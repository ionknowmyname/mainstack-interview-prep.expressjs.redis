import mongoose from "mongoose";
import { LibraryDocument } from "../models/library.model";
import { LibraryRepository } from "../repositories/library.repository";
import { BookService } from "./book.service";
import { BookWithPagination, LibrarySearchQuery, LibraryWithPagination, PaginationOptions } from "../interfaces";

export class LibraryService {
  constructor(
    private libraryRepository: LibraryRepository, 
    // private bookService: BookService
  ) {}

  async createLibrary(
    libraryData: Partial<LibraryDocument>
  ): Promise<LibraryDocument> {
    return this.libraryRepository.create(libraryData);
  }

  async getLibraryById(id: string): Promise<LibraryDocument | null> {
    return this.libraryRepository.findById(id);
  }

  async updateLibrary(
    id: string,
    libraryData: Partial<LibraryDocument>
  ): Promise<LibraryDocument | null> {
    return this.libraryRepository.updateById(id, libraryData);
  }

  async deleteLibrary(id: string): Promise<Boolean | null> {
    return this.libraryRepository.deleteById(id);
  }

  async searchLibraries(
    searchQuery: LibrarySearchQuery = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<LibraryWithPagination> {
    return this.libraryRepository.searchLibraries(searchQuery, pagination);
  }

  async addBookToLibrary(libraryId: string, bookId: string) {
    const foundLibrary = await this.getLibraryById(libraryId);
    if (!foundLibrary) {
      throw new Error('Library not found');
    }

    return await this.libraryRepository.addBook(libraryId, bookId);
  }

  async removeBookFromLibrary(libraryId: string, bookId: string) {
    // Validate inputs
    const foundLibrary = await this.getLibraryById(libraryId);
    if (!foundLibrary) {
      throw new Error("Library not found");
    }
    
    return await this.libraryRepository.removeBook(libraryId, bookId);
  }

  async getLibraryBooks(
    libraryId: string,
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookWithPagination> {
    if (pagination.page < 1) pagination.page = 1;
    if (pagination.limit < 1 || pagination.limit > 100) pagination.limit = 10;

    return this.libraryRepository.getLibraryBooks(libraryId, pagination);
  }
}