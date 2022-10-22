import { AirdropСampaigns } from "@gearbox-protocol/sdk";
import { ClaimableBalance } from "../merkle/parse-accounts";
import { creditAccountMiners } from "./01 - ca-miners";

export interface AirdropBalance {
  address: string;
  amount: number; // without decimals!
}

export interface Campaign {
  campaign: AirdropСampaigns;
  distributed: Array<AirdropBalance>;
  claimed: Array<AirdropBalance>;
}

export const campaigns = [creditAccountMiners];
