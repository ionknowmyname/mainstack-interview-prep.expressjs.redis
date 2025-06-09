import mongoose from "mongoose";
import { BookWithPagination, LibrarySearchQuery, LibraryWithPagination, PaginationOptions } from "../interfaces";
import { BookDocument } from "../models/book.model";
import { Library, LibraryDocument } from "../models/library.model";
import { CacheService } from "../services/cache.service";
import { BookRepository } from "./book.repository";


export class LibraryRepository {
  private cacheService: CacheService;
  private bookRepository: BookRepository;

  constructor(cacheService: CacheService, bookRepository: BookRepository) {
    this.cacheService = cacheService;
    this.bookRepository = bookRepository;
  }

  public async create(
    libraryData: Partial<LibraryDocument>
  ): Promise<LibraryDocument> {
    const library = new Library(libraryData);
    const savedLibrary = await library.save();

    // Cache the created library
    const cacheKey = CacheService.generateLibraryKey(String(savedLibrary._id));
    await this.cacheService.set(cacheKey, savedLibrary);

    return savedLibrary;
  }

  public async findById(
    id: string,
    populateBooks: boolean = false
  ): Promise<LibraryDocument | null> {
    const _id = new mongoose.Types.ObjectId(id);

    // For populated results, we skip cache as relationships might change frequently
    if (populateBooks) {
      return await Library.findById(_id).populate("bookDetails");
    }

    // Try cache first for simple library data
    const cacheKey = CacheService.generateLibraryKey(id);
    const cachedLibrary = await this.cacheService.get<LibraryDocument>(
      cacheKey
    );

    if (cachedLibrary) {
      return cachedLibrary;
    }

    // If not in cache, query database
    const library = await Library.findById(_id);

    if (library) {
      // Cache the result
      await this.cacheService.set(cacheKey, library);
    }

    return library;
  }

  // Update library by ID
  public async updateById(
    id: string,
    updateData: Partial<LibraryDocument>
  ): Promise<LibraryDocument | null> {
    const updatedLibrary = await Library.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (updatedLibrary) {
      // Update cache
      const cacheKey = CacheService.generateLibraryKey(id);
      await this.cacheService.set(cacheKey, updatedLibrary);

      // Invalidate search cache
      await this.cacheService.deleteByPattern("libraries:search:*");
    }

    return updatedLibrary;
  }

  public async deleteById(id: string): Promise<boolean> {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete all books in the library
      await this.bookRepository.deleteAllBooksInLibrary(id, session);

      // const result = await Library.findByIdAndDelete(id).session(session);
      const result = await Library.findByIdAndDelete(id, { session });

      if (result) {
        // Remove from cache
        const cacheKey = CacheService.generateLibraryKey(id);
        await this.cacheService.delete(cacheKey);

        // Invalidate search cache
        await this.cacheService.deleteByPattern("libraries:search:*");
      }

      await session.commitTransaction();
      return !!result;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  public async searchLibraries(
    searchQuery: LibrarySearchQuery = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<LibraryWithPagination> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (searchQuery.name) {
      query.name = { $regex: searchQuery.name, $options: "i" };
    }

    if (searchQuery.address) {
      query.address = { $regex: searchQuery.address, $options: "i" };
    }

    // Text search across multiple fields
    if (searchQuery.searchText) {
      query.$or = [
        { name: { $regex: searchQuery.searchText, $options: "i" } },
        { address: { $regex: searchQuery.searchText, $options: "i" } },
      ];
    }

    const [libraries, totalCount] = await Promise.all([
      Library.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Library.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    return {
      libraries: libraries as LibraryDocument[],
      totalCount,
      totalPages,
      // currentPage: page,
      // hasNextPage: page < totalPages,
      // hasPreviousPage: page > 1,
    };
  }

  // Add book to library
  public async addBook(
    libraryId: string,
    bookId: string
  ): Promise<LibraryDocument | null> {
    const libraryObjectId = new mongoose.Types.ObjectId(libraryId);
    // find Book to exist first
    const foundBook = await this.bookRepository.findById(bookId);
    if (!foundBook) {
      throw new Error(`Book with ID ${bookId} does not exist`);
    }


    const library = await Library.findByIdAndUpdate(
      libraryObjectId,
      { $addToSet: { books: foundBook._id } },
      { new: true }
    );

    foundBook.library = libraryObjectId;
    await foundBook.save();

    if (library) {
      // Update cache
      const cacheKey = CacheService.generateLibraryKey(libraryId);
      await this.cacheService.set(cacheKey, library);

      // Invalidate library books cache
      await this.cacheService.deleteByPattern(`library:${libraryId}:books:*`);
    }

    return library;
  }

  // Remove book from library
  public async removeBook(
    libraryId: string,
    bookId: string
  ): Promise<LibraryDocument | null> {
    const libraryObjectId = new mongoose.Types.ObjectId(libraryId);
    const bookObjectId = new mongoose.Types.ObjectId(bookId);
   
    const library = await Library.findByIdAndUpdate(
      libraryObjectId,
      { $pull: { books: bookObjectId } },
      { new: true }
    );

    if (library) {
      // Update cache
      const cacheKey = CacheService.generateLibraryKey(libraryId);
      await this.cacheService.set(cacheKey, library);

      // Invalidate library books cache
      await this.cacheService.deleteByPattern(`library:${libraryId}:books:*`);
    }

    return library;
  }

  // Get books in a library with pagination
  public async getLibraryBooks(
    libraryId: string,
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookWithPagination> {
    const libraryObjectId = new mongoose.Types.ObjectId(libraryId);
    const { page, limit } = pagination;

    // Try cache first
    const cacheKey = CacheService.generateLibraryBooksKey(
      libraryId,
      page,
      limit
    );
    const cachedResult = await this.cacheService.get<BookWithPagination>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const pipeline = [
      { $match: { _id: libraryObjectId } },
      {
        $lookup: {
          from: "books",
          localField: "books",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      {
        $project: {
          books: {
            $slice: ["$bookDetails", (page - 1) * limit, limit],
          },
          totalCount: { $size: "$bookDetails" },
        },
      },
    ];

    const result = await Library.aggregate(pipeline);

    if (!result.length) {
      return {
        books: [],
        totalCount: 0,
        totalPages: 0,
        // currentPage: page,
        // hasNextPage: false,
        // hasPreviousPage: false,
      };
    }

    const { books, totalCount } = result[0];
    const totalPages = Math.ceil(totalCount / limit);

    const bookResult: BookWithPagination = {
      books: books as BookDocument[],
      totalCount,
      totalPages,
      // currentPage: page,
      // hasNextPage: page < totalPages,
      // hasPreviousPage: page > 1,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, bookResult, 600); // Cache for 10 minutes

    return bookResult;
  }
}