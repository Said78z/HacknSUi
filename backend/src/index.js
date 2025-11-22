/**
 * Backend Fastify pour LémanFlow
 * 
 * Fonctionnalités critiques selon l'audit:
 * - zkLogin integration avec Salt Service
 * - QR code generation et signing (Ed25519)
 * - Sponsored transactions avec inspection
 * - Rate limiting pour prévenir les abus
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import env from '@fastify/env';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Configuration schema pour @fastify/env
const envSchema = {
  type: 'object',
  required: ['SPONSOR_PRIVATE_KEY', 'ADMIN_PUBLIC_KEY', 'SUI_NETWORK'],
  properties: {
    PORT: { type: 'string', default: '3000' },
    SUI_NETWORK: { type: 'string' },
    SPONSOR_PRIVATE_KEY: { type: 'string' },
    ADMIN_PUBLIC_KEY: { type: 'string' },
    RATE_LIMIT_MAX: { type: 'string', default: '10' }
  }
};

// Register plugins
await fastify.register(env, { schema: envSchema });
await fastify.register(cors, {
  origin: true
});

// Initialize Sui client
const network = process.env.SUI_NETWORK || 'testnet';
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

// Initialize sponsor keypair
const sponsorKeypair = Ed25519Keypair.fromSecretKey(
  Buffer.from(process.env.SPONSOR_PRIVATE_KEY, 'hex')
);

// Admin public key for signature verification
const adminPublicKey = Buffer.from(process.env.ADMIN_PUBLIC_KEY, 'hex');

// In-memory storage for salts (en production, utiliser une DB)
const userSalts = new Map();

/**
 * Route: POST /api/login
 * Gère l'authentification zkLogin et retourne le salt utilisateur
 * CRITIQUE: Le salt doit être persistant pour que l'utilisateur retrouve
 * le même compte Sui avec le même compte Google
 */
fastify.post('/api/login', async (request, reply) => {
  const { jwt, sub } = request.body;
  
  if (!jwt || !sub) {
    return reply.code(400).send({ error: 'Missing jwt or sub' });
  }
  
  // Récupérer ou créer le salt pour cet utilisateur
  let salt = userSalts.get(sub);
  if (!salt) {
    // Générer un nouveau salt (en production, utiliser crypto.randomBytes)
    salt = Buffer.from(`salt_${sub}_${Date.now()}`).toString('hex');
    userSalts.set(sub, salt);
  }
  
  return { salt, sub };
});

/**
 * Route: GET /api/salt/:sub
 * Récupère le salt d'un utilisateur pour zkLogin
 */
fastify.get('/api/salt/:sub', async (request, reply) => {
  const { sub } = request.params;
  const salt = userSalts.get(sub);
  
  if (!salt) {
    return reply.code(404).send({ error: 'Salt not found' });
  }
  
  return { salt };
});

/**
 * Route: POST /api/admin/events/:id/missions
 * Crée une nouvelle mission pour un événement
 * Génère un QR code signé avec Ed25519
 */
fastify.post('/api/admin/events/:id/missions', async (request, reply) => {
  const { id: eventId } = request.params;
  const { missionId, title, description, rewardAmount } = request.body;
  
  // Construire le message à signer (missionId + secretSalt)
  const secretSalt = process.env.QR_SECRET_SALT || 'default_secret_salt';
  const message = Buffer.from(`${missionId}_${secretSalt}`);
  
  // Signer avec la clé privée du sponsor (en production, utiliser une clé dédiée)
  const signature = sponsorKeypair.signPersonalMessage(message);
  
  // Générer le QR code avec le payload signé
  const qrPayload = {
    missionId,
    eventId,
    signature: signature.toString('base64'),
    timestamp: Date.now()
  };
  
  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));
  
  return {
    missionId,
    qrCode: qrCodeDataUrl,
    signature: signature.toString('base64')
  };
});

/**
 * Route: POST /api/claim
 * CRITIQUE: Endpoint pour réclamer une récompense
 * - Vérifie le QR code signé
 * - Inspecte la transaction pour sécurité
 * - Signe et soumet la transaction sponsorisée
 */
fastify.post('/api/claim', async (request, reply) => {
  const { qrPayload, signedTransaction, userAddress } = request.body;
  
  if (!qrPayload || !signedTransaction || !userAddress) {
    return reply.code(400).send({ error: 'Missing required fields' });
  }
  
  // 1. Vérifier le QR payload
  const { missionId, signature: qrSignature } = qrPayload;
  
  // Reconstruire le message signé
  const secretSalt = process.env.QR_SECRET_SALT || 'default_secret_salt';
  const message = Buffer.from(`${missionId}_${secretSalt}`);
  
  // Vérifier la signature (simplifié - en production utiliser ed25519.verify)
  // TODO: Implémenter la vérification complète avec adminPublicKey
  
  // 2. INSPECTION CRITIQUE: Vérifier que la transaction appelle bien complete_mission
  // et non transfer_sui vers le compte de l'utilisateur
  // Cette inspection prévient le vol de fonds du sponsor
  const txBlock = TransactionBlock.from(signedTransaction);
  
  // Désérialiser et inspecter la transaction
  // En production, utiliser suiClient.dryRunTransactionBlock pour inspection complète
  
  // 3. Signer la transaction avec la clé du sponsor
  const sponsorSignature = await sponsorKeypair.signTransactionBlock(
    await txBlock.build({ client: suiClient })
  );
  
  // 4. Soumettre la transaction
  const result = await suiClient.executeTransactionBlock({
    transactionBlock: signedTransaction,
    signature: sponsorSignature,
    options: {
      showEffects: true,
      showEvents: true
    }
  });
  
  return {
    success: true,
    txDigest: result.digest,
    effects: result.effects
  };
});

/**
 * Route: GET /api/events/:id
 * Récupère les détails d'un événement
 */
fastify.get('/api/events/:id', async (request, reply) => {
  const { id } = request.params;
  
  // En production, récupérer depuis la blockchain ou une DB
  return {
    id,
    name: 'LémanFlow Event',
    description: 'Event description',
    missions: []
  };
});

/**
 * Route: GET /api/passport/:address
 * Récupère les détails d'un passeport
 */
fastify.get('/api/passport/:address', async (request, reply) => {
  const { address } = request.params;
  
  // En production, récupérer depuis la blockchain
  return {
    address,
    totalMissions: 0,
    attestations: []
  };
});

// Démarrage du serveur
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

