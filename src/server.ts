import express from "express";
import connectDB from "./config/db";
import { connectRedis } from "./config/redis";
// import "./config/redis";
import dotenv from "dotenv";
import router from "./routes/index";
dotenv.config();

const app = express();
app.use(express.json());
app.use("/api", router);

// connectDB();
// connectRedis();

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;