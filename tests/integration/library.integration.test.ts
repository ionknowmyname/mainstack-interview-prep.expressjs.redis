import request from "supertest";
import app from "../../src/server";
import { Library } from "../../src/models/library.model";
import { Book } from "../../src/models/book.model";
import mongoose, { mongo } from "mongoose";

describe("Library Integration Tests", () => {
  let bookId: string;

  beforeEach(async () => {
    // Create a test book
    const book = await Book.create({
      title: "Test Book",
      author: "Test Author",
    });
    bookId = String(book._id);
  });

  describe("POST /api/library", () => {
    it("should create a new library", async () => {
      const bookObjectId = new mongoose.Types.ObjectId(bookId);
      const libraryData = {
        name: "Central Library",
        address: "123 Main St",
        books: [bookObjectId],
      };

      const response = await request(app)
        .post("/api/library")
        .send(libraryData)
        .expect(201);

      expect(response.body.name).toBe(libraryData.name);
      expect(response.body.address).toBe(libraryData.address);
      expect(response.body.books).toContain(bookObjectId);
    });

    it("should return 400 for invalid library data", async () => {
      const invalidLibraryData = {
        name: "", // Empty name
        address: "123 Main St",
      };

      const response = await request(app)
        .post("/api/library")
        .send(invalidLibraryData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /api/library", () => {
    beforeEach(async () => {
      await Library.create([
        {
          name: "Library 1",
          address: "123 First St",
          books: [new mongoose.Types.ObjectId(bookId)],
        },
        {
          name: "Library 2",
          address: "456 Second St",
          books: [],
        },
      ]);
    });

    it("should get all library", async () => {
      const response = await request(app).get("/api/library/search").expect(200);

      // add more pagination and search options later

      expect(response.body.library).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe("POST /api/library/:id/books/:bookId", () => {
    let libraryId: string;

    beforeEach(async () => {
      const library = await Library.create({
        name: "Test Library",
        address: "123 Test St",
        books: [],
      });
      libraryId = String(library._id);
    });

    it("should add book to library", async () => {
      const response = await request(app)
        .post(`/api/library/${libraryId}/books/${bookId}`)
        .send({ bookId })
        .expect(200);

      expect(response.body.books).toContain(bookId);
    });

    it("should return 404 for non-existent library", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .post(`/api/library/${fakeId}/books/${bookId}`)
        .send({ bookId })
        .expect(404);

      expect(response.body.error).toBe("Library not found");
    });

    it("should return 404 for non-existent book", async () => {
      const fakeBookId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .post(`/api/library/${libraryId}/books/${bookId}`)
        .send({ bookId: new mongoose.Types.ObjectId(fakeBookId) })
        .expect(404);

      expect(response.body.error).toBe("Book not found");
    });
  });

  describe("DELETE /api/library/:id/books/:bookId", () => {
    let libraryId: string;

    beforeEach(async () => {
      const library = await Library.create({
        name: "Test Library",
        address: "123 Test St",
        books: [new mongoose.Types.ObjectId(bookId)],
      });
      libraryId = String(library._id);
    });

    it("should remove book from library", async () => {
      const response = await request(app)
        .delete(`/api/library/${libraryId}/books/${bookId}`)
        .expect(200);

      expect(response.body.books).not.toContain(bookId);
    });

    it("should return 404 for non-existent library", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .delete(`/api/library/${fakeId}/books/${bookId}`)
        .expect(400);

      expect(response.body.error).toBe("Library not found");
    });
  });
});
