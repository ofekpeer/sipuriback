import fs from 'fs/promises';
import path from 'path';

import ImageAsset from '../models/ImageAsset.js';

const ASSET_URL_PREFIX = '/api/assets';
const VALID_ASSET_KEY = /^[a-zA-Z0-9._-]+$/;

function assertAssetKey(assetKey) {
  if (!VALID_ASSET_KEY.test(assetKey)) {
    throw new Error(`Invalid image asset key: ${assetKey}`);
  }
}

export function buildAssetUrl(bookId, assetKey) {
  assertAssetKey(assetKey);
  return `${ASSET_URL_PREFIX}/${bookId}/${assetKey}`;
}

export async function storeImageAsset({
  bookId,
  assetKey,
  filePath,
  contentType = 'image/jpeg',
}) {
  assertAssetKey(assetKey);
  const data = await fs.readFile(filePath);

  await ImageAsset.findOneAndUpdate(
    { bookId, assetKey },
    {
      $set: {
        contentType,
        data,
        size: data.length,
      },
    },
    {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return buildAssetUrl(bookId, assetKey);
}

export async function deleteImageAssetByUrl(assetUrl, bookId) {
  if (typeof assetUrl !== 'string') return;

  const prefix = `${ASSET_URL_PREFIX}/${bookId}/`;
  if (!assetUrl.startsWith(prefix)) return;

  const assetKey = assetUrl.slice(prefix.length);
  if (!VALID_ASSET_KEY.test(assetKey)) return;

  await ImageAsset.deleteOne({ bookId, assetKey });
}

export async function deleteBookImageAssets(bookId) {
  await ImageAsset.deleteMany({ bookId });
}

export function contentTypeForFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}
