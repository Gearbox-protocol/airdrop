// SPDX-License-Identifier: UNLICENSED
// Gearbox Protocol. Generalized leverage for DeFi protocols
// (c) Gearbox Holdings, 2021
pragma solidity ^0.8.10;

contract AddressProviderMock {

    address public getGearToken;
    address public getTreasuryContract;

    constructor(address token, address treasury) {
        getGearToken = token;
        getTreasuryContract = treasury;
    }
}