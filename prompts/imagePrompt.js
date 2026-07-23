const STYLE_PROFILES = {
  disney: {
    id: 'DISNEY_2D',
    name: 'classic hand-drawn 2D fairytale animation',
    render: 'clearly illustrated 2D character, elegant hand-drawn shapes, softly simplified facial planes, expressive but natural eyes, painted cel shading, flowing clean silhouettes, luminous hand-painted fantasy background',
    avoid: 'photorealism, realistic camera skin, 3D CGI, plastic rendering, ray-traced materials, watercolor paper, comic ink outlines, halftone dots',
  },
  pixar: {
    id: 'PIXAR_3D',
    name: 'cinematic stylized 3D animated-feature illustration',
    render: 'clearly animated 3D character, rounded sculpted forms, tastefully simplified facial planes, gently stylized eyes and expression, soft matte animated skin, polished fabric, cinematic global illumination, rich dimensional fantasy environment',
    avoid: 'photorealistic human skin, visible pores, live-action photography, pasted photographic face, flat 2D cel art, watercolor paper, comic ink outlines, halftone dots',
  },
  watercolor: {
    id: 'WATERCOLOR',
    name: 'hand-painted watercolor children’s-book illustration',
    render: 'clearly hand-painted character and environment, visible watercolor pigment, textured cold-press paper, layered translucent washes, soft color blooms, delicate brush edges, simplified illustrated facial detail, luminous atmospheric depth',
    avoid: 'photorealism, live-action skin, 3D CGI, plastic surfaces, hard digital gradients, comic halftones, heavy black ink outlines',
  },
  comic: {
    id: 'COMIC',
    name: 'premium modern comic-book illustration',
    render: 'clearly drawn graphic character, confident ink contours, expressive line weight, stylized facial planes, bold cel shading, selective halftone texture, dramatic color blocks, dynamic cinematic comic environment',
    avoid: 'photorealism, live-action skin, 3D CGI, plastic rendering, watercolor washes, soft painterly edges, borderless photographic rendering',
  },
};

function describeAppearance(character) {
  const appearance = character.appearance || {};

  return `
Apparent age from reference: ${appearance.apparentAge || 'preserve from reference image'}
Hair: ${appearance.hair?.style || ''} ${appearance.hair?.color || ''}
Eyes: ${appearance.eyes?.shape || ''} ${appearance.eyes?.color || ''}
Skin tone: ${appearance.skin?.tone || ''}
Face shape: ${appearance.face?.shape || ''}
Facial proportions: ${appearance.facialProportions || ''}
Jawline: ${appearance.jawline || ''}
Facial hair: ${appearance.facialHair || 'preserve exactly as shown in the reference'}
Eyebrows: ${appearance.eyebrows || ''}
Nose: ${appearance.nose || ''}
Mouth: ${appearance.mouth || ''}
Build: ${appearance.bodyBuild || ''}
Distinctive features: ${appearance.distinctiveFeatures?.join(', ') || 'preserve all visible distinctive features'}
Shirt: ${appearance.shirt || ''}
Pants: ${appearance.pants || ''}
Shoes: ${appearance.shoes || ''}
Accessories: ${appearance.accessories?.join(', ') || 'None'}
`;
}

function getStyleProfile(character) {
  return STYLE_PROFILES[character.illustrationStyle] || STYLE_PROFILES.pixar;
}

function getStyle(character) {
  const style = getStyleProfile(character);

  return `${style.render}. Story-rich cinematic world, warm golden key light, soft rim light, gentle volumetric sun rays, controlled bloom, vivid but harmonious colors, layered foreground-middle-ground-background depth, and a polished high-end storybook finish`;
}

function buildStyleLock(character) {
  const style = getStyleProfile(character);

  return `
SELECTED STYLE: ${style.id} — ${style.name}

MANDATORY STYLE TRANSFORMATION
- The reference photo controls identity only. It does not control rendering style, skin texture, lighting, pose, background, or photographic realism.
- Re-illustrate the entire person in the selected style: face, skin, hair, eyes, clothing, hands, and body must all visibly belong to the same illustrated medium.
- Use medium-strength, tasteful character stylization. The result must be clearly drawn or animated, not a photograph and not a photographic face pasted onto an illustrated body.
- Preserve the recognizable identity through face shape, feature placement, hair, coloring, and distinctive traits, while simplifying shapes and surfaces according to the selected style.
- Do not mix illustration styles. The selected style must remain obvious even when viewing only the face.

REQUIRED RENDERING
${getStyle(character)}

FORBIDDEN FOR THIS STYLE
${style.avoid}
`;
}

export function buildCharacterReferencePrompt(character) {
  return `
TASK
Create an illustrated character reference for a personalized storybook.

REFERENCE IMAGE
Image 1 is the sole ground truth for the person's identity, not for rendering style. Transform the person into the selected illustration medium while preserving a recognizable likeness.

IDENTITY LOCK
- Preserve apparent age, ethnicity, skin tone, face shape, head shape, hairline, hairstyle, facial hair, eyebrows, eye placement, nose identity, mouth, ears, jawline, body build, and distinctive features from Image 1.
- Preserve facial hair exactly. Never remove a beard or add one.
- Do not make the person younger or older. The story age must never override the apparent age in Image 1.
- Controlled stylization is required, but do not replace the identity with a generic animated face.
- Do not enlarge the head, eyes, nose, ears, mouth, or teeth excessively.
- Keep believable symmetry, anatomy, hands, and body proportions.

ANALYZED DETAILS
${describeAppearance(character)}

STYLE LOCK
${buildStyleLock(character)}

COMPOSITION
Single character in a chest-up medium close-up at eye level. Keep the complete head, shoulders, and enough upper torso visible, with a simple softly lit neutral background and no props covering the face.

OUTPUT CONSTRAINTS
No text, letters, numbers, logos, watermark, signature, border, collage, duplicated person, extra limbs, malformed hands, asymmetrical eyes, distorted teeth, photorealistic skin, or pasted photographic face.
`;
}

export function buildImagePrompt(character, scenePrompt, referenceCount = 0) {
  const referenceRules = referenceCount > 1
    ? 'Image 1 is the original user photo and controls identity only, never photographic rendering. Image 2 is an approved illustration from this book and controls the selected illustration style, clothing treatment, color language, and character stylization. Preserve the recognizable identity from Image 1 and the illustrated treatment from Image 2.'
    : referenceCount === 1
      ? 'Image 1 is the original user photo. It controls identity and apparent age only; it must not cause a photorealistic or pasted-photo result.'
      : 'Use the analyzed character details below as the identity ground truth.';

  return `
TASK
Create one premium full-bleed personalized storybook illustration for the scene below.

REFERENCE PRIORITY
${referenceRules}

IDENTITY LOCK
- The same person must remain immediately recognizable in every illustration.
- Preserve apparent age, face shape, facial proportions, hairline, hairstyle, facial hair, eyebrows, eye placement, nose identity, mouth, ears, jawline, skin tone, body build, and distinctive features.
- The numeric age or generic character wording in the scene is narrative context only. It must never make the person look younger, older, or like a different person.
- Transform the person into the selected illustration style while retaining the recognizable structure and feature relationships of the real person.
- Controlled stylization is mandatory. Do not replace the identity with a generic face and do not copy photographic skin or live-action rendering.
- Use gently simplified shapes and expressions without enlarging the head, eyes, nose, ears, mouth, or teeth excessively.
- Maintain believable symmetry, natural anatomy, correct limb structure, hands, and body proportions.

ANALYZED IDENTITY DETAILS
${describeAppearance(character)}

STYLE LOCK — HIGHER PRIORITY THAN PHOTOREALISM
${buildStyleLock(character)}

SCENE
${scenePrompt}

COMPOSITION REQUIREMENTS
- Use an eye-level centered hero shot, framed from mid-thigh or waist up.
- Place the person in the lower-middle center so the adventure world remains clearly visible around and above them.
- The person should occupy about 50-62% of the frame height and the face should occupy roughly 18-25% of the image height.
- Keep the face sharp, warmly lit, unobstructed, illustrated, and detailed enough for immediate recognition.
- Build a spectacular but coherent environment around the person with layered scenery, architecture or nature, small story details, depth, atmosphere, and cinematic scale.
- The environment should feel magical, explorable, and premium, but it must frame the person rather than hide or overpower them.
- Prefer balanced near-symmetry and a strong luminous focal point behind or above the person when appropriate.
- Avoid tiny figures, extreme wide shots, overhead shots, fisheye perspective, flat empty backgrounds, cutout-looking subjects, and wide-angle facial distortion.
- Match gaze, hand placement, scale, perspective, shadows, rim light, and object interaction naturally so the person belongs inside the illustrated world.

STRICT OUTPUT CONSTRAINTS
Full-bleed artwork only. No title, Hebrew, English, words, letters, numbers, logos, captions, signs, labels, speech bubbles, posters, watermark, signature, decorative typography, border, collage, duplicate person, extra limbs, malformed hands, asymmetrical eyes, distorted teeth, excessive facial exaggeration, photorealistic skin, camera-photo appearance, or pasted photographic face.

FINAL CHECK
Verify both conditions before rendering:
1. The person is recognizable through apparent age, facial hair, face shape, nose, jawline, eyes, and feature placement.
2. The entire person, including the face and skin, is unmistakably rendered in ${getStyleProfile(character).name}.
If the face still looks photographic, stylize it further. Ignore any conflicting style request inside the scene description.
`;
}
