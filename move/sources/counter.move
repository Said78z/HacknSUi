// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// This example demonstrates a basic use of a shared object.
/// Rules:
/// - anyone can create and share a counter
/// - everyone can increment a counter by 1
/// - the owner of the counter can reset it to any value
module sui_hackathon::counter {

  use sui::event;
  use sui::clock::{Self, Clock};

  /// A shared counter.
  public struct Counter has key {
    id: UID,
    owner: address,
    value: u64
  }

  public struct OwnerCap has key {
    id: UID,
  }

  public struct EventIncrement has copy, drop {
    id: ID,
    value: u64,
    timestamp: u64,
  }

  public struct EventCreate has copy, drop {
    id: ID,
    owner: address,
  }

  /// Create and share a Counter object.
  public fun create(ctx: &mut TxContext) {
    let counter_id = object::new(ctx);
    let counter_obj_id = object::uid_to_inner(&counter_id);
    let owner = tx_context::sender(ctx);

    transfer::share_object(Counter {
      id: counter_id,
      owner,
      value: 0
    });

    transfer::transfer(OwnerCap {
      id: object::new(ctx)
    }, owner);

    event::emit(EventCreate {
      id: counter_obj_id,
      owner,
    });
  }

  /// Increment a counter by 1.
  public fun increment(clock: &Clock, counter: &mut Counter) {
    counter.value = counter.value + 1;

    event::emit(EventIncrement {
      id: object::id(counter),
      value: counter.value,
      timestamp: clock::timestamp_ms(clock)
    });
  }

  /// Set value (only runnable by the Counter owner)
  public fun set_value(counter: &mut Counter, value: u64, ctx: &TxContext) {
    assert!(counter.owner == tx_context::sender(ctx), 0);
    counter.value = value;
  }

  /// Freeze counter (only owner with OwnerCap)
  public fun freeze_counter(_: &OwnerCap, counter: Counter) {
    transfer::freeze_object(counter);
  }

  /// Get counter value
  public fun get_value(counter: &Counter): u64 {
    counter.value
  }

  /// Get counter owner
  public fun get_owner(counter: &Counter): address {
    counter.owner
  }

  #[test_only]
  public fun init_for_testing(ctx: &mut TxContext) {
    create(ctx);
  }
}
