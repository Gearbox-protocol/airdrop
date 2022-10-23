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
import { mapToClaimed } from "./deployDistributor";

export async function updatePoolRewards() {
  const distributed: Record<string, BigNumber> = {};

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const network = await detectNetwork(deployer.provider!);

  for (const c of campaigns) {
    c.distributed.forEach((data) => {
      const amount = BigNumber.from(1e18).mul(data.amount);
      const account = data.address.toLowerCase();
      distributed[account] = distributed[account].add(amount);
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
    const poolRewards = await PoolRewards.computeAllRewards(
      tokenDataByNetwork[network][dToken],
      deployer.provider!,
      network
    );

    poolRewards.forEach((reward) => {
      distributed[reward.address] = distributed[reward.address].add(
        reward.amount
      );
    });
  }

  const distributorInfo = parseBalanceMap(mapToClaimed(distributed));

  fs.writeFileSync(
    `./merkle_${network.toLowerCase()}.json`,
    JSON.stringify(distributorInfo)
  );
}

updatePoolRewards();
