import express from 'express';

import upload from '../config/multer.js';

import {
  createBook,
  deleteBook,
  getBook,
  getBookForEditing,
  getBooks,
  replaceBookImage,
  updateBook,
} from '../controllers/booksController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

function uploadSingleImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();

    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE'
        ? 'התמונה גדולה מדי. ניתן להעלות קובץ עד 10MB'
        : error.message,
    });
  });
}

router.post('/create', optionalAuth, requireAuth, uploadSingleImage, createBook);

router.get('/', getBooks);

router.get('/:id/edit', optionalAuth, requireAuth, getBookForEditing);

router.patch('/:id', optionalAuth, requireAuth, updateBook);

router.post('/:id/image', optionalAuth, requireAuth, uploadSingleImage, replaceBookImage);

router.delete('/:id', optionalAuth, requireAuth, deleteBook);

router.get('/:id', optionalAuth, getBook);

export default router;
