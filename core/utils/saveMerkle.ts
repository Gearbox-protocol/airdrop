import { NetworkType } from "@gearbox-protocol/sdk";
import * as fs from "fs";

import { RewardsDistributorInfo } from "../merkle/parse-accounts";

export function saveMerkle(network: NetworkType, info: RewardsDistributorInfo) {
  const fnamePrefix = `./merkle/${network.toLowerCase()}_${info.merkleRoot.replace(
    "0x",
    "",
  )}`;
  fs.writeFileSync(`${fnamePrefix}.json`, JSON.stringify(info));

  if (!fs.existsSync(fnamePrefix)) {
    fs.mkdirSync(fnamePrefix);
  }

  for (let i = 0; i < 256; i++) {
    let prefix = i.toString(16).toLowerCase();
    prefix = prefix.length === 1 ? `0${prefix}` : prefix;

    const prefixedInfo = { ...info };
    prefixedInfo.claims = Object.entries(info.claims)
      .filter(([addr]) => addr.toLowerCase().startsWith(`0x${prefix}`))
      .reduce((res, [addr, claim]) => ({ ...res, [addr]: claim }), {});

    const fname = `${fnamePrefix}/${prefix}.json`;

    fs.writeFileSync(fname, JSON.stringify(prefixedInfo));
  }
}
