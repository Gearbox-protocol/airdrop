import { BigNumber } from "ethers";

interface RangedValuesProps {
  keys: Array<number>;
  data: Array<[number, BigNumber]>;
  initialValue: BigNumber;
}

interface ParsedRangedValuesProps {
  keys: Array<number>;
  data: Array<[number, string]>;
  initialValue: string;
}

export class RangedValue {
  protected initialValue: BigNumber;
  protected data: Map<number, BigNumber> = new Map();
  protected _keys: Array<number> = [];

  constructor(props?: Partial<RangedValuesProps>) {
    const {
      initialValue = BigNumber.from(0),
      data = [],
      keys = [],
    } = props || {};

    this.initialValue = initialValue;
    this.data = new Map(data);
    this._keys = keys;
  }
  addValue(from: number, value: BigNumber) {
    this.data.set(from, value);
    this._keys = [...this._keys, from].sort((a, b) => (a > b ? 1 : -1));
  }

  getValue(at: number): BigNumber {
    for (let index of [...this._keys].reverse()) {
      if (at >= index) {
        const value = this.data.get(index);
        if (!value)
          throw new Error(`Unexpectedly cant find a value with index ${index}`);
        return value;
      }
    }

    return this.initialValue;
  }

  getValues(sortedKeys: Array<number>): Array<BigNumber> {
    const lastElm = this._keys.length - 1;
    let ownKeyIndex = lastElm;
    const result: Array<BigNumber> = [];
    for (let sk of [...sortedKeys].reverse()) {
      if (sk < this._keys[0]) {
        result.push(this.initialValue);
      } else if (sk > this._keys[lastElm]) {
        result.push(this.getMapValue(this._keys[lastElm]));
      } else {
        if (sk < this._keys[ownKeyIndex]) {
          for (; ownKeyIndex >= 0; ownKeyIndex--) {
            if (sk >= this._keys[ownKeyIndex]) break;
          }
        }
        result.push(this.getMapValue(this._keys[ownKeyIndex]));
      }
    }
    return result.reverse();
  }

  protected getMapValue(index: number) {
    const value = this.data.get(index);
    if (!value) {
      if (this.data.size > 0) {
        throw new Error(`Can get value for ${index}`);
      } else {
        return this.initialValue;
      }
    }
    return value;
  }

  get keys(): Array<number> {
    return this._keys;
  }

  static fromString(jsonString?: string | null) {
    if (!jsonString) return new RangedValue();

    const parsedObject: ParsedRangedValuesProps = JSON.parse(jsonString);
    const transformed: RangedValuesProps = {
      ...parsedObject,
      initialValue: BigNumber.from(parsedObject.initialValue),
      data: parsedObject.data.map(([key, value]) => [
        key,
        BigNumber.from(value),
      ]),
    };

    return new RangedValue(transformed);
  }

  toString(): string {
    const toStringify: RangedValuesProps = {
      data: Array.from(this.data.entries()),
      keys: this._keys,
      initialValue: this.initialValue,
    };
    return JSON.stringify(toStringify);
  }
}
