import fs from 'fs/promises';
import path from 'path';

import Book from '../models/Book.js';
import User from '../models/User.js';
import { cancelBookGeneration } from './bookService.js';
import {
  deleteBookImageAssets,
  deleteImageAssetByUrl,
  storeImageAsset,
} from './assetStorageService.js';

const UPLOADS_ROOT = path.resolve('uploads');
const BOOKS_ROOT = path.join(UPLOADS_ROOT, 'books');

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isSameId(left, right) {
  return left?.toString() === right?.toString();
}

function sanitizeText(value, maxLength, fieldName) {
  if (typeof value !== 'string') {
    throw httpError(400, `${fieldName} חייב להיות טקסט`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw httpError(400, `${fieldName} ארוך מדי`);
  }

  return normalized;
}

function isPurchasedBy(book, userId) {
  return book.purchasedBy.some((id) => isSameId(id, userId));
}

async function getOwnedBook(bookId, ownerId) {
  const book = await Book.findById(bookId);

  if (!book) throw httpError(404, 'הספר לא נמצא');
  if (!isSameId(book.owner, ownerId)) {
    throw httpError(403, 'רק הבעלים של הספר יכול לערוך אותו');
  }

  return book;
}

function toEditableBook(book, ownerId) {
  const purchased = isPurchasedBy(book, ownerId);

  return {
    ...book.toObject(),
    pages: purchased ? book.pages : book.pages.slice(0, 2),
    moral: purchased ? book.moral : '',
    isPurchased: purchased,
    canEdit: true,
  };
}

function resolveSafeAssetPath(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return null;

  const withoutLeadingSlash = assetPath.replace(/^[/\\]+/, '');
  const resolved = path.resolve(withoutLeadingSlash);
  const relative = path.relative(UPLOADS_ROOT, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

function resolveBookDirectory(bookId) {
  const directory = path.resolve(BOOKS_ROOT, bookId.toString());
  const relative = path.relative(BOOKS_ROOT, directory);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw httpError(400, 'נתיב ספר לא תקין');
  }

  return directory;
}

async function removeAssetIfInsideBook(assetUrl, bookId) {
  await deleteImageAssetByUrl(assetUrl, bookId);

  const assetPath = resolveSafeAssetPath(assetUrl);
  if (!assetPath) return;

  const bookDirectory = resolveBookDirectory(bookId);
  const relative = path.relative(bookDirectory, assetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return;

  await fs.rm(assetPath, { force: true }).catch(() => {});
}

async function moveUploadedFile(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });

  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    await fs.copyFile(source, destination);
    await fs.rm(source, { force: true });
  }
}

function extensionForMimeType(mimeType) {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  return '.jpg';
}

export async function getEditableBook(bookId, ownerId) {
  const book = await getOwnedBook(bookId, ownerId);
  return toEditableBook(book, ownerId);
}

export async function updateOwnedBook(bookId, ownerId, payload = {}) {
  const book = await getOwnedBook(bookId, ownerId);
  const purchased = isPurchasedBy(book, ownerId);

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    const title = sanitizeText(payload.title, 160, 'שם הספר');
    if (!title) throw httpError(400, 'שם הספר לא יכול להיות ריק');
    book.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'coverTitle')) {
    book.cover.title = sanitizeText(payload.coverTitle, 160, 'כותרת הכריכה');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'summary')) {
    book.summary = sanitizeText(payload.summary, 3000, 'תקציר');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'moral')) {
    if (!purchased) {
      throw httpError(403, 'ניתן לערוך את מוסר ההשכל לאחר רכישת הספר');
    }
    book.moral = sanitizeText(payload.moral, 1500, 'מוסר השכל');
  }

  if (payload.pages !== undefined) {
    if (!Array.isArray(payload.pages)) {
      throw httpError(400, 'רשימת העמודים אינה תקינה');
    }

    const accessiblePageNumbers = new Set(
      (purchased ? book.pages : book.pages.slice(0, 2))
        .map((page) => page.page),
    );

    payload.pages.forEach((pageUpdate) => {
      const pageNumber = Number(pageUpdate.page);
      if (!Number.isInteger(pageNumber) || !accessiblePageNumbers.has(pageNumber)) {
        throw httpError(403, 'אין הרשאה לערוך עמוד זה לפני רכישת הספר');
      }

      const page = book.pages.find((item) => item.page === pageNumber);
      if (!page) throw httpError(404, `עמוד ${pageNumber} לא נמצא`);
      page.text = sanitizeText(pageUpdate.text, 5000, `טקסט עמוד ${pageNumber}`);
    });
  }

  await book.save();
  return toEditableBook(book, ownerId);
}

export async function replaceOwnedBookImage(
  bookId,
  ownerId,
  { kind, pageNumber, file },
) {
  if (!file) throw httpError(400, 'לא נבחרה תמונה');

  try {
    const book = await getOwnedBook(bookId, ownerId);
    const purchased = isPurchasedBy(book, ownerId);
    let previousImageUrl;
    let fileBaseName;

    if (kind === 'cover') {
      previousImageUrl = book.cover.imageUrl;
      fileBaseName = 'cover';
    } else if (kind === 'page') {
      const numericPage = Number(pageNumber);
      const accessiblePages = purchased ? book.pages : book.pages.slice(0, 2);
      const page = accessiblePages.find((item) => item.page === numericPage);

      if (!page) {
        throw httpError(403, 'אין הרשאה לשנות את תמונת העמוד הזה');
      }

      previousImageUrl = page.imageUrl;
      fileBaseName = `page-${numericPage}`;
    } else {
      throw httpError(400, 'סוג התמונה אינו תקין');
    }

    const extension = extensionForMimeType(file.mimetype);
    const fileName = `${fileBaseName}-custom-${Date.now()}${extension}`;
    const bookDirectory = resolveBookDirectory(bookId);
    const destination = path.join(bookDirectory, 'custom', fileName);

    await moveUploadedFile(file.path, destination);
    const imageUrl = await storeImageAsset({
      bookId,
      assetKey: fileName,
      filePath: destination,
      contentType: file.mimetype,
    });

    if (kind === 'cover') {
      book.cover.imageUrl = imageUrl;
    } else {
      const page = book.pages.find((item) => item.page === Number(pageNumber));
      page.imageUrl = imageUrl;
      page.isPlaceholder = false;
    }

    try {
      await book.save();
    } catch (error) {
      await deleteImageAssetByUrl(imageUrl, bookId).catch(() => {});
      await fs.rm(destination, { force: true }).catch(() => {});
      throw error;
    }

    await removeAssetIfInsideBook(previousImageUrl, bookId);
    return toEditableBook(book, ownerId);
  } catch (error) {
    if (file?.path) {
      await fs.rm(file.path, { force: true }).catch(() => {});
    }
    throw error;
  }
}

export async function deleteBookFromLibrary(bookId, userId) {
  const book = await Book.findById(bookId);
  if (!book) throw httpError(404, 'הספר לא נמצא');

  const isOwner = isSameId(book.owner, userId);
  const isPurchased = isPurchasedBy(book, userId);

  if (!isOwner) {
    if (!isPurchased) throw httpError(403, 'אין לך הרשאה למחוק ספר זה');

    await Promise.all([
      Book.updateOne(
        { _id: bookId },
        { $pull: { purchasedBy: userId } },
      ),
      User.updateOne(
        { _id: userId },
        { $pull: { purchasedBooks: bookId } },
      ),
    ]);

    return { removedFromLibrary: true, permanentlyDeleted: false };
  }

  const otherPurchasers = book.purchasedBy.filter((id) => !isSameId(id, userId));
  if (otherPurchasers.length) {
    throw httpError(
      409,
      'לא ניתן למחוק ספר שכבר נרכש על ידי משתמשים אחרים',
    );
  }

  cancelBookGeneration(bookId);
  await Book.deleteOne({ _id: bookId, owner: userId });
  await User.updateMany(
    { purchasedBooks: bookId },
    { $pull: { purchasedBooks: bookId } },
  );
  await deleteBookImageAssets(bookId);

  const bookDirectory = resolveBookDirectory(bookId);
  await fs.rm(bookDirectory, { recursive: true, force: true });

  const originalImagePath = resolveSafeAssetPath(book.originalImage);
  if (originalImagePath) {
    await fs.rm(originalImagePath, { force: true }).catch(() => {});
  }

  return { removedFromLibrary: true, permanentlyDeleted: true };
}
