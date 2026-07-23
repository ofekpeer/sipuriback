import Book from '../models/Book.js';

export async function getLibrary(req, res) {
  const books = await Book.find({
    $or: [{ purchasedBy: req.user._id }, { owner: req.user._id }],
  }).sort({ createdAt: -1 });

  const libraryBooks = books.map((book) => {
    const isOwner = book.owner?.equals(req.user._id) || false;
    const isPurchased = book.purchasedBy.some((id) => id.equals(req.user._id));

    return {
      ...book.toObject(),
      isOwner,
      isPurchased,
      canEdit: isOwner,
      canRemove: isOwner || isPurchased,
    };
  });

  res.json({ success: true, data: { books: libraryBooks } });
}
