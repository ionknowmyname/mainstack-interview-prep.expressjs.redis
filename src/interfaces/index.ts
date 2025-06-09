import mongoose from "mongoose";
import { BookDocument } from "../models/book.model";
import { LibraryDocument } from "../models/library.model";

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface BookSearchQuery {
  title?: string;
  author?: string;
  library?: string | mongoose.Types.ObjectId;
  // genre?: string;
  // publishYear?: number;
  // minYear?: number;
  // maxYear?: number;
  searchText?: string;
}

export interface BookWithPagination {
  books: BookDocument[];
  totalCount: number;
  totalPages: number;
  // currentPage: number;
  // hasNextPage: boolean;
  // hasPreviousPage: boolean;
}

export interface LibrarySearchQuery {
  name?: string;
  address?: string;
  searchText?: string;
}

export interface LibraryWithPagination {
  libraries: LibraryDocument[];
  totalCount: number;
  totalPages: number;
  // currentPage: number;
  // hasNextPage: boolean;
  // hasPreviousPage: boolean;
}
