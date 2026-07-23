import express from 'express';
import mongoose from 'mongoose';

import ImageAsset from '../models/ImageAsset.js';

const router = express.Router();
const VALID_ASSET_KEY = /^[a-zA-Z0-9._-]+$/;

router.get('/:bookId/:assetKey', async (req, res) => {
  try {
    const { bookId, assetKey } = req.params;

    if (
      !mongoose.isValidObjectId(bookId)
      || !VALID_ASSET_KEY.test(assetKey)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image asset path',
      });
    }

    const asset = await ImageAsset.findOne({ bookId, assetKey });
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Image asset not found',
      });
    }

    res.set({
      'Content-Type': asset.contentType,
      'Content-Length': asset.size,
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    });

    return res.send(asset.data);
  } catch (error) {
    console.error('[assets] failed to serve image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load image asset',
    });
  }
});

export default router;
