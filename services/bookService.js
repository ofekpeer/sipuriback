import { validateBook } from '../utils/validateBook.js';
import { buildBook } from '../utils/buildBook.js';
import { buildCharacter } from './characterService.js';
import { generateStory } from './storyService.js';
import Book from '../models/Book.js';

export async function createBook(bookData) {
  const errors = validateBook(bookData);

  if (errors.length) {
    throw new Error(errors.join(', '));
  }

  // בניית הדמות
  const character = buildCharacter(bookData);

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

  // שמירת הספר במסד הנתונים
  const savedBook = await Book.create(book);

  return savedBook;
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