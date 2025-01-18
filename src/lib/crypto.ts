import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

export function encrypt(text: string): string {
  // Generate salt and derive key
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
  
  // Generate IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Combine everything into a single string
  // Format: salt:iv:authTag:encryptedData
  return Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]).toString('base64');
}

export function decrypt(encryptedData: string): string {
  // Convert from base64 and split components
  const buffer = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH).toString('hex');
  
  // Derive key
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Utility function to generate a new encryption key
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
} 