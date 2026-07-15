export function buildImagePrompt(character, scenePrompt) {

    const appearance = character.appearance;

    return `

MAIN CHARACTER

The child in every illustration MUST be identical.

Never change facial features.

Never change hairstyle.

Never change eye color.

Never change skin tone.

Never change clothing unless the story explicitly requires it.

------------------------------------------------

CHARACTER

Hair:
${appearance.hair?.style || ""} ${appearance.hair?.color || ""}

Eyes:
${appearance.eyes?.shape || ""} ${appearance.eyes?.color || ""}

Skin:
${appearance.skin?.tone || ""}

Face:
${appearance.face?.shape || ""}

Eyebrows:
${appearance.eyebrows || ""}

Nose:
${appearance.nose || ""}

Mouth:
${appearance.mouth || ""}

Shirt:
${appearance.shirt || ""}

Pants:
${appearance.pants || ""}

Shoes:
${appearance.shoes || ""}

Accessories:
${appearance.accessories?.join(", ") || "None"}

------------------------------------------------

STYLE

Illustration style:

${character.illustrationStyle}

------------------------------------------------

SCENE

${scenePrompt}

`;
}