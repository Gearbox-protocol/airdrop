import * as dotenv from "dotenv";
import * as fs from "fs";
import {
  AirdropDistributorInfo,
  ClaimableBalance,
  parseBalanceMap,
} from "../merkle/parse-accounts";
import { recipients } from "../recipients";
import { Logger } from "tslog";
import { AirdropDistributor } from "../types";
import { Verifier, deploy, waitForTransaction, detectNetwork } from "@gearbox-protocol/devops";
import { ethers } from "hardhat";
import { JsonRpcProvider } from "@ethersproject/providers";
import { getNetworkType } from "@gearbox-protocol/sdk";

export async function deployDistributor(tokenAddress: string, initialBalances: ClaimableBalance[], log: Logger): Promise<[AirdropDistributor, AirdropDistributorInfo]> {
  log.info("Generating tree");
  const distributorInfo = parseBalanceMap(initialBalances);

  log.info("Deploying distributor");

  const airdropDistributor = await deploy<AirdropDistributor>(
    "AirdropDistributor",
    log,
    tokenAddress,
    distributorInfo.merkleRoot
  );

  return [airdropDistributor, distributorInfo]
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

  const provider = new JsonRpcProvider(process.env.ETH_MAINNET_PROVIDER);
  dotenv.config();

  const [airdropDistributor, merkle] = await deployDistributor(GEAR_TOKEN, recipients, log)

  verifier.addContract({
    address: airdropDistributor.address,
    constructorArguments: [GEAR_TOKEN, merkle.merkleRoot],
  });

  fs.writeFileSync("./merkle.json", JSON.stringify(merkle));
}

deployDistributorLive()
  .then(() => console.log("Ok"))
  .catch((e) => console.log(e));
