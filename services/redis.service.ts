import { createClient, RedisClientType } from 'redis';
import { logInfo, logError } from '../utils/logger';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  try {
    // const redisHost = process.env.REDIS_HOST || 'localhost';
    // const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    // const redisPassword = process.env.REDIS_PASSWORD;

    // redisClient = createClient({
    //   socket: {
    //     host: redisHost,
    //     port: redisPort,
    //   },
    //   password: redisPassword,
    // });

    redisClient = createClient({ url: "redis://localhost:6379" });

    redisClient.on('error', (err) => {
      logError('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logInfo('Redis client connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logError('Failed to create Redis client:', error);
    throw error;
  }
}
