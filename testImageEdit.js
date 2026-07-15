import OpenAI, { toFile } from 'openai';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const imageBuffer = await fs.readFile(
      './uploads/books/6a5714a0fcbf512383dbebde/cover.png',
    );

    const imageFile = await toFile(imageBuffer, 'cover.png', {
      type: 'image/png',
    });

    const response = await client.images.edit({
      model: 'gpt-image-1',

      image: imageFile,

      prompt: `
Turn this child into a Pixar style illustration.

Keep exactly the same face.
Keep exactly the same hairstyle.
Keep exactly the same eyes.
Do not change identity.

`,

      size: '1024x1024',
    });

    console.log(response);
  } catch (err) {
    console.error(err);
  }
}

test();
