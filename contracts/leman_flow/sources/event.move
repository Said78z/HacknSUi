/// Module Event: Gestion des événements avec Shared Object pour parallélisation
/// Architecture optimisée selon l'audit: Event doit être un Shared Object
/// pour permettre à des centaines de participants de valider des missions simultanément
module leman_flow::event;

use sui::object::{Self, UID, ID};
use sui::dynamic_field as df;
use sui::dynamic_object_field as dof;
use sui::tx_context::{Self, TxContext};
use sui::transfer;
use sui::url::{Self, Url};

/// Structure Event: Objet Partagé (Shared Object) pour éviter les contentions
/// Les missions sont attachées via Dynamic Fields pour permettre l'ajout dynamique
/// sans modifier la structure de base
public struct Event has key {
    id: UID,
    /// Nom de l'événement
    name: vector<u8>,
    /// Description de l'événement
    description: vector<u8>,
    /// URL de l'image de l'événement
    image_url: Url,
    /// Date de début (timestamp)
    start_date: u64,
    /// Date de fin (timestamp)
    end_date: u64,
    /// Adresse de l'administrateur de l'événement
    admin: address,
    /// Statut de l'événement (actif/inactif)
    is_active: bool,
}

/// Structure Mission: Représente une mission individuelle
/// Stockée comme Dynamic Field attaché à l'Event
public struct Mission has store, drop {
    /// ID unique de la mission
    mission_id: ID,
    /// Titre de la mission
    title: vector<u8>,
    /// Description de la mission
    description: vector<u8>,
    /// Récompense en SUI (micro-grant)
    reward_amount: u64,
    /// QR code signé requis pour compléter la mission
    qr_signature: vector<u8>,
    /// Statut de la mission (active/complétée)
    is_active: bool,
}

/// Erreurs
const EEventNotActive: u64 = 0;
const EUnauthorized: u64 = 1;
const EMissionNotFound: u64 = 2;
const EInvalidDateRange: u64 = 3;

/// Créer un nouvel événement
/// Retourne un Shared Object pour permettre l'accès parallèle
public fun create_event(
    name: vector<u8>,
    description: vector<u8>,
    image_url: Url,
    start_date: u64,
    end_date: u64,
    ctx: &mut TxContext
): Event {
    assert!(start_date < end_date, EInvalidDateRange);
    
    Event {
        id: object::new(ctx),
        name,
        description,
        image_url,
        start_date,
        end_date,
        admin: tx_context::sender(ctx),
        is_active: true,
    }
}

/// Partage l'événement pour en faire un Shared Object
/// CRITIQUE: Cette fonction transforme l'Event en Shared Object
/// permettant l'accès parallèle par tous les utilisateurs
public fun share_event(event: Event) {
    transfer::share_object(event);
}

/// Ajouter une mission à un événement via Dynamic Field
/// Optimisation: Utilisation de Dynamic Fields pour éviter de modifier
/// la structure Event et permettre l'ajout dynamique de missions
public fun add_mission(
    event: &mut Event,
    mission_id: ID,
    title: vector<u8>,
    description: vector<u8>,
    reward_amount: u64,
    qr_signature: vector<u8>,
    ctx: &mut TxContext
) {
    assert!(event.is_active, EEventNotActive);
    assert!(tx_context::sender(ctx) == event.admin, EUnauthorized);
    
    let mission = Mission {
        mission_id,
        title,
        description,
        reward_amount,
        qr_signature,
        is_active: true,
    };
    
    // Attacher la mission à l'événement via Dynamic Field
    df::add(&mut event.id, mission_id, mission);
}

/// Récupérer une mission depuis un événement
public fun get_mission(event: &Event, mission_id: ID): (vector<u8>, vector<u8>, u64, bool) {
    assert!(df::exists_(&event.id, mission_id), EMissionNotFound);
    
    let mission = df::borrow<Mission>(&event.id, mission_id);
    (
        *mission.title,
        *mission.description,
        mission.reward_amount,
        mission.is_active
    )
}

/// Vérifier si une mission existe
public fun mission_exists(event: &Event, mission_id: ID): bool {
    df::exists_(&event.id, mission_id)
}

/// Désactiver une mission
public fun deactivate_mission(event: &mut Event, mission_id: ID, ctx: &TxContext) {
    assert!(tx_context::sender(ctx) == event.admin, EUnauthorized);
    assert!(df::exists_(&event.id, mission_id), EMissionNotFound);
    
    let mission = df::borrow_mut<Mission>(&mut event.id, mission_id);
    mission.is_active = false;
}

/// Désactiver un événement
public fun deactivate_event(event: &mut Event, ctx: &TxContext) {
    assert!(tx_context::sender(ctx) == event.admin, EUnauthorized);
    event.is_active = false;
}

#[test_only]
public fun create_test_event(
    admin: address,
    ctx: &mut TxContext
): Event {
    use sui::url;
    
    Event {
        id: object::new(ctx),
        name: b"Test Event",
        description: b"Test Description",
        image_url: url::new_unsafe(b"https://example.com/image.png"),
        start_date: 0,
        end_date: 9999999999,
        admin,
        is_active: true,
    }
}

