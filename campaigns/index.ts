import { RewardСampaigns } from "../core/rewards/airdrops";
import { creditAccountMiners } from "./01-ca-miners";
import { earlyCommunityMembers } from "./02-early-community-members";
import { earlyLiquidityProviders } from "./03-early-liquidity-providers";
import { earlyCreditAccountUsers } from "./04-early-credit-account-users";
import { ciderParticipants } from "./05-cider-participants";
import { earlyGearLPs } from "./06-early-gear-lps";

export interface AirdropBalance {
  address: string;
  amount: number; // without decimals!
}

export interface Campaign {
  campaign: RewardСampaigns;
  distributed: Array<AirdropBalance>;
  claimed: Array<AirdropBalance>;
}

export const campaigns = [
  creditAccountMiners,
  earlyCommunityMembers,
  earlyLiquidityProviders,
  earlyCreditAccountUsers,
  ciderParticipants,
  earlyGearLPs,
];
