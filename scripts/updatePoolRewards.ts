import {
  detectNetwork,
  PoolRewards,
  SupportedToken,
  tokenDataByNetwork,
} from "@gearbox-protocol/sdk";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import { campaigns } from "../airdrops";
import { parseBalanceMap } from "../merkle/parse-accounts";
import { mapToClaimed } from "./lib";

export async function updatePoolRewards() {
  const distributed: Record<string, BigNumber> = {};

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const network = await detectNetwork(deployer.provider!);

  const toBlock = await deployer.provider!.getBlockNumber();

  console.log(`To block: ${toBlock}`);

  for (const c of campaigns) {
    c.distributed.forEach((data) => {
      const amount = BigNumber.from(10).pow(18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || BigNumber.from(0)).add(
        amount
      );
    });

    c.claimed.forEach((data) => {
      const amount = BigNumber.from(10).pow(18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || BigNumber.from(0)).sub(
        amount
      );
    });
  }

  const dieselTokens: Array<SupportedToken> = [
    "dDAI",
    "dUSDC",
    "dWETH",
    "dWBTC",
    "dwstETH",
  ];

  for (const dToken of dieselTokens) {
    try {
      const poolRewards = await PoolRewards.computeAllRewards(
        tokenDataByNetwork[network][dToken],
        deployer.provider!,
        network,
        toBlock
      );
      poolRewards.forEach((reward) => {
        distributed[reward.address] = (
          distributed[reward.address] || BigNumber.from(0)
        ).add(reward.amount);
      });
    } catch (e) {
      console.log("fff", e);
    }
  }

  const distributorInfo = parseBalanceMap(
    mapToClaimed(distributed).filter((e) => !e.amount.isZero())
  );

  fs.writeFileSync(
    `./merkle_${network.toLowerCase()}_${toBlock}.json`,
    JSON.stringify(distributorInfo)
  );
}

updatePoolRewards()
  .then(() => console.log("Ok"))
  .catch((e) => console.log(e));
