import {
  NetworkType,
  SupportedToken,
  tokenDataByNetwork,
  WAD,
} from "@gearbox-protocol/sdk";
import { BigNumber, Signer } from "ethers";

import { CSVExport } from "../../core/csv/csvExport";
import {
  PoolRewards,
  POOL_REWARDS_DIESEL_TOKENS,
} from "../../core/rewards/poolRewards";
import { formatGear } from "../../core/utils/formatter";

export async function computePools(
  exportCsv: CSVExport,
  distributed: Record<string, BigNumber>,
  network: NetworkType,
  toBlock: number,
  prevBlock: number,
  deployer: Signer,
) {
  for (const dToken of POOL_REWARDS_DIESEL_TOKENS) {
    try {
      let total = BigNumber.from(0);
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
        distributed[reward.address] = (
          distributed[reward.address] || BigNumber.from(0)
        ).add(reward.amount);

        exportCsv.additem(
          reward.address,
          `Pool ${dToken}`,
          reward.amount.div(WAD).toNumber(),
        );

        total = total.add(reward.amount);
      });

      const prevTotalRewards = prevPoolRewards.reduce(
        (a, b) => a.add(b.amount),
        BigNumber.from(0),
      );

      console.log(
        `Pool rewards for ${dToken}: ${formatGear(total)}, diff: ${formatGear(
          total.sub(prevTotalRewards),
        )}`,
      );
    } catch (e) {
      console.error("Error:\n", e);
    }
  }
}
