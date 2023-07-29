import {
  ArbitrumCreditManagers,
  creditManagerByNetwork,
  DieselTokenTypes,
  MainnetCreditManagers,
  NetworkType,
  TypedObjectUtils,
} from "@gearbox-protocol/sdk";

import { RangedValue } from "./range";

export const CMS_WITH_REWARDS: Record<
  NetworkType,
  Array<MainnetCreditManagers | ArbitrumCreditManagers>
> = {
  Mainnet: ["DAI_V2", "USDC_V2", "WETH_V2", "WBTC_V2", "WSTETH_V2", "FRAX_V2"],
  Arbitrum: [],
};

export const creditRewardsPerBlock: Record<
  NetworkType,
  Record<MainnetCreditManagers | ArbitrumCreditManagers, RangedValue>
> = {
  Mainnet: TypedObjectUtils.fromEntries(
    CMS_WITH_REWARDS.Mainnet.map(cm => {
      return [cm, new RangedValue()];
    }),
  ),
  Arbitrum: TypedObjectUtils.fromEntries(
    CMS_WITH_REWARDS.Arbitrum.map(token => {
      return [token, new RangedValue()];
    }),
  ),
};

const GEAR_PER_BLOCK: Record<DieselTokenTypes, bigint> = {
  dDAI: 166n,
  dUSDC: 166n,
  dWETH: 230n,
  dWBTC: 0n,
  dwstETH: 0n,
  dFRAX: 0n,
};

// const ARBITRUM_BLOCK = 7694030;

// creditRewardsPerBlock[creditManagerByNetwork.Mainnet.Arbitrum.].addValue(
//   ARBITRUM_BLOCK,
//   (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
// );

const MAINNET_BLOCK = 16033000;

creditRewardsPerBlock.Mainnet.DAI_V2.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
);
creditRewardsPerBlock.Mainnet.USDC_V2.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dUSDC) / 100n,
);
creditRewardsPerBlock.Mainnet.WETH_V2.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWETH) / 100n,
);
creditRewardsPerBlock.Mainnet.WSTETH_V2.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dwstETH) / 100n,
);
creditRewardsPerBlock.Mainnet.WBTC_V2.addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWBTC) / 100n,
);

const FRAX_MAINNET_BLOCK = 16033000;
creditRewardsPerBlock.Mainnet.FRAX_V2.addValue(
  FRAX_MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dFRAX) / 100n,
);
