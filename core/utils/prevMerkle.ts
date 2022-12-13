import { NetworkType } from "@gearbox-protocol/sdk";
import axios from "axios";

import { IAirdropDistributor } from "../../types";
import { RewardsDistributorInfo } from "../merkle/parse-accounts";

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
    throw new Error("Cant get previous merkle");
  }
}
