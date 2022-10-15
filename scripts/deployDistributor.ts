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
import { Verifier, deploy, waitForTransaction } from "@gearbox-protocol/devops";
import { ethers } from "hardhat";
import { JsonRpcProvider } from "@ethersproject/providers";

async function deployDistributor() {
  dotenv.config({ path: ".env.goerli" });

  const GEAR_TOKEN = process.env.REACT_APP_GEAR_TOKEN || "";

  if (GEAR_TOKEN === "") {
    throw new Error("Address provider is not set");
  }

  const log = new Logger();
  const verifier = new Verifier();
  log.info("generate merkle trees");

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const provider = new JsonRpcProvider(process.env.ETH_MAINNET_PROVIDER);
  dotenv.config();

  const recipientsAddr: Array<ClaimableBalance> = [];
  for (const r of recipients) {
    const address = await provider.resolveName(r.address);
    if (address) {
      recipientsAddr.push({
        address,
        amount: r.amount,
      });
    }
  }

  const merkle = parseBalanceMap(recipientsAddr);

  const airdropDistributor = await deploy<AirdropDistributor>(
    "AirdropDistributor",
    log,
    GEAR_TOKEN,
    merkle.merkleRoot
  );

  verifier.addContract({
    address: airdropDistributor.address,
    constructorArguments: [GEAR_TOKEN, merkle.merkleRoot],
  });

  fs.writeFileSync("./merkle.json", JSON.stringify(merkle));
}

deployDistributor()
  .then(() => console.log("Ok"))
  .catch((e) => console.log(e));
