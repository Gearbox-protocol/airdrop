import { deploy, Verifier } from "@gearbox-protocol/devops";
import { Overrides } from "ethers";
import { Logger } from "tslog";
import {
  AirdropDistributorInfo,
  ClaimableBalance,
  parseBalanceMap,
} from "../core/merkle/parse-accounts";
import { AirdropDistributor } from "../types";

export async function deployDistributor(
  apAddress: string,
  distributed: ClaimableBalance[],
  claimed: ClaimableBalance[],
  log: Logger,
  fee?: Overrides
): Promise<[AirdropDistributor, AirdropDistributorInfo]> {
  log.info("Generating tree");
  const distributorInfo = parseBalanceMap(distributed);
  const verifier = new Verifier();
  log.info("Deploying distributor");

  const constructorArguments = [
    apAddress,
    distributorInfo.merkleRoot,
    claimed.map((c) => ({
      account: c.address,
      amount: c.amount,
    })),
  ];

  const airdropDistributor = await deploy<AirdropDistributor>(
    "AirdropDistributor",
    log,
    ...constructorArguments,
    fee
  );

  verifier.addContract({
    address: airdropDistributor.address,
    constructorArguments,
  });

  return [airdropDistributor, distributorInfo];
}
