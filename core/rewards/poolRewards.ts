import {
  ADDRESS_0X0,
  DieselTokenTypes,
  IERC20__factory,
  NetworkType,
  tokenSymbolByAddress,
} from "@gearbox-protocol/sdk";
import { TransferEvent } from "@gearbox-protocol/sdk/lib/types/@openzeppelin/contracts/token/ERC20/IERC20";
import { BigNumber, providers } from "ethers";
import { UniversalQuery } from "./fetchService";

import { poolRewardsPerBlock } from "./poolRewardParams";
import { RangedValue } from "./range";

export interface Reward {
  address: string;
  amount: BigNumber;
}

export class PoolRewards {
  static async computeReward(
    dieselToken: string,
    address: string,
    provider: providers.Provider,
    networkType: NetworkType,
    toBlock?: number,
  ): Promise<BigNumber> {
    const toBlockQuery = toBlock || (await provider.getBlockNumber());

    const events = await PoolRewards.query(dieselToken, provider, toBlockQuery);

    const rewardPerBlock = PoolRewards.getRewardsRange(
      dieselToken,
      networkType,
    );
    const addrLC = address.toLowerCase();

    const balanceRange = new RangedValue();
    const totalSupplyRange = new RangedValue();

    let totalSupply = BigNumber.from(0);
    let balance = BigNumber.from(0);

    events.forEach(e => {
      const from = e.args.from.toLowerCase();
      if (from === ADDRESS_0X0) {
        totalSupply = totalSupply.add(e.args.value);
        totalSupplyRange.addValue(e.blockNumber, totalSupply);
      } else if (from === addrLC) {
        balance = balance.sub(e.args.value);
        balanceRange.addValue(e.blockNumber, balance);
      }

      const to = e.args.to.toLowerCase();
      if (to === ADDRESS_0X0) {
        totalSupply = totalSupply.sub(e.args.value);
        totalSupplyRange.addValue(e.blockNumber, totalSupply);
      } else if (to === addrLC) {
        balance = balance.add(e.args.value);
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
  ): BigNumber {
    const keys = Array.from(
      new Set([
        ...balance.keys,
        ...totalSupply.keys,
        ...rewardPerBlock.keys,
        toBlock,
      ]),
    ).sort((a, b) => (a > b ? 1 : -1));

    let total = BigNumber.from(0);

    const balancesArr = balance.getValues(keys);
    const totalSupplyArr = totalSupply.getValues(keys);
    const rewardsArr = rewardPerBlock.getValues(keys);

    for (let i = 0; i < keys.length; i++) {
      const curBlock = keys[i];
      const nextBlock = i === keys.length - 1 ? toBlock : keys[i + 1];
      if (!totalSupplyArr[i].isZero()) {
        total = total.add(
          balancesArr[i]
            .mul(nextBlock - curBlock)
            .mul(rewardsArr[i])
            .div(totalSupplyArr[i]),
        );
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

    let totalSupply = BigNumber.from(0);
    let balances: Record<string, BigNumber> = {};

    query
      .filter(e => !e.args.value.isZero())
      .forEach(e => {
        const from = e.args.from.toLowerCase();
        if (from === ADDRESS_0X0) {
          totalSupply = totalSupply.add(e.args.value);
          totalSupplyRange.addValue(e.blockNumber, totalSupply);
        } else {
          balances[from] = balances[from].sub(e.args.value);
          balancesRange[from].addValue(e.blockNumber, balances[from]);
        }

        const to = e.args.to.toLowerCase();
        if (to === ADDRESS_0X0) {
          totalSupply = totalSupply.sub(e.args.value);
          totalSupplyRange.addValue(e.blockNumber, totalSupply);
        } else {
          if (!balances[to]) {
            balances[to] = BigNumber.from(0);
            balancesRange[to] = new RangedValue();
          }
          balances[to] = balances[to].add(e.args.value);
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
    const rewardPerBlock =
      poolRewardsPerBlock[networkType][
        tokenSymbolByAddress[dieselToken.toLowerCase()] as DieselTokenTypes
      ];

    if (!rewardPerBlock) throw new Error(`Unknown diesel token ${dieselToken}`);
    return rewardPerBlock;
  }
}
