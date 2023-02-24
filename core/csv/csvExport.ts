import * as fs from "fs";

export class CSVExport {
  protected columns: Array<string> = [];
  protected data: Record<string, Record<string, number>> = {};
  protected claimed: Record<string, number> = {};

  redirectRewards(from: string, to: string) {
    const fromLC = from.toLowerCase();
    const toLC = to.toLowerCase();

    const fromData = this.data[fromLC];
    if (fromData) {
      const toData = this.data[toLC] || {};

      this.data[toLC] = this.sumRows(fromData, toData);
      delete this.data[fromLC];
    }

    const fromClaimed = this.claimed[fromLC];
    if (fromClaimed) {
      const toClaimed = this.claimed[toLC] || 0;

      this.claimed[toLC] = fromClaimed + toClaimed;
      delete this.claimed[fromLC];
    }
  }

  sumRows(rowA: Record<string, number>, rowB: Record<string, number>) {
    const commonSum = Object.fromEntries(
      Object.entries(rowA).map(([key, value]) => [
        key,
        (rowB[key] || 0) + value,
      ]),
    );

    return { ...rowA, ...rowB, ...commonSum };
  }

  additem(address: string, column: string, value: number) {
    const columnLC = column.toLowerCase();
    const addressLC = address.toLowerCase();
    if (!this.columns.includes(columnLC)) {
      this.columns.push(columnLC);
    }
    if (!this.data[addressLC]) {
      this.data[addressLC] = {};
    }
    this.data[addressLC][columnLC] = value;
  }

  addClaimed(address: string, amount: number) {
    const addressLC = address.toLowerCase();
    this.claimed[addressLC] = (this.claimed[addressLC] || 0) + amount;
  }

  getLine(address: string): string {
    let result = "";
    const addressLC = address.toLowerCase();
    if (this.data[addressLC]) {
      const values = [addressLC];

      let total = 0;
      this.columns.forEach(c => {
        const v = this.data[addressLC][c] || 0;
        values.push(`${v}`);
        total += v;
      });

      values.push(total.toString());

      const claimed = this.claimed[addressLC] || 0;
      values.push(claimed.toString());

      const toPay = total - claimed;
      values.push(toPay.toString());

      result += values.join(", ");
    }
    return result;
  }

  getCSV(): string {
    return (
      ["address", ...this.columns, "total", "claimed", "to pay"].join(", ") +
      "\n" +
      Object.keys(this.data)
        .map(address => this.getLine(address))
        .join("\n")
    );
  }
}
