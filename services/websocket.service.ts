import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getRedisClient } from './redis.service';
import { logError, logInfo } from '../utils/logger';


let io: SocketIOServer | null = null;

// Channel patterns to subscribe to
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
];

export function initializeWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logInfo(`Client connected: ${socket.id}`);

    // Handle room joining
    socket.on('join:doc', (docId: string) => {
      const room = `doc:${docId}`;
      socket.join(room);
      logInfo(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave:doc', (docId: string) => {
      const room = `doc:${docId}`;
      socket.leave(room);
      logInfo(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('join:section', (sectionId: string) => {
      const room = `section:${sectionId}`;
      socket.join(room);
      logInfo(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave:section', (sectionId: string) => {
      const room = `section:${sectionId}`;
      socket.leave(room);
      logInfo(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('join:clause', (clauseId: string) => {
      const room = `clause:${clauseId}`;
      socket.join(room);
      logInfo(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave:clause', (clauseId: string) => {
      const room = `clause:${clauseId}`;
      socket.leave(room);
      logInfo(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('join:user', (address: string) => {
      const room = `user:${address.toLowerCase()}`;
      socket.join(room);
      logInfo(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave:user', (address: string) => {
      const room = `user:${address.toLowerCase()}`;
      socket.leave(room);
      logInfo(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      logInfo(`Client disconnected: ${socket.id}`);
    });
  });

  logInfo('WebSocket server initialized');
  return io;
}

export async function startRedisSubscriber(): Promise<void> {
  try {
    const redis = await getRedisClient();
    const subscriber = redis.duplicate();

    await subscriber.connect();

    subscriber.on('error', (err) => {
      logError('Redis subscriber error:', err);
    });

    // Subscribe to all channel patterns
    await subscriber.pSubscribe(CHANNEL_PATTERNS, () => {});
    logInfo(`Redis subscriber listening to channels: ${CHANNEL_PATTERNS.join(', ')}`);

    // Handle incoming messages
    subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const data = JSON.parse(message);
        logInfo(`Received Redis message on channel: ${channel}`);

        // Map Redis channel to WebSocket room
        const room = channel; // Channel names match room names
        
        // Broadcast to all clients in the room
        if (io) {
          io.to(room).emit('event', data);
          logInfo(`Broadcasted event to room: ${room}`);
        }
      } catch (error) {
        logError('Error processing Redis message:', error);
      }
    });

  } catch (error) {
    logError('Failed to start Redis subscriber:', error);
    throw error;
  }
}

export function getWebSocketServer(): SocketIOServer | null {
  return io;
}
