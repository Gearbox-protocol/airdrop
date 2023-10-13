import {
  ADDRESS_0X0,
  IERC20__factory,
  isDieselToken,
  NetworkType,
  toBigInt,
  tokenSymbolByAddress,
} from "@gearbox-protocol/sdk";
import { TransferEvent } from "@gearbox-protocol/sdk/lib/types/IERC20";
import { providers } from "ethers";

import { poolRewardsPerBlock } from "./poolRewardParams";
import { RangedValue } from "./range";
import { UniversalQuery } from "./universalQuery";

export interface Reward {
  address: string;
  amount: bigint;
}

export class PoolRewards {
  static async computeReward(
    dieselToken: string,
    address: string,
    provider: providers.Provider,
    networkType: NetworkType,
    toBlock?: number,
  ): Promise<bigint> {
    const toBlockQuery = toBlock || (await provider.getBlockNumber());

    const events = await PoolRewards.query(dieselToken, provider, toBlockQuery);

    const rewardPerBlock = PoolRewards.getRewardsRange(
      dieselToken,
      networkType,
    );
    const addrLC = address.toLowerCase();

    const balanceRange = new RangedValue();
    const totalSupplyRange = new RangedValue();

    let totalSupply = 0n;
    let balance = 0n;

    events.forEach(e => {
      const from = e.args.from.toLowerCase();
      if (from === ADDRESS_0X0) {
        totalSupply = totalSupply + toBigInt(e.args.value);
        totalSupplyRange.addValue(e.blockNumber, totalSupply);
      } else if (from === addrLC) {
        balance = balance - toBigInt(e.args.value);
        balanceRange.addValue(e.blockNumber, balance);
      }

      const to = e.args.to.toLowerCase();
      if (to === ADDRESS_0X0) {
        totalSupply = totalSupply - toBigInt(e.args.value);
        totalSupplyRange.addValue(e.blockNumber, totalSupply);
      } else if (to === addrLC) {
        balance = balance + toBigInt(e.args.value);
        balanceRange.addValue(e.blockNumber, balance);
      }
    });

    const reward = PoolRewards.computeRewardInt(
      toBlockQuery,
      balanceRange,
      totalSupplyRange,
      rewardPerBlock,
    );

    return reward;
  }

  static async computeAllRewards(
    dieselToken: string,
    provider: providers.Provider,
    networkType: NetworkType,
    toBlock?: number,
  ): Promise<Array<Reward>> {
    const toBlockQuery = toBlock || (await provider.getBlockNumber());

    const { totalSupplyRange, balancesRange, balances } =
      await this.computeAllRanges(dieselToken, provider, toBlockQuery);

    const rewardPerBlock = PoolRewards.getRewardsRange(
      dieselToken,
      networkType,
    );

    return Object.keys(balances).map(address => ({
      address,
      amount: PoolRewards.computeRewardInt(
        toBlockQuery,
        balancesRange[address],
        totalSupplyRange,
        rewardPerBlock,
      ),
    }));
  }

  static computeRewardInt(
    toBlock: number,
    balance: RangedValue,
    totalSupply: RangedValue,
    rewardPerBlock: RangedValue,
  ): bigint {
    const keys = Array.from(
      new Set([
        ...balance.keys,
        ...totalSupply.keys,
        ...rewardPerBlock.keys,
        toBlock,
      ]),
    ).sort((a, b) => (a > b ? 1 : -1));

    let total = 0n;

    const balancesArr = balance.getValues(keys);
    const totalSupplyArr = totalSupply.getValues(keys);
    const rewardsArr = rewardPerBlock.getValues(keys);

    for (let i = 0; i < keys.length; i++) {
      const curBlock = keys[i];
      const nextBlock = i === keys.length - 1 ? toBlock : keys[i + 1];

      if (totalSupplyArr[i] !== 0n && curBlock <= nextBlock) {
        total =
          total +
          (balancesArr[i] * BigInt(nextBlock - curBlock) * rewardsArr[i]) /
            totalSupplyArr[i];
      }
    }

    return total;
  }

  static async computeAllRanges(
    dieselToken: string,
    provider: providers.Provider,
    toBlock: number,
  ) {
    const query = await PoolRewards.query(dieselToken, provider, toBlock);

    const totalSupplyRange = new RangedValue();
    const balancesRange: Record<string, RangedValue> = {};

    let totalSupply = 0n;
    let balances: Record<string, bigint> = {};

    query
      .filter(e => !e.args.value.isZero())
      .forEach(e => {
        const from = e.args.from.toLowerCase();
        if (from === ADDRESS_0X0) {
          totalSupply = totalSupply + toBigInt(e.args.value);
          totalSupplyRange.addValue(e.blockNumber, totalSupply);
        } else {
          balances[from] = balances[from] - toBigInt(e.args.value);
          balancesRange[from].addValue(e.blockNumber, balances[from]);
        }

        const to = e.args.to.toLowerCase();
        if (to === ADDRESS_0X0) {
          totalSupply = totalSupply - toBigInt(e.args.value);
          totalSupplyRange.addValue(e.blockNumber, totalSupply);
        } else {
          if (balances[to] === undefined) {
            balances[to] = 0n;
            balancesRange[to] = new RangedValue();
          }
          balances[to] = balances[to] + toBigInt(e.args.value);
          balancesRange[to].addValue(e.blockNumber, balances[to]);
        }
      });

    return {
      totalSupplyRange,
      balancesRange,
      totalSupply,
      balances,
    };
  }

  protected static async query(
    dieselToken: string,
    provider: providers.Provider,
    toBlock: number,
  ): Promise<Array<TransferEvent>> {
    const token = IERC20__factory.connect(dieselToken, provider);

    const events = await UniversalQuery.query({
      action: (start, end) =>
        token.queryFilter(token.filters.Transfer(), start, end),
      start: 0,
      end: toBlock,

      loggerPrefix: "Pool",
    });

    return events;
  }

  protected static getRewardsRange(
    dieselToken: string,
    networkType: NetworkType,
  ): RangedValue {
    const symbol = tokenSymbolByAddress[dieselToken.toLowerCase()];
    if (!isDieselToken(symbol))
      throw new Error(`Unknown diesel token ${dieselToken}`);

    const rewardPerBlock = poolRewardsPerBlock[networkType][symbol];

    if (!rewardPerBlock)
      throw new Error(`Unknown diesel token: bo reward ${dieselToken}`);
    return rewardPerBlock;
  }
}
