/*
 * SPDX-License-Identifier: BUSL-1.1
 * Gearbox. Generalized leverage protocol, which allows to take leverage and then use it across other DeFi protocols and platforms in a composable way.
 * (c) Gearbox.fi, 2021
 */

import { deploy, waitForTransaction } from "@gearbox-protocol/devops";
import { toBigInt, WAD } from "@gearbox-protocol/sdk";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Suite } from "mocha";
import { Logger } from "tslog";

import {
  ClaimableBalance,
  parseBalanceMap,
  RewardsDistributorInfo,
} from "../core/merkle/parse-accounts";
import { deployDistributor } from "../scripts/deployer";
import {
  AirdropDistributor,
  AirdropDistributor__factory,
  ERC20Mock,
} from "../types";
import { AddressProviderMock } from "../types/contracts/test/AddressProviderMock";

const DUMB_ADDRESS = "0x5D4FF1249abf08F01AC57e1f5060BFfD55EC3692";
const DUMB_ADDRESS2 = "0x7BAFC0D5c5892f2041FD9F2415A7611042218e22";

describe("Airdrop distributor tests", function (this: Suite) {
  this.timeout(0);

  let deployer: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user: SignerWithAddress;

  let airdropDistributor: AirdropDistributor;
  let info: RewardsDistributorInfo;
  let token: ERC20Mock;
  let log: Logger;

  let claimed: Array<ClaimableBalance>;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();

    deployer = accounts[0];
    treasury = accounts[1];
    user = accounts[2];

    log = new Logger();

    token = await deploy<ERC20Mock>(
      "ERC20Mock",
      log,
      "Distributed token",
      "DIS",
      18,
    );

    let addressProviderMock = await deploy<AddressProviderMock>(
      "AddressProviderMock",
      log,
      token.address,
      treasury.address,
    );

    const distributed: Array<ClaimableBalance> = [
      { address: DUMB_ADDRESS, amount: WAD * 1500n },
      { address: DUMB_ADDRESS2, amount: WAD * 2000n },
    ];

    claimed = [
      { address: DUMB_ADDRESS, amount: WAD * 500n },
      { address: DUMB_ADDRESS2, amount: WAD * 200n },
    ];

    [airdropDistributor, info] = await deployDistributor(
      addressProviderMock.address,
      distributed,
      claimed,
      log,
      {},
    );

    await waitForTransaction(
      token.mint(airdropDistributor.address, WAD * 3500n),
    );
  });

  it(`[AD-1]: constructor sets correct parameters`, async () => {
    expect(await airdropDistributor.merkleRoot()).to.be.eq(info.merkleRoot);

    expect(await airdropDistributor.token()).to.be.eq(token.address);
  });

  it(`[AD-1A]: constructor emits Claimed events`, async () => {
    const tx = await deployer.provider?.getTransactionReceipt(
      airdropDistributor.deployTransaction.hash,
    );

    if (!tx) {
      throw "Deploy tx receipt undefined";
    }

    tx.logs.slice(1).forEach((e, index) => {
      const event =
        AirdropDistributor__factory.createInterface().decodeEventLog(
          "Claimed",
          e.data,
          e.topics,
        );

      expect(event.account).to.be.eq(claimed[index].address);
      expect(event.amount).to.be.eq(claimed[index].amount);
    });
  });

  it(`[AD-2]: claim works correctly`, async () => {
    const nodeInfo = info.claims[DUMB_ADDRESS];

    const tx = await waitForTransaction(
      airdropDistributor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD * 1500n,
        nodeInfo.proof,
      ),
    );

    const event = AirdropDistributor__factory.createInterface().decodeEventLog(
      "Claimed",
      tx.logs[1].data,
      tx.logs[1].topics,
    );

    expect(event.account).to.be.eq(DUMB_ADDRESS);
    expect(toBigInt(event.amount)).to.be.eq(WAD * 1500n);

    expect(toBigInt(await token.balanceOf(DUMB_ADDRESS))).to.be.eq(WAD * 1500n);

    expect(toBigInt(await airdropDistributor.claimed(DUMB_ADDRESS))).to.be.eq(
      WAD * 1500n,
    );
  });

  it(`[AD-4]: claim reverts on incorrect proof`, async () => {
    const nodeInfo = info.claims[DUMB_ADDRESS];

    await expect(
      airdropDistributor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD * 1001n,
        nodeInfo.proof,
      ),
    ).to.be.revertedWith("MerkleDistributor: Invalid proof.");
  });

  it(`[AD-5]: claim reverts on attempting to claim zero`, async () => {
    const nodeInfo = info.claims[DUMB_ADDRESS];

    await airdropDistributor.claim(
      nodeInfo.index,
      DUMB_ADDRESS,
      WAD * 1500n,
      nodeInfo.proof,
    );

    await expect(
      airdropDistributor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD * 1500n,
        nodeInfo.proof,
      ),
    ).to.be.revertedWith("MerkleDistributor: Nothing to claim");
  });

  it(`[AD-6]: updateMerkleRoot works correctly`, async () => {
    const recipients: Array<ClaimableBalance> = [
      { address: DUMB_ADDRESS, amount: 2000n * WAD },
      { address: DUMB_ADDRESS2, amount: 2000n * WAD },
    ];

    const newInfo = parseBalanceMap(recipients);

    const tx = await waitForTransaction(
      airdropDistributor.connect(treasury).updateMerkleRoot(newInfo.merkleRoot),
    );

    const event = AirdropDistributor__factory.createInterface().decodeEventLog(
      "RootUpdated",
      tx.logs[0].data,
      tx.logs[0].topics,
    );

    expect(event.oldRoot).to.be.eq(info.merkleRoot);
    expect(event.newRoot).to.be.eq(newInfo.merkleRoot);

    expect(await airdropDistributor.merkleRoot()).to.be.eq(newInfo.merkleRoot);
  });

  it(`[AD-7]: subsequent claims work correctly after root update`, async () => {
    let nodeInfo = info.claims[DUMB_ADDRESS];

    await waitForTransaction(
      airdropDistributor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD * 1500n,
        nodeInfo.proof,
      ),
    );

    const recipients: Array<ClaimableBalance> = [
      { address: DUMB_ADDRESS, amount: 2000n * WAD },
      { address: DUMB_ADDRESS2, amount: 2000n * WAD },
    ];

    const newInfo = parseBalanceMap(recipients);

    await waitForTransaction(
      airdropDistributor.connect(treasury).updateMerkleRoot(newInfo.merkleRoot),
    );

    nodeInfo = newInfo.claims[DUMB_ADDRESS];

    await waitForTransaction(
      airdropDistributor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD * 2000n,
        nodeInfo.proof,
      ),
    );

    expect(await token.balanceOf(DUMB_ADDRESS)).to.be.eq(WAD * 2000n);

    expect(await airdropDistributor.claimed(DUMB_ADDRESS)).to.be.eq(
      WAD * 2000n,
    );

    await expect(
      airdropDistributor.claim(
        nodeInfo.index,
        DUMB_ADDRESS,
        WAD * 2000n,
        nodeInfo.proof,
      ),
    ).to.be.revertedWith("MerkleDistributor: Nothing to claim");
  });

  it(`[AD-8]: emitDistributionEvents correctly emits events`, async () => {
    const distrData = [
      {
        account: DUMB_ADDRESS,
        campaignId: 0,
        amount: WAD * 1000n,
      },
      {
        account: DUMB_ADDRESS2,
        campaignId: 1,
        amount: WAD * 2000n,
      },
    ];

    const tx = await waitForTransaction(
      airdropDistributor.emitDistributionEvents(distrData),
    );

    distrData.forEach((d, idx) => {
      let event = AirdropDistributor__factory.createInterface().decodeEventLog(
        "TokenAllocated",
        tx.logs[idx].data,
        tx.logs[idx].topics,
      );

      expect(event.account).to.be.eq(d.account);
      expect(event.campaignId).to.be.eq(d.campaignId);
      expect(event.amount).to.be.eq(d.amount);
    });
  });

  it(`[AD-9]: updateMerkleRoot and emitDistributionEvents revert on called by address with no access`, async () => {
    await expect(
      airdropDistributor.connect(user).updateMerkleRoot(info.merkleRoot),
    ).to.be.revertedWith("TreasuryOnlyException()");

    await expect(
      airdropDistributor.connect(user).emitDistributionEvents([]),
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      airdropDistributor.connect(deployer).updateMerkleRoot(info.merkleRoot),
    ).to.be.revertedWith("TreasuryOnlyException()");
  });
});
