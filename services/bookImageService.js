import path from 'path';
import Book from '../models/Book.js';
import { createImage } from './imageService.js';
import { buildImagePrompt } from '../prompts/imagePrompt.js';

export async function generateCover(
  book,
  referenceImages = [book.originalImage].filter(Boolean),
) {
  const outputPath = path.join(
    'uploads',
    'books',
    book._id.toString(),
    'cover.jpg',
  );

  console.log(`[book:${book._id}] cover generation started`);
  console.log(`[book:${book._id}] cover illustration style: ${book.character.illustrationStyle}`);
  const prompt = buildImagePrompt(
    book.character,
    book.cover.imagePrompt,
    referenceImages.length,
  );

  await createImage({
    prompt,
    outputPath,
    referenceImage: referenceImages,
  });

  await Book.findByIdAndUpdate(book._id, {
    'cover.imageUrl': `/uploads/books/${book._id}/cover.jpg`,
  });

  console.log('✅ Cover created');
}

export async function generatePages(
  book,
  pages = book.pages,
  referenceImages = [book.originalImage].filter(Boolean),
) {
  const BATCH_SIZE = 3;
  console.log(`[book:${book._id}] page illustration style: ${book.character.illustrationStyle}`);

  const mockImages = process.env.MOCK_IMAGES === 'true';
  const maxAIImages = Number(process.env.MAX_AI_IMAGES);

  const pagesToGenerate = mockImages
    ? pages.slice(0, maxAIImages)
    : pages;

  for (let i = 0; i < pagesToGenerate.length; i += BATCH_SIZE) {
    const batch = pagesToGenerate.slice(i, i + BATCH_SIZE);

    console.log(`[book:${book._id}] generating pages: ${batch.map((page) => page.page).join(', ')}`);

    await Promise.all(
      batch.map(async (page) => {
        const outputPath = path.join(
          'uploads',
          'books',
          book._id.toString(),
          `page-${page.page}.jpg`,
        );

        const prompt = buildImagePrompt(
          book.character,
          page.imagePrompt,
          referenceImages.length,
        );

        await createImage({
          prompt,
          outputPath,
          referenceImage: referenceImages,
        });

        await Book.updateOne(
          {
            _id: book._id,
            'pages.page': page.page,
          },
          {
            $set: {
              'pages.$.imageUrl': `/uploads/books/${book._id}/page-${page.page}.jpg`,
              'pages.$.isPlaceholder': false,
            },
            $inc: {
              generatedPages: 1,
            },
          },
        );

        console.log(`✅ Page ${page.page} created`);
      }),
    );
  }

  if (mockImages) {
    const placeholder = '/uploads/defaults/sipuri-placeholder.png';

    await Promise.all(
      pages.slice(maxAIImages).map(async (page) => {
        await Book.updateOne(
          {
            _id: book._id,
            'pages.page': page.page,
          },
          {
            $set: {
              'pages.$.imageUrl': placeholder,
              'pages.$.isPlaceholder': true,
            },
            $inc: {
              generatedPages: 1,
            },
          },
        );

        console.log(`🟡 Placeholder assigned to page ${page.page}`);
      }),
    );
  }

  console.log('✅ All pages finished');
}
