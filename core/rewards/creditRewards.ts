import {
  creditManagerByAddress,
  creditManagerByNetwork,
  ICreditConfigurator__factory,
  ICreditFacade__factory,
  ICreditManagerV2__factory,
  NetworkType,
  toBigInt,
} from "@gearbox-protocol/sdk";
import {
  CloseCreditAccountEvent,
  IncreaseBorrowedAmountEvent,
  OpenCreditAccountEvent,
  TransferAccountEvent,
} from "@gearbox-protocol/sdk/lib/types/@gearbox-protocol/core-v2/contracts/interfaces/ICreditFacade.sol/ICreditFacade";
import { TypedEvent } from "@gearbox-protocol/sdk/lib/types/common";
import { providers } from "ethers";

import { creditRewardsPerBlock } from "./creditRewardParams";
import { Reward } from "./poolRewards";
import { RangedValue } from "./range";
import { UniversalQuery } from "./universalQuery";

export class CreditRewards {
  static async computeReward(
    creditManager: string,
    address: string,
    provider: providers.Provider,
    networkType: NetworkType,
    toBlock?: number,
  ): Promise<bigint> {
    const rewards = await CreditRewards.computeAllRewards(
      creditManager,
      provider,
      networkType,
      toBlock,
    );

    const addressLC = address.toLowerCase();
    const rewardFound = rewards.find(r => r.address === addressLC);
    const reward = !rewardFound ? 0n : rewardFound.amount;

    return reward;
  }

  static async computeAllRewards(
    creditManager: string,
    provider: providers.Provider,
    networkType: NetworkType,
    toBlock?: number,
  ): Promise<Array<Reward>> {
    const toBlockQuery = toBlock || (await provider.getBlockNumber());

    const events = await this.getCMEvents(
      creditManager,
      provider,
      toBlockQuery,
    );

    const rewardPerBlock = this.getRewardsRange(creditManager, networkType);
    const parsed = this.parseCMEvents(events);

    return this.formatEvents(parsed, rewardPerBlock, toBlockQuery);
  }

  static formatEvents(
    parsed: {
      borrowedRange: Record<string, RangedValue>;
      totalBorrowedRange: RangedValue;
      borrowed: Record<string, bigint>;
      totalBorrowed: bigint;
    },
    rewardPerBlock: RangedValue,
    toBlock: number,
  ): Array<Reward> {
    const { borrowed, borrowedRange, totalBorrowedRange } = parsed;

    return Object.keys(borrowed).map(address => ({
      address: address.toLowerCase(),
      amount: CreditRewards.computeRewardInt(
        toBlock,
        borrowedRange[address],
        totalBorrowedRange,
        rewardPerBlock,
      ),
    }));
  }

  static parseCMEvents(events: Array<TypedEvent>) {
    const borrowedRange: Record<string, RangedValue> = {};
    const totalBorrowedRange = new RangedValue();

    const borrowed: Record<string, bigint> = {};
    let totalBorrowed = 0n;

    const cfi = ICreditFacade__factory.createInterface();

    events.forEach(e => {
      const event = cfi.parseLog(e);
      switch (e.topics[0]) {
        case cfi.getEventTopic("OpenCreditAccount"): {
          const { onBehalfOf, borrowAmount: ba } = (
            event as unknown as OpenCreditAccountEvent
          ).args;
          const borrowAmount = toBigInt(ba);
          totalBorrowed = totalBorrowed + borrowAmount;
          totalBorrowedRange.addValue(e.blockNumber, totalBorrowed);

          borrowed[onBehalfOf] = borrowAmount;

          if (!borrowedRange[onBehalfOf]) {
            borrowedRange[onBehalfOf] = new RangedValue();
          }
          borrowedRange[onBehalfOf].addValue(e.blockNumber, borrowAmount);
          break;
        }
        case cfi.getEventTopic("CloseCreditAccount"):
        case cfi.getEventTopic("LiquidateCreditAccount"):
        case cfi.getEventTopic("LiquidateExpiredCreditAccount"): {
          // We need { borrower} only so, we can use any event to get it from args
          const { borrower } = (event as unknown as CloseCreditAccountEvent)
            .args;
          totalBorrowed = totalBorrowed - borrowed[borrower];
          totalBorrowedRange.addValue(e.blockNumber, totalBorrowed);

          borrowed[borrower] = 0n;
          borrowedRange[borrower].addValue(e.blockNumber, 0n);
          break;
        }
        case cfi.getEventTopic("IncreaseBorrowedAmount"): {
          const { borrower, amount: a } = (
            event as unknown as IncreaseBorrowedAmountEvent
          ).args;
          const amount = toBigInt(a);
          totalBorrowed = totalBorrowed + amount;
          totalBorrowedRange.addValue(e.blockNumber, totalBorrowed);

          borrowed[borrower] = borrowed[borrower] + amount;
          borrowedRange[borrower].addValue(e.blockNumber, borrowed[borrower]);
          break;
        }
        case cfi.getEventTopic("DecreaseBorrowedAmount"): {
          const { borrower, amount: a } = (
            event as unknown as IncreaseBorrowedAmountEvent
          ).args;
          const amount = toBigInt(a);
          totalBorrowed = totalBorrowed - amount;
          totalBorrowedRange.addValue(e.blockNumber, totalBorrowed);

          borrowed[borrower] = borrowed[borrower] - amount;
          borrowedRange[borrower].addValue(e.blockNumber, borrowed[borrower]);
          break;
        }
        case cfi.getEventTopic("TransferAccount"): {
          const { newOwner, oldOwner } = (
            event as unknown as TransferAccountEvent
          ).args;
          borrowed[newOwner] = borrowed[oldOwner];

          if (!borrowedRange[newOwner]) {
            borrowedRange[newOwner] = new RangedValue();
          }

          borrowed[oldOwner] = 0n;
          borrowedRange[newOwner].addValue(e.blockNumber, borrowed[newOwner]);
          borrowedRange[oldOwner].addValue(e.blockNumber, 0n);
          break;
        }
      }
    });

    return {
      borrowedRange,
      totalBorrowedRange,
      borrowed,
      totalBorrowed,
    };
  }

  static async computeCMStats(
    creditManager: string,
    provider: providers.Provider,
    toBlock?: number,
  ) {
    const toBlockQuery = toBlock || (await provider.getBlockNumber());

    const events = await this.getCMEvents(
      creditManager,
      provider,
      toBlockQuery,
    );

    const parsed = CreditRewards.parseCMEvents(events);

    return parsed;
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

  protected static async getCMEvents(
    creditManager: string,
    provider: providers.Provider,
    toBlock: number,
  ) {
    const cm = ICreditManagerV2__factory.connect(creditManager, provider);
    // get all historical creditConfigurators for this cm
    const ccAddrs = (
      await cm.queryFilter(cm.filters.NewConfigurator(), undefined, toBlock)
    ).map(e => e.args.newConfigurator);

    // get all historical creditFacades for this cm
    const cfAddrs = (
      await Promise.all(
        ccAddrs.map(async (ccAddr): Promise<string[]> => {
          const cc = ICreditConfigurator__factory.connect(ccAddr, provider);
          const cfUpgradedEvents = await cc.queryFilter(
            cc.filters.CreditFacadeUpgraded(),
            undefined,
            toBlock,
          );
          return cfUpgradedEvents.map(e => e.args.newCreditFacade);
        }),
      )
    ).flat();

    const events: Array<TypedEvent> = (
      await Promise.all(
        cfAddrs.map(addr => CreditRewards.query(addr, provider, toBlock)),
      )
    ).flat(1);

    return events;
  }

  protected static async query(
    creditFacade: string,
    provider: providers.Provider,
    toBlock: number,
  ): Promise<Array<TypedEvent>> {
    const cf = ICreditFacade__factory.connect(creditFacade, provider);
    const topics = {
      OpenCreditAccount: cf.interface.getEventTopic("OpenCreditAccount"),
      CloseCreditAccount: cf.interface.getEventTopic("CloseCreditAccount"),
      LiquidateCreditAccount: cf.interface.getEventTopic(
        "LiquidateCreditAccount",
      ),
      LiquidateExpiredCreditAccount: cf.interface.getEventTopic(
        "LiquidateExpiredCreditAccount",
      ),
      TransferAccount: cf.interface.getEventTopic("TransferAccount"),
      IncreaseBorrowedAmount: cf.interface.getEventTopic(
        "IncreaseBorrowedAmount",
      ),
      DecreaseBorrowedAmount: cf.interface.getEventTopic(
        "DecreaseBorrowedAmount",
      ),
    };

    const events = await UniversalQuery.query({
      action: (start, end) =>
        cf.queryFilter(
          {
            address: cf.address,
            topics: [Object.values(topics)],
          },
          start,
          end,
        ),
      start: 0,
      end: toBlock,

      loggerPrefix: "CM",
    });

    return events;
  }

  protected static getRewardsRange(
    creditManager: string,
    networkType: NetworkType,
  ): RangedValue {
    const symbol = creditManagerByAddress[creditManager.toLowerCase()];
    const rewardPerBlock = creditRewardsPerBlock[networkType][symbol];

    if (!rewardPerBlock)
      throw new Error(`Unknown credit manager token ${creditManager}`);
    return rewardPerBlock;
  }
}
