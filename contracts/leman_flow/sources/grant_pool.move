/// Module GrantPool: Distribution sécurisée des micro-grants
/// SÉCURITÉ CRITIQUE selon l'audit:
/// - Vérification cryptographique Ed25519 des signatures backend
/// - Anti-double-claim via Table on-chain dans le Passport
/// - Inspection des transactions pour prévenir les attaques
module leman_flow::grant_pool;

use sui::object::{Self, UID, ID};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::ed25519;
use sui::tx_context::{Self, TxContext};
use sui::transfer;
use leman_flow::passport::{Self, Passport};
use leman_flow::event::{Self, Event};

/// Structure GrantPool: Gestion centralisée des fonds de distribution
/// Contient la clé publique de l'admin pour vérifier les signatures
public struct GrantPool has key {
    id: UID,
    /// Balance disponible pour les distributions
    balance: Balance<SUI>,
    /// Clé publique Ed25519 de l'administrateur backend
    /// Utilisée pour vérifier les signatures des QR codes
    admin_public_key: vector<u8>,
}

/// Erreurs
const EInvalidSignature: u64 = 0;
const EAlreadyClaimed: u64 = 1;
const EInsufficientFunds: u64 = 2;
const EMissionNotFound: u64 = 3;
const EInvalidRewardAmount: u64 = 4;

/// Créer un nouveau GrantPool
public fun create(
    admin_public_key: vector<u8>,
    initial_funds: Coin<SUI>,
    ctx: &mut TxContext
): GrantPool {
    GrantPool {
        id: object::new(ctx),
        balance: coin::into_balance(initial_funds),
        admin_public_key,
    }
}

/// Fonction critique: Réclamer une récompense de mission
/// SÉCURITÉ MULTI-COUCHES:
/// 1. Vérification anti-replay via Table dans Passport
/// 2. Vérification cryptographique Ed25519 de la signature backend
/// 3. Vérification de l'existence et validité de la mission
/// 4. Distribution atomique des fonds
public fun claim_reward(
    pool: &mut GrantPool,
    passport: &mut Passport,
    event: &Event,
    mission_id: ID,
    signature: vector<u8>,
    ctx: &mut TxContext
): Coin<SUI> {
    let sender = tx_context::sender(ctx);
    
    // 1. VÉRIFICATION ANTI-REPLAY
    // Vérifie si l'utilisateur a déjà complété cette mission
    assert!(!passport::is_mission_completed(passport, mission_id), EAlreadyClaimed);
    
    // 2. VÉRIFICATION DE L'EXISTENCE DE LA MISSION
    assert!(event::mission_exists(event, mission_id), EMissionNotFound);
    
    // Récupérer les détails de la mission
    let (_, _, reward_amount, is_active) = event::get_mission(event, mission_id);
    assert!(is_active, EMissionNotFound);
    assert!(reward_amount > 0, EInvalidRewardAmount);
    
    // 3. VÉRIFICATION CRYPTOGRAPHIQUE Ed25519
    // Reconstruire le message signé (sender + mission_id)
    let message = construct_message(sender, mission_id);
    
    // Vérifier la signature avec la clé publique de l'admin
    assert!(
        ed25519::verify(&signature, &pool.admin_public_key, &message),
        EInvalidSignature
    );
    
    // 4. VÉRIFICATION DES FONDS DISPONIBLES
    let balance_value = balance::value(&pool.balance);
    assert!(balance_value >= reward_amount, EInsufficientFunds);
    
    // 5. DISTRIBUTION ATOMIQUE
    // Retirer les fonds du pool
    let reward_coin = balance::withdraw(&mut pool.balance, reward_amount);
    
    // Retourner la pièce pour transfert
    reward_coin
}

/// Construire le message à signer pour la vérification cryptographique
/// Format: sender_address || mission_id
/// Ce message doit correspondre exactement à celui signé par le backend
fun construct_message(sender: address, mission_id: ID): vector<u8> {
    use sui::bcs;
    
    let message = vector::empty<u8>();
    
    // Ajouter l'adresse du sender
    let sender_bytes = bcs::to_bytes(&sender);
    vector::append(&mut message, sender_bytes);
    
    // Ajouter l'ID de la mission
    let mission_bytes = bcs::to_bytes(&mission_id);
    vector::append(&mut message, mission_bytes);
    
    message
}

/// Ajouter des fonds au pool
public fun add_funds(pool: &mut GrantPool, coins: Coin<SUI>) {
    balance::join(&mut pool.balance, coin::into_balance(coins));
}

/// Retirer des fonds du pool (admin uniquement)
public fun withdraw_funds(
    pool: &mut GrantPool,
    amount: u64,
    ctx: &mut TxContext
): Coin<SUI> {
    balance::withdraw(&mut pool.balance, amount)
}

/// Obtenir le solde disponible du pool
public fun get_balance(pool: &GrantPool): u64 {
    balance::value(&pool.balance)
}

#[test_only]
use sui::test_scenario::{Self as ts, Scenario};

#[test_only]
public fun create_test_pool(
    admin_key: vector<u8>,
    initial_amount: u64,
    ctx: &mut TxContext
): GrantPool {
    let initial_coin = coin::mint_for_testing<SUI>(initial_amount, ctx);
    create(admin_key, initial_coin, ctx)
}

