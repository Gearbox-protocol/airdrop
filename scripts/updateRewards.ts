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
  CreditRewards,
  detectNetwork,
  formatBN,
  PoolRewards,
  SupportedToken,
  tokenDataByNetwork,
} from "@gearbox-protocol/sdk";
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";

import { campaigns } from "../campaigns";
import { parseBalanceMap } from "../core/merkle/parse-accounts";
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
  console.log(`Airdrop distributor: ${AIRDROP_DISTRIBUTOR}`);

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

  for (const c of campaigns) {
    c.distributed.forEach(data => {
      const amount = BigNumber.from(10).pow(18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || BigNumber.from(0)).add(
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
      });
    } catch (e) {
      console.log("fff", e);
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
    const creditRewards = await CreditRewards.computeAllRewards(
      cm,
      deployer.provider!,
    );
    creditRewards.forEach(reward => {
      distributed[reward.address] = (
        distributed[reward.address] || BigNumber.from(0)
      ).add(reward.amount);
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
    `Airdrop contract should be fulfilled with ${formatBN(
      diff,
      18,
    )} ${diff.toString()}`,
  );

  fs.writeFileSync(
    `./merkle/${network.toLowerCase()}_${distributorInfo.merkleRoot.replace(
      "0x",
      "",
    )}.json`,
    JSON.stringify(distributorInfo),
  );

  console.log(`Last merkle: ${distributorInfo.merkleRoot}`);
}

updatePoolRewards()
  .then(() => console.log("Ok"))
  .catch(e => console.log(e));
