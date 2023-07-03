import {
  DUMB_ADDRESS,
  DUMB_ADDRESS2,
  DUMB_ADDRESS3,
} from "@gearbox-protocol/sdk";
import { expect } from "chai";

import { TypedEvent } from "../../types/common";
import { CreditRewards } from "./creditRewards";
import {
  closeCreditAccountEvent,
  decreaseBorrowedAmountEvent,
  increaseBorrowedAmountEvent,
  liquidateCreditAccountEvent,
  openCreditAccountEvent,
  transferAccountEvent,
} from "./creditRewardsHelper.spec";
import { RangedValue } from "./range";

describe("CreditRewards test", () => {
  it("one acccount only", () => {
    const cfacade = DUMB_ADDRESS;
    const user = DUMB_ADDRESS2.toLowerCase();
    const events = [
      openCreditAccountEvent(cfacade, 1000, user, 100n),
    ] as Array<TypedEvent>;

    const rewardPerBlock = new RangedValue();
    rewardPerBlock.addValue(1000, 1000n);
    const r = CreditRewards.formatEvents(
      CreditRewards.parseCMEvents(events),
      rewardPerBlock,
      2000,
    );

    expect(r).to.be.eql([
      {
        address: user,
        amount: 1000n * 1000n,
      },
    ]);
  });

  it("one acccoun only with closure", () => {
    const cfacade = DUMB_ADDRESS;
    const user = DUMB_ADDRESS2.toLowerCase();
    const events = [
      openCreditAccountEvent(cfacade, 1000, user, 100n),
      closeCreditAccountEvent(cfacade, 1500, user),
    ] as Array<TypedEvent>;

    const rewardPerBlock = new RangedValue();
    rewardPerBlock.addValue(1000, 1000n);
    const r = CreditRewards.formatEvents(
      CreditRewards.parseCMEvents(events),
      rewardPerBlock,
      2000,
    );

    expect(r).to.be.eql([
      {
        address: user,
        amount: 1000n * 500n,
      },
    ]);
  });

  it("two accounts with one liquidation", () => {
    const cfacade = DUMB_ADDRESS;
    const user = DUMB_ADDRESS2.toLowerCase();
    const user2 = DUMB_ADDRESS3.toLowerCase();
    const events = [
      openCreditAccountEvent(cfacade, 1000, user, 100n),
      liquidateCreditAccountEvent(cfacade, 1500, user),
      openCreditAccountEvent(cfacade, 1500, user2, 200n),
    ] as Array<TypedEvent>;

    const rewardPerBlock = new RangedValue();
    rewardPerBlock.addValue(1000, 1000n);
    const r = CreditRewards.formatEvents(
      CreditRewards.parseCMEvents(events),
      rewardPerBlock,
      2000,
    );

    expect(r).to.be.eql([
      {
        address: user,
        amount: 1000n * 500n,
      },
      {
        address: user2,
        amount: 1000n * 500n,
      },
    ]);
  });

  it("two accounts with increase borrowed amount", () => {
    const cfacade = DUMB_ADDRESS;
    const user = DUMB_ADDRESS2.toLowerCase();
    const user2 = DUMB_ADDRESS3.toLowerCase();
    const events = [
      openCreditAccountEvent(cfacade, 1000, user, 100n),
      openCreditAccountEvent(cfacade, 1000, user2, 100n),
      increaseBorrowedAmountEvent(cfacade, 1500, user2, 200n),
    ] as Array<TypedEvent>;

    const rewardPerBlock = new RangedValue();
    rewardPerBlock.addValue(1000, 1000n);
    const r = CreditRewards.formatEvents(
      CreditRewards.parseCMEvents(events),
      rewardPerBlock,
      2000,
    );

    expect(r).to.be.eql([
      {
        address: user,
        amount: 500n * 500n + 250n * 500n,
      },
      {
        address: user2,
        amount: 500n * 500n + 750n * 500n,
      },
    ]);
  });

  it("two accounts with decrease borrowed amount", () => {
    const cfacade = DUMB_ADDRESS;
    const user = DUMB_ADDRESS2.toLowerCase();
    const user2 = DUMB_ADDRESS3.toLowerCase();
    const events = [
      openCreditAccountEvent(cfacade, 1000, user, 200n),
      openCreditAccountEvent(cfacade, 1000, user2, 200n),
      decreaseBorrowedAmountEvent(cfacade, 1500, user, 100n),
      increaseBorrowedAmountEvent(cfacade, 1500, user2, 100n),
    ] as Array<TypedEvent>;

    const rewardPerBlock = new RangedValue();
    rewardPerBlock.addValue(1000, 1000n);
    const r = CreditRewards.formatEvents(
      CreditRewards.parseCMEvents(events),
      rewardPerBlock,
      2000,
    );

    expect(r).to.be.eql([
      {
        address: user,
        amount: 500n * 500n + 250n * 500n,
      },
      {
        address: user2,
        amount: 500n * 500n + 750n * 500n,
      },
    ]);
  });

  it("transfer works correctly ", () => {
    const cfacade = DUMB_ADDRESS;
    const user = DUMB_ADDRESS2.toLowerCase();
    const user2 = DUMB_ADDRESS3.toLowerCase();
    const events = [
      openCreditAccountEvent(cfacade, 1000, user, 200n),
      transferAccountEvent(cfacade, 1500, user, user2),
    ] as Array<TypedEvent>;

    const rewardPerBlock = new RangedValue();
    rewardPerBlock.addValue(1000, 1000n);
    const r = CreditRewards.formatEvents(
      CreditRewards.parseCMEvents(events),
      rewardPerBlock,
      2000,
    );

    expect(r).to.be.eql([
      {
        address: user,
        amount: 500n * 1000n,
      },
      {
        address: user2,
        amount: 500n * 1000n,
      },
    ]);
  });
});
