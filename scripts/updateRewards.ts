import { detectNetwork, toBigInt, WAD } from "@gearbox-protocol/sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { ethers } from "hardhat";

import { CSVExport } from "../core/csv/csvExport";
import { parseBalanceMap } from "../core/merkle/parse-accounts";
import { formatGear } from "../core/utils/formatter";
import { saveMerkle } from "../core/utils/saveMerkle";
import {
  IAddressProvider__factory,
  IAirdropDistributor__factory,
  IERC20__factory,
} from "../types";
import { ClaimedEvent } from "../types/contracts/AirdropDistributor";
import { computeCampaigns } from "./compute/campaign";
import { computeCreditManagers } from "./compute/creditManager";
import { computePools } from "./compute/pool";
import { queryClaimed } from "./greedQuery";
import { mapToClaimed } from "./lib";
import { loadPrevMerkle } from "./prevMerkle";

export async function updatePoolRewards() {
  const distributed: Record<string, bigint> = {};

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const network = await detectNetwork(deployer.provider!);

  dotenv.config({
    path: network === "Goerli" ? ".env.goerli" : ".env.mainnet",
  });

  const ADDRESS_PROVIDER = process.env.REACT_APP_ADDRESS_PROVIDER || "";
  const AIRDROP_DISTRIBUTOR = process.env.REACT_APP_AIRDROP_DISTRIBUTOR || "";

  if (ADDRESS_PROVIDER === "") {
    throw new Error("ADDRESS_PROVIDER token address unknown");
  }

  if (AIRDROP_DISTRIBUTOR === "") {
    throw new Error("AIRDROP_DISTRIBUTOR token address unknown");
  }

  console.log(
    `Address provider: https://etherscan.io/address/${ADDRESS_PROVIDER}`,
  );
  console.log(
    `Reward distributor: https://etherscan.io/address/${AIRDROP_DISTRIBUTOR}\n`,
  );

  const gearToken = IERC20__factory.connect(
    await IAddressProvider__factory.connect(
      ADDRESS_PROVIDER,
      deployer,
    ).getGearToken(),
    deployer,
  );

  const distributor = IAirdropDistributor__factory.connect(
    AIRDROP_DISTRIBUTOR,
    deployer,
  );

  const toBlock = await deployer.provider!.getBlockNumber();

  const prevMerkle = await loadPrevMerkle(network, distributor);

  console.log(
    `Rewards to block: ${toBlock} [contract merkle root at block #${
      prevMerkle.toBlock
    }, ${toBlock - prevMerkle.toBlock} blocks ago]\n`,
  );

  const exportCsv = new CSVExport();

  computeCampaigns(exportCsv, distributed);

  console.log("");

  await computePools(
    exportCsv,
    distributed,
    network,
    toBlock,
    prevMerkle.toBlock,
    deployer,
  );

  console.log("");

  await computeCreditManagers(
    exportCsv,
    distributed,
    network,
    toBlock,
    prevMerkle.toBlock,
    deployer,
  );

  console.log("");

  const lastBlock = await deployer.provider!.getBlockNumber();

  const b = await gearToken.balanceOf(AIRDROP_DISTRIBUTOR, {
    blockTag: lastBlock,
  });
  const balance = toBigInt(b);

  const claimed: Array<ClaimedEvent> = await queryClaimed(
    distributor,
    lastBlock,
  );

  let totalClaimedFromContract = 0n;

  claimed.forEach(e => {
    exportCsv.addClaimed(e.args.account, e.args.amount.div(WAD).toNumber());
    if (!e.args.historic) {
      totalClaimedFromContract =
        totalClaimedFromContract + toBigInt(e.args.amount);
    }
  });

  const redirectRewardsPairs: Array<[string, string]> = [
    [
      "0xba12222222228d8ba445958a75a0704d566bf2c8",
      "0xc38c5f97b34e175ffd35407fc91a937300e33860",
    ],
  ];

  redirectRewardsPairs.forEach(([from, to]) => {
    const distributedFrom = distributed[from];

    if (distributedFrom) {
      const distributedTo = distributed[to] || 0n;

      distributed[to] = distributedFrom + distributedTo;
      delete distributed[from];
    }
    exportCsv.redirectRewards(from, to);
  });

  const distributorInfo = parseBalanceMap(
    mapToClaimed(distributed).filter(e => e.amount !== 0n),
  );

  const totalNeeded = BigInt(distributorInfo.tokenTotal);
  const diff = totalNeeded - totalClaimedFromContract - balance;

  console.log(
    `Total distributed: ${formatGear(
      totalNeeded,
    )}, diff with existing merkle ${formatGear(
      totalNeeded - toBigInt(prevMerkle.tokenTotal),
    )}`,
  );
  console.log(`Total claimed: ${formatGear(totalClaimedFromContract)}`);
  console.log(`Need to add: ${formatGear(diff)}`);
  console.log("\n");

  console.log(`Rewards contract should be fulfilled with ${formatGear(diff)}`);

  distributorInfo.toBlock = toBlock;

  const fname = `${network.toLowerCase()}_${distributorInfo.merkleRoot.replace(
    "0x",
    "",
  )}`;

  saveMerkle(network, distributorInfo);

  fs.writeFileSync(
    `./merkle/${fname}.csv`,
    `REWARDS COMPUTED TO BLOCK: ${toBlock}\n${exportCsv.getCSV()}`,
  );

  console.log(`Last merkle: ${distributorInfo.merkleRoot}`);
}

updatePoolRewards()
  .then(() => console.log("Ok"))
  .catch(e => console.log(e));
