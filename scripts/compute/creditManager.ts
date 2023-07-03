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
  deployedContracts,
  NetworkType,
  WAD,
} from "@gearbox-protocol/sdk";
import { Signer } from "ethers";

import { CSVExport } from "../../core/csv/csvExport";
import { CreditRewards } from "../../core/rewards/creditRewards";
import { formatGear } from "../../core/utils/formatter";

function getRewardCMs(network: NetworkType) {
  return network === "Mainnet"
    ? [
        CREDIT_MANAGER_DAI_V2_MAINNET,
        CREDIT_MANAGER_USDC_V2_MAINNET,
        CREDIT_MANAGER_WETH_V2_MAINNET,
        CREDIT_MANAGER_WSTETH_V2_MAINNET,
        CREDIT_MANAGER_WBTC_V2_MAINNET,
        CREDIT_MANAGER_FRAX_V2_MAINNET,
      ]
    : [
        CREDIT_MANAGER_DAI_V2_GOERLI,
        CREDIT_MANAGER_USDC_V2_GOERLI,
        CREDIT_MANAGER_WETH_V2_GOERLI,
        CREDIT_MANAGER_WSTETH_V2_GOERLI,
        CREDIT_MANAGER_WBTC_V2_GOERLI,
      ];
}

export async function computeCreditManagers(
  exportCsv: CSVExport,
  distributed: Record<string, bigint>,
  network: NetworkType,
  toBlock: number,
  prevBlock: number,
  deployer: Signer,
) {
  const cms = getRewardCMs(network);

  for (const cm of cms) {
    let total = 0n;
    const creditRewards = await CreditRewards.computeAllRewards(
      cm,
      deployer.provider!,
      toBlock,
    );

    const prevCreditRewards = await CreditRewards.computeAllRewards(
      cm,
      deployer.provider!,
      prevBlock,
    );

    creditRewards.forEach(reward => {
      distributed[reward.address] =
        (distributed[reward.address] || 0n) + reward.amount;

      total = total + reward.amount;

      exportCsv.additem(
        reward.address,
        `CM ${deployedContracts[cm]}`,
        Number(reward.amount / WAD),
      );
    });

    const prevTotalRewards = prevCreditRewards.reduce(
      (a, b) => a + b.amount,
      0n,
    );

    console.log(
      `Credit manager rewards for ${deployedContracts[cm]}: ${formatGear(
        total,
      )}, diff ${formatGear(total - prevTotalRewards)}`,
    );
  }
}
