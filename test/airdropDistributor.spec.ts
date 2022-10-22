/*
 * SPDX-License-Identifier: BUSL-1.1
 * Gearbox. Generalized leverage protocol, which allows to take leverage and then use it across other DeFi protocols and platforms in a composable way.
 * (c) Gearbox.fi, 2021
 */

import { deploy, waitForTransaction } from "@gearbox-protocol/devops";
import { WAD } from "@gearbox-protocol/sdk";
import { expect } from "chai";
import "ethers";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { Suite } from "mocha";
import { Logger } from "tslog";
import {
  AirdropDistributorInfo,
  ClaimableBalance,
  parseBalanceMap,
} from "../merkle/parse-accounts";
import { deployDistributor } from "../scripts/deployer";
import {
  AirdropDistributor,
  AirdropDistributor__factory,
  ERC20Mock,
} from "../types";

const DUMB_ADDRESS = "0x5D4FF1249abf08F01AC57e1f5060BFfD55EC3692";
const DUMB_ADDRESS2 = "0x7BAFC0D5c5892f2041FD9F2415A7611042218e22";

describe("Airdrop distributor tests", function (this: Suite) {
  this.timeout(0);

  let airdropDistrubutor: AirdropDistributor;
  let info: AirdropDistributorInfo;
  let token: ERC20Mock;
  let log: Logger;

  beforeEach(async () => {
    log = new Logger();

    token = await deploy<ERC20Mock>(
      "ERC20Mock",
      log,
      "Distributed token",
      "DIS",
      18
    );

    const recipients: Array<ClaimableBalance> = [
      { address: DUMB_ADDRESS, amount: BigNumber.from(1000).mul(WAD) },
      { address: DUMB_ADDRESS2, amount: BigNumber.from(2000).mul(WAD) },
    ];

    [airdropDistrubutor, info] = await deployDistributor(
      token.address,
      recipients,
      log
    );

    await waitForTransaction(
      token.mint(airdropDistrubutor.address, WAD.mul(3000))
    );
  });

  it(`[AD-1]: constructor sets correct parameters`, async () => {
    expect(await airdropDistrubutor.merkleRoot()).to.be.eq(info.merkleRoot);

    expect(await airdropDistrubutor.token()).to.be.eq(token.address);
  });

  it(`[AD-2]: claim works correctly`, async () => {
    const nodeInfo = info.claims[DUMB_ADDRESS];

    const tx = await waitForTransaction(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1000),
        WAD.mul(500),
        nodeInfo.proof
      )
    );

    const event = AirdropDistributor__factory.createInterface().decodeEventLog(
      "Claimed",
      tx.logs[1].data,
      tx.logs[1].topics
    );

    expect(event.index).to.be.eq(nodeInfo.index);
    expect(event.account).to.be.eq(DUMB_ADDRESS);
    expect(event.amount).to.be.eq(WAD.mul(500));

    expect(await token.balanceOf(DUMB_ADDRESS)).to.be.eq(WAD.mul(500));

    expect(await airdropDistrubutor.claimed(DUMB_ADDRESS)).to.be.eq(
      WAD.mul(500)
    );
  });

  it(`[AD-3]: successive claims work correctly`, async () => {
    const nodeInfo = info.claims[DUMB_ADDRESS];

    await waitForTransaction(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1000),
        WAD.mul(500),
        nodeInfo.proof
      )
    );
    await waitForTransaction(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1000),
        WAD.mul(250),
        nodeInfo.proof
      )
    );

    expect(await token.balanceOf(DUMB_ADDRESS)).to.be.eq(WAD.mul(750));

    expect(await airdropDistrubutor.claimed(DUMB_ADDRESS)).to.be.eq(
      WAD.mul(750)
    );
  });

  it(`[AD-4]: claim reverts on incorrect proof`, async () => {
    const nodeInfo = info.claims[DUMB_ADDRESS];

    expect(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1001),
        WAD.mul(500),
        nodeInfo.proof
      )
    ).to.be.revertedWith("MerkleDistributor: Invalid proof.");
  });

  it(`[AD-5]: claim reverts on attempting to claim more than total amount`, async () => {
    const nodeInfo = info.claims[DUMB_ADDRESS];

    expect(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1000),
        WAD.mul(1001),
        nodeInfo.proof
      )
    ).to.be.revertedWith(
      "MerkleDistributor: Total claimed amount is more than total rewards"
    );
  });

  it(`[AD-6]: updateMerkleRoot works correctly`, async () => {
    const recipients: Array<ClaimableBalance> = [
      { address: DUMB_ADDRESS, amount: BigNumber.from(1500).mul(WAD) },
      { address: DUMB_ADDRESS2, amount: BigNumber.from(2000).mul(WAD) },
    ];

    const newInfo = parseBalanceMap(recipients);

    const tx = await waitForTransaction(
      airdropDistrubutor.updateMerkleRoot(newInfo.merkleRoot)
    );

    const event = AirdropDistributor__factory.createInterface().decodeEventLog(
      "RootUpdated",
      tx.logs[0].data,
      tx.logs[0].topics
    );

    expect(event.oldRoot).to.be.eq(info.merkleRoot);
    expect(event.newRoot).to.be.eq(newInfo.merkleRoot);

    expect(await airdropDistrubutor.merkleRoot()).to.be.eq(newInfo.merkleRoot);
  });

  it(`[AD-7]: subsequent claims work correctly after root update`, async () => {
    let nodeInfo = info.claims[DUMB_ADDRESS];

    await waitForTransaction(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1000),
        WAD.mul(500),
        nodeInfo.proof
      )
    );

    const recipients: Array<ClaimableBalance> = [
      { address: DUMB_ADDRESS, amount: BigNumber.from(1500).mul(WAD) },
      { address: DUMB_ADDRESS2, amount: BigNumber.from(2000).mul(WAD) },
    ];

    const newInfo = parseBalanceMap(recipients);

    await waitForTransaction(
      airdropDistrubutor.updateMerkleRoot(newInfo.merkleRoot)
    );

    nodeInfo = newInfo.claims[DUMB_ADDRESS];

    await waitForTransaction(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1500),
        WAD.mul(700),
        nodeInfo.proof
      )
    );

    expect(await token.balanceOf(DUMB_ADDRESS)).to.be.eq(WAD.mul(1200));

    expect(await airdropDistrubutor.claimed(DUMB_ADDRESS)).to.be.eq(
      WAD.mul(1200)
    );

    expect(
      airdropDistrubutor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD.mul(1500),
        WAD.mul(700),
        nodeInfo.proof
      )
    ).to.be.revertedWith(
      "MerkleDistributor: Total claimed amount is more than total rewards"
    );
  });

  it(`[AD-8]: emitDistributionEvents correctly emits events`, async () => {
    const distrData = [
      {
        account: DUMB_ADDRESS,
        campaignId: 0,
        amount: WAD.mul(1000),
      },
      {
        account: DUMB_ADDRESS2,
        campaignId: 1,
        amount: WAD.mul(2000),
      },
    ];

    const tx = await waitForTransaction(
      airdropDistrubutor.emitDistributionEvents(distrData)
    );

    distrData.forEach((d, idx) => {
      let event = AirdropDistributor__factory.createInterface().decodeEventLog(
        "TokenAllocated",
        tx.logs[idx].data,
        tx.logs[idx].topics
      );

      expect(event.account).to.be.eq(d.account);
      expect(event.campaignId).to.be.eq(d.campaignId);
      expect(event.amount).to.be.eq(d.amount);
    });
  });

  it(`[AD-9]: updateMerkleRoot and emitDistributionEvents revert on called by non-owner`, async () => {
    const accounts = await ethers.getSigners();

    const airdropDistributorDumb = airdropDistrubutor.connect(accounts[1]);

    expect(
      airdropDistributorDumb.updateMerkleRoot(info.merkleRoot)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    expect(
      airdropDistributorDumb.emitDistributionEvents([])
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
