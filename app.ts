import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import apiRouter from './routes/api';
import clauseRouter from './routes/clause';
import sectionRouter from './routes/section';
import contractRouter from './routes/contract';
import uploadRouter from './routes/upload';
import subgraphRouter from './routes/subgraph';
import supportRouter from './routes/support';
import analysisRouter from './routes/analysis';

dotenv.config();
// Create express app
const app = express();

const connectionString = `mongodb+srv://${process.env.USER_NAME}:${encodeURIComponent(process.env.PASSWORD!)}@cluster0.dwfddsb.mongodb.net/solar?retryWrites=true&w=majority`;
// Connect to MongoDB Atlas
mongoose.connect(connectionString, {
}).then(() => {
  console.log('Connected to Database');
}).catch((error) => {
  console.error('Error connecting to Database:', error);
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
  .use("/subgraph", subgraphRouter)
  .use("/analysis", analysisRouter)


app.listen(8085, () => {
  console.log("the server is running on port 8085");
}); 