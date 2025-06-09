import mongoose, { Document, Schema } from "mongoose";

export interface BookDocument extends Document {
  title: string;
  author: string;
  library?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const bookSchema = new Schema<BookDocument>(
  {
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      // required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
  // { timestamps: true, versionKey: false }
);

bookSchema.index({ title: "text", author: "text" }); // Text search
bookSchema.index({ title: 1, author: 1 }); // compound index

export const Book = mongoose.model<BookDocument>("Book", bookSchema);
