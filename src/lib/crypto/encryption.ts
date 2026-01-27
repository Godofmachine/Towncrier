import crypto from 'crypto';

/**
 * SECURITY: Token encryption utilities
 * Uses AES-256-GCM for secure token storage
 * 
 * Environment variable required:
 * TOKEN_ENCRYPTION_KEY - 64-character hex string (32 bytes)
 * Generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment
 * Falls back to a development key (DO NOT USE IN PRODUCTION)
 */
function getEncryptionKey(): Buffer {
    const key = process.env.TOKEN_ENCRYPTION_KEY;

    if (!key) {
        // Development fallback - NOT SECURE for production
        console.warn('⚠️ WARNING: Using default encryption key. Set TOKEN_ENCRYPTION_KEY in production!');
        return Buffer.from('0'.repeat(64), 'hex');
    }

    if (key.length !== 64) {
        throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(key, 'hex');
}

/**
 * Encrypt a token string
 * @param plaintext - The token to encrypt
 * @returns Base64-encoded encrypted data with IV and auth tag
 */
export function encryptToken(plaintext: string): string {
    if (!plaintext) {
        throw new Error('Cannot encrypt empty token');
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Format: IV (12 bytes) + Auth Tag (16 bytes) + Encrypted Data
    const combined = Buffer.concat([iv, authTag, encrypted]);

    return combined.toString('base64');
}

/**
 * Decrypt a token string
 * @param encryptedData - Base64-encoded encrypted data
 * @returns Decrypted token string
 */
export function decryptToken(encryptedData: string): string {
    if (!encryptedData) {
        throw new Error('Cannot decrypt empty data');
    }

    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

/**
 * Checks if a token is encrypted (base64 format with correct length)
 * @param token - Token string to check
 * @returns true if token appears to be encrypted
 */
export function isEncrypted(token: string): boolean {
    if (!token) return false;

    // Encrypted tokens are base64 and longer than plain tokens
    // Minimum length: IV (12) + AuthTag (16) + Some data = ~40 bytes base64 encoded
    try {
        const decoded = Buffer.from(token, 'base64');
        return decoded.length >= (IV_LENGTH + AUTH_TAG_LENGTH + 10);
    } catch {
        return false;
    }
}
