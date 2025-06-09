import { redisClient } from "../config/redis";
// import { createClient } from "redis";

export class CacheService {
  // private redisClient: any;
  private defaultTTL: number = 3600; // 1 hour

  // constructor(redisClient: any) {
  //   this.redisClient = redisClient;
  //   this.defaultTTL = 3600; // Default TTL of 1 hour
  // }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await redisClient.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  public async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL
  ): Promise<boolean> {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Delete multiple keys by pattern
  public async deleteByPattern(pattern: string): Promise<boolean> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error(
        `Cache delete by pattern error for pattern ${pattern}:`,
        error
      );
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Cache key generators for consistency
  public static generateBookKey(id: string): string {
    return `book:${id}`;
  }

  public static generateLibraryKey(id: string): string {
    return `library:${id}`;
  }

  public static generateBookSearchKey(
    query: string,
    page: number,
    limit: number
  ): string {
    // return `books:search:${Buffer.from(query).toString("base64")}:${page}:${limit}`;

    return `books:search:${JSON.stringify(query)}:${page}:${limit}`;
  }

  public static generateLibraryBooksKey(
    libraryId: string,
    page: number,
    limit: number
  ): string {
    return `library:${libraryId}:books:${page}:${limit}`;
  }
}
