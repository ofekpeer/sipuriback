import { buildStoryPrompt } from '../prompts/storyPrompt.js';
import { chat } from './openAIService.js';
import { parseJSON } from '../utils/parseJSON.js';

export async function generateStory(bookData, character) {
  const prompt = buildStoryPrompt(bookData, character);

  const response = await chat([
    {
      role: 'user',

      content: prompt,
    },
  ]);

  return parseJSON(response);
}
