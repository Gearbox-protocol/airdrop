import {
  NetworkType,
  WAD,
  creditManagerByNetwork,
  getContractName,
} from "@gearbox-protocol/sdk";
import { Signer } from "ethers";

import { CSVExport } from "../../core/csv/csvExport";
import { CreditRewards } from "../../core/rewards/creditRewards";
import { formatGear } from "../../core/utils/formatter";
import { CMS_WITH_REWARDS } from "../../core";

function getRewardCMs(network: NetworkType) {
  switch (network) {
    case "Mainnet":
      return CMS_WITH_REWARDS[network].map(
        cm => creditManagerByNetwork[network][cm],
      );
    case "Arbitrum":
      return CMS_WITH_REWARDS[network].map(
        cm => creditManagerByNetwork[network][cm],
      );
    default:
      return [];
  }
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
        `CM ${getContractName(cm)}`,
        Number(reward.amount / WAD),
      );
    });

    const prevTotalRewards = prevCreditRewards.reduce(
      (a, b) => a + b.amount,
      0n,
    );

    console.log(
      `Credit manager rewards for ${getContractName(cm)}: ${formatGear(
        total,
      )}, diff ${formatGear(total - prevTotalRewards)}`,
    );
  }
}
