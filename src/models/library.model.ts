import mongoose, { Document, Schema } from "mongoose";
import { BookDocument } from "./book.model";

export interface LibraryDocument extends Document {
  name: string;
  address?: string; 
  books: mongoose.Types.ObjectId[] | BookDocument[];
  bookDetails?: BookDocument[]; // Optional because it's a virtual
  createdAt?: Date;
  updatedAt?: Date;
}

const librarySchema = new Schema<LibraryDocument>(
  {
    name: { type: String, required: true, index: true },
    address: { type: String },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for library books
librarySchema.virtual("bookDetails", {
  ref: "Book",
  localField: "books",
  foreignField: "_id",
});

export const Library = mongoose.model<LibraryDocument>("Library", librarySchema);
