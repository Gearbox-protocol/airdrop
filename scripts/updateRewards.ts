import {
  CREDIT_MANAGER_DAI_V2_GOERLI,
  CREDIT_MANAGER_DAI_V2_MAINNET,
  CREDIT_MANAGER_USDC_V2_GOERLI,
  CREDIT_MANAGER_USDC_V2_MAINNET,
  CREDIT_MANAGER_WBTC_V2_GOERLI,
  CREDIT_MANAGER_WBTC_V2_MAINNET,
  CREDIT_MANAGER_WETH_V2_GOERLI,
  CREDIT_MANAGER_WETH_V2_MAINNET,
  CREDIT_MANAGER_WSTETH_V2_GOERLI,
  CREDIT_MANAGER_WSTETH_V2_MAINNET,
  deployedContracts,
  detectNetwork,
  formatBN,
  SupportedToken,
  tokenDataByNetwork,
  WAD,
} from "@gearbox-protocol/sdk";
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";

import { campaigns } from "../campaigns";
import { CreditRewards, PoolRewards } from "../core";
import { CSVExport } from "../core/csv/csvExport";
import { parseBalanceMap } from "../core/merkle/parse-accounts";
import { RewardСampaigns } from "../core/rewards/airdrops";
import {
  IAddressProvider__factory,
  IAirdropDistributor__factory,
  IERC20__factory,
} from "../types";
import { mapToClaimed } from "./lib";

export async function updatePoolRewards() {
  const distributed: Record<string, BigNumber> = {};

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const network = await detectNetwork(deployer.provider!);

  dotenv.config({
    path: network === "Goerli" ? ".env.goerli" : ".env.mainnet",
  });

  const ADDRESS_PROVIDER = process.env.REACT_APP_ADDRESS_PROVIDER || "";
  const AIRDROP_DISTRIBUTOR = process.env.REACT_APP_AIRDROP_DISTRIBUTOR || "";

  if (ADDRESS_PROVIDER === "") {
    throw new Error("ADDRESS_PROVIDER token address unknown");
  }

  if (AIRDROP_DISTRIBUTOR === "") {
    throw new Error("AIRDROP_DISTRIBUTOR token address unknown");
  }

  console.log(`Address provider: ${ADDRESS_PROVIDER}`);
  console.log(`Reward distributor: ${AIRDROP_DISTRIBUTOR}`);

  const gearToken = IERC20__factory.connect(
    await IAddressProvider__factory.connect(
      ADDRESS_PROVIDER,
      deployer,
    ).getGearToken(),
    deployer,
  );

  const distributor = IAirdropDistributor__factory.connect(
    AIRDROP_DISTRIBUTOR,
    deployer,
  );

  const toBlock = await deployer.provider!.getBlockNumber();

  console.log(`To block: ${toBlock}`);

  const exportCsv = new CSVExport();

  for (const c of campaigns) {
    c.distributed.forEach(data => {
      const amount = BigNumber.from(10).pow(18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || BigNumber.from(0)).add(
        amount,
      );

      exportCsv.additem(account, RewardСampaigns[c.campaign], data.amount);
    });
    c.claimed.forEach(data => {
      const amount = BigNumber.from(10).pow(18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || BigNumber.from(0)).sub(
        amount,
      );
    });
  }

  const dieselTokens: Array<SupportedToken> = [
    "dDAI",
    "dUSDC",
    "dWETH",
    "dWBTC",
    "dwstETH",
  ];

  for (const dToken of dieselTokens) {
    console.log(`Computing pool rewards for ${dToken}`);
    try {
      const poolRewards = await PoolRewards.computeAllRewards(
        tokenDataByNetwork[network][dToken],
        deployer.provider!,
        network,
        toBlock,
      );
      poolRewards.forEach(reward => {
        distributed[reward.address] = (
          distributed[reward.address] || BigNumber.from(0)
        ).add(reward.amount);

        exportCsv.additem(
          reward.address,
          `Pool ${dToken}`,
          reward.amount.div(WAD).toNumber(),
        );
      });
    } catch (e) {
      console.error("Error:\n", e);
    }
  }

  const cms =
    network === "Mainnet"
      ? [
          CREDIT_MANAGER_DAI_V2_MAINNET,
          CREDIT_MANAGER_USDC_V2_MAINNET,
          CREDIT_MANAGER_WETH_V2_MAINNET,
          CREDIT_MANAGER_WSTETH_V2_MAINNET,
          CREDIT_MANAGER_WBTC_V2_MAINNET,
        ]
      : [
          CREDIT_MANAGER_DAI_V2_GOERLI,
          CREDIT_MANAGER_USDC_V2_GOERLI,
          CREDIT_MANAGER_WETH_V2_GOERLI,
          CREDIT_MANAGER_WSTETH_V2_GOERLI,
          CREDIT_MANAGER_WBTC_V2_GOERLI,
        ];

  for (const cm of cms) {
    console.log(
      `Computing credit manager rewards for ${deployedContracts[cm]}`,
    );
    const creditRewards = await CreditRewards.computeAllRewards(
      cm,
      deployer.provider!,
      toBlock,
    );

    creditRewards.forEach(reward => {
      distributed[reward.address] = (
        distributed[reward.address] || BigNumber.from(0)
      ).add(reward.amount);

      exportCsv.additem(
        reward.address,
        `CM ${deployedContracts[cm]}`,
        reward.amount.div(WAD).toNumber(),
      );
    });
  }

  const lastBlock = await deployer.provider!.getBlockNumber();

  const balance = await gearToken.balanceOf(AIRDROP_DISTRIBUTOR, {
    blockTag: lastBlock,
  });

  const claimed = await distributor.queryFilter(
    distributor.filters.Claimed(),
    0,
    lastBlock,
  );

  claimed.forEach(e =>
    exportCsv.addClaimed(e.args.account, e.args.amount.div(WAD).toNumber()),
  );

  const totalClaimed = claimed.reduce(
    (a, b) => a.add(b.args.amount),
    BigNumber.from(0),
  );

  const distributorInfo = parseBalanceMap(
    mapToClaimed(distributed).filter(e => !e.amount.isZero()),
  );

  const totalNeeded = BigNumber.from(distributorInfo.tokenTotal);
  const diff = totalNeeded.sub(totalClaimed).sub(balance);

  console.log(
    `Rewards contract should be fulfilled with ${formatBN(
      diff,
      18,
    )} ${diff.toString()}`,
  );

  distributorInfo.toBlock = toBlock;

  const fname = `${network.toLowerCase()}_${distributorInfo.merkleRoot.replace(
    "0x",
    "",
  )}`;
  fs.writeFileSync(`./merkle/${fname}.json`, JSON.stringify(distributorInfo));

  fs.writeFileSync(
    `./merkle/${fname}.csv`,
    `REWARDS COMPUTED TO BLOCK: ${toBlock}\n${exportCsv.getCSV()}`,
  );

  console.log(`Last merkle: ${distributorInfo.merkleRoot}`);
}

updatePoolRewards()
  .then(() => console.log("Ok"))
  .catch(e => console.log(e));
