import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

interface EncryptedData {
  encrypted: string;  // Base64 encoded encrypted data
  iv: string;        // Base64 encoded initialization vector
  tag: string;       // Base64 encoded authentication tag
  salt: string;      // Base64 encoded salt
}

function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    ENCRYPTION_KEY!,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

export function encrypt(text: string): string {
  // Generate salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key using PBKDF2
  const key = deriveKey(salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Create encrypted data object
  const encryptedData: EncryptedData = {
    encrypted: encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    salt: salt.toString('base64'),
  };

  // Return JSON string of encrypted data
  return JSON.stringify(encryptedData);
}

export function decrypt(encryptedJson: string): string {
  try {
    // Parse the encrypted data
    const encryptedData: EncryptedData = JSON.parse(encryptedJson);

    // Convert base64 strings back to buffers
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');

    // Derive the key using the same salt
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

export function encryptObject(obj: Record<string, any>): Record<string, any> {
  const encrypted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      encrypted[key] = encrypt(value);
    } else if (typeof value === 'object' && value !== null) {
      encrypted[key] = encryptObject(value);
    } else {
      encrypted[key] = value;
    }
  }

  return encrypted;
}

export function decryptObject(obj: Record<string, any>): Record<string, any> {
  const decrypted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isEncryptedJson(value)) {
      decrypted[key] = decrypt(value);
    } else if (typeof value === 'object' && value !== null) {
      decrypted[key] = decryptObject(value);
    } else {
      decrypted[key] = value;
    }
  }

  return decrypted;
}

function isEncryptedJson(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'encrypted' in parsed &&
      'iv' in parsed &&
      'tag' in parsed &&
      'salt' in parsed
    );
  } catch {
    return false;
  }
} 