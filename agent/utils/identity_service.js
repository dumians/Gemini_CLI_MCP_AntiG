import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'mesh-secret-key-2026';

/**
 * Signs a JWT-like token using HMAC SHA256.
 * @param {object} payload - The token payload.
 * @returns {string} The signed token.
 */
export function signAgentToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
    })).toString('base64url');
    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');
    return `${header}.${body}.${signature}`;
}

/**
 * Verifies a JWT-like token.
 * @param {string} token - The token to verify.
 * @returns {object|null} The decoded payload if valid, else null.
 */
export function verifyAgentToken(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [header, body, signature] = parts;
        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(`${header}.${body}`)
            .digest('base64url');
        if (signature !== expectedSignature) {
            return null;
        }
        const decodedBody = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (decodedBody.exp && decodedBody.exp < Math.floor(Date.now() / 1000)) {
            return null; // Expired
        }
        return decodedBody;
    } catch (e) {
        return null;
    }
}
