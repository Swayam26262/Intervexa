/**
 * AES-256-GCM encryption for sensitive data at rest (resume text and files).
 * Key: ENCRYPTION_KEY (32 bytes, base64) or, if unset, derived from AUTH_SECRET.
 * Format: "enc:v1:<iv b64>:<tag b64>:<ciphertext b64>". Plaintext values pass through
 * decrypt() unchanged so data written before encryption keeps working.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const explicit = process.env.ENCRYPTION_KEY;
  if (explicit) {
    const buf = Buffer.from(explicit, "base64");
    if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded");
    return buf;
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Set ENCRYPTION_KEY or AUTH_SECRET to encrypt data at rest");
  return createHash("sha256").update(`intervexa:data-at-rest:${secret}`).digest();
}

export function encryptBuffer(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  // Layout: [1 byte version][12 iv][16 tag][data]
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), data]);
}

export function decryptBuffer(stored: Buffer): Buffer {
  if (stored[0] !== 1) throw new Error("Unknown encryption version");
  const iv = stored.subarray(1, 13);
  const tag = stored.subarray(13, 29);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(stored.subarray(29)), decipher.final()]);
}

export function encryptText(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${data.toString("base64")}`;
}

export function decryptText(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
