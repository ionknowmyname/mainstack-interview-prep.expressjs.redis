import { Router, Request, Response } from 'express';
import { LibraryController } from '../controllers/library.controller';
import { LibraryService } from '../services/library.service';
import { LibraryRepository } from '../repositories/library.repository';
import { BookRepository } from '../repositories/book.repository';
import { CacheService } from '../services/cache.service';

const libraryRouter = Router();

const cacheService = new CacheService();
const bookRepository = new BookRepository(cacheService);
const libraryRepository = new LibraryRepository(cacheService, bookRepository);
const libraryService = new LibraryService(libraryRepository);
const libraryController = new LibraryController(libraryService);

libraryRouter.post("/", libraryController.createLibrary.bind(libraryController));
libraryRouter.get("/:id", libraryController.getLibrary.bind(libraryController));
libraryRouter.put("/:id", libraryController.updateLibrary.bind(libraryController));
libraryRouter.delete("/:id", libraryController.deleteLibrary.bind(libraryController));

libraryRouter.get("/search", libraryController.searchLibraries.bind(libraryController));
libraryRouter.post("/:libraryId/books/:bookId", libraryController.addBookToLibrary.bind(libraryController));
libraryRouter.delete("/:libraryId/books/:bookId", libraryController.removeBookFromLibrary.bind(libraryController));
libraryRouter.get("/:libraryId/books", libraryController.getLibraryBooks.bind(libraryController));

export default libraryRouter;