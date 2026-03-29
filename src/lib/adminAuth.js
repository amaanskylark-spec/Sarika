const ADMIN_KEY = 'sarkia_admin_creds';
const ADMIN_TOTP_KEY = 'sarkia_totp_secret';
const ADMIN_SESSION_KEY = 'sarkia_admin_session';

// Fixed admin credentials
const ADMIN_USERNAME = 'AdminSarkia';
const ADMIN_PASSWORD = 'Admin@Sarkia#2024';

export function verifyAdminCredentials(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function getTotpSecret() {
  return localStorage.getItem(ADMIN_TOTP_KEY) || null;
}

export function saveTotpSecret(secret) {
  localStorage.setItem(ADMIN_TOTP_KEY, secret);
}

export function setAdminSession() {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ time: Date.now() }));
}

export function getAdminSession() {
  const s = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!s) return null;
  const { time } = JSON.parse(s);
  // Session valid for 30 minutes
  if (Date.now() - time > 30 * 60 * 1000) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
  return true;
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

// Simple TOTP implementation (RFC 6238 compatible)
export function generateTotpSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  array.forEach(byte => { secret += chars[byte % 32]; });
  return secret;
}

export function getTotpQrUrl(secret, username = 'SarkiaAdmin') {
  const issuer = 'SarkiaTracker';
  const otpauth = `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
}

// TOTP verification - Time-based OTP
function base32Decode(encoded) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0;
  const output = [];
  for (let i = 0; i < encoded.length; i++) {
    const idx = chars.indexOf(encoded[i].toUpperCase());
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function hotp(secret, counter) {
  const key = base32Decode(secret);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(4, counter, false);
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msg);
  const arr = new Uint8Array(sig);
  const offset = arr[19] & 0xf;
  const code = ((arr[offset] & 0x7f) << 24) | (arr[offset + 1] << 16) | (arr[offset + 2] << 8) | arr[offset + 3];
  return String(code % 1000000).padStart(6, '0');
}

export async function verifyTotp(secret, token) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  // Check current and adjacent windows
  for (let delta = -1; delta <= 1; delta++) {
    const expected = await hotp(secret, counter + delta);
    if (expected === token.trim()) return true;
  }
  return false;
}