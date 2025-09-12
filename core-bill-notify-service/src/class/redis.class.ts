import Redis, { RedisOptions } from "ioredis";

// custom imports
import {env} from '../config/env.config'

export class RedisService {
  private static instance: RedisService;
  private client: Redis;

  private constructor() {
    const options: RedisOptions = {
      host: env.redisHost,
      port: Number(env.redisPort),
      password: env.redisPassword,
      username: env.redisUsername,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    };

    this.client = new Redis(options);

    this.client.on("connect", () => {
      console.log("Redis connected");
    });

    this.client.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async set(key: string, value: string, ttl?: number): Promise<"OK" | null> {
    if (ttl) {
      return await this.client.set(key, value, "EX", ttl);
    }
    return await this.client.set(key, value);
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
    console.log("Redis disconnected");
  }
}

