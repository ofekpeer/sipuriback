export function buildCharacter(bookData) {

    const { child, design } = bookData;

    return {

        name: child.name,

        age: child.age,

        gender: child.gender,

        illustrationStyle: design.illustrationStyle,

        appearance: {

            hair: "",

            eyes: "",

            skin: "",

            clothes: "",

            shoes: "",

            accessories: []

        },

        personality: {

            brave: true,

            curious: true,

            kind: true,

            funny: false

        }

    };

}