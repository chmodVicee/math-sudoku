/**
 * Hash local de contraseñas con PBKDF2-SHA256 (WebCrypto).
 * En Android, Capacitor sirve la app en un origen https://localhost, por lo
 * que crypto.subtle está disponible.
 */
const ITERATIONS = 120_000;
const KEY_LENGTH_BITS = 256;

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

export async function createPasswordHash(password) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Este dispositivo no soporta el cifrado necesario para guardar la contraseña.');
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS,
  );

  return {
    hash: bytesToBase64(new Uint8Array(bits)),
    salt: bytesToBase64(salt),
  };
}

export async function verifyPassword(password, expectedHash, saltBase64) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Este dispositivo no soporta el cifrado necesario para guardar la contraseña.');
  }

  const salt = base64ToBytes(saltBase64);
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS,
  );

  return constantTimeEqual(bytesToBase64(new Uint8Array(bits)), expectedHash);
}
