import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from "path";
import { toFile } from "openai";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STORY_SETTINGS = {
  model: 'gpt-4.1',
  temperature: 0.8,
};

export async function chat(messages) {
  const response = await client.chat.completions.create({
    ...STORY_SETTINGS,
    messages,
  });

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
  if (!referenceImage) {
    console.log("Using images.generate()");

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    console.log("images.generate finished");

    return response.data[0];
  }

  console.log("Reading reference image...");

  const imageBuffer = await fs.readFile(referenceImage);

  const extension = path.extname(referenceImage).toLowerCase();

  let mimeType = "image/jpeg";

  if (extension === ".png") {
    mimeType = "image/png";
  }

  if (extension === ".webp") {
    mimeType = "image/webp";
  }

  console.log("Extension:", extension);
  console.log("Mime:", mimeType);

  const imageFile = await toFile(
    imageBuffer,
    `reference${extension}`,
    {
      type: mimeType,
    }
  );

  console.log("Calling OpenAI images.edit()...");

  const response = await client.images.edit({
    model: "gpt-image-1",

    image: imageFile,

    prompt,

    size: "1024x1024",
  });

  console.log("images.edit finished");

  console.log(response);

  return response.data[0];
}

export async function analyzeImage(imagePath) {
  const buffer = await fs.readFile(imagePath);

  const base64 = buffer.toString('base64');

  const response = await client.chat.completions.create({
    model: 'gpt-4.1',

    response_format: {
      type: 'json_object',
    },

    messages: [
      {
        role: 'system',
        content: `
You are an expert character designer.

Analyze the child.

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
            text: 'Analyze this child.',
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
  });

  return JSON.parse(response.choices[0].message.content);
}
