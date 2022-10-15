// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol"
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { IAirdropDistributor, DistributionData } from "./IAirdropDistributor.sol";

contract AirdropDistributor is Ownable, IAirdropDistributor {

    /// @dev Returns the token distributed by the contract
    IERC20 public immutable override token;

    /// @dev The current merkle root of total claimable balances
    bytes32 public override merkleRoot;

    /// @dev The mapping that stores amounts already claimed by users
    mapping(address => uint256) claimed;

    constructor(address token_, bytes32 merkleRoot_) {
        token = IERC20(token_);
        merkleRoot = merkleRoot_;
    }

    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        bytes32 oldRoot = merkleRoot;
        merkleRoot = newRoot;
        emit RootUpdated(oldRoot, newRoot);
    }

    function emitDistributionEvents(DistributionData[] calldata data) external onlyOwner {
        uint256 len = data.length;
        for (uint256 i = 0; i < len; ) {
            emit TokenAllocated(data.account, data.campaignId, data.amount);
            unchecked {
                ++i;
            }
        }
    }

    function claim(
        uint256 index,
        address account,
        uint256 totalAmount,
        uint256 claimedAmount,
        bytes32[] calldata merkleProof
    ) external override {

        require(
            claimed[account] + claimedAmount <= totalAmount,
            "MerkleDistributor: Total claimed amount is more than total rewards"
        );

        bytes32 node = keccak256(abi.encodePacked(index, account, totalAmount));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, node),
            "MerkleDistributor: Invalid proof."
        );
        
        claimed[account] += claimedAmount;
        token.transfer(account, claimedAmount);

        emit Claimed(index, account, claimedAmount);
    }
}
