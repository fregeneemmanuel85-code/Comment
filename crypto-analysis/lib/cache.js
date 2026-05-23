import { Redis } from "@upstash/redis";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

const CACHE_DIR = join(tmpdir(), "crypto-analysis-cache");

const hasRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
if (hasRedisConfig) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log(
      "[cache] Redis configured:",
      process.env.UPSTASH_REDIS_REST_URL,
    );
  } catch (e) {
    console.error("[cache] Redis init failed:", e.message);
  }
} else {
  console.warn("[cache] Redis not configured — using file-based fallback");
  console.log("[cache] Cache dir:", CACHE_DIR);
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
      console.log("[cache] Created cache dir");
    }
  } catch (e) {
    console.error("[cache] Failed to create cache dir:", e.message);
  }
}

const memoryCache = new Map();
const MAX_MEMORY_KEYS = 100;

function getFilePath(key) {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return join(CACHE_DIR, `${safeKey}.json`);
}

function readFileCache(key) {
  try {
    const filePath = getFilePath(key);
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed.expiry < Date.now()) {
      try {
        unlinkSync(filePath);
      } catch (e) {}
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function writeFileCache(key, value, ttlSeconds) {
  try {
    const filePath = getFilePath(key);
    const payload = {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000,
      created: Date.now(),
    };
    writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error(`[cache] File write error for ${key}:`, e.message);
    return false;
  }
}

export const cache = {
  async get(key) {
    // Try Redis first
    if (redis) {
      try {
        const value = await redis.get(key);
        console.log(
          `[cache] Redis GET ${key}:`,
          value === null ? "null" : typeof value,
        );
        if (value === null || value === undefined) return null;
        if (typeof value === "object") return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      } catch (error) {
        console.error(`[cache] Redis get error for ${key}:`, error.message);
      }
    }

    // Try file cache
    const fileData = readFileCache(key);
    if (fileData !== null) {
      console.log(`[cache] File HIT for ${key}`);
      return fileData;
    }

    // Fallback to memory
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiry < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return entry.data;
  },

  async set(key, value, ttlSeconds = 180) {
    console.log(`[cache] SET ${key} (TTL: ${ttlSeconds}s)`);

    if (redis) {
      try {
        const serialized =
          typeof value === "string" ? value : JSON.stringify(value);
        await redis.set(key, serialized, { ex: ttlSeconds });
        console.log(`[cache] Redis SET ${key}: OK`);
        return true;
      } catch (error) {
        console.error(`[cache] Redis set error for ${key}:`, error.message);
      }
    }

    const fileSuccess = writeFileCache(key, value, ttlSeconds);
    if (fileSuccess) {
      console.log(`[cache] File SET ${key}`);
      return true;
    }

    if (memoryCache.size >= MAX_MEMORY_KEYS && !memoryCache.has(key)) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
    memoryCache.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
    return true;
  },

  async del(key) {
    if (redis) {
      try {
        await redis.del(key);
        return true;
      } catch (error) {
        console.error(`[cache] Redis del error for ${key}:`, error.message);
      }
    }

    try {
      const filePath = getFilePath(key);
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch (e) {}

    memoryCache.delete(key);
    return true;
  },
};
