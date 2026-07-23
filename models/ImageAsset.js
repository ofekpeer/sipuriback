import mongoose from 'mongoose';

const ImageAssetSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    assetKey: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      default: 'image/jpeg',
    },
    data: {
      type: Buffer,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ImageAssetSchema.index({ bookId: 1, assetKey: 1 }, { unique: true });

export default mongoose.model('ImageAsset', ImageAssetSchema);
