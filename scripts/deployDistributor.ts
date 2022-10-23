import {
  detectNetwork,
  Verifier,
  waitForTransaction,
} from "@gearbox-protocol/devops";
import { getNetworkType } from "@gearbox-protocol/sdk";
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import { Logger } from "tslog";
import { campaigns } from "../airdrops";
import { ClaimableBalance } from "../merkle/parse-accounts";
import { DistributionDataStruct } from "../types/contracts/AirdropDistributor";
import { deployDistributor } from "./deployer";

interface InitialClaim {
  distributed: Array<ClaimableBalance>;
  claimed: Array<ClaimableBalance>;
  events: Array<DistributionDataStruct>;
}

export const mapToClaimed = (map: Record<string, BigNumber>) =>
  Object.entries(map).map(([address, amount]) => ({
    address,
    amount,
  }));

export function getInitialSetup(): InitialClaim {
  const distributed: Record<string, BigNumber> = {};
  const claimed: Record<string, BigNumber> = {};
  const events: Array<DistributionDataStruct> = [];

  for (const c of campaigns) {
    c.distributed.forEach((data) => {
      const amount = BigNumber.from(1e18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = distributed[account].add(amount);
      events.push({
        account,
        campaignId: c.campaign,
        amount,
      });
    });

    c.claimed.forEach((data) => {
      const amount = BigNumber.from(1e18).mul(data.amount);
      const account = data.address.toLowerCase();

      claimed[account] = claimed[account].add(amount);
    });
  }

  const result: InitialClaim = {
    distributed: mapToClaimed(distributed),
    claimed: mapToClaimed(claimed),
    events,
  };

  return result;
}

async function deployDistributorLive() {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const chainId = await deployer.getChainId();

  const networkType =
    chainId === 1337 ? await detectNetwork() : getNetworkType(chainId);

  if (networkType == "Goerli") {
    dotenv.config({ path: ".env.goerli" });
  } else if (networkType == "Mainnet") {
    dotenv.config({ path: ".env.mainnet" });
  }

  const GEAR_TOKEN = process.env.REACT_APP_GEAR_TOKEN || "";

  if (GEAR_TOKEN === "") {
    throw new Error("GEAR token address unknown");
  }

  const log = new Logger();
  const verifier = new Verifier();

  dotenv.config();

  const { distributed, claimed, events } = getInitialSetup();

  const [airdropDistributor, merkle] = await deployDistributor(
    GEAR_TOKEN,
    distributed,
    claimed,
    log
  );

  verifier.addContract({
    address: airdropDistributor.address,
    constructorArguments: [GEAR_TOKEN, merkle.merkleRoot],
  });

  await waitForTransaction(airdropDistributor.emitDistributionEvents(events));

  fs.writeFileSync("./merkle.json", JSON.stringify(merkle));
}

deployDistributorLive()
  .then(() => console.log("Ok"))
  .catch((e) => console.log(e));
