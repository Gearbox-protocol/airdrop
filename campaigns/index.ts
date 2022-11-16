import { AirdropСampaigns } from "@gearbox-protocol/sdk";

import { creditAccountMiners } from "./01-ca-miners";
import { earlyCommunityMembers } from "./02-early-community-members";
import { earlyLiquidityProviders } from "./03-early-liquidity-providers";
import { earlyCreditAccountUsers } from "./04-early-credit-account-users";

export interface AirdropBalance {
  address: string;
  amount: number; // without decimals!
}

export interface Campaign {
  campaign: AirdropСampaigns;
  distributed: Array<AirdropBalance>;
  claimed: Array<AirdropBalance>;
}

export const campaigns = [
  creditAccountMiners,
  earlyCommunityMembers,
  earlyLiquidityProviders,
  earlyCreditAccountUsers,
];
