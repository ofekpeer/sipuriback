import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();
const client = new OpenAI({

    apiKey: process.env.OPENAI_API_KEY,

});

const STORY_SETTINGS = {

    model: "gpt-4.1",

    temperature: 0.8,

};

export async function chat(messages) {

    const response = await client.chat.completions.create({

        ...STORY_SETTINGS,

        messages,

    });

    return response.choices[0].message.content;

}