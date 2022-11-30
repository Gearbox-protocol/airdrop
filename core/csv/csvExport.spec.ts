import { expect } from "chai";

import { CSVExport } from "./csvExport";

describe("CSV export", () => {
  it("works corerecly", () => {
    const e = new CSVExport();

    e.additem("aaa", "b", 444);
    e.additem("Aaa", "c", 50);
    e.additem("bbn", "B", 34);

    e.addClaimed("aAa", 40);

    expect(e.getCSV()).to.be.eq(`address, b, c, total, claimed, to pay
aaa, 444, 50, 494, 40, 454
bbn, 34, 0, 34, 0, 34`);
  });
});
