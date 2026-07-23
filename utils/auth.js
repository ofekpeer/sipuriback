import crypto from 'crypto';

const secret = () => process.env.JWT_SECRET || 'change-this-development-secret';
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

export function createToken(userId) {
  const payload = encode({ sub: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  const signature = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readToken(token) {
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('Invalid token');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (data.exp < Date.now()) throw new Error('Expired token');
  return data;
}

export function createOAuthState() {
  const payload = encode({ exp: Date.now() + 1000 * 60 * 10, nonce: crypto.randomUUID() });
  const signature = crypto.createHmac('sha256', secret()).update(`oauth:${payload}`).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state) {
  const [payload, signature] = state?.split('.') || [];
  const expected = crypto.createHmac('sha256', secret()).update(`oauth:${payload}`).digest('base64url');
  if (!payload || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('Invalid OAuth state');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (data.exp < Date.now()) throw new Error('Expired OAuth state');
}
