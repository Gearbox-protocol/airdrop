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
  detectNetwork,
  WAD,
} from "@gearbox-protocol/sdk";
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";

import { CreditRewards } from "../core";
import { computeCampaigns } from "../core/compute/campaign";
import { computeCreditManagers } from "../core/compute/creditManager";
import { computePools } from "../core/compute/pool";
import { CSVExport } from "../core/csv/csvExport";
import { parseBalanceMap } from "../core/merkle/parse-accounts";
import { formatGear } from "../core/utils/formatter";
import { loadPrevMerkle } from "../core/utils/prevMerkle";
import {
  IAddressProvider__factory,
  IAirdropDistributor__factory,
  IERC20__factory,
} from "../types";
import { mapToClaimed } from "./lib";

export async function updatePoolRewards() {
  const distributed: Record<string, BigNumber> = {};

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

  const toBlock = 16175801; // await deployer.provider!.getBlockNumber();

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

  const balance = await gearToken.balanceOf(AIRDROP_DISTRIBUTOR, {
    blockTag: lastBlock,
  });

  const claimed = await distributor.queryFilter(
    distributor.filters.Claimed(),
    0,
    lastBlock,
  );

  let totalClaimedFromContract = BigNumber.from(0);

  claimed.forEach(e => {
    exportCsv.addClaimed(e.args.account, e.args.amount.div(WAD).toNumber());
    if (!e.args.historic) {
      totalClaimedFromContract = totalClaimedFromContract.add(e.args.amount);
    }
  });

  const distributorInfo = parseBalanceMap(
    mapToClaimed(distributed).filter(e => !e.amount.isZero()),
  );

  const totalNeeded = BigNumber.from(distributorInfo.tokenTotal);
  const diff = totalNeeded.sub(totalClaimedFromContract).sub(balance);

  console.log(
    `Total distributed: ${formatGear(
      totalNeeded,
    )}, diff with existing merkle ${formatGear(
      totalNeeded.sub(prevMerkle.tokenTotal),
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
  fs.writeFileSync(`./merkle/${fname}.json`, JSON.stringify(distributorInfo));

  fs.writeFileSync(
    `./merkle/${fname}.csv`,
    `REWARDS COMPUTED TO BLOCK: ${toBlock}\n${exportCsv.getCSV()}`,
  );

  console.log(`Last merkle: ${distributorInfo.merkleRoot}`);
}

updatePoolRewards()
  .then(() => console.log("Ok"))
  .catch(e => console.log(e));
