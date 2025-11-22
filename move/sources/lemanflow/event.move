// LémanFlow Event Module
// Represents a hackathon or conference event with missions and grant pool

module sui_hackathon::event {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field as df;
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};

    /// Event struct - represents a hackathon or conference
    public struct Event has key, store {
        id: UID,
        name: String,
        description: String,
        organizer: address,
        start_time: u64,
        end_time: u64,
        grant_pool: Balance<SUI>,
        total_missions: u64,
        active: bool,
    }

    /// Admin capability for event management
    public struct EventAdminCap has key, store {
        id: UID,
        event_id: ID,
    }

    /// Events
    public struct EventCreated has copy, drop {
        event_id: ID,
        name: String,
        organizer: address,
    }

    public struct EventFunded has copy, drop {
        event_id: ID,
        amount: u64,
    }

    public struct EventStatusChanged has copy, drop {
        event_id: ID,
        active: bool,
    }

    /// Error codes
    const ENotOrganizer: u64 = 1;
    const EEventInactive: u64 = 2;
    const EInsufficientFunds: u64 = 3;

    /// Create a new event
    public fun create_event(
        name: vector<u8>,
        description: vector<u8>,
        start_time: u64,
        end_time: u64,
        ctx: &mut TxContext
    ) {
        let event_uid = object::new(ctx);
        let event_id = object::uid_to_inner(&event_uid);
        let organizer = tx_context::sender(ctx);

        let new_event = Event {
            id: event_uid,
            name: string::utf8(name),
            description: string::utf8(description),
            organizer,
            start_time,
            end_time,
            grant_pool: balance::zero(),
            total_missions: 0,
            active: true,
        };

        // Create admin capability
        let admin_cap = EventAdminCap {
            id: object::new(ctx),
            event_id,
        };

        event::emit(EventCreated {
            event_id,
            name: string::utf8(name),
            organizer,
        });

        transfer::share_object(new_event);
        transfer::transfer(admin_cap, organizer);
    }

    /// Fund the event grant pool
    public fun fund_event(
        event: &mut Event,
        payment: Coin<SUI>,
    ) {
        let amount = coin::value(&payment);
        let balance = coin::into_balance(payment);
        balance::join(&mut event.grant_pool, balance);

        event::emit(EventFunded {
            event_id: object::id(event),
            amount,
        });
    }

    /// Toggle event active status (admin only)
    public fun set_event_status(
        _admin_cap: &EventAdminCap,
        event: &mut Event,
        active: bool,
    ) {
        event.active = active;

        event::emit(EventStatusChanged {
            event_id: object::id(event),
            active,
        });
    }

    /// Increment total missions count (called by mission module)
    public(package) fun increment_missions(event: &mut Event) {
        event.total_missions = event.total_missions + 1;
    }

    /// Withdraw from grant pool for rewards (called by mission module)
    public(package) fun withdraw_reward(
        event: &mut Event,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(balance::value(&event.grant_pool) >= amount, EInsufficientFunds);
        let reward_balance = balance::split(&mut event.grant_pool, amount);
        coin::from_balance(reward_balance, ctx)
    }

    /// Getters
    public fun get_name(event: &Event): String {
        event.name
    }

    public fun get_organizer(event: &Event): address {
        event.organizer
    }

    public fun is_active(event: &Event): bool {
        event.active
    }

    public fun get_grant_pool_balance(event: &Event): u64 {
        balance::value(&event.grant_pool)
    }

    public fun get_total_missions(event: &Event): u64 {
        event.total_missions
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        create_event(
            b"Test Hackathon",
            b"A test event",
            0,
            1000000,
            ctx
        );
    }
}
