import {
  ArbitrumCreditManagers,
  MainnetCreditManagers,
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

function getCmAddress(network: NetworkType, cmSymbol: any) {
  const address = (creditManagerByNetwork[network] as any)[cmSymbol];

  if (!address) {
    throw new Error(`Unknown network:cm combinations: ${network}:${cmSymbol}`);
  }

  return address;
}

export async function computeCreditManagers(
  exportCsv: CSVExport,
  distributed: Record<string, bigint>,
  network: NetworkType,
  toBlock: number,
  prevBlock: number,
  deployer: Signer,
) {
  for (const cmSymbol of CMS_WITH_REWARDS[network]) {
    const cmAddress = getCmAddress(network, cmSymbol);
    let total = 0n;
    const creditRewards = await CreditRewards.computeAllRewards(
      cmAddress,
      deployer.provider!,
      toBlock,
    );

    const prevCreditRewards = await CreditRewards.computeAllRewards(
      cmAddress,
      deployer.provider!,
      prevBlock,
    );

    creditRewards.forEach(reward => {
      distributed[reward.address] =
        (distributed[reward.address] || 0n) + reward.amount;

      total = total + reward.amount;

      exportCsv.additem(
        reward.address,
        `CM ${getContractName(cmAddress)}`,
        Number(reward.amount / WAD),
      );
    });

    const prevTotalRewards = prevCreditRewards.reduce(
      (a, b) => a + b.amount,
      0n,
    );

    console.log(
      `Credit manager rewards for ${getContractName(cmAddress)}: ${formatGear(
        total,
      )}, diff ${formatGear(total - prevTotalRewards)}`,
    );
  }
}
