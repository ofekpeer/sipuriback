import express from 'express';
import { getLibrary } from '../controllers/usersController.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();
router.get('/me/books', requireAuth, getLibrary);
export default router;
