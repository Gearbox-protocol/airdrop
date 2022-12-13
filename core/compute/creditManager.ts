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
  deployedContracts,
  NetworkType,
  WAD,
} from "@gearbox-protocol/sdk";
import { BigNumber, Signer } from "ethers";

import { CSVExport } from "../csv/csvExport";
import { CreditRewards } from "../rewards/creditRewards";
import { formatGear } from "../utils/formatter";

export async function computeCreditManagers(
  exportCsv: CSVExport,
  distributed: Record<string, BigNumber>,
  network: NetworkType,
  toBlock: number,
  prevBlock: number,
  deployer: Signer,
) {
  const cms =
    network === "Mainnet"
      ? [
          CREDIT_MANAGER_DAI_V2_MAINNET,
          CREDIT_MANAGER_USDC_V2_MAINNET,
          CREDIT_MANAGER_WETH_V2_MAINNET,
          CREDIT_MANAGER_WSTETH_V2_MAINNET,
          CREDIT_MANAGER_WBTC_V2_MAINNET,
        ]
      : [
          CREDIT_MANAGER_DAI_V2_GOERLI,
          CREDIT_MANAGER_USDC_V2_GOERLI,
          CREDIT_MANAGER_WETH_V2_GOERLI,
          CREDIT_MANAGER_WSTETH_V2_GOERLI,
          CREDIT_MANAGER_WBTC_V2_GOERLI,
        ];

  for (const cm of cms) {
    let total = BigNumber.from(0);
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
      distributed[reward.address] = (
        distributed[reward.address] || BigNumber.from(0)
      ).add(reward.amount);

      total = total.add(reward.amount);

      exportCsv.additem(
        reward.address,
        `CM ${deployedContracts[cm]}`,
        reward.amount.div(WAD).toNumber(),
      );
    });

    const prevTotalRewards = prevCreditRewards.reduce(
      (a, b) => a.add(b.amount),
      BigNumber.from(0),
    );

    console.log(
      `Credit manager rewards for ${deployedContracts[cm]}: ${formatGear(
        total,
      )}, diff ${formatGear(total.sub(prevTotalRewards))}`,
    );
  }
}
