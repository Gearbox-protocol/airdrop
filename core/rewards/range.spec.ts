import { expect } from "chai";

import { RangedValue } from "./range";

describe("RangedValue test", () => {
  it("addValue and getValue works correctly", () => {
    const r = new RangedValue({ initialValue: 5n });

    expect(Number(r.getValue(5))).to.be.eq(5);

    r.addValue(100, 8n);
    r.addValue(10, 18n);

    expect(Number(r.getValue(9))).to.be.eq(5);
    expect(Number(r.getValue(10))).to.be.eq(18);
    expect(Number(r.getValue(1000))).to.be.eq(8);

    expect(r.keys).to.be.eql([10, 100]);
  });

  it("getValues works correctly", () => {
    const r = new RangedValue();
    r.addValue(4, 3n);
    r.addValue(2, 5n);
    r.addValue(10, 1n);
    r.addValue(6, 8n);
    r.addValue(8, 7n);

    const keys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const expected = [0, 0, 5, 5, 3, 3, 8, 8, 7, 7, 1, 1];
    const result = r.getValues(keys).map(e => Number(e));

    expect(result).to.be.eql(expected);
  });
});
