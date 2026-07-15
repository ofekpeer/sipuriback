import crypto from "crypto";

export function buildBook(bookData, character, story) {

    return {

        id: crypto.randomUUID(),

        createdAt: new Date().toISOString(),

        child: {

            name: bookData.child.name,

            age: Number(bookData.child.age),

            gender: bookData.child.gender,

        },

        // ⭐ נשמור את התמונה המקורית
        originalImage: bookData.child.image || null,

        character,

        title: story.title,

        cover: story.cover,

        pages: story.pages,

        summary: story.summary,

        moral: story.moral,

    };

}