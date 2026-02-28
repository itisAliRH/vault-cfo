import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  tag: string;
  salt?: string;
}

/**
 * Derive a 32-byte key from passphrase using PBKDF2.
 */
export function deriveKey(passphrase: string, salt?: Buffer): Buffer {
  const s = salt ?? randomBytes(SALT_LENGTH);
  return pbkdf2Sync(passphrase, s, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypt plaintext with AES-256-GCM. Returns iv, ciphertext, and tag as base64.
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ciphertext: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypt payload (iv, ciphertext, tag) with the given key.
 */
export function decrypt(
  payload: EncryptedPayload,
  key: Buffer
): string {
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}

/**
 * Get encryption key from env (default passphrase for hackathon).
 * In production, use OS keychain or user passphrase.
 */
export function getEncryptionKey(): Buffer {
  const passphrase = process.env.ENCRYPTION_PASSPHRASE ?? "vaultcfo-default-dev-key-change-in-production";
  return deriveKey(passphrase);
}

/**
 * Serialize encrypted payload for storage (e.g. JSON string in DB).
 */
export function serializeEncrypted(payload: EncryptedPayload): string {
  return JSON.stringify(payload);
}

/**
 * Deserialize encrypted payload from storage.
 */
export function deserializeEncrypted(raw: string): EncryptedPayload {
  return JSON.parse(raw) as EncryptedPayload;
}
