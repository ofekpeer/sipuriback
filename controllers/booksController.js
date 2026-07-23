import {
  createBook as createBookService,
  getBookById,
  getAllBooks,
} from '../services/bookService.js';
import {
  deleteBookFromLibrary,
  getEditableBook,
  replaceOwnedBookImage,
  updateOwnedBook,
} from '../services/bookManagementService.js';

const inFlightBookCreations = new Map();

export async function createBook(req, res) {
  try {
    // bookData מגיע כ-String בתוך FormData
    const bookData = JSON.parse(req.body.bookData);

    bookData.design = {
      ...bookData.design,
      illustrationStyle: bookData.design?.illustrationStyle || 'pixar',
    };

    // אם הועלתה תמונה, שומרים את הנתיב שלה
    if (req.file) {
      bookData.child.image = req.file.path;
    }

    console.log(`[book] create request received (style: ${bookData.design.illustrationStyle})`);

    const creationKey = req.get('Idempotency-Key') || null;
    const requestKey = creationKey ? `${req.user._id}:${creationKey}` : null;
    let creationPromise = requestKey ? inFlightBookCreations.get(requestKey) : null;

    if (creationPromise) {
      console.log(`[book] joining in-flight creation for key ${creationKey}`);
    } else {
      creationPromise = createBookService(bookData, req.user._id, creationKey);

      if (requestKey) {
        inFlightBookCreations.set(requestKey, creationPromise);
        creationPromise.then(
          () => inFlightBookCreations.delete(requestKey),
          () => inFlightBookCreations.delete(requestKey),
        );
      }
    }

    const book = await creationPromise;

    res.status(202).json({
      success: true,
      data: book,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getBook(req, res) {
  try {
    const book = await getBookById(req.params.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'יש להתחבר כדי לצפות בספר זה',
      });
    }

    const isOwner = book.owner?.equals(req.user._id);
    const isPurchased = book.purchasedBy.some((id) => id.equals(req.user._id));

    if (!isOwner && !isPurchased) {
      return res.status(403).json({
        success: false,
        message: 'אין לך גישה לספר זה',
      });
    }

    res.json({
      success: true,
      data: {
        ...book.toObject(),
        // בעלי הספר יכולים לצפות בתצוגה מקדימה בלבד עד שהתשלום מאומת.
        pages: isPurchased ? book.pages : book.pages.slice(0, 2),
        moral: isPurchased ? book.moral : undefined,
        isPurchased,
      },
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getBooks(req, res) {
  try {
    const books = await getAllBooks();

    res.json({
      success: true,
      data: books,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getBookForEditing(req, res) {
  try {
    const book = await getEditableBook(req.params.id, req.user._id);
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function updateBook(req, res) {
  try {
    const book = await updateOwnedBook(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function replaceBookImage(req, res) {
  try {
    const book = await replaceOwnedBookImage(
      req.params.id,
      req.user._id,
      {
        kind: req.body.kind,
        pageNumber: req.body.pageNumber,
        file: req.file,
      },
    );
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function deleteBook(req, res) {
  try {
    const result = await deleteBookFromLibrary(req.params.id, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
}
