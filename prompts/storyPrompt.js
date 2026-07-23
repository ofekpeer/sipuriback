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
export function buildStoryPrompt(bookData, character) {
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

${bookData.child.image ? 'A reference photo is provided. The photo controls identity only, never rendering style. Every imagePrompt must refer to the same recognizable person without copying photographic skin, lighting, or camera realism.' : ''}

The selected illustration style must transform the entire child: face, skin, hair, eyes, clothing, hands, and body. The child must look clearly illustrated rather than photorealistic, while remaining recognizable.

Keep the following identical across the entire book:

• Hair color

• Hair style

• Eye color

• Skin tone

• Clothes

• Shoes

• Accessories

Never change the child's appearance unless the story explicitly explains why.

Never ask for enlarged eyes, an oversized head, exaggerated teeth, a caricature, or distorted facial proportions. Require a recognizable likeness, natural human anatomy, and a gentle non-frightening expression.

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

Repeat the selected illustration medium in every imagePrompt. Never mix 2D animation, stylized 3D animation, watercolor, comic ink, or photorealism. The selected medium must be clearly visible on the child's face, not only in the background.

Use an eye-level centered hero shot framed from the waist or mid-thigh up. Keep the person in the lower-middle center at roughly half the frame height, with a clearly recognizable face and a rich cinematic adventure world visible around and above them. Use layered scenery, luminous atmosphere, environmental storytelling, and strong depth. Avoid tiny characters, extreme wide angles, overhead views, empty backgrounds, and full-body framing unless absolutely required by the action.

Never request or describe text, titles, letters, numbers, signs, logos, captions, speech bubbles, posters, labels, or any typography in an illustration. The application adds all written content separately.

The cover imagePrompt must describe title-free full-bleed artwork, never a book-cover layout or lettering.

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

${characterProfile(character)}

==================================================

${outputSchema}

`;
}
