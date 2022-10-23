import * as fs from "fs";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { AirdropBalance } from "../airdrops";
import merkle from "./old/merkle_community.json";
import { IMerkleDistributor__factory } from "../types/factories/contracts/old";

const AIRDROP_CONTRACT = "0xADC72D5c034c189f5c0b03C7bAc21Ac50B9D01F1";

async function getData() {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const distributed: Array<AirdropBalance> = [];
  const claimed: Array<AirdropBalance> = [];

  const chainId = await deployer.getChainId();

  if (chainId !== 1) throw new Error("Incorrent chain, should be mainnet");

  let totalDistributed = 0;
  for (const address of Object.keys(merkle.claims)) {
    const amount = BigNumber.from(merkle.claims[address].amount)
      .div(BigNumber.from(10).pow(18))
      .toNumber();
    distributed.push({
      address,
      amount,
    });

    totalDistributed += amount;
  }

  const md = IMerkleDistributor__factory.connect(AIRDROP_CONTRACT, deployer);
  const query = await md.queryFilter(md.filters.Claimed());

  let totalClaimed = 0;
  query.forEach((q) => {
    const amount = BigNumber.from(q.args.amount)
      .div(BigNumber.from(10).pow(18))
      .toNumber();
    claimed.push({
      address: q.args.account,
      amount,
    });

    totalClaimed += amount;
  });

  console.log(`Total distributed: ${totalDistributed}`);
  console.log(`Total claimed: ${totalClaimed}`);
  console.log(`Diff: ${totalDistributed - totalClaimed}`);

  fs.writeFileSync(
    "./community.json",
    JSON.stringify({
      distributed,
      claimed,
    })
  );
}

getData()
  .then(() => console.log("Ok"))
  .catch((e) => console.log(e));
