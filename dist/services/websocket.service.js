"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocketServer = initializeWebSocketServer;
exports.startRedisSubscriber = startRedisSubscriber;
const socket_io_1 = require("socket.io");
const redis_service_1 = require("./redis.service");
const logger_1 = require("../utils/logger");
let io = null;
const CHANNEL_PATTERNS = [
    'doc:*:updated',
    'doc:*:created',
    'doc:*:submitted_to_client',
    'doc:*:reviewed',
    'doc:*:esigned',
    'section:*:updated',
    'section:*:assigned',
    'section:*:submitted',
    'clause:*:updated',
    'clause:*:assigned',
    'clause:*:submitted',
    'user:*:notification',
    'user:*:registration_approved',
    'user:*:registration_rejected',
];
function initializeWebSocketServer(httpServer) {
    if (io) {
        return io;
    }
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || ['https://app.tomeblock.com', 'http://localhost:3000'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        (0, logger_1.logInfo)(`Client connected: ${socket.id}`);
        socket.on('join:admin', (address) => {
            socket.join('admin');
            (0, logger_1.logInfo)(`Socket ${socket.id} joined admin room for address: ${address}`);
        });
        socket.on('join:doc', (docId) => {
            const room = `doc:${docId}`;
            socket.join(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} joined room: ${room}`);
        });
        socket.on('leave:doc', (docId) => {
            const room = `doc:${docId}`;
            socket.leave(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} left room: ${room}`);
        });
        socket.on('join:section', (sectionId) => {
            const room = `section:${sectionId}`;
            socket.join(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} joined room: ${room}`);
        });
        socket.on('leave:section', (sectionId) => {
            const room = `section:${sectionId}`;
            socket.leave(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} left room: ${room}`);
        });
        socket.on('join:clause', (clauseId) => {
            const room = `clause:${clauseId}`;
            socket.join(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} joined room: ${room}`);
        });
        socket.on('leave:clause', (clauseId) => {
            const room = `clause:${clauseId}`;
            socket.leave(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} left room: ${room}`);
        });
        socket.on('join:user', (address) => {
            const room = `user:${address.toLowerCase()}`;
            socket.join(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} joined room: ${room}`);
        });
        socket.on('leave:user', (address) => {
            const room = `user:${address.toLowerCase()}`;
            socket.leave(room);
            (0, logger_1.logInfo)(`Socket ${socket.id} left room: ${room}`);
        });
        socket.on('disconnect', () => {
            (0, logger_1.logInfo)(`Client disconnected: ${socket.id}`);
        });
    });
    (0, logger_1.logInfo)('WebSocket server initialized');
    return io;
}
async function startRedisSubscriber() {
    try {
        (0, logger_1.logInfo)('Getting Redis client for subscriber...');
        const redis = await (0, redis_service_1.getRedisClient)();
        (0, logger_1.logInfo)('Duplicating Redis client for subscriber...');
        const subscriber = redis.duplicate();
        (0, logger_1.logInfo)('Connecting subscriber to Redis...');
        await subscriber.connect();
        (0, logger_1.logInfo)('Subscriber connected to Redis');
        subscriber.on('error', (err) => {
            (0, logger_1.logError)('Redis subscriber error:', err);
        });
        (0, logger_1.logInfo)(`Subscribing to patterns: ${CHANNEL_PATTERNS.join(', ')}`);
        await subscriber.pSubscribe(CHANNEL_PATTERNS, (message, channel) => {
            try {
                const data = JSON.parse(message);
                (0, logger_1.logInfo)(`Received Redis message on channel: ${channel}, ${message}`);
                const room = channel.startsWith('user:') ? channel.substring(0, channel.lastIndexOf(':')) : channel;
                if (io) {
                    io.to(room).emit('event', data);
                    io.to('admin').emit('event', data);
                    if (channel.startsWith('doc:') && data.data?.client) {
                        const clientRoom = `user:${data.data.client.toLowerCase()}`;
                        io.to(clientRoom).emit('event', data);
                        (0, logger_1.logInfo)(`Broadcasted event to client room: ${clientRoom}`);
                    }
                    if (channel.startsWith('section:') && data.data?.divisionLeader) {
                        const leaderRoom = `user:${data.data.divisionLeader.toLowerCase()}`;
                        io.to(leaderRoom).emit('event', data);
                        (0, logger_1.logInfo)(`Broadcasted event to division leader room: ${leaderRoom}`);
                    }
                    if (channel.startsWith('clause:') && data.data?.member) {
                        const memberRoom = `user:${data.data.member.toLowerCase()}`;
                        io.to(memberRoom).emit('event', data);
                        (0, logger_1.logInfo)(`Broadcasted event to division member room: ${memberRoom}`);
                    }
                    if (channel.startsWith('clause:') && data.data?.divisionLeader) {
                        const leaderRoom = `user:${data.data.divisionLeader.toLowerCase()}`;
                        io.to(leaderRoom).emit('event', data);
                        (0, logger_1.logInfo)(`Broadcasted event to division leader room: ${leaderRoom}`);
                    }
                    (0, logger_1.logInfo)(`Broadcasted event to room: ${room} and admin`);
                }
            }
            catch (error) {
                (0, logger_1.logError)('Error processing Redis message:', error);
            }
        });
        (0, logger_1.logInfo)(`Redis subscriber listening to channels: ${CHANNEL_PATTERNS.join(', ')}`);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to start Redis subscriber:', error);
        throw error;
    }
}
