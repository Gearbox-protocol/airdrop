import { DieselTokenTypes, NetworkType } from "@gearbox-protocol/sdk";

import { RangedValue } from "./range";

export const poolRewardsPerBlock: Record<
  NetworkType,
  Record<DieselTokenTypes, RangedValue>
> = {
  Mainnet: {
    dDAI: new RangedValue(),
    dUSDC: new RangedValue(),
    dWETH: new RangedValue(),
    dWBTC: new RangedValue(),
    dwstETH: new RangedValue(),
    dFRAX: new RangedValue(),
  },
  Goerli: {
    dDAI: new RangedValue(),
    dUSDC: new RangedValue(),
    dWETH: new RangedValue(),
    dWBTC: new RangedValue(),
    dwstETH: new RangedValue(),
    dFRAX: new RangedValue(),
  },
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

const GOERLI_BLOCK = 7694030;

poolRewardsPerBlock.Goerli.dDAI.addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
);
poolRewardsPerBlock.Goerli.dUSDC.addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dUSDC) / 100n,
);
poolRewardsPerBlock.Goerli.dWETH.addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWETH) / 100n,
);
poolRewardsPerBlock.Goerli.dWBTC.addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWBTC) / 100n,
);
poolRewardsPerBlock.Goerli.dwstETH.addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dwstETH) / 100n,
);

const GOERLI_BLOCK_FRAX = 7694030;
poolRewardsPerBlock.Goerli.dFRAX.addValue(
  GOERLI_BLOCK_FRAX,
  (10n ** 18n * GEAR_PER_BLOCK.dFRAX) / 100n,
);

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
