import { NetworkType, tokenDataByNetwork, WAD } from "@gearbox-protocol/sdk";
import { Signer } from "ethers";

import { CSVExport } from "../../core/csv/csvExport";
import {
  POOL_REWARDS_DIESEL_TOKENS,
  PoolRewards,
} from "../../core/rewards/poolRewards";
import { formatGear } from "../../core/utils/formatter";

export async function computePools(
  exportCsv: CSVExport,
  distributed: Record<string, bigint>,
  network: NetworkType,
  toBlock: number,
  prevBlock: number,
  deployer: Signer,
) {
  for (const dToken of POOL_REWARDS_DIESEL_TOKENS) {
    try {
      let total = 0n;
      const poolRewards = await PoolRewards.computeAllRewards(
        tokenDataByNetwork[network][dToken],
        deployer.provider!,
        network,
        toBlock,
      );

      const prevPoolRewards = await PoolRewards.computeAllRewards(
        tokenDataByNetwork[network][dToken],
        deployer.provider!,
        network,
        prevBlock,
      );

      poolRewards.forEach(reward => {
        distributed[reward.address] =
          (distributed[reward.address] || 0n) + reward.amount;

        exportCsv.additem(
          reward.address,
          `Pool ${dToken}`,
          Number(reward.amount / WAD),
        );

        total = total + reward.amount;
      });

      const prevTotalRewards = prevPoolRewards.reduce(
        (a, b) => a + b.amount,
        0n,
      );

      console.log(
        `Pool rewards for ${dToken}: ${formatGear(total)}, diff: ${formatGear(
          total - prevTotalRewards,
        )}`,
      );
    } catch (e) {
      console.error("Error:\n", e);
    }
  }
}
