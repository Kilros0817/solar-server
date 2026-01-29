import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ensureClauseTemplatesSeeded } from './utils/seedClauseTemplates';
import { ensureSectionTemplatesSeeded } from './utils/seedSectionTemplates';

// Import routes
import apiRouter from './routes/api';
import clauseRouter from './routes/clause';
import sectionRouter from './routes/section';

// Create express app
const app = express();

// app.enable('trust proxy');

dotenv.config();

const connectionString = `mongodb+srv://${process.env.USER_NAME}:${encodeURIComponent(process.env.PASSWORD!)}@cluster0.dwfddsb.mongodb.net/solar?retryWrites=true&w=majority`;
// Connect to MongoDB Atlas
mongoose.connect(connectionString, {
}).then(() => {
  console.log('Connected to Database');
  Promise.all([
    ensureClauseTemplatesSeeded(),
    ensureSectionTemplatesSeeded(),
  ])
    .then(() => {
      console.log('Clause templates ensured');
      console.log('Section templates ensured');
    })
    .catch((error) => console.error('Failed to seed templates:', error));
}).catch((error) => {
  console.error('Error connecting to Database:', error);
});

const corsOptions = {
  origin: ["http://localhost:3000"],
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


app.listen(8085, () => {
  console.log("the server is running on port 8085");
}); 