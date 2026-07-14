export function validateBook(book) {

    const errors = [];

    // =========================
    // Child
    // =========================

    if (!book.child?.name?.trim()) {

        errors.push("Missing child name");

    }

    if (!book.child?.age) {

        errors.push("Missing child age");

    } else {

        const age = Number(book.child.age);

        if (Number.isNaN(age) || age < 1 || age > 12) {

            errors.push("Child age must be between 1 and 12");

        }

    }

    if (!book.child?.gender) {

        errors.push("Missing child gender");

    }

    // =========================
    // Story
    // =========================

    if (!book.story?.type) {

        errors.push("Missing story type");

    }

    if (!book.story?.hobbies?.trim()) {

        errors.push("Missing hobbies");

    }

    // lesson כרגע לא חובה

    // =========================
    // Design
    // =========================

    if (!book.design?.illustrationStyle) {

        errors.push("Missing illustration style");

    }

    return errors;

}