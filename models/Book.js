import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,

      default: Date.now,
    },

    child: {
      name: String,

      age: Number,

      gender: String,
    },

    character: {
      type: Object,

      required: true,
    },

    title: {
      type: String,

      required: true,
    },

    cover: {
      type: Object,

      required: true,
    },

    pages: [
      {
        page: Number,

        text: String,

        imagePrompt: String,
      },
    ],

    summary: String,

    moral: String,
  },

  {
    versionKey: false,
  },
);

export default mongoose.model('Book', BookSchema);
