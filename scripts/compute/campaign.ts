import { toBigInt } from "@gearbox-protocol/sdk";

import { campaigns } from "../../campaigns";
import { CSVExport } from "../../core/csv/csvExport";
import { RewardСampaigns } from "../../core/rewards/airdrops";
import { formatGear } from "../../core/utils/formatter";

export function computeCampaigns(
  exportCsv: CSVExport,
  distributed: Record<string, bigint>,
) {
  for (const c of campaigns) {
    let total = 0n;

    c.distributed.forEach(data => {
      const amount = 10n ** 18n * toBigInt(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || 0n) + amount;

      exportCsv.additem(account, RewardСampaigns[c.campaign], data.amount);

      total = total + amount;
    });
    c.claimed.forEach(data => {
      const amount = 10n ** 18n * toBigInt(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || 0n) - amount;
    });
    console.log(
      `Campaign rewards for ${RewardСampaigns[c.campaign]}: ${formatGear(
        total,
      )}`,
    );
  }
}
