import { waitForTransaction } from "@gearbox-protocol/devops";
import { ethers } from "hardhat";
import merkleData from "../merkle.json";
import { AirdropDistributor__factory } from "../types";
import { AirdropDistributorInfo } from "../merkle/parse-accounts";
import { BigNumberish } from "ethers";

async function claim(distributorAddress: string, account: string, claimedAmount: BigNumberish) {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const airdropDistributor = AirdropDistributor__factory.connect(
    distributorAddress,
    deployer
  );

  const claimData = (merkleData as AirdropDistributorInfo).claims[account];

  await waitForTransaction(
    airdropDistributor.claim(
      claimData.index,
      account,
      claimData.amount,
      claimedAmount,
      claimData.proof
    )
  );
}
