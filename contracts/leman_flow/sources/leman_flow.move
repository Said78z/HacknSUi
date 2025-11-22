/// Module Principal LémanFlow: Orchestration des interactions
/// Ce module coordonne Event, Passport, et GrantPool pour créer
/// une expérience fluide de complétion de missions et distribution de récompenses
module leman_flow::leman_flow;

use sui::object::{Self, UID, ID};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::tx_context::{Self, TxContext};
use sui::transfer;
use leman_flow::event::{Self, Event};
use leman_flow::passport::{Self, Passport};
use leman_flow::grant_pool::{Self, GrantPool};

/// Fonction principale: Compléter une mission et réclamer la récompense
/// Cette fonction orchestre l'ensemble du processus:
/// 1. Vérifie la validité de la mission
/// 2. Vérifie que l'utilisateur n'a pas déjà complété la mission
/// 3. Vérifie la signature cryptographique du QR code
/// 4. Distribue la récompense
/// 5. Crée et attache l'attestation au passeport
public fun complete_mission(
    pool: &mut GrantPool,
    passport: &mut Passport,
    event: &Event,
    mission_id: ID,
    signature: vector<u8>,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    
    // Récupérer les détails de la mission pour créer l'attestation
    let (title, description, reward_amount, _) = event::get_mission(event, mission_id);
    
    // Réclamer la récompense (inclut toutes les vérifications de sécurité)
    let reward_coin = grant_pool::claim_reward(
        pool,
        passport,
        event,
        mission_id,
        signature,
        ctx
    );
    
    // Créer l'attestation
    let event_id = object::id(event);
    let attestation = passport::create_attestation(
        mission_id,
        event_id,
        title,
        description,
        // TODO: Utiliser le standard Display de Sui pour l'image
        sui::url::new_unsafe(b"https://lemanflow.io/badges/default.png"),
        reward_amount,
        ctx
    );
    
    // Ajouter l'attestation au passeport (enregistre aussi la complétion)
    passport::add_attestation(passport, attestation, mission_id, ctx);
    
    // Transférer la récompense au propriétaire du passeport
    transfer::public_transfer(reward_coin, sender);
}

/// Fonction helper: Créer un passeport pour un nouvel utilisateur
/// À utiliser lors de l'onboarding zkLogin
public fun create_user_passport(
    name: vector<u8>,
    image_url: sui::url::Url,
    ctx: &mut TxContext
): Passport {
    passport::create_passport(name, image_url, ctx)
}

/// Fonction helper: Vérifier si un utilisateur peut réclamer une mission
/// Utile pour le frontend pour afficher l'état avant la transaction
public fun can_claim_mission(
    passport: &Passport,
    event: &Event,
    mission_id: ID
): bool {
    // Vérifier que la mission existe et est active
    if (!event::mission_exists(event, mission_id)) {
        return false
    };
    
    let (_, _, _, is_active) = event::get_mission(event, mission_id);
    if (!is_active) {
        return false
    };
    
    // Vérifier que la mission n'a pas déjà été complétée
    !passport::is_mission_completed(passport, mission_id)
}

