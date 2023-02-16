import {
  CREDIT_MANAGER_DAI_V2_GOERLI,
  CREDIT_MANAGER_DAI_V2_MAINNET,
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
  CREDIT_MANAGER_FRAX_V2_MAINNET,
} from "@gearbox-protocol/sdk";
import { BigNumber } from "ethers";

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

const GEAR_PER_BLOCK: Record<DieselTokenTypes, number> = {
  dDAI: 166,
  dUSDC: 166,
  dWETH: 230,
  dWBTC: 0,
  dwstETH: 0,
  dFRAX: 0,
};

const GOERLI_BLOCK = 7694030;

creditRewardsPerBlock[CREDIT_MANAGER_DAI_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dDAI).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_USDC_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dUSDC).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_WETH_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dWETH).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_WSTETH_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dwstETH).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_WBTC_V2_GOERLI].addValue(
  GOERLI_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dWBTC).div(100),
);

const MAINNET_BLOCK = 16033000;

creditRewardsPerBlock[CREDIT_MANAGER_DAI_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dDAI).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_USDC_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dUSDC).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_WETH_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dWETH).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_WSTETH_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dwstETH).div(100),
);
creditRewardsPerBlock[CREDIT_MANAGER_WBTC_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dWBTC).div(100),
);

const FRAX_MAINNET_BLOCK = 16033000;
creditRewardsPerBlock[CREDIT_MANAGER_FRAX_V2_MAINNET].addValue(
  MAINNET_BLOCK,
  BigNumber.from(10).pow(18).mul(GEAR_PER_BLOCK.dFRAX).div(100),
);
