import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure we have a key of correct length (32 bytes) or fallback to a derived key from a string
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-must-be-32-bytes-long!';
// Note: In production, ENCRYPTION_KEY must be exactly 32 chars or hex string of 64 chars. For dev, we'll ensure it works.
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    // If text is empty, return it
    if (!text) return text;

    // Use a hash to ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!text) return text;

    try {
        const textParts = text.split(':');
        if (textParts.length !== 2) return text; // Not encrypted or invalid format

        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedText = Buffer.from(textParts[1], 'hex');

        // Regenerate key same way
        const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);

        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        return text; // Return original if failed (e.g. if key changed)
    }
}
