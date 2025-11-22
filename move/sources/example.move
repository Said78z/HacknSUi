module sui_hackathon::example {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    /// Main application object
    public struct App has key {
        id: UID,
        name: String,
        counter: u64,
    }

    /// Admin capability
    public struct AdminCap has key {
        id: UID,
    }

    /// Initialize the module
    fun init(ctx: &mut TxContext) {
        let app = App {
            id: object::new(ctx),
            name: string::utf8(b"SUI Hackathon dApp"),
            counter: 0,
        };

        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        transfer::share_object(app);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Increment the counter
    public entry fun increment(app: &mut App) {
        app.counter = app.counter + 1;
    }

    /// Get counter value
    public fun get_counter(app: &App): u64 {
        app.counter
    }

    /// Update app name (admin only)
    public entry fun update_name(
        _admin_cap: &AdminCap,
        app: &mut App,
        new_name: String
    ) {
        app.name = new_name;
    }

    /// Get app name
    public fun get_name(app: &App): String {
        app.name
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
