import { formatBN } from "@gearbox-protocol/sdk";

export const formatGear = (amount: bigint) =>
  `${formatBN(amount, 18)} [${amount.toString()}]`;
