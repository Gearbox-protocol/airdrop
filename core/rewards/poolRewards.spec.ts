import { expect } from "chai";

import { PoolRewards } from "./poolRewards";
import { RangedValue } from "./range";

describe("PoolRewards test", () => {
  it("computeReward works correctly", () => {
    const balances = new RangedValue();

    balances.addValue(1000, 100n);
    balances.addValue(2000, 200n);
    balances.addValue(3000, 0n);

    const totalSupply = new RangedValue();
    totalSupply.addValue(500, 100n);
    totalSupply.addValue(1000, 200n);
    totalSupply.addValue(1500, 250n);
    totalSupply.addValue(2000, 400n);
    totalSupply.addValue(3000, 100n);

    const rewards = new RangedValue();
    rewards.addValue(500, 20n);

    // Block: ----- 500 ------ 1000 ----- 1500 ----- 2000 ------ 2500 ----- 3000
    //
    // Balances:     0          100 ----------------  200 ------------------ 0
    // Total supply  100        200   --    250       400                    100
    // Rewards:      20
    //                           10 ------  8         10 -------------------- 0
    // Total: 10 * 500 + 8*500 + 10 * 1000 = 19000

    const result = PoolRewards.computeRewardInt(
      4000,
      balances,
      totalSupply,
      rewards,
    );

    expect(Number(result)).to.be.eq(19000);
  });

  it("sum of rewards is equal to total distributed", () => {
    const balances0 = new RangedValue();
    const balances1 = new RangedValue();

    balances0.addValue(1000, 100n);
    balances0.addValue(2000, 200n);
    balances0.addValue(3000, 0n);

    balances1.addValue(500, 100n);
    balances1.addValue(1500, 300n);
    balances1.addValue(2500, 200n);
    balances1.addValue(3000, 100n);

    const totalSupply = new RangedValue();
    totalSupply.addValue(500, 100n);
    totalSupply.addValue(1000, 200n);
    totalSupply.addValue(1500, 400n);
    totalSupply.addValue(2000, 500n);
    totalSupply.addValue(2500, 400n);
    totalSupply.addValue(3000, 100n);

    const rewards = new RangedValue();
    rewards.addValue(500, 20n);
    rewards.addValue(1500, 10n);
    rewards.addValue(2000, 0n);
    rewards.addValue(2500, 5n);

    const result0 = PoolRewards.computeRewardInt(
      3000,
      balances0,
      totalSupply,
      rewards,
    );

    const result1 = PoolRewards.computeRewardInt(
      3000,
      balances1,
      totalSupply,
      rewards,
    );

    expect(Number(result0) + Number(result1)).to.be.eq(
      20 * 1000 + 10 * 500 + 5 * 500,
    );
  });
});
