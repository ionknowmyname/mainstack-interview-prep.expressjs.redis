import mongoose from 'mongoose';
import { BookRepository } from '../../src/repositories/book.repository';
import { CacheService } from '../../src/services/cache.service';
import { Book, BookDocument } from '../../src/models/book.model';
import { BookSearchQuery, PaginationOptions } from '../../src/interfaces';

jest.mock('../../src/services/cache.service');
jest.mock("../../src/models/book.model", () => {
  // Book: {
  //   ...jest.fn(),  // mock constructor
  //   // Mock static methods
  //   findById: jest.fn(),
  //   find: jest.fn(),
  //   findOne: jest.fn(),
  // },

  const MockBook = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn(),
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
  }));
  
  (MockBook as any).findById = jest.fn();
  (MockBook as any).find = jest.fn();
  (MockBook as any).findOne = jest.fn();
  (MockBook as any).create = jest.fn();
  (MockBook as any).updateOne = jest.fn();
  (MockBook as any).deleteOne = jest.fn();
  
  return { Book: MockBook };
});


describe('BookRepository', () => {
  let bookRepository: BookRepository;
  // let mockBookModel: jest.Mocked<typeof Book>;
  let mockBookModel: jest.MockedClass<typeof Book>;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;
    bookRepository = new BookRepository(mockCacheService);
    // mockBookModel = Book as jest.Mocked<typeof Book>
    mockBookModel = Book as jest.MockedClass<typeof Book>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a book and cache it', async () => {
      const mockObjectId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const bookData: Partial<BookDocument> = {
        title: "Test Book",
        author: "Author Name",
        // library: new mongoose.Types.ObjectId(),
      };

      const expectedResult = {
        _id: mockObjectId,
        ...bookData,
      } as BookDocument;

      const mockBookInstance = {
        _id: mockObjectId,
        ...bookData,
        save: jest.fn().mockResolvedValue(expectedResult),
      } as BookDocument;

      mockBookModel.mockImplementation(() => mockBookInstance as any);
      CacheService.generateBookKey = jest
        .fn()
        .mockReturnValue("book:507f1f77bcf86cd799439011");
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);

      const result = await bookRepository.create(bookData);

      expect(mockBookModel).toHaveBeenCalledWith(bookData);
      expect(mockBookInstance.save).toHaveBeenCalled();
      expect(CacheService.generateBookKey).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockCacheService.set).toHaveBeenCalledWith(
        "book:507f1f77bcf86cd799439011",
        expect.any(Object)
      );
      // expect(mockCacheService.set).toHaveBeenCalledWith(
      //   expect.stringContaining("books:"),
      //   result
      // );
      expect(result).toEqual(expectedResult);
      
      
      
      // mockBookModel.prototype.save.mockResolvedValue(savedBook);
      // mockCacheService.set.mockResolvedValue(undefined);
      
    });

    it("should throw error when book creation fails", async () => {
      const bookData: Partial<BookDocument> = {
        title: "Test Book",
        author: "Test Author",
      };

      const mockBook = {
        save: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      mockBookModel.mockImplementation(() => mockBook as any);

      await expect(bookRepository.create(bookData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findById", () => {
    it("should return cached book if available", async () => {
      const mockBook = {
        _id: "507f1f77bcf86cd799439011",
        title: "Test Book",
        author: "Test Author",
      };

      CacheService.generateBookKey = jest.fn().mockReturnValue("book:507f1f77bcf86cd799439011");
      mockCacheService.get = jest.fn().mockResolvedValue(mockBook);

      const result = await bookRepository.findById("507f1f77bcf86cd799439011");

      expect(CacheService.generateBookKey).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockCacheService.get).toHaveBeenCalledWith("book:507f1f77bcf86cd799439011");
      expect(result).toEqual(mockBook);
      expect(mockBookModel.findById).not.toHaveBeenCalled();
    });

    it("should find book from database and cache it when not in cache", async () => {
      const mockBook = {
        _id: "507f1f77bcf86cd799439011",
        title: "Test Book",
        author: "Test Author",
      };

      CacheService.generateBookKey = jest.fn().mockReturnValue("book:507f1f77bcf86cd799439011");
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockBookModel.findById = jest.fn().mockResolvedValue(mockBook);

      const result = await bookRepository.findById("507f1f77bcf86cd799439011");

      expect(mockBookModel.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockCacheService.set).toHaveBeenCalledWith(
        "book:507f1f77bcf86cd799439011",
        mockBook
      );
      expect(result).toEqual(mockBook);
    });

    it("should return null when book not found", async () => {
      CacheService.generateBookKey = jest
        .fn()
        .mockReturnValue("book:nonexistent");
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockBookModel.findById = jest.fn().mockResolvedValue(null);

      const result = await bookRepository.findById("nonexistent");

      expect(result).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe("updateById", () => {
    it("should update book and update cache", async () => {
      const updateData: Partial<BookDocument> = {
        title: "Updated Title",
      };

      const mockUpdatedBook = {
        _id: "mockId",
        title: "Updated Title",
        author: "Test Author",
      };

      mockBookModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedBook);
      CacheService.generateBookKey = jest.fn().mockReturnValue("book:mockId");
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockCacheService.deleteByPattern = jest.fn().mockResolvedValue(undefined);

      const result = await bookRepository.updateById("mockId", updateData);

      expect(mockBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "mockId",
        updateData,
        { new: true }
      );
      expect(mockCacheService.set).toHaveBeenCalledWith(
        "book:mockId",
        mockUpdatedBook
      );
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        "books:search:*"
      );
      expect(result).toEqual(mockUpdatedBook);
    });

    it("should return null when book not found for update", async () => {
      mockBookModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const result = await bookRepository.updateById("nonexistent", {
        title: "Updated",
      });

      expect(result).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    it("should delete book and remove from cache", async () => {
      const mockDeletedBook = {
        _id: "mockId",
        title: "Deleted Book",
      };

      mockBookModel.findByIdAndDelete = jest
        .fn()
        .mockResolvedValue(mockDeletedBook);
      CacheService.generateBookKey = jest.fn().mockReturnValue("book:mockId");
      mockCacheService.delete = jest.fn().mockResolvedValue(undefined);
      mockCacheService.deleteByPattern = jest.fn().mockResolvedValue(undefined);

      const result = await bookRepository.deleteById("mockId");

      expect(mockBookModel.findByIdAndDelete).toHaveBeenCalledWith("mockId");
      expect(mockCacheService.delete).toHaveBeenCalledWith("book:mockId");
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        "books:search:*"
      );
      expect(result).toBe(true);
    });

    it("should return false when book not found for deletion", async () => {
      mockBookModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const result = await bookRepository.deleteById("nonexistent");

      expect(result).toBe(false);
      expect(mockCacheService.delete).not.toHaveBeenCalled();
    });
  });

  describe('searchBooks', () => {
    it('should return cached search results if available', async () => {
      const searchQuery: BookSearchQuery = {
        title: 'Test',
        author: 'Author'
      };
      const pagination: PaginationOptions = { page: 1, limit: 10 };

      const cachedResult = {
        books: [{ _id: '1', title: 'Test Book' }],
        totalCount: 1,
        totalPages: 1
      };

      CacheService.generateBookSearchKey = jest.fn().mockReturnValue('books:search:key');
      mockCacheService.get = jest.fn().mockResolvedValue(cachedResult);

      const result = await bookRepository.searchBooks(searchQuery, pagination);

      expect(CacheService.generateBookSearchKey).toHaveBeenCalledWith(
        JSON.stringify(searchQuery),
        1,
        10
      );
      expect(mockCacheService.get).toHaveBeenCalledWith('books:search:key');
      expect(result).toEqual(cachedResult);
      expect(mockBookModel.find).not.toHaveBeenCalled();
    });

    it('should search books by title and author', async () => {
      const searchQuery: BookSearchQuery = {
        title: 'Test',
        author: 'Author'
      };
      const pagination: PaginationOptions = { page: 1, limit: 10 };

      const mockBooks = [
        { _id: '1', title: 'Test Book 1', author: 'Author 1' },
        { _id: '2', title: 'Test Book 2', author: 'Author 2' }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockBooks)
      };

      CacheService.generateBookSearchKey = jest.fn().mockReturnValue('books:search:key');
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockBookModel.find = jest.fn().mockReturnValue(mockQuery);
      mockBookModel.countDocuments = jest.fn().mockResolvedValue(2);

      const result = await bookRepository.searchBooks(searchQuery, pagination);

      expect(mockBookModel.find).toHaveBeenCalledWith({
        title: { $regex: 'Test', $options: 'i' },
        author: { $regex: 'Author', $options: 'i' }
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.lean).toHaveBeenCalled();
      expect(mockBookModel.countDocuments).toHaveBeenCalledWith({
        title: { $regex: 'Test', $options: 'i' },
        author: { $regex: 'Author', $options: 'i' }
      });
      expect(mockCacheService.set).toHaveBeenCalledWith('books:search:key', expect.any(Object), 600);
      expect(result).toEqual({
        books: mockBooks,
        totalCount: 2,
        totalPages: 1
      });
    });

    it('should search books by library', async () => {
      const libraryId = new mongoose.Types.ObjectId();
      const searchQuery: BookSearchQuery = {
        library: libraryId.toString()
      };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      CacheService.generateBookSearchKey = jest.fn().mockReturnValue('books:search:key');
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockBookModel.find = jest.fn().mockReturnValue(mockQuery);
      mockBookModel.countDocuments = jest.fn().mockResolvedValue(0);

      await bookRepository.searchBooks(searchQuery);

      expect(mockBookModel.find).toHaveBeenCalledWith({
        library: libraryId
      });
    });

    it('should search books with text search', async () => {
      const searchQuery: BookSearchQuery = {
        searchText: 'fiction adventure'
      };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      CacheService.generateBookSearchKey = jest.fn().mockReturnValue('books:search:key');
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockBookModel.find = jest.fn().mockReturnValue(mockQuery);
      mockBookModel.countDocuments = jest.fn().mockResolvedValue(0);

      await bookRepository.searchBooks(searchQuery);

      expect(mockBookModel.find).toHaveBeenCalledWith({
        $text: { $search: 'fiction adventure' }
      });
    });

    it('should handle empty search query', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      CacheService.generateBookSearchKey = jest.fn().mockReturnValue('books:search:key');
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockBookModel.find = jest.fn().mockReturnValue(mockQuery);
      mockBookModel.countDocuments = jest.fn().mockResolvedValue(0);

      await bookRepository.searchBooks();

      expect(mockBookModel.find).toHaveBeenCalledWith({});
    });

    it('should calculate pagination correctly', async () => {
      const pagination: PaginationOptions = { page: 3, limit: 5 };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      CacheService.generateBookSearchKey = jest.fn().mockReturnValue('books:search:key');
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockBookModel.find = jest.fn().mockReturnValue(mockQuery);
      mockBookModel.countDocuments = jest.fn().mockResolvedValue(12);

      const result = await bookRepository.searchBooks({}, pagination);

      expect(mockQuery.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(result.totalPages).toBe(3); // Math.ceil(12/5)
    });

  });







  // it('should update a book by ID and cache the result', async () => {
  //   const bookId = '507f1f77bcf86cd799439011';
  //   const updateData: Partial<BookDocument> = { title: 'Updated Book' };
  //   const updatedBook = { _id: bookId, ...updateData } as BookDocument;

  //   mockBookModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBook);
  //   CacheService.generateBookKey = jest.fn().mockReturnValue(`book:${bookId}`);
  //   mockCacheService.set = jest.fn().mockResolvedValue(undefined);
  //   mockCacheService.deleteByPattern = jest.fn().mockResolvedValue(undefined);

  //   const result = await bookRepository.updateById(bookId, updateData);

  //   expect(mockBookModel.findByIdAndUpdate).toHaveBeenCalledWith(bookId, updateData, { new: true });
  //   expect(CacheService.generateBookKey).toHaveBeenCalledWith(bookId);
  //   expect(mockCacheService.set).toHaveBeenCalledWith(`book:${bookId}`, updatedBook);
  //   expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith('books:search:*');
  //   expect(result).toEqual(updatedBook);
  // });

  // it('should search books with pagination and sorting', async () => {
  //   for (let i = 0; i < 5; i++) {
  //     await bookRepository.create({ title: `Test Book ${i}`, author: `Author ${i}`, publishedYear: 2021 });
  //   }
  //   const query: BookSearchQuery = { title: 'Test' };
  //   const paginationOptions: PaginationOptions = { page: 1, limit: 2, sortBy: 'title', sortOrder: 'asc' };
  //   const result = await bookRepository.search(query, paginationOptions);     

  // });

});