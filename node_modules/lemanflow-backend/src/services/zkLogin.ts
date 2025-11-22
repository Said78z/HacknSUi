import type { AppConfig } from '../config.js';

export interface ZkLoginPayload {
  jwt: string;
  provider: 'google' | 'github';
  nonce?: string;
  randomness?: string;
}

export interface UserSession {
  address: string;
  provider: string;
  externalId: string;
  email?: string;
  name?: string;
  createdAt: number;
}

/**
 * Verify zkLogin JWT and derive SUI address
 *
 * For MVP: This is a MOCK implementation
 * For Production: Use @mysten/zklogin SDK
 */
export async function verifyZkLogin(
  payload: ZkLoginPayload,
  config: AppConfig
): Promise<UserSession> {
  const { jwt, provider } = payload;

  // MOCK IMPLEMENTATION for MVP
  // In production, use real zkLogin verification:
  // 1. Verify JWT signature
  // 2. Extract sub (subject) from JWT
  // 3. Derive SUI address from (sub, aud, iss, salt)

  try {
    // Decode JWT (without verification for MVP)
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payloadBase64 = parts[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const decodedPayload = JSON.parse(payloadJson);

    // Extract user info
    const externalId = decodedPayload.sub || 'mock-user-id';
    const email = decodedPayload.email;
    const name = decodedPayload.name || decodedPayload.login;

    // MOCK: Generate deterministic address from externalId
    const mockAddress = generateMockSuiAddress(externalId);

    return {
      address: mockAddress,
      provider,
      externalId,
      email,
      name,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('zkLogin verification failed:', error);
    throw new Error('Invalid zkLogin credentials');
  }
}

/**
 * Generate nonce for zkLogin flow
 *
 * For Production: Use @mysten/zklogin generateNonce()
 */
export function generateNonce(): string {
  // MOCK: Random nonce
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Generate randomness for zkLogin
 *
 * For Production: Use @mysten/zklogin generateRandomness()
 */
export function generateRandomness(): string {
  // MOCK: Random string
  return Math.random().toString(36).substring(2, 15);
}

/**
 * MOCK: Generate deterministic SUI address from external ID
 * In production, this would be derived using zkLogin cryptography
 */
function generateMockSuiAddress(externalId: string): string {
  // Simple hash to create pseudo-deterministic address
  let hash = 0;
  for (let i = 0; i < externalId.length; i++) {
    hash = ((hash << 5) - hash) + externalId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to hex and pad to 64 chars (32 bytes)
  const hexHash = Math.abs(hash).toString(16).padStart(16, '0');
  const address = '0x' + hexHash.repeat(4).substring(0, 64);

  return address;
}

/**
 * Validate session from cookie
 */
export function validateSession(sessionData: any): UserSession | null {
  if (!sessionData || typeof sessionData !== 'object') {
    return null;
  }

  const { address, provider, externalId, createdAt } = sessionData;

  if (!address || !provider || !externalId || !createdAt) {
    return null;
  }

  // Check if session is expired (24 hours)
  const now = Date.now();
  const age = now - createdAt;
  if (age > 86400000) {
    return null;
  }

  return sessionData as UserSession;
}

/**
 * PRODUCTION IMPLEMENTATION NOTES:
 *
 * Install: npm install @mysten/zklogin
 *
 * Real implementation:
 *
 * import { generateNonce, generateRandomness } from '@mysten/zklogin';
 * import { jwtToAddress } from '@mysten/zklogin';
 *
 * export async function verifyZkLogin(payload: ZkLoginPayload, config: AppConfig) {
 *   // 1. Verify JWT with OAuth provider
 *   const decoded = await verifyJWT(payload.jwt, config);
 *
 *   // 2. Derive SUI address
 *   const address = jwtToAddress(payload.jwt, payload.nonce);
 *
 *   // 3. Return session
 *   return {
 *     address,
 *     provider: payload.provider,
 *     externalId: decoded.sub,
 *     email: decoded.email,
 *     name: decoded.name,
 *     createdAt: Date.now(),
 *   };
 * }
 */
