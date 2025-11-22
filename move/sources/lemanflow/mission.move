// LémanFlow Mission Module
// Missions attached to events as dynamic fields, with QR-based completion

module sui_hackathon::mission {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field as df;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};

    use sui_hackathon::event::{Self, Event, EventAdminCap};
    use sui_hackathon::passport::{Self, Passport};

    /// Mission data stored as dynamic field on Event
    public struct Mission has store, copy, drop {
        mission_id: u64,
        title: String,
        description: String,
        reward_amount: u64,
        qr_secret_hash: vector<u8>, // Hash of QR secret for verification
        active: bool,
        completions: u64,
    }

    /// Mission key for dynamic fields
    public struct MissionKey has store, copy, drop {
        mission_id: u64,
    }

    /// Events
    public struct MissionCreated has copy, drop {
        event_id: ID,
        mission_id: u64,
        title: String,
        reward_amount: u64,
    }

    public struct MissionCompleted has copy, drop {
        event_id: ID,
        mission_id: u64,
        passport_id: ID,
        user: address,
        reward_amount: u64,
        timestamp: u64,
    }

    /// Error codes
    const ENotOrganizer: u64 = 1;
    const EMissionNotFound: u64 = 2;
    const EMissionInactive: u64 = 3;
    const EAlreadyCompleted: u64 = 4;
    const EInvalidQR: u64 = 5;
    const EInsufficientFunds: u64 = 6;

    /// Create a mission and attach to event
    public fun create_mission(
        _admin_cap: &EventAdminCap,
        event: &mut Event,
        title: vector<u8>,
        description: vector<u8>,
        reward_amount: u64,
        qr_secret_hash: vector<u8>,
        _ctx: &mut TxContext
    ) {
        let mission_id = event::get_total_missions(event);

        let mission = Mission {
            mission_id,
            title: string::utf8(title),
            description: string::utf8(description),
            reward_amount,
            qr_secret_hash,
            active: true,
            completions: 0,
        };

        let key = MissionKey { mission_id };
        df::add(&mut event.id, key, mission);

        event::increment_missions(event);

        event::emit(MissionCreated {
            event_id: object::id(event),
            mission_id,
            title: string::utf8(title),
            reward_amount,
        });
    }

    /// Complete mission and distribute reward (sponsored transaction)
    public fun complete_mission_and_reward(
        event: &mut Event,
        passport: &mut Passport,
        mission_id: u64,
        qr_proof: vector<u8>, // In real implementation, verify signature
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check event is active
        assert!(event::is_active(event), EMissionInactive);

        // Get mission
        let key = MissionKey { mission_id };
        let mission_ref = df::borrow_mut(&mut event.id, key);

        assert!(mission_ref.active, EMissionInactive);

        // Check not already completed (via passport attestation)
        assert!(
            !passport::has_attestation(passport, object::id(event), mission_id),
            EAlreadyCompleted
        );

        // TODO: Verify QR proof in production
        // For now, we accept any proof (backend validates before calling)
        let _ = qr_proof; // Suppress unused warning

        // Withdraw reward from event grant pool
        let reward_amount = mission_ref.reward_amount;
        let reward = event::withdraw_reward(event, reward_amount, ctx);

        // Transfer reward to user
        let user = tx_context::sender(ctx);
        transfer::public_transfer(reward, user);

        // Add attestation to passport
        let timestamp = clock::timestamp_ms(clock);
        let mission_title = mission_ref.title;
        passport::add_attestation(
            passport,
            object::id(event),
            event::get_name(event),
            mission_id,
            mission_title,
            timestamp,
            reward_amount
        );

        // Update mission stats
        mission_ref.completions = mission_ref.completions + 1;

        event::emit(MissionCompleted {
            event_id: object::id(event),
            mission_id,
            passport_id: object::id(passport),
            user,
            reward_amount: mission_ref.reward_amount,
            timestamp,
        });
    }

    /// Get mission info
    public fun get_mission(event: &Event, mission_id: u64): &Mission {
        let key = MissionKey { mission_id };
        df::borrow(&event.id, key)
    }

    /// Check if mission exists
    public fun mission_exists(event: &Event, mission_id: u64): bool {
        let key = MissionKey { mission_id };
        df::exists_(&event.id, key)
    }

    /// Toggle mission active status
    public fun set_mission_status(
        _admin_cap: &EventAdminCap,
        event: &mut Event,
        mission_id: u64,
        active: bool,
    ) {
        let key = MissionKey { mission_id };
        let mission = df::borrow_mut(&mut event.id, key);
        mission.active = active;
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Test initialization happens via event module
    }
}
