import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Throw error if key is not defined, ensuring we never accidentally encrypt with a blank key
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
    console.warn("WARNING: ENCRYPTION_KEY is not set or invalid length (must be 64 char hex string). Check .env file.");
}

function getKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY || "";
    if (keyString.length !== 64) {
        throw new Error("Invalid ENCRYPTION_KEY length. Expected 64 characters (32 bytes hex).");
    }
    return Buffer.from(keyString, 'hex');
}

/**
 * Encrypts a plain text string using AES-256-GCM
 * @param text The plain text to encrypt
 * @returns The encrypted string formatted as iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
    if (!text) return text;

    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get the auth tag (essential for GCM)
    const authTag = cipher.getAuthTag();

    // Return all three parts needed for decryption, joined by colons
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string
 * @param encryptedText The encrypted text in format iv:authTag:encryptedText
 * @returns The decrypted plain text
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
        const parts = encryptedText.split(':');

        // We expect exactly 3 parts: iv, authTag, and the encrypted content
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

        // Set auth tag
        decipher.setAuthTag(authTag);

        // Decrypt
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Failed to decrypt configuration value");
    }
}
