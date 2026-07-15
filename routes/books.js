import express from 'express';

import upload from '../config/multer.js';

import {
  createBook,
  getBook,
  getBooks,
} from '../controllers/booksController.js';

const router = express.Router();

router.post('/create', upload.single('image'), createBook);

router.get('/', getBooks);

router.get('/:id', getBook);

export default router;
