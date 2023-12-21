import {
  DieselTokenTypes,
  NetworkType,
  TypedObjectUtils,
} from "@gearbox-protocol/sdk";

import { addRewards, RangedValue } from "./range";

export const POOLS_WITH_REWARDS: Record<
  NetworkType,
  Array<DieselTokenTypes>
> = {
  Mainnet: [
    "dDAI",
    "dUSDC",
    "dWETH",
    "dWBTC",
    "dwstETH",
    "dFRAX",
    "dUSDCV3",
    "dWBTCV3",
    "dWETHV3",
  ],
  Arbitrum: [],
};

export const poolRewardsPerBlock: Record<
  NetworkType,
  Record<DieselTokenTypes, RangedValue>
> = {
  Mainnet: TypedObjectUtils.fromEntries(
    POOLS_WITH_REWARDS.Mainnet.map(token => {
      return [token, new RangedValue()];
    }),
  ),
  Arbitrum: TypedObjectUtils.fromEntries(
    POOLS_WITH_REWARDS.Arbitrum.map(token => {
      return [token, new RangedValue()];
    }),
  ),
};

const GEAR_PER_BLOCK: Record<DieselTokenTypes, bigint> = {
  dDAI: 2283n,
  dUSDC: 2283n,
  dWETH: 3196n,
  dWBTC: 913n,
  dwstETH: 1636n,
  dFRAX: 0n,
};

const MAINNET_BLOCK = 15820000;
addRewards({
  fromBlock: MAINNET_BLOCK,
  perBlock: GEAR_PER_BLOCK,
  rangedValues: poolRewardsPerBlock.Mainnet,
  list: ["dDAI", "dUSDC", "dWETH", "dWBTC", "dwstETH"],
});

const GEAR_PER_BLOCK_GIP30: Record<DieselTokenTypes, bigint> = {
  dDAI: 2283n,
  dUSDC: 3101n,
  dWETH: 4014n,
  dWBTC: 457n,
  dwstETH: 0n,
  dFRAX: 641n,
};

const MAINNET_BLOCK_GIP30 = 15977000;
addRewards({
  fromBlock: MAINNET_BLOCK_GIP30,
  perBlock: GEAR_PER_BLOCK_GIP30,
  rangedValues: poolRewardsPerBlock.Mainnet,
  list: ["dDAI", "dUSDC", "dWETH", "dWBTC", "dwstETH"],
});

const MAINNET_BLOCK_FRAX = 16720000;
addRewards({
  fromBlock: MAINNET_BLOCK_FRAX,
  perBlock: GEAR_PER_BLOCK_GIP30,
  rangedValues: poolRewardsPerBlock.Mainnet,
  list: ["dFRAX"],
});

const GEAR_PER_BLOCK_GIP68: Record<DieselTokenTypes, bigint> = {
  dDAI: 2283n,
  dUSDC: 3101n,
  dWETH: 4014n,
  dWBTC: 457n,
  dwstETH: 0n,
  dFRAX: 0n,
};
const GI68_MAINNET_BLOCK = 17904775;
addRewards({
  fromBlock: GI68_MAINNET_BLOCK,
  perBlock: GEAR_PER_BLOCK_GIP68,
  rangedValues: poolRewardsPerBlock.Mainnet,
  list: ["dFRAX"],
});

const GEAR_PER_BLOCK_GIP_NEXT: Record<DieselTokenTypes, bigint> = {
  dDAI: 1142n,
  dUSDC: 1551n,
  dWETH: 2007n,
  dWBTC: 229n,
  dwstETH: 0n,
  dFRAX: 0n,
};
const GIP_NEXT_MAINNET_BLOCK = 18815109;
addRewards({
  fromBlock: GIP_NEXT_MAINNET_BLOCK,
  perBlock: GEAR_PER_BLOCK_GIP_NEXT,
  rangedValues: poolRewardsPerBlock.Mainnet,
  list: ["dDAI", "dUSDC", "dWETH", "dWBTC", "dwstETH", "dFRAX"],
});

// const ARBITRUM_BLOCK = 7694030;

// poolRewardsPerBlock.Arbitrum.dDAI.addValue(
//   ARBITRUM_BLOCK,
//   (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
// );

// const ARBITRUM_BLOCK_FRAX = 7694030;
// poolRewardsPerBlock.Arbitrum.dFRAX.addValue(
//   ARBITRUM_BLOCK_FRAX,
//   (10n ** 18n * GEAR_PER_BLOCK.dFRAX) / 100n,
// );
