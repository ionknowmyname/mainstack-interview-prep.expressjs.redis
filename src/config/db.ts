import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/mainstack-interview";
    await mongoose.connect(dbURI); 
    // , {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });

    // {
    //   // Connection options for optimization
    //   maxPoolSize: 10, // Maintain up to 10 socket connections
    //   serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    //   socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    //   bufferCommands: false, // Disable mongoose buffering
    //   bufferMaxEntries: 0 // Disable mongoose buffering
    // }
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export default connectDB;