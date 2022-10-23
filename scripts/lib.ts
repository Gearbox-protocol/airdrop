import { BigNumber } from "ethers";

export const mapToClaimed = (map: Record<string, BigNumber>) =>
  Object.entries(map).map(([address, amount]) => ({
    address,
    amount,
  }));
