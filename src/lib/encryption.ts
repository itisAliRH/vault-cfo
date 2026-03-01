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
  salt: string; // always stored so decryption uses the same salt
}

/**
 * Derive a 32-byte key from passphrase + salt using PBKDF2.
 */
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypt plaintext. Generates a fresh random salt per call and stores it
 * in the returned payload, so decryption can always re-derive the same key.
 */
export function encrypt(plaintext: string, passphrase: string): EncryptedPayload {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(passphrase, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ciphertext: encrypted.toString("base64"),
    tag: tag.toString("base64"),
    salt: salt.toString("base64"),
  };
}

/**
 * Decrypt payload using the salt stored inside it.
 */
export function decrypt(payload: EncryptedPayload, passphrase: string): string {
  const salt = Buffer.from(payload.salt, "base64");
  const key = deriveKey(passphrase, salt);
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}

/**
 * Get the encryption passphrase from env.
 */
export function getPassphrase(): string {
  return process.env.ENCRYPTION_PASSPHRASE ?? "vaultcfo-default-dev-key-change-in-production";
}

/**
 * Serialize encrypted payload for storage (JSON string in DB).
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
