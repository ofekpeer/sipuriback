import express from 'express';
import {
  createBook,
  getBook,
  getBooks,
} from '../controllers/booksController.js';
const router = express.Router();

router.post('/create', createBook);

router.get('/', getBooks);

router.get('/:id', getBook);

export default router;
