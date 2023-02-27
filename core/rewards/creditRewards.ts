import {
  ICreditConfigurator__factory,
  ICreditFacade__factory,
  ICreditManagerV2__factory,
} from "@gearbox-protocol/sdk";
import {
  CloseCreditAccountEvent,
  IncreaseBorrowedAmountEvent,
  OpenCreditAccountEvent,
  TransferAccountEvent,
} from "@gearbox-protocol/sdk/lib/types/@gearbox-protocol/core-v2/contracts/interfaces/ICreditFacade.sol/ICreditFacade";
import { TypedEvent } from "@gearbox-protocol/sdk/lib/types/common";
import { BigNumber, providers } from "ethers";

import { creditRewardsPerBlock } from "./creditRewardParams";
import { Reward } from "./poolRewards";
import { RangedValue } from "./range";
import { UniversalQuery } from "./universalQuery";

export class CreditRewards {
  static async computeReward(
    creditManager: string,
    address: string,
    provider: providers.Provider,
    toBlock?: number,
  ): Promise<BigNumber> {
    const rewards = await CreditRewards.computeAllRewards(
      creditManager,
      provider,
      toBlock,
    );

    const addressLC = address.toLowerCase();
    const rewardFound = rewards.find(r => r.address === addressLC);
    const reward = !rewardFound ? BigNumber.from(0) : rewardFound.amount;

    return reward;
  }

  static async computeAllRewards(
    creditManager: string,
    provider: providers.Provider,
    toBlock?: number,
  ): Promise<Array<Reward>> {
    const toBlockQuery = toBlock || (await provider.getBlockNumber());

    const events = await this.getCMEvents(
      creditManager,
      provider,
      toBlockQuery,
    );

    const rewardPerBlock = this.getRewardsRange(creditManager);
    const parsed = this.parseCMEvents(events);

    return this.formatEvents(parsed, rewardPerBlock, toBlockQuery);
  }

  static formatEvents(
    parsed: {
      borrowedRange: Record<string, RangedValue>;
      totalBorrowedRange: RangedValue;
      borrowed: Record<string, BigNumber>;
      totalBorrowed: BigNumber;
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

    const borrowed: Record<string, BigNumber> = {};
    let totalBorrowed = BigNumber.from(0);

    const cfi = ICreditFacade__factory.createInterface();

    events.forEach(e => {
      const event = cfi.parseLog(e);
      switch (e.topics[0]) {
        case cfi.getEventTopic("OpenCreditAccount"): {
          const { onBehalfOf, borrowAmount } = (
            event as unknown as OpenCreditAccountEvent
          ).args;
          totalBorrowed = totalBorrowed.add(borrowAmount);
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
          totalBorrowed = totalBorrowed.sub(borrowed[borrower]);
          totalBorrowedRange.addValue(e.blockNumber, totalBorrowed);

          borrowed[borrower] = BigNumber.from(0);
          borrowedRange[borrower].addValue(e.blockNumber, BigNumber.from(0));
          break;
        }
        case cfi.getEventTopic("IncreaseBorrowedAmount"): {
          const { borrower, amount } = (
            event as unknown as IncreaseBorrowedAmountEvent
          ).args;
          totalBorrowed = totalBorrowed.add(amount);
          totalBorrowedRange.addValue(e.blockNumber, totalBorrowed);

          borrowed[borrower] = borrowed[borrower].add(amount);
          borrowedRange[borrower].addValue(e.blockNumber, borrowed[borrower]);
          break;
        }
        case cfi.getEventTopic("DecreaseBorrowedAmount"): {
          const { borrower, amount } = (
            event as unknown as IncreaseBorrowedAmountEvent
          ).args;
          totalBorrowed = totalBorrowed.sub(amount);
          totalBorrowedRange.addValue(e.blockNumber, totalBorrowed);

          borrowed[borrower] = borrowed[borrower].sub(amount);
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

          borrowed[oldOwner] = BigNumber.from(0);
          borrowedRange[newOwner].addValue(e.blockNumber, borrowed[newOwner]);
          borrowedRange[oldOwner].addValue(e.blockNumber, BigNumber.from(0));
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
      if (!totalSupplyArr[i].isZero() && curBlock <= nextBlock) {
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

  protected static async getCMEvents(
    creditManager: string,
    provider: providers.Provider,
    toBlock: number,
  ) {
    const cm = ICreditManagerV2__factory.connect(creditManager, provider);
    const cc = ICreditConfigurator__factory.connect(
      await cm.creditConfigurator(),
      provider,
    );

    const creditFacadesEvents = await cc.queryFilter(
      cc.filters.CreditFacadeUpgraded(),
      0,
      toBlock,
    );

    const events: Array<TypedEvent> = (
      await Promise.all(
        creditFacadesEvents.map(cfe =>
          CreditRewards.query(cfe.args.newCreditFacade, provider, toBlock),
        ),
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

  protected static getRewardsRange(creditManager: string): RangedValue {
    const cmLC = creditManager.toLowerCase();
    const rewardPerBlock = creditRewardsPerBlock[cmLC];

    if (!rewardPerBlock)
      throw new Error(`Unknown credit manager token ${cmLC}`);
    return rewardPerBlock;
  }
}
