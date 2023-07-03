import { BigNumberish, utils } from "ethers";
import BalanceTree from "./balance-tree";
import { BigIntMath, toBigInt } from "@gearbox-protocol/sdk";

const { isAddress, getAddress } = utils;

// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
export interface RewardsDistributorInfo {
  merkleRoot: string;
  tokenTotal: string;
  toBlock: number;
  claims: {
    [account: string]: {
      index: number;
      amount: string;
      proof: string[];
    };
  };
}

export type ClaimableBalance = { address: string; amount: BigNumberish };

export function parseBalanceMap(
  balances: ClaimableBalance[],
): RewardsDistributorInfo {
  const dataByAddress = balances.reduce<{
    [address: string]: {
      amount: bigint;
      flags?: { [flag: string]: boolean };
    };
  }>((memo, { address: account, amount: earnings }) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`);
    }
    const parsed = getAddress(account);
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`);
    const parsedNum = toBigInt(earnings);
    if (parsedNum <= 0)
      throw new Error(`Invalid amount for account: ${account}`);

    memo[parsed] = { amount: parsedNum };
    return memo;
  }, {});

  const sortedAddresses = Object.keys(dataByAddress).sort();

  // construct a tree
  const tree = new BalanceTree(
    sortedAddresses.map(address => ({
      account: address,
      amount: dataByAddress[address].amount,
    })),
  );

  // generate claims
  const claims = sortedAddresses.reduce<{
    [address: string]: { amount: string; index: number; proof: string[] };
  }>((memo, address, index) => {
    const { amount } = dataByAddress[address];
    memo[address] = {
      index,
      amount: BigIntMath.toHexString(amount),
      proof: tree.getProof(index, address, amount),
    };
    return memo;
  }, {});

  const tokenTotal: bigint = sortedAddresses.reduce<bigint>(
    (memo, key) => memo + dataByAddress[key].amount,
    0n,
  );

  return {
    merkleRoot: tree.getHexRoot(),
    toBlock: 0,
    tokenTotal: BigIntMath.toHexString(tokenTotal),
    claims,
  };
}
