import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    purchasedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    creationKey: { type: String, index: true, sparse: true },

    generationInput: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
      default: null,
    },

    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'generating',
    },

    generationStep: {
      type: String,
      enum: [
        'created',
        'analyzing-image',
        'generating-story',
        'generating-cover',
        'generating-preview',
        'generating-pages',
        'completed',
        'failed',
      ],
      default: 'created',
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

    characterReferenceUrl: {
      type: String,
      default: '',
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

    generatedPages: {
      type: Number,
      default: 0,
    },

    remainingPagesStatus: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
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

        isPlaceholder: {
          type: Boolean,
          default: false,
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

BookSchema.index({ owner: 1, creationKey: 1 }, { unique: true, sparse: true });

export default mongoose.model('Book', BookSchema);
