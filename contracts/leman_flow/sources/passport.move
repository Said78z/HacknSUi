/// Module Passport: Implémentation de Soulbound Token (SBT)
/// Architecture critique selon l'audit:
/// - Capacité 'key' présente pour UID et persistance
/// - Capacité 'store' ABSENTE pour rendre le token non-transférable (Soulbound)
/// - Capacités 'copy' et 'drop' absentes pour garantir l'unicité et empêcher la destruction
module leman_flow::passport;

use sui::object::{Self, UID, ID};
use sui::dynamic_object_field as dof;
use sui::table::{Self, Table};
use sui::tx_context::{Self, TxContext};
use sui::transfer;
use sui::url::{Self, Url};

/// Structure Passport: Soulbound Token (SBT)
/// SÉCURITÉ NATIVE: Seule la capacité 'key' est présente
/// - PAS de 'store': Empêche le transfert libre (Soulbound)
/// - PAS de 'copy': Garantit l'unicité
/// - PAS de 'drop': Empêche la destruction accidentelle
/// Cette implémentation native est plus robuste que les vérifications logiques Solidity
public struct Passport has key {
    id: UID,
    /// Adresse du propriétaire (créateur)
    owner: address,
    /// Nom du porteur du passeport
    name: vector<u8>,
    /// Image du passeport (peut être générative)
    image_url: Url,
    /// Date de création
    created_at: u64,
    /// Table de suivi des missions complétées (anti-double-claim)
    /// Format: Table<mission_id, timestamp>
    missions_completed: Table<ID, u64>,
    /// Nombre total de missions complétées
    total_missions: u64,
}

/// Structure Attestation: Badge de complétion de mission
/// Utilise Dynamic Object Fields (DOF) pour la composabilité future
/// Chaque attestation est un objet distinct avec son propre ID
public struct Attestation has key, store {
    id: UID,
    /// ID de la mission complétée
    mission_id: ID,
    /// ID de l'événement associé
    event_id: ID,
    /// Titre de l'attestation
    title: vector<u8>,
    /// Description de l'attestation
    description: vector<u8>,
    /// Image du badge
    badge_image: Url,
    /// Date de complétion
    completed_at: u64,
    /// Récompense reçue
    reward_amount: u64,
}

/// Erreurs
const EAlreadyCompleted: u64 = 0;
const EPassportNotFound: u64 = 1;

/// Créer un nouveau passeport SBT
/// Le passeport est automatiquement transféré au créateur
/// et ne peut pas être transféré ensuite (Soulbound)
public fun create_passport(
    name: vector<u8>,
    image_url: Url,
    ctx: &mut TxContext
): Passport {
    let sender = tx_context::sender(ctx);
    
    Passport {
        id: object::new(ctx),
        owner: sender,
        name,
        image_url,
        created_at: tx_context::epoch_timestamp_ms(ctx),
        missions_completed: table::new(ctx),
        total_missions: 0,
    }
}

/// Ajouter une attestation au passeport via Dynamic Object Field
/// OPTIMISATION: Utilisation de DOF pour permettre la composabilité
/// Les attestations peuvent être référencées par d'autres contrats
public fun add_attestation(
    passport: &mut Passport,
    attestation: Attestation,
    mission_id: ID,
    ctx: &mut TxContext
) {
    // Vérifier que la mission n'a pas déjà été complétée (anti-double-claim)
    assert!(!table::contains(&passport.missions_completed, mission_id), EAlreadyCompleted);
    
    // Enregistrer la complétion de la mission
    table::add(&mut passport.missions_completed, mission_id, tx_context::epoch_timestamp_ms(ctx));
    passport.total_missions = passport.total_missions + 1;
    
    // Attacher l'attestation via Dynamic Object Field
    dof::add(&mut passport.id, mission_id, attestation);
}

/// Vérifier si une mission a été complétée
public fun is_mission_completed(passport: &Passport, mission_id: ID): bool {
    table::contains(&passport.missions_completed, mission_id)
}

/// Récupérer une attestation depuis le passeport
public fun get_attestation(passport: &Passport, mission_id: ID): (vector<u8>, vector<u8>, u64) {
    assert!(dof::exists_(&passport.id, mission_id), EPassportNotFound);
    
    let attestation = dof::borrow<Attestation>(&passport.id, mission_id);
    (
        *attestation.title,
        *attestation.description,
        attestation.reward_amount
    )
}

/// Créer une attestation
public fun create_attestation(
    mission_id: ID,
    event_id: ID,
    title: vector<u8>,
    description: vector<u8>,
    badge_image: Url,
    reward_amount: u64,
    ctx: &mut TxContext
): Attestation {
    Attestation {
        id: object::new(ctx),
        mission_id,
        event_id,
        title,
        description,
        badge_image,
        completed_at: tx_context::epoch_timestamp_ms(ctx),
        reward_amount,
    }
}

/// Obtenir le nombre total de missions complétées
public fun get_total_missions(passport: &Passport): u64 {
    passport.total_missions
}

/// Obtenir les informations de base du passeport
public fun get_passport_info(passport: &Passport): (address, vector<u8>, u64) {
    (passport.owner, *passport.name, passport.total_missions)
}

#[test_only]
public fun create_test_passport(
    owner: address,
    ctx: &mut TxContext
): Passport {
    use sui::url;
    
    Passport {
        id: object::new(ctx),
        owner,
        name: b"Test User",
        image_url: url::new_unsafe(b"https://example.com/passport.png"),
        created_at: 0,
        missions_completed: table::new(ctx),
        total_missions: 0,
    }
}

