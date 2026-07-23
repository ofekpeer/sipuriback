import User from '../models/User.js';
import { readToken } from '../utils/auth.js';

export async function optionalAuth(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (token) req.user = await User.findById(readToken(token).sub);
  } catch (_) { /* Guest access stays available for previews. */ }
  next();
}

export function requireAuth(req, res, next) {
  if (req.user) return next();

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, message: 'יש להתחבר כדי לבצע פעולה זו' });

  User.findById(readToken(token).sub)
    .then((user) => {
      if (!user) return res.status(401).json({ success: false, message: 'החשבון לא נמצא' });
      req.user = user;
      next();
    })
    .catch(() => res.status(401).json({ success: false, message: 'ההתחברות פגה, יש להתחבר מחדש' }));
}
