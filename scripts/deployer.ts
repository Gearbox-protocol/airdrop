import { deploy } from "@gearbox-protocol/devops";
import { Logger } from "tslog";
import {
  AirdropDistributorInfo,
  ClaimableBalance,
  parseBalanceMap,
} from "../merkle/parse-accounts";
import { AirdropDistributor } from "../types";

export async function deployDistributor(
  apAddress: string,
  distributed: ClaimableBalance[],
  claimed: ClaimableBalance[],
  log: Logger
): Promise<[AirdropDistributor, AirdropDistributorInfo]> {
  log.info("Generating tree");
  const distributorInfo = parseBalanceMap(distributed);

  log.info("Deploying distributor");

  const airdropDistributor = await deploy<AirdropDistributor>(
    "AirdropDistributor",
    log,
    apAddress,
    distributorInfo.merkleRoot,
    claimed.map(c => { 
      return {
        account: c.address,
        amount: c.amount
      }
    })
  );

  return [airdropDistributor, distributorInfo];
}
