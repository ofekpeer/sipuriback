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

// הפעלת השרת מיד כדי ש-Render יזהה את הפורט פתוח
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // ניסיון חיבור למסד הנתונים ברקע
  try {
    await connectDatabase();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Failed to connect to database:', err);
  }
});
startServer();
