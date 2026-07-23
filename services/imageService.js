import fs from 'fs/promises';
import path from 'path';
import { generateImage } from './openAIService.js';

const MIN_FREE_SPACE_BYTES = Number(
  process.env.MIN_IMAGE_STORAGE_FREE_BYTES || 100 * 1024 * 1024,
);

async function ensureStorageAvailable() {
  const storage = await fs.statfs(path.resolve('uploads'));
  const freeBytes = Number(storage.bavail) * Number(storage.bsize);

  if (freeBytes < MIN_FREE_SPACE_BYTES) {
    const freeMB = Math.floor(freeBytes / (1024 * 1024));
    throw new Error(
      `Not enough disk space to generate images (${freeMB}MB free; at least 100MB required).`,
    );
  }
}

export async function createImage({
  prompt,

  outputPath,

  referenceImage = null,
}) {
  console.log('➡️ createImage');

  console.log(`[image] generation started: ${outputPath}`);
  await ensureStorageAvailable();

  const image = await generateImage({
    prompt,

    referenceImage,
  });

  console.log('Image received from OpenAI');
  console.log(`[image] response received: ${outputPath}`);

  if (!image.b64_json) {
    throw new Error('Image generation failed');
  }

  const buffer = Buffer.from(
    image.b64_json,

    'base64',
  );

  await fs.mkdir(
    path.dirname(outputPath),

    {
      recursive: true,
    },
  );

  await fs.writeFile(
    outputPath,

    buffer,
  );
  console.log('Image saved:', outputPath);
  console.log(`[image] saved: ${outputPath}`);
  return outputPath;
}
