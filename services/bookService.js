import Book from '../models/Book.js';

import { validateBook } from '../utils/validateBook.js';
import { buildBook } from '../utils/buildBook.js';
import { analyzeImage } from './openAIService.js';
import { buildCharacter } from './characterService.js';
import { generateStory } from './storyService.js';
import { generateCover, generatePages } from './bookImageService.js';
export async function createBook(bookData) {
  const errors = validateBook(bookData);
  console.log('IMAGE PATH:', bookData.child.image);
  if (errors.length) {
    throw new Error(errors.join(', '));
  }

  // בניית הדמות
  let imageAnalysis = null;

  if (bookData.child.image) {
    imageAnalysis = await analyzeImage(bookData.child.image);
  }

  const character = buildCharacter(
    bookData,

    imageAnalysis,
  );
  // יצירת הסיפור
  const story = await generateStory(
    bookData,

    character,
  );

  // בניית אובייקט הספר
  const book = buildBook(
    bookData,

    character,

    story,
  );

  // שמירה במסד
  const savedBook = await Book.create(book);
  console.log('SAVED ORIGINAL IMAGE:', savedBook.originalImage);
  console.log(bookData.child.image);
  // יצירת תמונת כריכה
  await generateCover(savedBook);

  // יצירת כל תמונות העמודים
  //await generatePages(savedBook);

  // סימון שהספר הושלם
  await Book.findByIdAndUpdate(savedBook._id, {
    status: 'completed',
  });

  // טעינה מחדש של הספר
  const completedBook = await Book.findById(savedBook._id);
  console.log('COMPLETED ORIGINAL IMAGE:', completedBook.originalImage);
  return completedBook;
}

export async function getBookById(id) {
  const book = await Book.findById(id);

  if (!book) {
    throw new Error('Book not found');
  }

  return book;
}

export async function getAllBooks() {
  return await Book.find()

    .sort({ createdAt: -1 });
}
