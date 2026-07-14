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
  'user:*:registration_approved',
  'user:*:registration_rejected',
];

export function initializeWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['https://app.tomeblock.com', 'http://localhost:3000'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logInfo(`Client connected: ${socket.id}`);

    // Handle admin auto-join to all rooms
    socket.on('join:admin', (address: string) => {
      // Admin joins all rooms to receive all messages
      socket.join('admin');
      logInfo(`Socket ${socket.id} joined admin room for address: ${address}`);
    });

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
    logInfo('Getting Redis client for subscriber...');
    const redis = await getRedisClient();
    logInfo('Duplicating Redis client for subscriber...');
    const subscriber = redis.duplicate();

    logInfo('Connecting subscriber to Redis...');
    await subscriber.connect();
    logInfo('Subscriber connected to Redis');

    subscriber.on('error', (err) => {
      logError('Redis subscriber error:', err);
    });

    // Subscribe to all channel patterns
    logInfo(`Subscribing to patterns: ${CHANNEL_PATTERNS.join(', ')}`);
    
    // In node-redis v4, pSubscribe callback handles messages directly
    await subscriber.pSubscribe(CHANNEL_PATTERNS, (message, channel) => {
      try {
        const data = JSON.parse(message);
        logInfo(`Received Redis message on channel: ${channel}, ${message}`);

        // Map Redis channel to WebSocket room
        // For user channels, strip the event suffix (everything after the last colon)
        // e.g., user:{address}:registration_approved -> user:{address}
        const room = channel.startsWith('user:') ? channel.substring(0, channel.lastIndexOf(':')) : channel;

        // Broadcast to all clients in the room
        if (io) {
          io.to(room).emit('event', data);
          // Also broadcast to admin room for all events
          io.to('admin').emit('event', data);

          // For doc events, also broadcast to the client's user room if client address is in data
          if (channel.startsWith('doc:') && data.data?.client) {
            const clientRoom = `user:${data.data.client.toLowerCase()}`;
            io.to(clientRoom).emit('event', data);
            logInfo(`Broadcasted event to client room: ${clientRoom}`);
          }

          // For section events, also broadcast to the division leader's user room if divisionLeader is in data
          if (channel.startsWith('section:') && data.data?.divisionLeader) {
            const leaderRoom = `user:${data.data.divisionLeader.toLowerCase()}`;
            io.to(leaderRoom).emit('event', data);
            logInfo(`Broadcasted event to division leader room: ${leaderRoom}`);
          }

          // For clause events, also broadcast to the division member's user room if member is in data
          if (channel.startsWith('clause:') && data.data?.member) {
            const memberRoom = `user:${data.data.member.toLowerCase()}`;
            io.to(memberRoom).emit('event', data);
            logInfo(`Broadcasted event to division member room: ${memberRoom}`);
          }

          // For clause events, also broadcast to the division leader's user room if divisionLeader is in data
          if (channel.startsWith('clause:') && data.data?.divisionLeader) {
            const leaderRoom = `user:${data.data.divisionLeader.toLowerCase()}`;
            io.to(leaderRoom).emit('event', data);
            logInfo(`Broadcasted event to division leader room: ${leaderRoom}`);
          }

          logInfo(`Broadcasted event to room: ${room} and admin`);
        }
      } catch (error) {
        logError('Error processing Redis message:', error);
      }
    });
    
    logInfo(`Redis subscriber listening to channels: ${CHANNEL_PATTERNS.join(', ')}`);

  } catch (error) {
    logError('Failed to start Redis subscriber:', error);
    throw error;
  }
}
