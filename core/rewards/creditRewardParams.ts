import {
  CREDIT_MANAGER_DAI_V2_GOERLI,
  CREDIT_MANAGER_DAI_V2_MAINNET,
  CREDIT_MANAGER_FRAX_V2_MAINNET,
  CREDIT_MANAGER_USDC_V2_GOERLI,
  CREDIT_MANAGER_USDC_V2_MAINNET,
  CREDIT_MANAGER_WBTC_V2_GOERLI,
  CREDIT_MANAGER_WBTC_V2_MAINNET,
  CREDIT_MANAGER_WETH_V2_GOERLI,
  CREDIT_MANAGER_WETH_V2_MAINNET,
  CREDIT_MANAGER_WSTETH_V2_GOERLI,
  CREDIT_MANAGER_WSTETH_V2_MAINNET,
  CreditManagersV2,
  DieselTokenTypes,
} from "@gearbox-protocol/sdk";

import { RangedValue } from "./range";

export const creditRewardsPerBlock: Record<CreditManagersV2, RangedValue> = {
  [CREDIT_MANAGER_DAI_V2_MAINNET]: new RangedValue(),
  [CREDIT_MANAGER_USDC_V2_MAINNET]: new RangedValue(),
  [CREDIT_MANAGER_WETH_V2_MAINNET]: new RangedValue(),
  [CREDIT_MANAGER_WSTETH_V2_MAINNET]: new RangedValue(),
  [CREDIT_MANAGER_WBTC_V2_MAINNET]: new RangedValue(),
  [CREDIT_MANAGER_FRAX_V2_MAINNET]: new RangedValue(),

  // GOERLI CM
  [CREDIT_MANAGER_DAI_V2_GOERLI]: new RangedValue(),
  [CREDIT_MANAGER_USDC_V2_GOERLI]: new RangedValue(),
  [CREDIT_MANAGER_WETH_V2_GOERLI]: new RangedValue(),
  [CREDIT_MANAGER_WSTETH_V2_GOERLI]: new RangedValue(),
  [CREDIT_MANAGER_WBTC_V2_GOERLI]: new RangedValue(),
};

const GEAR_PER_BLOCK: Record<DieselTokenTypes, bigint> = {
  dDAI: 166n,
  dUSDC: 166n,
  dWETH: 230n,
  dWBTC: 0n,
  dwstETH: 0n,
  dFRAX: 0n,
};

const GOERLI_BLOCK = 7694030;

creditRewardsPerBlock[CREDIT_MANAGER_DAI_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_USDC_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dUSDC) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_WETH_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWETH) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_WSTETH_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dwstETH) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_WBTC_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWBTC) / 100n,
);

const MAINNET_BLOCK = 16033000;

creditRewardsPerBlock[CREDIT_MANAGER_DAI_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dDAI) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_USDC_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dUSDC) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_WETH_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWETH) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_WSTETH_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dwstETH) / 100n,
);
creditRewardsPerBlock[CREDIT_MANAGER_WBTC_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dWBTC) / 100n,
);

const FRAX_MAINNET_BLOCK = 16033000;
creditRewardsPerBlock[CREDIT_MANAGER_FRAX_V2_MAINNET].addValue(
  FRAX_MAINNET_BLOCK,
  (10n ** 18n * GEAR_PER_BLOCK.dFRAX) / 100n,
);
