import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    // retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true, // false connects immediately when client is created
  }
);

// const initializeRedis = async () => {
//   try {
//     // ioredis connects automatically, but we can wait for ready state
//     await new Promise((resolve, reject) => {
//       redisClient.on("ready", resolve);
//       redisClient.on("error", reject);

//       // Timeout after 10 seconds
//       setTimeout(() => reject(new Error("Redis connection timeout")), 10000);
//     });

//     console.log("Redis connected and ready");
//   } catch (error) {
//     console.error("Redis connection error:", error);
//     process.exit(1);
//   }
// };

// Initialize immediately when module is imported
// initializeRedis();

redisClient.on("connect", () => {
  console.log("Redis connected successfully 1.0");
});

redisClient.on("ready", () => {
  console.log("Redis is ready to accept commands");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
  process.exit(1);
});

const connectRedis = async () => {
  await redisClient.connect();
  console.log("Redis connected successfully 2.0");
};


export { redisClient, connectRedis };