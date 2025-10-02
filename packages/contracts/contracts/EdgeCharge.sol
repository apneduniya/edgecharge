// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title EdgeCharge
 * @dev Main contract for anchoring usage data and invoices for edge computing billing
 * @notice This contract handles usage anchoring, invoice management, and dispute resolution
 */
contract EdgeCharge is Ownable {
    using MerkleProof for bytes32[];
    // Events
    event UsageAnchored(
        bytes32 indexed anchorId,
        address indexed provider,
        uint256 windowStart,
        uint256 windowEnd,
        uint256 totalUsage
    );
    
    event InvoiceAnchored(
        uint256 indexed invoiceId,
        address indexed enterprise,
        address indexed provider,
        uint256 amount
    );
    
    event InvoicePaid(uint256 indexed invoiceId);
    
    event DisputeOpened(
        bytes32 indexed anchorId,
        address indexed disputant,
        string reason
    );

    event RelayerAuthorized(address indexed relayer);
    event RelayerRevoked(address indexed relayer);

    // Storage structures
    struct UsageAnchor {
        address provider;
        uint256 windowStart;
        uint256 windowEnd;
        bytes32 merkleRoot;
        uint256 totalUsage;
        bool disputed;
    }

    struct Invoice {
        address enterprise;
        address provider;
        bytes32 invoiceHash;
        uint256 amount;
        bool paid;
        bool exists;
    }

    // State variables
    mapping(bytes32 => UsageAnchor) public usageAnchors;
    mapping(uint256 => Invoice) public invoices;
    mapping(address => bool) public authorizedRelayers;
    
    uint256 public nextInvoiceId = 1;

    // Modifiers
    modifier onlyRelayer() {
        require(authorizedRelayers[msg.sender], "EdgeCharge: Not authorized relayer");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Authorize a relayer address
     * @param relayer The address to authorize as a relayer
     */
    function authorizeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = true;
        emit RelayerAuthorized(relayer);
    }

    /**
     * @dev Revoke relayer authorization
     * @param relayer The address to revoke relayer access from
     */
    function revokeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = false;
        emit RelayerRevoked(relayer);
    }

    /**
     * @dev Submit a usage anchor with aggregated data
     * @param provider The edge computing provider address
     * @param windowStart Start timestamp of the usage window
     * @param windowEnd End timestamp of the usage window
     * @param merkleRoot Merkle root of the usage data
     * @param totalUsage Total usage amount for the window
     * @return anchorId The unique identifier for this anchor
     */
    function submitUsageAnchor(
        address provider,
        uint256 windowStart,
        uint256 windowEnd,
        bytes32 merkleRoot,
        uint256 totalUsage
    ) external onlyRelayer returns (bytes32 anchorId) {
        require(provider != address(0), "EdgeCharge: Invalid provider");
        require(windowStart < windowEnd, "EdgeCharge: Invalid time window");
        require(totalUsage > 0, "EdgeCharge: Invalid usage amount");

        anchorId = keccak256(abi.encodePacked(
            provider,
            windowStart,
            windowEnd,
            merkleRoot,
            totalUsage,
            block.timestamp
        ));

        require(usageAnchors[anchorId].provider == address(0), "EdgeCharge: Anchor already exists");

        usageAnchors[anchorId] = UsageAnchor({
            provider: provider,
            windowStart: windowStart,
            windowEnd: windowEnd,
            merkleRoot: merkleRoot,
            totalUsage: totalUsage,
            disputed: false
        });

        emit UsageAnchored(anchorId, provider, windowStart, windowEnd, totalUsage);
    }

    /**
     * @dev Anchor an invoice hash
     * @param invoiceId Unique identifier for the invoice
     * @param invoiceHash Hash of the invoice data
     */
    function anchorInvoice(
        uint256 invoiceId,
        bytes32 invoiceHash
    ) external onlyRelayer {
        require(invoiceId > 0, "EdgeCharge: Invalid invoice ID");
        require(invoiceHash != bytes32(0), "EdgeCharge: Invalid invoice hash");
        require(!invoices[invoiceId].exists, "EdgeCharge: Invoice already exists");

        // For MVP, we'll use the relayer as the provider and a placeholder enterprise
        // In production, these would be extracted from the invoice data
        invoices[invoiceId] = Invoice({
            enterprise: address(0), // Placeholder - would be extracted from invoice
            provider: msg.sender,   // Relayer as provider for MVP
            invoiceHash: invoiceHash,
            amount: 0,              // Placeholder - would be extracted from invoice
            paid: false,
            exists: true
        });

        emit InvoiceAnchored(invoiceId, address(0), msg.sender, 0);
    }

    /**
     * @dev Mark an invoice as paid
     * @param invoiceId The invoice ID to mark as paid
     */
    function markInvoicePaid(uint256 invoiceId) external onlyRelayer {
        require(invoices[invoiceId].exists, "EdgeCharge: Invoice does not exist");
        require(!invoices[invoiceId].paid, "EdgeCharge: Invoice already paid");

        invoices[invoiceId].paid = true;
        emit InvoicePaid(invoiceId);
    }

    /**
     * @dev Open a dispute for a usage anchor
     * @param anchorId The anchor ID to dispute
     * @param reason Reason for the dispute
     */
    function openDispute(bytes32 anchorId, string calldata reason) external {
        require(usageAnchors[anchorId].provider != address(0), "EdgeCharge: Anchor does not exist");
        require(!usageAnchors[anchorId].disputed, "EdgeCharge: Anchor already disputed");
        require(bytes(reason).length > 0, "EdgeCharge: Dispute reason required");

        usageAnchors[anchorId].disputed = true;
        emit DisputeOpened(anchorId, msg.sender, reason);
    }

    /**
     * @dev Verify a merkle proof for dispute resolution
     * @param anchorId The anchor ID containing the merkle root
     * @param leaf The leaf data to verify
     * @param proof The merkle proof
     * @return valid Whether the proof is valid
     */
    function verifyMerkleProof(
        bytes32 anchorId,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool valid) {
        require(usageAnchors[anchorId].provider != address(0), "EdgeCharge: Anchor does not exist");
        
        bytes32 root = usageAnchors[anchorId].merkleRoot;
        return MerkleProof.verify(proof, root, leaf);
    }

    /**
     * @dev Get usage anchor details
     * @param anchorId The anchor ID to query
     * @return anchor The usage anchor data
     */
    function getUsageAnchor(bytes32 anchorId) external view returns (UsageAnchor memory anchor) {
        require(usageAnchors[anchorId].provider != address(0), "EdgeCharge: Anchor does not exist");
        return usageAnchors[anchorId];
    }

    /**
     * @dev Get invoice details
     * @param invoiceId The invoice ID to query
     * @return invoice The invoice data
     */
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory invoice) {
        require(invoices[invoiceId].exists, "EdgeCharge: Invoice does not exist");
        return invoices[invoiceId];
    }
}
