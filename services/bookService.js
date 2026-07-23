import Book from '../models/Book.js';
import path from 'path';
import fs from 'fs/promises';

import { validateBook } from '../utils/validateBook.js';
import { buildBook } from '../utils/buildBook.js';
import { analyzeImage } from './openAIService.js';
import { buildCharacter } from './characterService.js';
import { generateStory } from './storyService.js';
import {
  generateCover,
  generatePages,
} from './bookImageService.js';

const activeGenerationJobs = new Set();
const cancelledGenerationJobs = new Set();

function assertGenerationActive(bookId) {
  if (cancelledGenerationJobs.has(bookId.toString())) {
    const error = new Error('Book generation was cancelled');
    error.code = 'GENERATION_CANCELLED';
    throw error;
  }
}

export function cancelBookGeneration(bookId) {
  const jobKey = bookId.toString();
  if (activeGenerationJobs.has(jobKey)) {
    cancelledGenerationJobs.add(jobKey);
  }
}

async function generateBookInBackground(bookId, bookData) {
  const generationStartedAt = Date.now();

  try {
    console.log(`[book:${bookId}] background generation started`);
    assertGenerationActive(bookId);

    await Book.findByIdAndUpdate(bookId, {
      generationStep: bookData.child.image ? 'analyzing-image' : 'generating-story',
    });

    // Story writing does not need to wait for the portrait analysis. The final
    // image prompt receives the analyzed identity details after both finish.
    const initialCharacter = buildCharacter(bookData);
    console.log(`[book:${bookId}] story and portrait analysis started in parallel`);
    const [story, imageAnalysis] = await Promise.all([
      generateStory(bookData, initialCharacter),
      bookData.child.image
        ? analyzeImage(bookData.child.image)
        : Promise.resolve(null),
    ]);
    const character = buildCharacter(bookData, imageAnalysis);
    console.log(`[book:${bookId}] story and portrait analysis completed`);
    assertGenerationActive(bookId);

    const completedBookData = buildBook(bookData, character, story);
    await Book.findByIdAndUpdate(bookId, {
      ...completedBookData,
      generatedPages: 0,
      generationStep: 'generating-preview',
      remainingPagesStatus: 'pending',
    });

    const book = await Book.findById(bookId);
    if (!book) throw new Error('Book was deleted before generation completed');

    const referenceImages = [
      book.originalImage,
    ].filter(Boolean);

    const previewPages = book.pages.slice(0, 2);

    // The cover and the two pages the user can read before payment are the
    // critical path. Generate all three concurrently.
    await Promise.all([
      generateCover(book, referenceImages),
      generatePages(book, previewPages, referenceImages),
    ]);
    assertGenerationActive(bookId);

    await Book.findByIdAndUpdate(bookId, {
      status: 'completed',
      generationStep: 'completed',
      remainingPagesStatus: book.pages.length > 2 ? 'generating' : 'completed',
    });

    console.log(`[book:${bookId}] preview ready`);
    console.log(`[book:${bookId}] preview latency: ${Date.now() - generationStartedAt}ms`);

    const remainingPages = book.pages.slice(2);
    if (remainingPages.length) {
      try {
        assertGenerationActive(bookId);
        // The finished cover is a free style anchor for the rest of the book,
        // avoiding a separate master-reference generation request.
        const remainingReferenceImages = [
          book.originalImage,
          path.join('uploads', 'books', book._id.toString(), 'cover.jpg'),
        ].filter(Boolean);
        await generatePages(book, remainingPages, remainingReferenceImages);
        await Book.findByIdAndUpdate(bookId, {
          $set: { remainingPagesStatus: 'completed' },
          $unset: { generationInput: 1 },
        });
        console.log(`[book:${bookId}] remaining pages completed`);
      } catch (remainingError) {
        console.error(`[book:${bookId}] remaining pages failed:`, remainingError);
        await Book.findByIdAndUpdate(bookId, {
          remainingPagesStatus: 'failed',
        });
      }
    } else {
      await Book.findByIdAndUpdate(bookId, {
        $unset: { generationInput: 1 },
      });
    }
  } catch (error) {
    if (error.code === 'GENERATION_CANCELLED') {
      console.log(`[book:${bookId}] background generation cancelled`);
      return;
    }

    console.error(`[book:${bookId}] background generation failed:`, error);

    await Book.findByIdAndUpdate(bookId, {
      status: 'failed',
      generationStep: 'failed',
    });
  }
}

function queueBookGeneration(bookId, bookData) {
  const jobKey = bookId.toString();
  if (activeGenerationJobs.has(jobKey)) {
    console.log(`[book:${jobKey}] generation is already active`);
    return;
  }

  activeGenerationJobs.add(jobKey);

  setImmediate(async () => {
    try {
      await generateBookInBackground(jobKey, bookData);
    } finally {
      activeGenerationJobs.delete(jobKey);

      if (cancelledGenerationJobs.has(jobKey)) {
        await fs.rm(
          path.join('uploads', 'books', jobKey),
          { recursive: true, force: true },
        ).catch(() => {});
        cancelledGenerationJobs.delete(jobKey);
      }
    }
  });
}

async function generateRemainingPagesInBackground(bookId) {
  const book = await Book.findById(bookId);
  if (!book) return;

  const remainingPages = book.pages
    .slice(2)
    .filter((page) => !page.imageUrl);

  if (!remainingPages.length) {
    await Book.findByIdAndUpdate(bookId, {
      $set: { remainingPagesStatus: 'completed' },
      $unset: { generationInput: 1 },
    });
    return;
  }

  const coverReferencePath = book.cover?.imageUrl
    ? path.normalize(book.cover.imageUrl.replace(/^\/+/, ''))
    : null;
  const referenceImages = [
    book.originalImage,
    coverReferencePath,
  ].filter(Boolean);

  try {
    console.log(`[book:${bookId}] resuming ${remainingPages.length} remaining page(s)`);
    await generatePages(book, remainingPages, referenceImages);
    await Book.findByIdAndUpdate(bookId, {
      $set: { remainingPagesStatus: 'completed' },
      $unset: { generationInput: 1 },
    });
  } catch (error) {
    console.error(`[book:${bookId}] resumed remaining pages failed:`, error);
    await Book.findByIdAndUpdate(bookId, {
      remainingPagesStatus: 'failed',
    });
  }
}

function queueRemainingPageGeneration(bookId) {
  const jobKey = bookId.toString();
  if (activeGenerationJobs.has(jobKey)) return;

  activeGenerationJobs.add(jobKey);

  setImmediate(async () => {
    try {
      await generateRemainingPagesInBackground(jobKey);
    } finally {
      activeGenerationJobs.delete(jobKey);
    }
  });
}

export async function resumePendingBookGenerations() {
  const [pendingBooks, interruptedRemainingBooks] = await Promise.all([
    Book.find({
      status: 'generating',
      generationInput: { $ne: null },
    }).select('+generationInput'),
    Book.find({
      status: 'completed',
      remainingPagesStatus: 'generating',
      generationInput: { $ne: null },
    }).select('_id'),
  ]);

  const totalJobs = pendingBooks.length + interruptedRemainingBooks.length;
  if (!totalJobs) return;

  console.log(`[books] resuming ${totalJobs} interrupted generation job(s)`);
  pendingBooks.forEach((book) => {
    queueBookGeneration(book._id, book.generationInput);
  });

  interruptedRemainingBooks.forEach((book) => {
    queueRemainingPageGeneration(book._id);
  });
}

export async function createBook(bookData, ownerId, creationKey = null) {
  if (creationKey) {
    const existingBook = await Book.findOne({ owner: ownerId, creationKey });

    if (existingBook) {
      console.log(`[book:${existingBook._id}] returning existing idempotent creation`);
      return existingBook;
    }
  }

  const errors = validateBook(bookData);
  if (errors.length) throw new Error(errors.join(', '));

  // Create a valid lightweight record immediately so the HTTP request returns
  // without waiting for any OpenAI request.
  const initialCharacter = buildCharacter(bookData);
  const pendingBook = {
    child: {
      name: bookData.child.name,
      age: Number(bookData.child.age),
      gender: bookData.child.gender,
    },
    originalImage: bookData.child.image || null,
    character: initialCharacter,
    title: `ספר בהכנה עבור ${bookData.child.name}`,
    cover: { title: '', imagePrompt: '', imageUrl: '' },
    pages: [],
    summary: '',
    moral: '',
    owner: ownerId,
    creationKey: creationKey || undefined,
    generationInput: bookData,
    status: 'generating',
    generationStep: 'created',
    generatedPages: 0,
  };

  let savedBook;

  try {
    savedBook = await Book.create(pendingBook);
  } catch (error) {
    if (error?.code === 11000 && creationKey) {
      const existingBook = await Book.findOne({ owner: ownerId, creationKey });
      if (existingBook) return existingBook;
    }

    throw error;
  }

  console.log(`[book:${savedBook._id}] created immediately; AI generation queued`);
  queueBookGeneration(savedBook._id, bookData);

  return Book.findById(savedBook._id);
}

export async function getBookById(id) {
  const book = await Book.findById(id);

  if (!book) throw new Error('Book not found');

  return book;
}

export async function getAllBooks() {
  return Book.find().sort({ createdAt: -1 });
}
