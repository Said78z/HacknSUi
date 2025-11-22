/// GrantPool module - Pool de fonds SUI pour distribuer des micro-grants
module sui_hackathon::grant_pool {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;

    // ===== Errors =====

    const EInsufficientFunds: u64 = 0;
    const ENotAuthorized: u64 = 1;
    const EPoolNotActive: u64 = 2;
    const EInvalidAmount: u64 = 3;

    // ===== Structures =====

    /// Pool de grants pour un événement
    public struct GrantPool has key, store {
        id: UID,
        /// Nom de l'événement
        event_name: String,
        /// Admin qui peut distribuer
        admin: address,
        /// Balance de SUI disponible
        balance: Balance<SUI>,
        /// Total distribué jusqu'à maintenant
        total_distributed: u64,
        /// Nombre de bénéficiaires
        recipients_count: u64,
        /// Pool actif ou non
        active: bool,
        /// Timestamp de création
        created_at: u64,
    }

    /// Capability admin pour gérer le pool
    public struct GrantPoolAdminCap has key, store {
        id: UID,
        pool_id: ID,
    }

    // ===== Events =====

    public struct PoolCreated has copy, drop {
        pool_id: ID,
        event_name: String,
        admin: address,
        initial_balance: u64,
    }

    public struct GrantDistributed has copy, drop {
        pool_id: ID,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    public struct PoolFunded has copy, drop {
        pool_id: ID,
        amount: u64,
        new_balance: u64,
    }

    // ===== Public Functions =====

    /// Créer un nouveau pool de grants
    public fun create_pool(
        event_name: String,
        initial_funding: Coin<SUI>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ): (GrantPool, GrantPoolAdminCap) {
        let pool_uid = object::new(ctx);
        let pool_id = object::uid_to_inner(&pool_uid);

        let initial_amount = coin::value(&initial_funding);

        let pool = GrantPool {
            id: pool_uid,
            event_name,
            admin: tx_context::sender(ctx),
            balance: coin::into_balance(initial_funding),
            total_distributed: 0,
            recipients_count: 0,
            active: true,
            created_at: sui::clock::timestamp_ms(clock),
        };

        let admin_cap = GrantPoolAdminCap {
            id: object::new(ctx),
            pool_id,
        };

        event::emit(PoolCreated {
            pool_id,
            event_name: pool.event_name,
            admin: pool.admin,
            initial_balance: initial_amount,
        });

        (pool, admin_cap)
    }

    /// Ajouter des fonds au pool
    public fun fund_pool(
        pool: &mut GrantPool,
        funding: Coin<SUI>,
    ) {
        assert!(pool.active, EPoolNotActive);

        let amount = coin::value(&funding);
        balance::join(&mut pool.balance, coin::into_balance(funding));

        event::emit(PoolFunded {
            pool_id: object::uid_to_inner(&pool.id),
            amount,
            new_balance: balance::value(&pool.balance),
        });
    }

    /// Distribuer un grant à un bénéficiaire (nécessite admin cap)
    public fun distribute_grant(
        pool: &mut GrantPool,
        _admin_cap: &GrantPoolAdminCap,
        recipient: address,
        amount: u64,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        assert!(pool.active, EPoolNotActive);
        assert!(amount > 0, EInvalidAmount);
        assert!(balance::value(&pool.balance) >= amount, EInsufficientFunds);

        // Retirer du pool
        let grant_balance = balance::split(&mut pool.balance, amount);
        let grant_coin = coin::from_balance(grant_balance, ctx);

        // Transférer au bénéficiaire
        transfer::public_transfer(grant_coin, recipient);

        // Mettre à jour les stats
        pool.total_distributed = pool.total_distributed + amount;
        pool.recipients_count = pool.recipients_count + 1;

        event::emit(GrantDistributed {
            pool_id: object::uid_to_inner(&pool.id),
            recipient,
            amount,
            timestamp: sui::clock::timestamp_ms(clock),
        });
    }

    /// Distribuer des grants à plusieurs bénéficiaires (batch)
    public fun distribute_batch(
        pool: &mut GrantPool,
        admin_cap: &GrantPoolAdminCap,
        recipients: vector<address>,
        amount_per_recipient: u64,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        assert!(pool.active, EPoolNotActive);

        let total_needed = amount_per_recipient * vector::length(&recipients);
        assert!(balance::value(&pool.balance) >= total_needed, EInsufficientFunds);

        let i = 0;
        let len = vector::length(&recipients);

        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            distribute_grant(pool, admin_cap, recipient, amount_per_recipient, clock, ctx);
            i = i + 1;
        };
    }

    /// Désactiver le pool
    public fun deactivate_pool(
        pool: &mut GrantPool,
        _admin_cap: &GrantPoolAdminCap,
    ) {
        pool.active = false;
    }

    /// Réactiver le pool
    public fun reactivate_pool(
        pool: &mut GrantPool,
        _admin_cap: &GrantPoolAdminCap,
    ) {
        pool.active = true;
    }

    /// Retirer les fonds restants (admin only)
    public fun withdraw_remaining(
        pool: &mut GrantPool,
        _admin_cap: &GrantPoolAdminCap,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(balance::value(&pool.balance) >= amount, EInsufficientFunds);

        let withdrawn_balance = balance::split(&mut pool.balance, amount);
        coin::from_balance(withdrawn_balance, ctx)
    }

    // ===== View Functions =====

    /// Obtenir la balance disponible
    public fun get_balance(pool: &GrantPool): u64 {
        balance::value(&pool.balance)
    }

    /// Obtenir le total distribué
    public fun get_total_distributed(pool: &GrantPool): u64 {
        pool.total_distributed
    }

    /// Obtenir le nombre de bénéficiaires
    public fun get_recipients_count(pool: &GrantPool): u64 {
        pool.recipients_count
    }

    /// Vérifier si le pool est actif
    public fun is_active(pool: &GrantPool): bool {
        pool.active
    }

    /// Obtenir l'admin
    public fun get_admin(pool: &GrantPool): address {
        pool.admin
    }

    /// Obtenir le nom de l'événement
    public fun get_event_name(pool: &GrantPool): String {
        pool.event_name
    }

    // ===== Tests =====

    #[test_only]
    public fun create_pool_for_testing(
        event_name: String,
        initial_amount: u64,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ): (GrantPool, GrantPoolAdminCap) {
        let coin = coin::mint_for_testing<SUI>(initial_amount, ctx);
        create_pool(event_name, coin, clock, ctx)
    }
}
