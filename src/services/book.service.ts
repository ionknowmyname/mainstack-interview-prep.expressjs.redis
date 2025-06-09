import { BookSearchQuery, PaginationOptions, BookWithPagination } from "../interfaces";
import { BookDocument } from "../models/book.model";
import { BookRepository } from "../repositories/book.repository";


export class BookService {
  private bookRepository: BookRepository;

  constructor(bookRepository: BookRepository) {
    this.bookRepository = bookRepository;
  }

  async createBook(bookData: Partial<BookDocument>): Promise<BookDocument> {
    return this.bookRepository.create(bookData);
  }

  async getBookById(bookId: string): Promise<BookDocument | null> {
    return this.bookRepository.findById(bookId);
  }

  async updateBook(
    bookId: string,
    updateData: Partial<BookDocument>
  ): Promise<BookDocument | null> {
    return this.bookRepository.updateById(bookId, updateData);
  }

  async deleteBook(bookId: string): Promise<Boolean | null> {
    return this.bookRepository.deleteById(bookId);
  }

  async searchBooks(
    searchQuery: BookSearchQuery = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookWithPagination> {
    return this.bookRepository.searchBooks(searchQuery, pagination);
  }
}