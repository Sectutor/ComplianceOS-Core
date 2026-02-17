import crypto from 'crypto';
import { getEncryptionKeys, getActiveKeyVersion } from './secrets';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Derives a consistent 32-byte key from a secret string
 */
function deriveKey(secret: string): Buffer {
    const hash = crypto.createHash('sha256').update(secret).digest('base64').substring(0, 32);
    return Buffer.from(hash);
}

/**
 * Encrypts data using the active key version (ASVS V14.1.2)
 */
export function encrypt(text: string): string {
    if (!text) return text;

    const keys = getEncryptionKeys();
    const activeVersion = getActiveKeyVersion();
    const activeKey = keys[activeVersion];

    if (!activeKey) {
        throw new Error(`Encryption failed: Active key version ${activeVersion} not found`);
    }

    const key = deriveKey(activeKey);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Format: version$iv:ciphertext
    return `${activeVersion}$${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts data using the version-specific key (ASVS V14.1.2)
 */
export function decrypt(text: string): string {
    if (!text) return text;

    try {
        let version = 'v1'; // Default / Legacy version
        let rawData = text;

        if (text.includes('$')) {
            const parts = text.split('$');
            version = parts[0];
            rawData = parts[1];
        }

        const keys = getEncryptionKeys();
        const keyString = keys[version];

        if (!keyString) {
            console.warn(`Decryption warning: Key version ${version} not found. Data might be unreadable.`);
            return text; // Return as is if we can't find the key
        }

        const textParts = rawData.split(':');
        if (textParts.length !== 2) return text;

        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedText = Buffer.from(textParts[1], 'hex');
        const key = deriveKey(keyString);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        return text;
    }
}
