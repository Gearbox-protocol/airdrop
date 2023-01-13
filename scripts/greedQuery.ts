import { IAirdropDistributor } from "../types";
import { ClaimedEvent } from "../types/contracts/AirdropDistributor";

export async function queryClaimed(
  distributor: IAirdropDistributor,
  lastBlock: number,
  from = 0,
  step = 0,
): Promise<Array<ClaimedEvent>> {
  try {
    return await distributor.queryFilter(
      distributor.filters.Claimed(),
      from,
      lastBlock,
    );
  } catch (e) {
    if (step > 4) throw new Error(`Too much recursion calls for greed query`);

    const left = await queryClaimed(
      distributor,
      Math.floor((lastBlock + from) / 2),
      from,
      step + 1,
    );

    const right = await queryClaimed(
      distributor,
      lastBlock,
      Math.floor((lastBlock + from) / 2) + 1,
      step + 1,
    );

    return [...left, ...right];
  }
}
