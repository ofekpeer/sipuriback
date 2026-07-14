import systemPrompt from './systemPrompt.js';
import storyRules from './storyRules.js';
import storyWorlds from './storyWorlds.js';
import outputSchema from './outputSchema.js';
import storyBlueprint from './storyBlueprint.js';
import qualityChecklist from './qualityChecklist.js';
import planningInstructions from './planningInstructions.js';
import characterProfile from './characterProfile.js';
import writingStyle from './writingStyle.js';
import { storyTypes, illustrationStyles } from '../constants/bookOptions.js';
export function buildStoryPrompt(bookData) {
  const {
    child,

    story,

    design,
  } = bookData;

  return `

${systemPrompt}

==================================================

BOOK INFORMATION

Child Name:
${child.name}

Age:
${child.age}

Gender:
${child.gender}

Hobbies:
${story.hobbies || 'None'}

Adventure Type:
${storyTypes[story.type]}

Illustration Style:
${illustrationStyles[design.illustrationStyle]}

==================================================

STORY WORLD

${storyWorlds[story.type]}

==================================================

WRITING RULES

${storyRules}

==================================================

WRITING STYLE

${writingStyle}

==================================================

IMAGE CONSISTENCY

Every illustration must describe exactly the same child.

Keep the following identical across the entire book:

• Hair color

• Hair style

• Eye color

• Skin tone

• Clothes

• Shoes

• Accessories

Never change the child's appearance unless the story explicitly explains why.

==================================================

ILLUSTRATION RULES

Every page must include an imagePrompt.

Every imagePrompt must:

• describe the complete scene

• describe the child's emotions

• describe the environment

• describe the lighting

• describe the camera angle

• describe the illustration style

Each imagePrompt must be completely self contained.

Never refer to previous pages.

==================================================

BOOK STRUCTURE

Cover

↓

10 Story Pages

↓

Ending

↓

Moral

↓

Summary

==================================================

BOOK BLUEPRINT

${storyBlueprint}

==================================================

QUALITY CHECKLIST

${qualityChecklist}

==================================================

PLANNING PHASE

${planningInstructions}

==================================================

CHARACTER PROFILE

${characterProfile(bookData)}

==================================================

${outputSchema}

`;
}
