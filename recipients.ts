import { ClaimableBalance } from "./merkle/parse-accounts";
import { BigNumber } from "ethers";
import { WAD } from "@gearbox-protocol/sdk";

export const recipients: Array<ClaimableBalance> = [
  { address: "0x5D4FF1249abf08F01AC57e1f5060BFfD55EC3692", amount: BigNumber.from(1000).mul(WAD)},
  { address: "0x7BAFC0D5c5892f2041FD9F2415A7611042218e22", amount: BigNumber.from(2000).mul(WAD)}
]