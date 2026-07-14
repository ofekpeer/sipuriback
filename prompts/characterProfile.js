export default function buildCharacterProfile(bookData) {

const { child, design } = bookData;

return `

MAIN CHARACTER

This character must remain visually identical throughout the entire book.

==========================

Name:
${child.name}

Age:
${child.age}

Gender:
${child.gender}

Illustration Style:
${design.illustrationStyle}

==========================

CHARACTER RULES

The child is the main hero.

The child appears on every page.

Never replace the child as the main character.

The child's appearance must remain identical throughout the story.

The child's hairstyle never changes.

The child's hair color never changes.

The child's eye color never changes.

The child's skin tone never changes.

The child's clothes remain consistent unless the story explicitly changes them.

The child's shoes remain consistent.

The child's personality remains consistent.

The child becomes slightly more confident as the adventure progresses.

Every imagePrompt must describe exactly the same child.

`;

}