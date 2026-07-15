"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
let redisClient = null;
async function getRedisClient() {
    if (redisClient) {
        return redisClient;
    }
    try {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        const redisPassword = process.env.REDIS_PASSWORD;
        redisClient = (0, redis_1.createClient)({
            socket: {
                host: redisHost,
                port: redisPort,
            },
            password: redisPassword,
        });
        redisClient.on('error', (err) => {
            (0, logger_1.logError)('Redis Client Error:', err);
        });
        redisClient.on('connect', () => {
            (0, logger_1.logInfo)('Redis client connected');
        });
        await redisClient.connect();
        return redisClient;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to create Redis client:', error);
        throw error;
    }
}
