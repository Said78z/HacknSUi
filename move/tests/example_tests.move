#[test_only]
module sui_hackathon::example_tests {
    use sui_hackathon::example::{Self, App, AdminCap};
    use sui::test_scenario;
    use std::string;

    #[test]
    fun test_init() {
        let admin = @0xAD;
        let mut scenario = test_scenario::begin(admin);

        {
            example::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, admin);

        {
            let app = test_scenario::take_shared<App>(&scenario);
            assert!(example::get_counter(&app) == 0, 0);
            test_scenario::return_shared(app);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_increment() {
        let admin = @0xAD;
        let user = @0xB0B;
        let mut scenario = test_scenario::begin(admin);

        {
            example::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, user);

        {
            let mut app = test_scenario::take_shared<App>(&scenario);
            example::increment(&mut app);
            assert!(example::get_counter(&app) == 1, 0);

            example::increment(&mut app);
            assert!(example::get_counter(&app) == 2, 0);

            test_scenario::return_shared(app);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_update_name() {
        let admin = @0xAD;
        let mut scenario = test_scenario::begin(admin);

        {
            example::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, admin);

        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut app = test_scenario::take_shared<App>(&scenario);

            let new_name = string::utf8(b"Updated dApp");
            example::update_name(&admin_cap, &mut app, new_name);

            assert!(example::get_name(&app) == string::utf8(b"Updated dApp"), 0);

            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(app);
        };

        test_scenario::end(scenario);
    }
}
