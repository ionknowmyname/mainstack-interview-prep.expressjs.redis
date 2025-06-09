import mongoose from "mongoose";
import { BookSearchQuery, BookWithPagination, PaginationOptions } from "../interfaces";
import { Book, BookDocument } from "../models/book.model";
import { CacheService } from "../services/cache.service";


export class BookRepository {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  public async create(bookData: Partial<BookDocument>): Promise<BookDocument> {
    const book = new Book(bookData);
    const savedBook: BookDocument = await book.save();

    // Cache the created book
    const cacheKey = CacheService.generateBookKey(String(savedBook._id));
    await this.cacheService.set(cacheKey, savedBook);

    return savedBook;
  }

  public async findById(id: string): Promise<BookDocument | null> {
    const cacheKey = CacheService.generateBookKey(id);
    const cachedBook = await this.cacheService.get<BookDocument>(cacheKey);

    if (cachedBook) {
      return cachedBook;
    }

    const book = await Book.findById(id);

    if (book) {
      // Cache the result
      await this.cacheService.set(cacheKey, book);
    }

    return book;
  }

  public async updateById(
    id: string,
    updateData: Partial<BookDocument>
  ): Promise<BookDocument | null> {
    const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (updatedBook) {
      // Update cache
      const cacheKey = CacheService.generateBookKey(id);
      await this.cacheService.set(cacheKey, updatedBook);

      // Invalidate search cache
      await this.cacheService.deleteByPattern("books:search:*");
    }

    return updatedBook;
  }

  public async deleteById(id: string): Promise<boolean> {
    const result = await Book.findByIdAndDelete(id);

    if (result) {
      // Remove from cache
      const cacheKey = CacheService.generateBookKey(id);
      await this.cacheService.delete(cacheKey);

      // Invalidate search cache
      await this.cacheService.deleteByPattern("books:search:*");

      return true;
    }

    return false;
  }

  public async deleteAllBooksInLibrary(
    libraryId: string,
    session?: mongoose.ClientSession
  ) {
    // : Promise<any>

    return await Book.deleteMany(
      { library: new mongoose.Types.ObjectId(libraryId) },
      { session } // Pass session here
    );
  }

  // Search books with advanced filtering and pagination
  public async searchBooks(
    searchQuery: BookSearchQuery = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookWithPagination> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build MongoDB query
    const query: any = {};

    if (searchQuery.library) {
      query.library = new mongoose.Types.ObjectId(searchQuery.library);
    }

    if (searchQuery.title) {
      query.title = { $regex: searchQuery.title, $options: "i" };
    }

    if (searchQuery.author) {
      query.author = { $regex: searchQuery.author, $options: "i" };
    }

    // if (searchQuery.genre) {
    //   query.genre = { $regex: searchQuery.genre, $options: "i" };
    // }

    // if (searchQuery.publishYear) {
    //   query.publishYear = searchQuery.publishYear;
    // }

    // if (searchQuery.minYear || searchQuery.maxYear) {
    //   query.publishYear = {};
    //   if (searchQuery.minYear) query.publishYear.$gte = searchQuery.minYear;
    //   if (searchQuery.maxYear) query.publishYear.$lte = searchQuery.maxYear;
    // }

    // Text search across multiple fields
    if (searchQuery.searchText) {
      query.$text = { $search: searchQuery.searchText };
    }

    // Try cache first for search results
    const cacheKey = CacheService.generateBookSearchKey(
      JSON.stringify(searchQuery),
      page,
      limit
    );
    const cachedResult = await this.cacheService.get<BookWithPagination>(
      cacheKey
    );

    if (cachedResult) {
      return cachedResult;
    }

    const [books, totalCount] = await Promise.all([
      Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Book.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const result: BookWithPagination = {
      books: books as BookDocument[],
      totalCount,
      totalPages,
      // currentPage: page,
      // hasNextPage: page < totalPages,
      // hasPreviousPage: page > 1,
    };

    // Cache the search result
    await this.cacheService.set(cacheKey, result, 600); // Cache for 10 minutes

    return result;
  }
}