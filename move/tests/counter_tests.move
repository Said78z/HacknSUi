#[test_only]
module sui_hackathon::counter_tests {
    use sui_hackathon::counter::{Self, Counter, OwnerCap};
    use sui::test_scenario;
    use sui::clock;

    #[test]
    fun test_create_counter() {
        let admin = @0xAD;
        let mut scenario = test_scenario::begin(admin);

        {
            counter::create(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, admin);

        {
            let counter = test_scenario::take_shared<Counter>(&scenario);
            assert!(counter::get_value(&counter) == 0, 0);
            assert!(counter::get_owner(&counter) == admin, 1);
            test_scenario::return_shared(counter);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_increment() {
        let admin = @0xAD;
        let user = @0xB0B;
        let mut scenario = test_scenario::begin(admin);

        {
            counter::create(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, user);

        {
            let mut counter = test_scenario::take_shared<Counter>(&scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

            counter::increment(&clock, &mut counter);
            assert!(counter::get_value(&counter) == 1, 0);

            counter::increment(&clock, &mut counter);
            assert!(counter::get_value(&counter) == 2, 0);

            clock::destroy_for_testing(clock);
            test_scenario::return_shared(counter);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_set_value() {
        let admin = @0xAD;
        let mut scenario = test_scenario::begin(admin);

        {
            counter::create(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, admin);

        {
            let mut counter = test_scenario::take_shared<Counter>(&scenario);

            counter::set_value(&mut counter, 42, test_scenario::ctx(&mut scenario));
            assert!(counter::get_value(&counter) == 42, 0);

            test_scenario::return_shared(counter);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 0)]
    fun test_set_value_unauthorized() {
        let admin = @0xAD;
        let user = @0xB0B;
        let mut scenario = test_scenario::begin(admin);

        {
            counter::create(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, user);

        {
            let mut counter = test_scenario::take_shared<Counter>(&scenario);

            // This should fail because user is not the owner
            counter::set_value(&mut counter, 100, test_scenario::ctx(&mut scenario));

            test_scenario::return_shared(counter);
        };

        test_scenario::end(scenario);
    }
}
