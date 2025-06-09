import { Router, Request, Response } from 'express';
import { BookController } from '../controllers/book.controller';
import { BookService } from '../services/book.service';
import { BookRepository } from '../repositories/book.repository';
import { CacheService } from '../services/cache.service';

const bookRouter = Router();

const cacheService = new CacheService();
const bookRepository = new BookRepository(cacheService);
const bookService = new BookService(bookRepository);
const bookController = new BookController(bookService);

bookRouter.post("/", bookController.createBook.bind(bookController));
bookRouter.get("/search", bookController.searchBooks.bind(bookController));
bookRouter.get("/:id", bookController.getBook.bind(bookController));
bookRouter.put("/:id", bookController.updateBook.bind(bookController));
bookRouter.delete("/:id", bookController.deleteBook.bind(bookController));


export default bookRouter;