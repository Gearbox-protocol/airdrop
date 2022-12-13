import {
  NetworkType,
  SupportedToken,
  tokenDataByNetwork,
  WAD,
} from "@gearbox-protocol/sdk";
import { BigNumber, Signer } from "ethers";

import { CSVExport } from "../csv/csvExport";
import { PoolRewards } from "../rewards/poolRewards";
import { formatGear } from "../utils/formatter";

export async function computePools(
  exportCsv: CSVExport,
  distributed: Record<string, BigNumber>,
  network: NetworkType,
  toBlock: number,
  prevBlock: number,
  deployer: Signer,
) {
  const dieselTokens: Array<SupportedToken> = [
    "dDAI",
    "dUSDC",
    "dWETH",
    "dWBTC",
    "dwstETH",
  ];

  for (const dToken of dieselTokens) {
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
