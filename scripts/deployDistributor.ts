import { detectNetwork, waitForTransaction } from "@gearbox-protocol/devops";
import { getNetworkType } from "@gearbox-protocol/sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { ethers } from "hardhat";
import { Logger } from "tslog";

import { campaigns } from "../campaigns";
import { ClaimableBalance } from "../core/merkle/parse-accounts";
import { DistributionDataStruct } from "../types/contracts/AirdropDistributor";
import { deployDistributor } from "./deployer";
import { mapToClaimed } from "./lib";

interface InitialClaim {
  distributed: Array<ClaimableBalance>;
  claimed: Array<ClaimableBalance>;
  events: Array<DistributionDataStruct>;
}

const fee = {
  maxFeePerGas: BigInt(233e9),
  maxPriorityFeePerGas: BigInt(23e9),
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

export function getInitialSetup(): InitialClaim {
  const distributed: Record<string, bigint> = {};
  const claimed: Record<string, bigint> = {};
  const events: Array<DistributionDataStruct> = [];

  for (const c of campaigns) {
    c.distributed.forEach(data => {
      const amount = 10n ** 18n * BigInt(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || 0n) + amount;
      events.push({
        account,
        campaignId: c.campaign,
        amount,
      });
    });

    c.claimed.forEach(data => {
      const amount = 10n ** 18n * BigInt(data.amount);
      const account = data.address.toLowerCase();

      claimed[account] = (claimed[account] || 0n) + amount;
      distributed[account] = (distributed[account] || 0n) - amount;
    });
  }

  const result: InitialClaim = {
    distributed: mapToClaimed(distributed).filter(e => e.amount !== 0n),
    claimed: mapToClaimed(claimed),
    events,
  };

  return result;
}

async function deployDistributorLive() {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  console.log(`Deployer: ${deployer.address}`);

  const chainId = await deployer.getChainId();

  const network =
    chainId === 1337 ? await detectNetwork() : getNetworkType(chainId);

  dotenv.config({
    path: network === "Goerli" ? ".env.goerli" : ".env.mainnet",
  });

  const ADDRESS_PROVIDER = process.env.REACT_APP_ADDRESS_PROVIDER || "";

  console.log(`Address provider: ${ADDRESS_PROVIDER}`);

  if (ADDRESS_PROVIDER === "") {
    throw new Error("ADDRESS_PROVIDER token address unknown");
  }

  const log = new Logger();

  dotenv.config();

  const { distributed, claimed, events } = getInitialSetup();

  const claimedChunks = cutIntoChuncks(claimed, 1500);

  const [airdropDistributor, distributorInfo] = await deployDistributor(
    ADDRESS_PROVIDER,
    distributed,
    claimedChunks[0],
    log,
    fee,
  );

  for (let i = 1; i < claimedChunks.length; i++) {
    log.debug(`Adding claimed events ${i} of ${claimedChunks.length}`);
    const receipt = await waitForTransaction(
      airdropDistributor.updateHistoricClaims(
        claimedChunks[i].map(c => ({
          account: c.address,
          amount: c.amount,
        })),
        fee,
      ),
    );

    log.debug(`Gas used: ${receipt.gasUsed}`);
  }

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

  fs.writeFileSync(
    `./merkle/${network.toLowerCase()}_${distributorInfo.merkleRoot.replace(
      "0x",
      "",
    )}.json`,
    JSON.stringify(distributorInfo),
  );
}

deployDistributorLive()
  .then(() => console.log("Ok"))
  .catch(e => console.log(e));
