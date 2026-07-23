import User from '../models/User.js';
import { createOAuthState, createToken, hashPassword, verifyOAuthState, verifyPassword } from '../utils/auth.js';

const publicUser = (user) => ({ _id: user._id, name: user.name, email: user.email });
const response = (res, user, status = 200) => res.status(status).json({ success: true, token: createToken(user._id.toString()), user: publicUser(user) });

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) return res.status(400).json({ success: false, message: 'יש למלא שם, אימייל וסיסמה של 6 תווים לפחות' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ success: false, message: 'האימייל כבר רשום' });
  const user = await User.create({ name, email, passwordHash: hashPassword(password) });
  response(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+passwordHash');
  if (!user || !user.passwordHash || !password || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ success: false, message: 'אימייל או סיסמה שגויים' });
  response(res, user);
}

export function me(req, res) { res.json({ success: true, user: publicUser(req.user) }); }

export function startGoogleLogin(_req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://sipuriback.onrender.com/api/auth/google/callback';

  if (!clientId) return res.status(503).json({ success: false, message: 'Google sign-in is not configured' });

  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: createOAuthState(),
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
}

export async function completeGoogleLogin(req, res) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://sipurifront.onrender.com';

  try {
    verifyOAuthState(req.query.state);

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://sipuriback.onrender.com/api/auth/google/callback';
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokens.error_description || 'Google token exchange failed');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email_verified) throw new Error('Google account email was not verified');

    let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }] });
    if (!user) {
      user = await User.create({ name: profile.name || profile.email.split('@')[0], email: profile.email, googleId: profile.sub });
    } else if (!user.googleId) {
      user.googleId = profile.sub;
      await user.save();
    }

    const token = createToken(user._id.toString());
    res.redirect(`${frontendUrl}/login?googleToken=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${frontendUrl}/login?authError=${encodeURIComponent('ההתחברות עם Google נכשלה')}`);
  }
}
