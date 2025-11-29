/**
 * Cryptographic utilities for API key storage
 * Uses Web Crypto API for secure encryption/decryption
 *
 * @module api-key-crypto
 */

/**
 * Derives an encryption key from a master secret using PBKDF2
 * This creates a consistent key for encryption/decryption
 *
 * @param masterSecret - The master secret string
 * @returns Promise resolving to a CryptoKey for encryption
 */
async function deriveKey(masterSecret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterSecret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("maze-race-salt-2025"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Generates a random initialization vector (IV) for encryption
 *
 * @returns Uint8Array containing 12 random bytes (standard for AES-GCM)
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encrypts an API key using AES-GCM encryption
 * Falls back to basic obfuscation if Web Crypto API is unavailable
 *
 * @param key - The API key to encrypt
 * @returns Base64-encoded encrypted key with IV prepended
 *
 * @example
 * ```ts
 * const encrypted = await encryptKey("sk-abc123...")
 * // Returns base64 string with IV + encrypted data
 * ```
 */
export async function encryptKey(key: string): Promise<string> {
  if (typeof window === "undefined" || !crypto.subtle) {
    /**
     * Fallback to basic obfuscation for SSR or unsupported browsers
     */
    return fallbackEncrypt(key);
  }

  try {
    const masterSecret = "maze-race-2025-secure";
    const derivedKey = await deriveKey(masterSecret);
    const iv = generateIV();
    const encoder = new TextEncoder();
    const data = encoder.encode(key);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      data,
    );

    /**
     * Prepend IV to encrypted data and encode as base64
     */
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(
      String.fromCharCode(...combined)
        .split("")
        .map((char) => char.charCodeAt(0))
        .filter((code) => code !== undefined)
        .map((code) => String.fromCharCode(code))
        .join(""),
    );
  } catch (error) {
    console.warn("Web Crypto API encryption failed, using fallback:", error);
    return fallbackEncrypt(key);
  }
}

/**
 * Decrypts an API key that was encrypted with encryptKey
 * Falls back to basic deobfuscation if Web Crypto API is unavailable
 *
 * @param encrypted - The encrypted key string (base64 with IV)
 * @returns Decrypted API key, or empty string if decryption fails
 *
 * @example
 * ```ts
 * const decrypted = await decryptKey(encryptedString)
 * // Returns original API key
 * ```
 */
export async function decryptKey(encrypted: string): Promise<string> {
  if (typeof window === "undefined" || !crypto.subtle) {
    /**
     * Fallback to basic deobfuscation for SSR or unsupported browsers
     */
    return fallbackDecrypt(encrypted);
  }

  try {
    const masterSecret = "maze-race-2025-secure";
    const derivedKey = await deriveKey(masterSecret);

    /**
     * Decode base64 and extract IV
     */
    const combined = Uint8Array.from(
      atob(encrypted)
        .split("")
        .map((char) => char.charCodeAt(0)),
    );

    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      encryptedData,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.warn("Web Crypto API decryption failed, using fallback:", error);
    return fallbackDecrypt(encrypted);
  }
}

/**
 * Fallback encryption using XOR (for SSR or unsupported browsers)
 * This is less secure but ensures compatibility
 *
 * @param key - The API key to encrypt
 * @returns Base64-encoded obfuscated key
 */
function fallbackEncrypt(key: string): string {
  const secret = "maze-race-2025";
  return btoa(
    key
      .split("")
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length),
        ),
      )
      .join(""),
  );
}

/**
 * Fallback decryption using XOR (for SSR or unsupported browsers)
 *
 * @param encrypted - The encrypted key string
 * @returns Decrypted API key, or empty string if decryption fails
 */
function fallbackDecrypt(encrypted: string): string {
  const secret = "maze-race-2025";
  try {
    return atob(encrypted)
      .split("")
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length),
        ),
      )
      .join("");
  } catch {
    return "";
  }
}
