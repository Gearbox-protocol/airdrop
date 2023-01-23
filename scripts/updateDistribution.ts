import { detectNetwork, waitForTransaction } from "@gearbox-protocol/devops";
import { getNetworkType } from "@gearbox-protocol/sdk";
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { Logger } from "tslog";

import { earlyGearLPs } from "../campaigns/06-early-gear-lps";
import { AirdropDistributor__factory } from "../types";
import { DistributionDataStruct } from "../types/contracts/AirdropDistributor";

const campaign = earlyGearLPs;

const fee = {
  maxFeePerGas: BigNumber.from(233e9),
  maxPriorityFeePerGas: BigNumber.from(5e9),
};

function cutIntoChuncks<T>(
  array: Array<T>,
  chunkSize: number,
): Array<Array<T>> {
  const result: Array<Array<T>> = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

async function updateDistributor() {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  console.log(`Deployer: ${deployer.address}`);

  const chainId = await deployer.getChainId();

  const network =
    chainId === 1337 ? await detectNetwork() : getNetworkType(chainId);

  dotenv.config({
    path: network === "Goerli" ? ".env.goerli" : ".env.mainnet",
  });

  const AIRDROP_DISTRIBUTOR = process.env.REACT_APP_AIRDROP_DISTRIBUTOR || "";

  console.log(`Airdrop distributor: ${AIRDROP_DISTRIBUTOR}`);

  if (AIRDROP_DISTRIBUTOR === "") {
    throw new Error("ADDRESS_PROVIDER token address unknown");
  }

  const log = new Logger();

  dotenv.config();

  const events: Array<DistributionDataStruct> = [];

  campaign.distributed.forEach(data => {
    const amount = BigNumber.from(10).pow(18).mul(data.amount);
    const account = data.address.toLowerCase();

    events.push({
      account,
      campaignId: campaign.campaign,
      amount,
    });
  });

  const airdropDistributor = AirdropDistributor__factory.connect(
    AIRDROP_DISTRIBUTOR,
    deployer,
  );

  const eventsChunks = cutIntoChuncks(events, 1000);
  let i = 1;
  for (const chunk of eventsChunks) {
    log.debug(`Adding distributed events ${i} of ${eventsChunks.length}`);

    const receipt = await waitForTransaction(
      airdropDistributor.emitDistributionEvents(chunk, fee),
    );
    log.debug(`Gas used: ${receipt.gasUsed}`);
    i++;
  }
}

updateDistributor()
  .then(() => console.log("Ok"))
  .catch(e => console.log(e));
