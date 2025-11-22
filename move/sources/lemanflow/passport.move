// LémanFlow Passport Module
// Soulbound token (SBT) that holds user's attestations

module sui_hackathon::passport {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field as df;
    use std::string::{Self, String};

    /// Passport - Soulbound token (cannot be transferred)
    public struct Passport has key {
        id: UID,
        owner: address,
        created_at: u64,
        attestation_count: u64,
    }

    /// Attestation - stored as dynamic field on Passport
    public struct Attestation has store, copy, drop {
        event_id: ID,
        event_name: String,
        mission_id: u64,
        mission_title: String,
        completed_at: u64,
        reward_amount: u64,
    }

    /// Events
    public struct PassportRegistered has copy, drop {
        passport_id: ID,
        owner: address,
    }

    public struct AttestationAdded has copy, drop {
        passport_id: ID,
        event_id: ID,
        mission_id: u64,
    }

    /// Error codes
    const ENotOwner: u64 = 1;
    const EAlreadyHasPassport: u64 = 2;
    const EAttestationExists: u64 = 3;

    /// Attestation key for dynamic fields
    public struct AttestationKey has store, copy, drop {
        event_id: ID,
        mission_id: u64,
    }

    /// Register a new passport (one per user)
    public fun register_passport(
        clock_timestamp: u64,
        ctx: &mut TxContext
    ) {
        let passport_uid = object::new(ctx);
        let passport_id = object::uid_to_inner(&passport_uid);
        let owner = tx_context::sender(ctx);

        let passport = Passport {
            id: passport_uid,
            owner,
            created_at: clock_timestamp,
            attestation_count: 0,
        };

        event::emit(PassportRegistered {
            passport_id,
            owner,
        });

        // Soulbound - transfer to owner, cannot be transferred again
        transfer::transfer(passport, owner);
    }

    /// Add attestation to passport (called by mission module)
    public(package) fun add_attestation(
        passport: &mut Passport,
        event_id: ID,
        event_name: String,
        mission_id: u64,
        mission_title: String,
        completed_at: u64,
        reward_amount: u64,
    ) {
        let key = AttestationKey { event_id, mission_id };

        // Check if attestation already exists (prevents double claims)
        assert!(!df::exists_(&passport.id, key), EAttestationExists);

        let attestation = Attestation {
            event_id,
            event_name,
            mission_id,
            mission_title,
            completed_at,
            reward_amount,
        };

        df::add(&mut passport.id, key, attestation);
        passport.attestation_count = passport.attestation_count + 1;

        event::emit(AttestationAdded {
            passport_id: object::id(passport),
            event_id,
            mission_id,
        });
    }

    /// Check if attestation exists
    public fun has_attestation(
        passport: &Passport,
        event_id: ID,
        mission_id: u64,
    ): bool {
        let key = AttestationKey { event_id, mission_id };
        df::exists_(&passport.id, key)
    }

    /// Get attestation (if exists)
    public fun get_attestation(
        passport: &Passport,
        event_id: ID,
        mission_id: u64,
    ): &Attestation {
        let key = AttestationKey { event_id, mission_id };
        df::borrow(&passport.id, key)
    }

    /// Getters
    public fun get_owner(passport: &Passport): address {
        passport.owner
    }

    public fun get_attestation_count(passport: &Passport): u64 {
        passport.attestation_count
    }

    public fun get_created_at(passport: &Passport): u64 {
        passport.created_at
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        register_passport(0, ctx);
    }
}
