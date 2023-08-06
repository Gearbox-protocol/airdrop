import {
  MainnetCreditManagers,
  NetworkType,
  PartialRecord,
  SupportedCreditManagers,
  TypedObjectUtils,
} from "@gearbox-protocol/sdk";

import { addRewards, RangedValue } from "./range";

export const CMS_WITH_REWARDS: Record<
  NetworkType,
  Array<SupportedCreditManagers>
> = {
  Mainnet: [
    "DAI_V2",
    "USDC_V2",
    "WETH_V2",
    "WBTC_V2",
    "WSTETH_V2",
    "FRAX_V2",
    "WETH_V2_1",
  ],
  Arbitrum: [],
};

export const creditRewardsPerBlock: Record<
  NetworkType,
  Record<SupportedCreditManagers, RangedValue>
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

const GEAR_PER_BLOCK: PartialRecord<MainnetCreditManagers, bigint> = {
  DAI_V2: 166n,
  USDC_V2: 166n,
  WETH_V2: 230n,
  WBTC_V2: 0n,
  WSTETH_V2: 0n,
  FRAX_V2: 0n,
  WETH_V2_1: 0n,
};

const MAINNET_BLOCK = 16033000;
addRewards({
  fromBlock: MAINNET_BLOCK,
  perBlock: GEAR_PER_BLOCK,
  rangedValues: creditRewardsPerBlock.Mainnet,
  list: ["DAI_V2", "USDC_V2", "WETH_V2", "WSTETH_V2", "WBTC_V2"],
});

const FRAX_MAINNET_BLOCK = 16033000;
addRewards({
  fromBlock: FRAX_MAINNET_BLOCK,
  perBlock: GEAR_PER_BLOCK,
  rangedValues: creditRewardsPerBlock.Mainnet,
  list: ["FRAX_V2"],
});

const GEAR_PER_BLOCK_GIP66: PartialRecord<MainnetCreditManagers, bigint> = {
  DAI_V2: 0n,
  USDC_V2: 0n,
  WETH_V2: 0n,
  WBTC_V2: 0n,
  WSTETH_V2: 0n,
  FRAX_V2: 0n,
  WETH_V2_1: 0n,
};
const GIP66_MAINNET_BLOCK = 17828000;
addRewards({
  fromBlock: GIP66_MAINNET_BLOCK,
  perBlock: GEAR_PER_BLOCK_GIP66,
  rangedValues: creditRewardsPerBlock.Mainnet,
  list: [
    "DAI_V2",
    "USDC_V2",
    "WETH_V2",
    "WBTC_V2",
    "WSTETH_V2",
    "FRAX_V2",
    "WETH_V2_1",
  ],
});

// const ARBITRUM_BLOCK = 7694030;

// creditRewardsPerBlock[creditManagerByNetwork.Mainnet.Arbitrum.].addValue(
//   ARBITRUM_BLOCK,
//   (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
// );
