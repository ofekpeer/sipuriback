import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database.js';
import booksRouter from './routes/books.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import { resumePendingBookGenerations } from './services/bookService.js';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/books', booksRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 5000;

// הפעלת השרת מיד
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // ניסיון חיבור למסד הנתונים ברקע
  try {
    await connectDatabase();
    console.log('Database connected successfully');
    await resumePendingBookGenerations();
  } catch (err) {
    console.error('Failed to connect to database:', err);
  }
});
