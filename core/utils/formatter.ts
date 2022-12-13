import { formatBN } from "@gearbox-protocol/sdk";
import { BigNumber } from "ethers";

export const formatGear = (amount: BigNumber) =>
  `${formatBN(amount, 18)} [${amount.toString()}]`;
