import { LibrarySearchQuery, PaginationOptions } from "../interfaces";
import { LibraryService } from "../services/library.service";
import { Request, Response } from "express";

export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  async createLibrary(req: Request, res: Response): Promise<void> {
    try {
      const library = await this.libraryService.createLibrary(req.body);
      res.status(201).json(library);
    } catch (error: any) {
      res.status(400).json({ error: error?.message });
    }
  }

  async getLibrary(req: Request, res: Response): Promise<void> {
    try {
      const library = await this.libraryService.getLibraryById(req.params.id);
      if (library) {
        res.status(200).json(library);
      } else {
        res.status(404).json({ error: "Library not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  }



  async updateLibrary(req: Request, res: Response): Promise<void> {
    try {
      const library = await this.libraryService.updateLibrary(
        req.params.id,
        req.body
      );
      if (library) {
        res.json(library);
      } else {
        res.status(404).json({ error: "Library not found" });
      }
    } catch (error: any) {
      res.status(400).json({ error: error?.message });
    }
  }

  async deleteLibrary(req: Request, res: Response): Promise<void> {
    try {
      await this.libraryService.deleteLibrary(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  }

  async searchLibraries(req: Request, res: Response): Promise<void> {
    try {
      const searchQuery: LibrarySearchQuery = {
        name: req.query.name as string,
        address: req.query.address as string,
        searchText: req.query.searchText as string,
      };

      const pagination: PaginationOptions = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      if (pagination.page < 1) pagination.page = 1;
      if (pagination.limit < 1 || pagination.limit > 100) pagination.limit = 10;

      const result = await this.libraryService.searchLibraries(
        searchQuery,
        pagination
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  }

  async addBookToLibrary(req: Request, res: Response): Promise<void> {
    try {
      const { libraryId, bookId } = req.params;
      const updatedLibrary = await this.libraryService.addBookToLibrary(
        libraryId,
        bookId
      );

      res.json(updatedLibrary);
    } catch (error: any) {
      res.status(400).json({ error: error?.message });
    }
  }

  async removeBookFromLibrary(req: Request, res: Response): Promise<void> {
    try {
      const { libraryId, bookId } = req.params;
      const updatedLibrary = await this.libraryService.removeBookFromLibrary(
        libraryId,
        bookId
      );

      res.status(200).json(updatedLibrary);
    } catch (error: any) {
      res.status(400).json({ error: error?.message });
    }
  }

  async getLibraryBooks(req: Request, res: Response): Promise<void> {
    try {
      const { libraryId } = req.params;
      const pagination: PaginationOptions = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      // Validate pagination
      if (pagination.page < 1) pagination.page = 1;
      if (pagination.limit < 1 || pagination.limit > 100) pagination.limit = 10;

      const result = await this.libraryService.getLibraryBooks(
        libraryId,
        pagination
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error?.message });
    }
  }
}