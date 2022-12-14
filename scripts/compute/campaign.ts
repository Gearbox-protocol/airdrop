import { BigNumber } from "ethers";

import { campaigns } from "../../campaigns";
import { CSVExport } from "../../core/csv/csvExport";
import { RewardСampaigns } from "../../core/rewards/airdrops";
import { formatGear } from "../../core/utils/formatter";

export function computeCampaigns(
  exportCsv: CSVExport,
  distributed: Record<string, BigNumber>,
) {
  for (const c of campaigns) {
    let total = BigNumber.from(0);

    c.distributed.forEach(data => {
      const amount = BigNumber.from(10).pow(18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || BigNumber.from(0)).add(
        amount,
      );

      exportCsv.additem(account, RewardСampaigns[c.campaign], data.amount);

      total = total.add(amount);
    });
    c.claimed.forEach(data => {
      const amount = BigNumber.from(10).pow(18).mul(data.amount);
      const account = data.address.toLowerCase();

      distributed[account] = (distributed[account] || BigNumber.from(0)).sub(
        amount,
      );
    });
    console.log(
      `Campaign rewards for ${RewardСampaigns[c.campaign]}: ${formatGear(
        total,
      )}`,
    );
  }
}
