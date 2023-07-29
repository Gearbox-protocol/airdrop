import {
  DieselTokenTypes,
  NetworkType,
  SupportedToken,
  TypedObjectUtils,
} from "@gearbox-protocol/sdk";

import { RangedValue } from "./range";

type PoolsListType = Record<NetworkType, Array<DieselTokenTypes>>;

export const POOLS_WITH_REWARDS: PoolsListType = {
  Mainnet: ["dDAI", "dUSDC", "dWETH", "dWBTC", "dwstETH", "dFRAX"],
  Arbitrum: [],
};

type PoolsRewardsType = Record<
  NetworkType,
  Record<DieselTokenTypes, RangedValue>
>;

export const poolRewardsPerBlock: PoolsRewardsType = {
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

export const GEAR_PER_BLOCK: Record<DieselTokenTypes, bigint> = {
  dDAI: 2283n,
  dUSDC: 2283n,
  dWETH: 3196n,
  dWBTC: 913n,
  dwstETH: 1636n,
  dFRAX: 0n,
};

export const GEAR_PER_BLOCK_GIP30: Record<DieselTokenTypes, bigint> = {
  dDAI: 2283n,
  dUSDC: 3101n,
  dWETH: 4014n,
  dWBTC: 457n,
  dwstETH: 0n,
  dFRAX: 641n,
};

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

const MAINNET_BLOCK = 15820000;

poolRewardsPerBlock.Mainnet.dDAI.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
);
poolRewardsPerBlock.Mainnet.dUSDC.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dUSDC) / 100n,
);
poolRewardsPerBlock.Mainnet.dWETH.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWETH) / 100n,
);
poolRewardsPerBlock.Mainnet.dWBTC.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWBTC) / 100n,
);
poolRewardsPerBlock.Mainnet.dwstETH.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dwstETH) / 100n,
);

const MAINNET_BLOCK_GIP30 = 15977000;

poolRewardsPerBlock.Mainnet.dDAI.addValue(
  MAINNET_BLOCK_GIP30,
  (10n ** 18n * GEAR_PER_BLOCK_GIP30.dDAI) / 100n,
);
poolRewardsPerBlock.Mainnet.dUSDC.addValue(
  MAINNET_BLOCK_GIP30,
  (10n ** 18n * GEAR_PER_BLOCK_GIP30.dUSDC) / 100n,
);
poolRewardsPerBlock.Mainnet.dWETH.addValue(
  MAINNET_BLOCK_GIP30,
  (10n ** 18n * GEAR_PER_BLOCK_GIP30.dWETH) / 100n,
);
poolRewardsPerBlock.Mainnet.dWBTC.addValue(
  MAINNET_BLOCK_GIP30,
  (10n ** 18n * GEAR_PER_BLOCK_GIP30.dWBTC) / 100n,
);
poolRewardsPerBlock.Mainnet.dwstETH.addValue(
  MAINNET_BLOCK_GIP30,
  (10n ** 18n * GEAR_PER_BLOCK_GIP30.dwstETH) / 100n,
);

const MAINNET_BLOCK_FRAX = 16720000;
poolRewardsPerBlock.Mainnet.dFRAX.addValue(
  MAINNET_BLOCK_FRAX,
  (10n ** 18n * GEAR_PER_BLOCK_GIP30.dFRAX) / 100n,
);
