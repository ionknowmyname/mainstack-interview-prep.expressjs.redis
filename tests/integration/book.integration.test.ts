import request from 'supertest';
import app from '../../src/server';
import { Book } from '../../src/models/book.model';

describe("Book Integration Tests", () => {
  describe("POST /api/book", () => {
    it("should create a new book", async () => {
      const bookData = {
        title: "Integration Test Book",
        author: "Test Author",
      };

      const response = await request(app)
        .post("/api/book")
        .send(bookData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: bookData.title,
        author: bookData.author,
      });

      expect(response.body._id).toBeDefined();
    });

    it("should return 400 for invalid book data", async () => {
      const invalidBookData = {
        title: "", // Empty title
        author: "Test Author",
      };

      const response = await request(app)
        .post("/api/book")
        .send(invalidBookData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /api/book/search", () => {
    beforeEach(async () => {
      // Create test books
      await Book.create([
        {
          title: "Book 1",
          author: "Author 1",
        },
        {
          title: "Book 2",
          author: "Author 2",
        },
        {
          title: "Book 3",
          author: "Author 3",
        },
      ]);
    });

    it("should get all books with pagination", async () => {
      const response = await request(app)
        .get("/api/book/search?page=1&limit=10")
        .expect(200);

      expect(response.body.books).toHaveLength(3);
      expect(response.body.totalCount).toBe(3);
      expect(response.body.totalPages).toBe(1);
    });

    it("should handle pagination correctly", async () => {
      const response = await request(app)
        .get("/api/books?page=1&limit=1")
        .expect(200);

      expect(response.body.books).toHaveLength(1);
      expect(response.body.totalCount).toBe(3);
    });
  });

  describe("GET /api/books/:id", () => {
    let bookId: string;

    beforeEach(async () => {
      const book = await Book.create({
        title: "Test Book",
        author: "Test Author",
      });
      bookId = String(book._id);
    });

    it("should get book by id", async () => {
      const response = await request(app)
        .get(`/api/book/${bookId}`)
        .expect(200);

      expect(response.body.title).toBe("Test Book");
      expect(response.body.author).toBe("Test Author");
    });

    it("should return 404 for non-existent book", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/book/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe("Book not found");
    });

    it("should return 400 for invalid book id", async () => {
      const response = await request(app)
        .get("/api/book/invalid-id")
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe("PUT /api/books/:id", () => {
    let bookId: string;

    beforeEach(async () => {
      const book = await Book.create({
        title: "Original Title",
        author: "Original Author",
      });
      bookId = String(book._id);
    });

    it("should update book successfully", async () => {
      const updateData = {
        title: "Updated Title",
        author: "Updated Author",
      };

      const response = await request(app)
        .put(`/api/book/${bookId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe("Updated Title");
      expect(response.body.author).toBe("Updated Author");
    });

    it("should return 404 for non-existent book", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const updateData = { title: "Updated Title" };

      const response = await request(app)
        .put(`/api/book/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe("Book not found");
    });
  });

  describe("DELETE /api/book/:id", () => {
    let bookId: string;

    beforeEach(async () => {
      const book = await Book.create({
        title: "Book to Delete",
        author: "Test Author",
      });
      bookId = String(book._id);
    });

    it("should delete book successfully", async () => {
      const response = await request(app)
        .delete(`/api/book/${bookId}`)
        .expect(200);

      expect(response.body.message).toBe("Book deleted successfully");

      // Verify book is deleted
      const deletedBook = await Book.findById(bookId);
      expect(deletedBook).toBeNull();
    });

    it("should return 404 for non-existent book", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .delete(`/api/book/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe("Book not found");
    });
  });

});