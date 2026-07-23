import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from "path";
import { toFile } from "openai";
import { withTimeout } from '../utils/withTimeout.js';
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STORY_SETTINGS = {
  model: 'gpt-4.1',
  temperature: 0.8,
};

const STORY_TIMEOUT_MS = Number(process.env.OPENAI_STORY_TIMEOUT_MS || 60_000);
const IMAGE_TIMEOUT_MS = Number(process.env.OPENAI_IMAGE_TIMEOUT_MS || 300_000);
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || 'high';
const IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || '1536x2048';
const IMAGE_OUTPUT_FORMAT = process.env.OPENAI_IMAGE_OUTPUT_FORMAT || 'jpeg';
const IMAGE_OUTPUT_COMPRESSION = Number(
  process.env.OPENAI_IMAGE_OUTPUT_COMPRESSION || 95,
);

export async function chat(messages) {
  const response = await withTimeout(
    (signal) => client.chat.completions.create({
      ...STORY_SETTINGS,
      messages,
    }, { signal }),
    { label: 'OpenAI story generation', timeoutMs: STORY_TIMEOUT_MS },
  );

  return response.choices[0].message.content;
}

/**
 * כרגע referenceImage עדיין לא בשימוש.
 * הוספנו אותו כדי שהארכיטקטורה תהיה מוכנה.
 */

export async function generateImage({
  prompt,
  referenceImage = null,
}) {
  console.log("=================================");
  console.log("generateImage()");
  console.log("Reference:", referenceImage);

  // אין תמונת ייחוס
  const referenceImages = Array.isArray(referenceImage)
    ? referenceImage.filter(Boolean)
    : [referenceImage].filter(Boolean);

  if (!referenceImages.length) {
    console.log("Using images.generate()");

    const response = await withTimeout(
      (signal) => client.images.generate({
        model: IMAGE_MODEL,
        prompt,
        size: IMAGE_SIZE,
        quality: IMAGE_QUALITY,
        output_format: IMAGE_OUTPUT_FORMAT,
        output_compression: IMAGE_OUTPUT_COMPRESSION,
      }, { signal }),
      { label: 'OpenAI image generation', timeoutMs: IMAGE_TIMEOUT_MS },
    );

    console.log("images.generate finished");

    return response.data[0];
  }

  console.log("Reading reference image...");

  const imageFiles = await Promise.all(referenceImages.map(async (imagePath, index) => {
    const imageBuffer = await fs.readFile(imagePath);
    const extension = path.extname(imagePath).toLowerCase();
    const mimeType = extension === '.png'
      ? 'image/png'
      : extension === '.webp'
        ? 'image/webp'
        : 'image/jpeg';

    return toFile(imageBuffer, `reference-${index + 1}${extension}`, { type: mimeType });
  }));

  console.log("Calling OpenAI images.edit()...");

  const response = await withTimeout((signal) => client.images.edit({
    model: IMAGE_MODEL,

    image: imageFiles,

    prompt,

    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY,
    output_format: IMAGE_OUTPUT_FORMAT,
    output_compression: IMAGE_OUTPUT_COMPRESSION,
  }, { signal }), {
    label: 'OpenAI image edit',
    timeoutMs: IMAGE_TIMEOUT_MS,
  });

  console.log("images.edit finished");

  return response.data[0];
}

export async function analyzeImage(imagePath) {
  const buffer = await fs.readFile(imagePath);

  const base64 = buffer.toString('base64');

  const response = await withTimeout((signal) => client.chat.completions.create({
    model: 'gpt-4.1',

    response_format: {
      type: 'json_object',
    },

    messages: [
      {
        role: 'system',
        content: `
You are an expert portrait and identity analyst.

Analyze the person in the reference photo. Preserve their real apparent age and identity. Do not assume they are a child.

Return ONLY valid JSON.

Describe only what is clearly visible.

{
  "hair":{
    "color":"",
    "style":""
  },
  "eyes":{
    "color":"",
    "shape":""
  },
  "skin":{
    "tone":""
  },
  "face":{
    "shape":""
  },
  "apparentAge":"",
  "facialHair":"",
  "jawline":"",
  "bodyBuild":"",
  "facialProportions":"",
  "distinctiveFeatures":[],
  "eyebrows":"",
  "nose":"",
  "mouth":"",
  "shirt":"",
  "pants":"",
  "shoes":"",
  "accessories":[]
}
`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this person for exact identity preservation in future illustrations.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
            },
          },
        ],
      },
    ],
  }, { signal }), {
    label: 'OpenAI child image analysis',
    timeoutMs: STORY_TIMEOUT_MS,
  });

  return JSON.parse(response.choices[0].message.content);
}
