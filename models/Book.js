import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'generating',
    },

    child: {
      name: String,
      age: Number,
      gender: String,
    },
    originalImage: {
      type: String,
      default: null,
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
      title: String,

      imagePrompt: String,

      imageUrl: {
        type: String,
        default: '',
      },
    },

    pages: [
      {
        page: Number,

        text: String,

        imagePrompt: String,

        imageUrl: {
          type: String,
          default: '',
        },
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
