import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import type { AppConfig } from '../config.js';

export interface QRPayload {
  eventId: string;
  missionId: number;
  nonce: string;
  timestamp: number;
}

export interface QRVerificationResult {
  valid: boolean;
  payload?: QRPayload;
  error?: string;
}

// Store used nonces to prevent replay attacks
const usedNonces = new Set<string>();

// Clean up old nonces every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const nonce of usedNonces) {
    const [timestampStr] = nonce.split('-');
    const timestamp = parseInt(timestampStr, 10);
    if (timestamp < oneHourAgo) {
      usedNonces.delete(nonce);
    }
  }
}, 3600000);

/**
 * Generate a signed QR code payload for a mission
 */
export async function generateMissionQR(
  eventId: string,
  missionId: number,
  config: AppConfig
): Promise<{ token: string; qrDataUrl: string; payload: QRPayload }> {
  const payload: QRPayload = {
    eventId,
    missionId,
    nonce: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    timestamp: Date.now(),
  };

  // Sign the payload
  const token = jwt.sign(payload, config.qrSecret, {
    expiresIn: '1h',
    issuer: 'lemanflow',
    subject: 'mission-qr',
  });

  // Generate QR code data URL
  const qrDataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 400,
    margin: 2,
  });

  return { token, qrDataUrl, payload };
}

/**
 * Verify a QR code token
 */
export function verifyQRToken(
  token: string,
  config: AppConfig
): QRVerificationResult {
  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, config.qrSecret, {
      issuer: 'lemanflow',
      subject: 'mission-qr',
    }) as QRPayload;

    // Check if nonce has been used
    if (usedNonces.has(decoded.nonce)) {
      return {
        valid: false,
        error: 'QR code already used',
      };
    }

    // Check timestamp (must be within 1 hour)
    const age = Date.now() - decoded.timestamp;
    if (age > 3600000) {
      return {
        valid: false,
        error: 'QR code expired',
      };
    }

    // Mark nonce as used
    usedNonces.add(decoded.nonce);

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'QR code expired',
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid QR code',
      };
    }

    return {
      valid: false,
      error: 'QR verification failed',
    };
  }
}

/**
 * Generate QR code hash for storing in mission
 * This is the hash that will be stored on-chain
 */
export function generateQRHash(secret: string): Uint8Array {
  // Simple hash implementation
  // In production, use crypto.createHash('sha256')
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);

  // Mock hash for MVP
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length && i < 32; i++) {
    hash[i] = data[i];
  }

  return hash;
}

/**
 * Verify QR proof matches mission's stored hash
 */
export function verifyQRProof(
  proof: string,
  storedHash: Uint8Array
): boolean {
  const proofHash = generateQRHash(proof);

  // Compare hashes
  if (proofHash.length !== storedHash.length) {
    return false;
  }

  for (let i = 0; i < proofHash.length; i++) {
    if (proofHash[i] !== storedHash[i]) {
      return false;
    }
  }

  return true;
}
