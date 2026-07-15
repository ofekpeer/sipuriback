export default function buildCharacterProfile(character) {
  return `

MAIN CHARACTER

This character must remain visually identical throughout the entire book.

==================================================

Name:
${character.name}

Age:
${character.age}

Gender:
${character.gender}

Illustration Style:
${character.illustrationStyle}

==================================================

VISUAL APPEARANCE

Hair Color:
${character.appearance.hair?.color || ''}

Hair Style:
${character.appearance.hair?.style || ''}

Eye Color:
${character.appearance.eyes?.color || ''}

Eye Shape:
${character.appearance.eyes?.shape || ''}

Skin Tone:
${character.appearance.skin?.tone || ''}

Face Shape:
${character.appearance.face?.shape || ''}

Eyebrows:
${character.appearance.eyebrows || ''}

Nose:
${character.appearance.nose || ''}

Mouth:
${character.appearance.mouth || ''}

Shirt:
${character.appearance.shirt || ''}

Pants:
${character.appearance.pants || ''}

Shoes:
${character.appearance.shoes || ''}

Accessories:
${character.appearance.accessories?.join(', ') || 'None'}

==================================================

VERY IMPORTANT

The child must look EXACTLY the same on:

- Cover
- Page 1
- Page 2
- ...
- Page 10

Never invent a new hairstyle.

Never change facial features.

Never change eye color.

Never change skin tone.

Never change clothes unless the story explicitly requires it.

Every imagePrompt must describe exactly this child.

`;
}
