import express from 'express';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './utils/database';
import { initializeWebSocketServer, startRedisSubscriber } from './services/websocket.service';

// Import routes
import apiRouter from './routes/api';
import clauseRouter from './routes/clause';
import sectionRouter from './routes/section';
import contractRouter from './routes/contract';
import uploadRouter from './routes/upload';
import postgresRouter from './routes/postgres';
import supportRouter from './routes/support';
import analysisRouter from './routes/analysis';

dotenv.config();
// Create express app
const app = express();

// Test PostgreSQL connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

const corsOptions = {
  origin: ["http://localhost:3000", "https://app.tomeblock.com", "https://www.tomeblock.com"],
  credentials: false,
};

app
  .use(
    cors(corsOptions)
  )
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .use("/api", apiRouter)
  .use("/clause", clauseRouter)
  .use("/section", sectionRouter)
  .use("/contract", contractRouter)
  .use("/upload", uploadRouter)
  .use("/support", supportRouter)
  .use("/postgres", postgresRouter)
  .use("/analysis", analysisRouter)

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app);
const io = initializeWebSocketServer(httpServer);

// Start Redis subscriber for real-time events
startRedisSubscriber().catch((error) => {
  console.error('Failed to start Redis subscriber:', error);
});

httpServer.listen(8085, () => {
  console.log("the server is running on port 8085");
  console.log("WebSocket server initialized");
}); 