import { NetworkType } from "@gearbox-protocol/sdk";
import axios from "axios";

import { RewardsDistributorInfo } from "../core/merkle/parse-accounts";
import { IAirdropDistributor } from "../types";

const cloudMerkle = (network: NetworkType, root: string) =>
  `https://am.gearbox.fi/${network.toString().toLowerCase()}_${root
    .toLowerCase()
    .replace("0x", "")}.json`;

export async function loadPrevMerkle(
  network: NetworkType,
  distributor: IAirdropDistributor,
): Promise<RewardsDistributorInfo> {
  const prevMerkle = await distributor.merkleRoot();

  try {
    const rawData = await axios.get<RewardsDistributorInfo>(
      cloudMerkle(network, prevMerkle),
      {
        headers: { "Accept-Encoding": "gzip,deflate,compress" },
      },
    );

    return rawData.data;
  } catch (e) {
    console.log(e);
    throw new Error("Cant get previous merkle");
  }
}
