import {
  BigIntMath,
  creditManagerByNetwork,
  DUMB_ADDRESS,
  DUMB_ADDRESS2,
  ICreditFacadeV2__factory,
} from "@gearbox-protocol/sdk";
import {
  CloseCreditAccountEvent,
  DecreaseBorrowedAmountEvent,
  IncreaseBorrowedAmountEvent,
  LiquidateCreditAccountEvent,
  OpenCreditAccountEvent,
  TransferAccountEvent,
} from "@gearbox-protocol/sdk/lib/types/ICreditFacadeV2.sol/ICreditFacadeV2";
import { expect } from "chai";

const cfi = ICreditFacadeV2__factory.createInterface();

const bnToU256 = (bn: bigint) => {
  const hexValue = BigIntMath.toHexString(bn).replace("0x", "");
  return `${"0".repeat(64 - hexValue.length)}${hexValue}`;
};

const addrToU256 = (addr: string) =>
  `0x000000000000000000000000${addr.replace("0x", "")}`;

const commonEventFields = {
  blockHash:
    "0xb77353a688104b25b14a3caf018b48d601f67fd08b748206b97930a90cee45c9",
  transactionIndex: 49,
  removed: false,
  transactionHash:
    "0x03f85b59b3641f863ac687e7c09e38777d42c5640ae0a74cc62f5667c74109d4",
  logIndex: 114,
};

export const openCreditAccountEvent = (
  address: string,
  blockNumber: number,
  onBehalf: string,
  borrowAmount: bigint,
) => {
  const data = `0x${bnToU256(borrowAmount)}${bnToU256(0n)}`;

  return {
    blockNumber,
    address,
    data,
    topics: [
      cfi.getEventTopic("OpenCreditAccount"),
      addrToU256(onBehalf),
      addrToU256(DUMB_ADDRESS),
    ],
    ...commonEventFields,
  };
};

export const closeCreditAccountEvent = (
  address: string,
  blockNumber: number,
  borrower: string,
) => {
  return {
    blockNumber,
    address,
    data: "0x",
    topics: [
      cfi.getEventTopic("CloseCreditAccount"),
      addrToU256(borrower),
      addrToU256(borrower),
    ],
    ...commonEventFields,
  };
};

export const liquidateCreditAccountEvent = (
  address: string,
  blockNumber: number,
  borrower: string,
  expired = false,
) => {
  return {
    blockNumber,
    address,
    data: `0x${bnToU256(1n)}`,
    topics: [
      expired
        ? cfi.getEventTopic("LiquidateExpiredCreditAccount")
        : cfi.getEventTopic("LiquidateCreditAccount"),
      addrToU256(borrower),
      addrToU256(DUMB_ADDRESS2),
      addrToU256(borrower),
    ],
    ...commonEventFields,
  };
};

export const increaseBorrowedAmountEvent = (
  address: string,
  blockNumber: number,
  borrower: string,
  amount: bigint,
) => {
  return {
    blockNumber,
    address,
    data: `0x${bnToU256(amount)}`,
    topics: [cfi.getEventTopic("IncreaseBorrowedAmount"), addrToU256(borrower)],
    ...commonEventFields,
  };
};

export const decreaseBorrowedAmountEvent = (
  address: string,
  blockNumber: number,
  borrower: string,
  amount: bigint,
) => {
  return {
    blockNumber,
    address,
    data: `0x${bnToU256(amount)}`,
    topics: [cfi.getEventTopic("DecreaseBorrowedAmount"), addrToU256(borrower)],
    ...commonEventFields,
  };
};

export const transferAccountEvent = (
  address: string,
  blockNumber: number,
  oldOwner: string,
  newOwner: string,
) => {
  return {
    blockNumber,
    address,
    data: `0x`,
    topics: [
      cfi.getEventTopic("TransferAccount"),
      addrToU256(oldOwner),
      addrToU256(newOwner),
    ],
    ...commonEventFields,
  };
};

describe("CreditRewards helper test", () => {
  it("test events generated correctly", () => {
    let e = openCreditAccountEvent(
      creditManagerByNetwork.Mainnet.DAI_V2,
      15902535,
      DUMB_ADDRESS,
      1500n,
    );
    let openEvent = cfi.parseLog(e) as unknown as OpenCreditAccountEvent;

    expect(openEvent.args.onBehalfOf).to.be.eq(DUMB_ADDRESS);
    expect(openEvent.args.borrowAmount.toNumber()).to.be.eq(1500);

    e = closeCreditAccountEvent(
      creditManagerByNetwork.Mainnet.DAI_V2,
      15902535,
      DUMB_ADDRESS,
    );
    const closeEvent = cfi.parseLog(e) as unknown as CloseCreditAccountEvent;
    expect(closeEvent.args.borrower).to.be.eq(DUMB_ADDRESS);

    for (let expired of [false, true]) {
      e = liquidateCreditAccountEvent(
        creditManagerByNetwork.Mainnet.DAI_V2,
        15902535,
        DUMB_ADDRESS,
        expired,
      );

      const liquidateEvent = cfi.parseLog(
        e,
      ) as unknown as LiquidateCreditAccountEvent;
      expect(liquidateEvent.args.borrower).to.be.eq(DUMB_ADDRESS);
    }

    e = increaseBorrowedAmountEvent(
      creditManagerByNetwork.Mainnet.DAI_V2,
      15902535,
      DUMB_ADDRESS,
      1898n,
    );
    const increaseEvent = cfi.parseLog(
      e,
    ) as unknown as IncreaseBorrowedAmountEvent;
    expect(increaseEvent.args.borrower).to.be.eq(DUMB_ADDRESS);
    expect(increaseEvent.args.amount.toNumber()).to.be.eq(1898);

    e = decreaseBorrowedAmountEvent(
      creditManagerByNetwork.Mainnet.DAI_V2,
      15902535,
      DUMB_ADDRESS,
      1898n,
    );
    const decreaseEvent = cfi.parseLog(
      e,
    ) as unknown as DecreaseBorrowedAmountEvent;
    expect(decreaseEvent.args.borrower).to.be.eq(DUMB_ADDRESS);
    expect(decreaseEvent.args.amount.toNumber()).to.be.eq(1898);

    e = transferAccountEvent(
      creditManagerByNetwork.Mainnet.DAI_V2,
      15902535,
      DUMB_ADDRESS,
      DUMB_ADDRESS2,
    );
    const transferEvent = cfi.parseLog(e) as unknown as TransferAccountEvent;
    expect(transferEvent.args.oldOwner).to.be.eq(DUMB_ADDRESS);
    expect(transferEvent.args.newOwner).to.be.eq(DUMB_ADDRESS2);
  });
});
