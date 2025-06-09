import { BookSearchQuery, PaginationOptions } from "../interfaces";
import { BookService } from "../services/book.service";
import { Request, Response } from "express";

export class BookController {
  constructor(private bookService: BookService) {}
  
  async createBook(req: Request, res: Response): Promise<void> {
    try {
      const book = await this.bookService.createBook(req.body);
      res.status(201).json(book);
    } catch (error: any) {
      res.status(400).json({ error: error?.message });
    }
  }

  async getBook(req: Request, res: Response): Promise<void> {
    try {
      const book = await this.bookService.getBookById(req.params.id);
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ error: "Book not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  }

  async updateBook(req: Request, res: Response): Promise<void> {
    try {
      const book = await this.bookService.updateBook(req.params.id, req.body);
      if (book) {
        res.json(book);
      } else {
        res.status(404).json({ error: "Book not found" });
      }
    } catch (error: any) {
      res.status(400).json({ error: error?.message });
    }
  }

  async deleteBook(req: Request, res: Response): Promise<void> {
    try {
      await this.bookService.deleteBook(req.params.id);
      res.status(200).send();
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  }

  async searchBooks(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters
      const searchQuery: BookSearchQuery = {
        title: req.query.title as string,
        author: req.query.author as string,
        // genre: req.query.genre as string,
        searchText: req.query.searchText as string,
        library: req.query.library as string,
        // publishYear: req.query.publishYear
        //   ? Number(req.query.publishYear)
        //   : undefined,
        // minYear: req.query.minYear ? Number(req.query.minYear) : undefined,
        // maxYear: req.query.maxYear ? Number(req.query.maxYear) : undefined,
      };

      const pagination: PaginationOptions = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      if (pagination.page < 1) pagination.page = 1;
      if (pagination.limit < 1 || pagination.limit > 100) pagination.limit = 10;

      const result = await this.bookService.searchBooks(
        searchQuery,
        pagination
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  }
}