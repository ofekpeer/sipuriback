import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database.js';
import booksRouter from './routes/books.js';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api/books', booksRouter);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server');

    console.error(err);
  }
}

startServer();
