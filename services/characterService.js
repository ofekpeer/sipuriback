export function buildCharacter(bookData, imageAnalysis = null) {
  const { child, design } = bookData;

  return {
    name: child.name,

    age: child.age,

    gender: child.gender,

    illustrationStyle: design.illustrationStyle,

    appearance: imageAnalysis || {
      hair: {
        color: '',
        style: '',
      },

      eyes: {
        color: '',
        shape: '',
      },

      skin: {
        tone: '',
      },

      face: {
        shape: '',
      },

      eyebrows: '',

      nose: '',

      mouth: '',

      shirt: '',

      pants: '',

      shoes: '',

      accessories: [],
    },

    personality: {
      brave: true,

      curious: true,

      kind: true,

      funny: false,
    },
  };
}
