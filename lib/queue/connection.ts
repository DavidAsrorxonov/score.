import "server-only";

import IORedis from "ioredis";

declare global {
  var scoreRedisConnection: IORedis | undefined;
}

export function createRedisConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required for queue operations.");
  }

  return new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

export function getRedisConnection() {
  if (!globalThis.scoreRedisConnection) {
    globalThis.scoreRedisConnection = createRedisConnection();
  }

  return globalThis.scoreRedisConnection;
}
