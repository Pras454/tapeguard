// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TapeGuardRegistry
/// @notice Anchors verifiable TapeOut circuit-evaluation receipts on X Layer.
/// @dev A receipt binds the TapeOut processor, circuit id, input bytes,
///      output bytes and the X Layer mainnet block at which the evaluation
///      was read. Anyone can re-run the same eth_call against the processor
///      and check that the anchored hash matches.
contract TapeGuardRegistry {
    struct Receipt {
        address recorder;
        address processor;
        uint256 circuitId;
        bytes32 receiptHash;
        uint256 mainnetBlock;
        uint256 recordedAt;
    }

    Receipt[] public receipts;

    event ReceiptRecorded(
        uint256 indexed receiptId,
        address indexed recorder,
        address indexed processor,
        uint256 circuitId,
        bytes32 receiptHash,
        uint256 mainnetBlock
    );

    /// @notice Anchor one circuit-evaluation receipt.
    /// @param processor TapeOut processor contract on X Layer mainnet.
    /// @param circuitId Circuit token id that was evaluated.
    /// @param input Input bytes sent to eval().
    /// @param output Output bytes returned by eval().
    /// @param mainnetBlock X Layer mainnet block number of the evaluation read.
    /// @return receiptId Sequential id of the stored receipt.
    function recordReceipt(
        address processor,
        uint256 circuitId,
        bytes calldata input,
        bytes calldata output,
        uint256 mainnetBlock
    ) external returns (uint256 receiptId) {
        bytes32 receiptHash = computeReceiptHash(
            processor,
            circuitId,
            input,
            output,
            mainnetBlock
        );
        receiptId = receipts.length;
        receipts.push(
            Receipt({
                recorder: msg.sender,
                processor: processor,
                circuitId: circuitId,
                receiptHash: receiptHash,
                mainnetBlock: mainnetBlock,
                recordedAt: block.timestamp
            })
        );
        emit ReceiptRecorded(
            receiptId,
            msg.sender,
            processor,
            circuitId,
            receiptHash,
            mainnetBlock
        );
    }

    /// @notice Recompute the receipt hash for a claimed evaluation.
    function computeReceiptHash(
        address processor,
        uint256 circuitId,
        bytes calldata input,
        bytes calldata output,
        uint256 mainnetBlock
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    processor,
                    circuitId,
                    input,
                    output,
                    mainnetBlock
                )
            );
    }

    function receiptCount() external view returns (uint256) {
        return receipts.length;
    }

    function getReceipt(
        uint256 receiptId
    ) external view returns (Receipt memory) {
        return receipts[receiptId];
    }
}
