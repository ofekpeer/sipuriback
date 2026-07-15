import {
  createBook as createBookService,
  getBookById,
  getAllBooks,
} from '../services/bookService.js';

export async function createBook(req, res) {
  try {
    console.log("BODY:", req.body);
console.log("FILE:", req.file);
console.log("BOOKDATA:", req.body.bookData);
    // bookData מגיע כ-String בתוך FormData
    const bookData = JSON.parse(req.body.bookData);

    // אם הועלתה תמונה, שומרים את הנתיב שלה
    if (req.file) {
      bookData.child.image = req.file.path;
    }

    const book = await createBookService(bookData);

    res.json({
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

    res.json({
      success: true,
      data: book,
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