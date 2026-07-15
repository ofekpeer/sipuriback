import path from 'path';
import Book from '../models/Book.js';
import { createImage } from './imageService.js';
import { buildImagePrompt } from '../prompts/imagePrompt.js';

export async function generateCover(book) {
  console.log('BOOK ORIGINAL IMAGE:', book.originalImage);
  const outputPath = path.join(
    'uploads',
    'books',
    book._id.toString(),
    'cover.png',
  );

  const prompt = buildImagePrompt(book.character, book.cover.imagePrompt);

  await createImage({
    prompt,

    outputPath,

    referenceImage: book.originalImage,
  });

  const imageUrl = `/uploads/books/${book._id}/cover.png`;

  await Book.findByIdAndUpdate(
    book._id,

    {
      'cover.imageUrl': imageUrl,
    },
  );
}

export async function generatePages(book) {
  for (const page of book.pages) {
    const outputPath = path.join(
      'uploads',

      'books',

      book._id.toString(),

      `page-${page.page}.png`,
    );

    const prompt = buildImagePrompt(
      book.character,

      page.imagePrompt,
    );

    await createImage({
      prompt,

      outputPath,

      referenceImage: book.originalImage,
    });

    await Book.updateOne(
      {
        _id: book._id,

        'pages.page': page.page,
      },

      {
        $set: {
          'pages.$.imageUrl': `/uploads/books/${book._id}/page-${page.page}.png`,
        },
      },
    );

    console.log(`✅ Page ${page.page} created`);
  }
}
