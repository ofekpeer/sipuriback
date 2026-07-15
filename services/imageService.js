import fs from 'fs/promises';
import path from 'path';
import { generateImage } from './openAIService.js';

export async function createImage({
  prompt,

  outputPath,

  referenceImage = null,
}) {
  console.log('➡️ createImage');

  const image = await generateImage({
    prompt,

    referenceImage,
  });

  console.log('Image received from OpenAI');
  console.log(image);

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
  return outputPath;
}
