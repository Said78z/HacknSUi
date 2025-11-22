import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { AppConfig } from '../config.js';

let suiClient: SuiClient | null = null;
let sponsorKeypair: Ed25519Keypair | null = null;

export function initializeSuiClient(config: AppConfig): SuiClient {
  if (!suiClient) {
    suiClient = new SuiClient({ url: config.suiRpcUrl });
  }
  return suiClient;
}

export function getSuiClient(): SuiClient {
  if (!suiClient) {
    throw new Error('SuiClient not initialized. Call initializeSuiClient first.');
  }
  return suiClient;
}

export function initializeSponsorKeypair(config: AppConfig): Ed25519Keypair {
  if (!sponsorKeypair && config.sponsorPrivateKey) {
    try {
      // Parse the private key (format: suiprivkey1...)
      const decodedKey = decodeSuiPrivateKey(config.sponsorPrivateKey);
      sponsorKeypair = Ed25519Keypair.fromSecretKey(decodedKey);
    } catch (error) {
      console.warn('Failed to initialize sponsor keypair:', error);
      // For development, create a temporary keypair
      if (process.env.NODE_ENV !== 'production') {
        sponsorKeypair = Ed25519Keypair.generate();
        console.warn('Using temporary sponsor keypair for development');
      }
    }
  }
  return sponsorKeypair!;
}

export function getSponsorKeypair(): Ed25519Keypair {
  if (!sponsorKeypair) {
    throw new Error('Sponsor keypair not initialized. Call initializeSponsorKeypair first.');
  }
  return sponsorKeypair;
}

/**
 * Decode SUI private key from bech32 format
 */
function decodeSuiPrivateKey(privateKey: string): Uint8Array {
  // This is a simplified implementation
  // In production, use proper bech32 decoding
  if (privateKey.startsWith('suiprivkey1')) {
    // Remove prefix and decode base64
    const base64Part = privateKey.slice(11);
    return Uint8Array.from(Buffer.from(base64Part, 'base64'));
  }

  // Fallback: assume hex format
  return Uint8Array.from(Buffer.from(privateKey, 'hex'));
}

/**
 * Get object by ID with error handling
 */
export async function getObject(objectId: string) {
  const client = getSuiClient();
  try {
    const response = await client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showOwner: true,
        showType: true,
      },
    });
    return response;
  } catch (error) {
    console.error(`Failed to get object ${objectId}:`, error);
    throw error;
  }
}

/**
 * Get dynamic fields of an object
 */
export async function getDynamicFields(parentId: string, limit = 50) {
  const client = getSuiClient();
  try {
    const response = await client.getDynamicFields({
      parentId,
      limit,
    });
    return response;
  } catch (error) {
    console.error(`Failed to get dynamic fields for ${parentId}:`, error);
    throw error;
  }
}

/**
 * Get dynamic field object
 */
export async function getDynamicFieldObject(parentId: string, name: any) {
  const client = getSuiClient();
  try {
    const response = await client.getDynamicFieldObject({
      parentId,
      name,
    });
    return response;
  } catch (error) {
    console.error(`Failed to get dynamic field object:`, error);
    throw error;
  }
}
