// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// EdgeCharge — Production-ready MVP contract
/// - deterministic anchor IDs (no block.timestamp in id)
/// - ERC20 escrow & payout (SafeERC20)
/// - relayer authorization
/// - invoice creation with auto-increment id
/// - markInvoicePaid does on-chain funds movement from enterprise escrow to provider balance
/// - provider withdraw
/// - pause/emergency + reentrancy guard
/// - merkle proof verification for dispute path
///

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EdgeCharge is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using MerkleProof for bytes32[];

    /* ========== EVENTS ========== */
    event UsageAnchored(
        bytes32 indexed anchorId,
        address indexed provider,
        uint256 windowStart,
        uint256 windowEnd,
        bytes32 merkleRoot,
        uint256 totalUsage
    );

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed enterprise,
        address indexed provider,
        uint256 amount,
        bytes32 invoiceHash
    );

    event InvoicePaid(uint256 indexed invoiceId, address payer, uint256 amount);
    event ProviderWithdraw(address indexed provider, uint256 amount);
    event DepositEscrow(address indexed enterprise, uint256 amount);
    event DisputeOpened(bytes32 indexed anchorId, address indexed disputant, string reason);
    event DisputeResolved(bytes32 indexed anchorId, bool resolvedInFavorOfProvider);
    event RelayerAuthorized(address indexed relayer);
    event RelayerRevoked(address indexed relayer);
    event BillingTokenSet(address indexed token);

    /* ========== STRUCTS ========== */
    struct UsageAnchor {
        address provider;
        uint256 windowStart;
        uint256 windowEnd;
        bytes32 merkleRoot;
        uint256 totalUsage;
        bool disputed;
        bool exists;
    }

    struct Invoice {
        address enterprise;
        address provider;
        bytes32 invoiceHash;
        uint256 amount;
        bool paid;
        bool exists;
    }

    /* ========== STATE ========== */
    mapping(bytes32 => UsageAnchor) public usageAnchors; // anchorId => anchor
    mapping(uint256 => Invoice) public invoices; // invoiceId => Invoice
    mapping(address => bool) public authorizedRelayers;

    mapping(address => uint256) public enterpriseEscrow; // enterprise => token balance (in billingToken units)
    mapping(address => uint256) public providerBalances; // provider => withdrawable amount

    IERC20 public billingToken; // ERC20 token used for billing (e.g., USDC)

    uint256 public nextInvoiceId = 1;

    /* ========== MODIFIERS ========== */
    modifier onlyRelayer() {
        require(authorizedRelayers[msg.sender], "EdgeCharge: Not authorized relayer");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Ownable sets owner to deployer
    }

    /* ========== ADMIN: RELAYER ========== */
    function authorizeRelayer(address relayer) external onlyOwner {
        require(relayer != address(0), "EdgeCharge: invalid relayer");
        authorizedRelayers[relayer] = true;
        emit RelayerAuthorized(relayer);
    }

    function revokeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = false;
        emit RelayerRevoked(relayer);
    }

    /* ========== ADMIN: billing token ========== */
    function setBillingToken(address token) external onlyOwner {
        require(token != address(0), "EdgeCharge: zero token");
        billingToken = IERC20(token);
        emit BillingTokenSet(token);
    }

    /* ========== ESCROW (ENTERPRISE) ========== */

    /// @notice Enterprise deposits ERC20 billingToken into contract escrow. 
    /// Enterprise must call `approve` on the token first.
    function depositEscrow(uint256 amount) external whenNotPaused nonReentrant {
        require(address(billingToken) != address(0), "EdgeCharge: billing token not set");
        require(amount > 0, "EdgeCharge: amount must be > 0");

        // transferFrom enterprise to contract
        billingToken.safeTransferFrom(msg.sender, address(this), amount);
        enterpriseEscrow[msg.sender] += amount;
        emit DepositEscrow(msg.sender, amount);
    }

    /* ========== USAGE ANCHOR ========== */

    /// @notice Submit a usage anchor (signed/verified off-chain). Only relayer should call.
    /// AnchorId is deterministic: keccak(provider, windowStart, windowEnd, merkleRoot)
    function submitUsageAnchor(
        address provider,
        uint256 windowStart,
        uint256 windowEnd,
        bytes32 merkleRoot,
        uint256 totalUsage
    ) external onlyRelayer whenNotPaused returns (bytes32 anchorId) {
        require(provider != address(0), "EdgeCharge: Invalid provider");
        require(windowStart < windowEnd, "EdgeCharge: Invalid time window");
        // allow totalUsage == 0 for some windows (depending on policy) - but often > 0 is expected
        require(totalUsage > 0, "EdgeCharge: Invalid usage amount");

        anchorId = keccak256(abi.encodePacked(provider, windowStart, windowEnd, merkleRoot));
        require(!usageAnchors[anchorId].exists, "EdgeCharge: Anchor already exists");

        usageAnchors[anchorId] = UsageAnchor({
            provider: provider,
            windowStart: windowStart,
            windowEnd: windowEnd,
            merkleRoot: merkleRoot,
            totalUsage: totalUsage,
            disputed: false,
            exists: true
        });

        emit UsageAnchored(anchorId, provider, windowStart, windowEnd, merkleRoot, totalUsage);
    }

    /* ========== INVOICE CREATION & PAYMENT ========== */

    /// @notice Create an invoice entry (called by relayer after computing invoice off-chain)
    /// @dev invoiceId is auto-incremented
    function createInvoice(
        address enterprise,
        address provider,
        uint256 amount,
        bytes32 invoiceHash
    ) external onlyRelayer whenNotPaused returns (uint256 invoiceId) {
        require(enterprise != address(0), "EdgeCharge: invalid enterprise");
        require(provider != address(0), "EdgeCharge: invalid provider");
        require(amount > 0, "EdgeCharge: amount must be > 0");
        require(invoiceHash != bytes32(0), "EdgeCharge: invalid invoice hash");

        invoiceId = nextInvoiceId++;
        invoices[invoiceId] = Invoice({
            enterprise: enterprise,
            provider: provider,
            invoiceHash: invoiceHash,
            amount: amount,
            paid: false,
            exists: true
        });

        emit InvoiceCreated(invoiceId, enterprise, provider, amount, invoiceHash);
    }

    /// @notice Mark an invoice as paid and move funds from enterprise escrow to provider balance
    /// @dev This function is called by relayer once payment conditions are met (e.g., enterprise authorized or escrow available)
    function markInvoicePaid(uint256 invoiceId) external onlyRelayer whenNotPaused nonReentrant {
        require(invoices[invoiceId].exists, "EdgeCharge: Invoice does not exist");
        Invoice storage inv = invoices[invoiceId];
        require(!inv.paid, "EdgeCharge: Invoice already paid");

        // escrow must have funds
        uint256 amount = inv.amount;
        require(enterpriseEscrow[inv.enterprise] >= amount, "EdgeCharge: insufficient escrow");

        // move funds: deduct enterprise escrow and credit providerBalances
        enterpriseEscrow[inv.enterprise] -= amount;
        providerBalances[inv.provider] += amount;
        inv.paid = true;

        emit InvoicePaid(invoiceId, inv.enterprise, amount);
    }

    /// @notice Provider withdraws accumulated balance
    function withdrawProvider() external whenNotPaused nonReentrant {
        uint256 bal = providerBalances[msg.sender];
        require(bal > 0, "EdgeCharge: no balance to withdraw");
        providerBalances[msg.sender] = 0;
        billingToken.safeTransfer(msg.sender, bal);
        emit ProviderWithdraw(msg.sender, bal);
    }

    /* ========== DISPUTE FLOW ========== */

    /// @notice Open a dispute for an anchor.
    /// Anyone can open (enterprise or consumer), but only one active dispute per anchor is allowed in this MVP.
    function openDispute(bytes32 anchorId, string calldata reason) external whenNotPaused {
        require(usageAnchors[anchorId].exists, "EdgeCharge: Anchor does not exist");
        require(!usageAnchors[anchorId].disputed, "EdgeCharge: Anchor already disputed");
        require(bytes(reason).length > 0, "EdgeCharge: reason required");

        usageAnchors[anchorId].disputed = true;
        emit DisputeOpened(anchorId, msg.sender, reason);
    }

    /// @notice Owner (or multisig) resolves the dispute. For MVP owner resolves.
    /// If resolvedInFavorOfProvider == true -> dispute cleared, else remain disputed and optionally refund logic can be implemented.
    function resolveDispute(bytes32 anchorId, bool resolvedInFavorOfProvider) external onlyOwner whenNotPaused {
        require(usageAnchors[anchorId].exists, "EdgeCharge: Anchor does not exist");
        require(usageAnchors[anchorId].disputed, "EdgeCharge: Anchor not disputed");

        usageAnchors[anchorId].disputed = false;
        emit DisputeResolved(anchorId, resolvedInFavorOfProvider);
        // Further logic (refunds, slashing relayer) can be implemented here in a later version.
    }

    /* ========== MERKLE PROOF VERIFICATION (for dispute) ========== */
    /// @notice Verify a merkle proof against an anchor's stored merkleRoot
    function verifyMerkleProof(
        bytes32 anchorId,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool valid) {
        require(usageAnchors[anchorId].exists, "EdgeCharge: Anchor does not exist");
        bytes32 root = usageAnchors[anchorId].merkleRoot;
        return MerkleProof.verify(proof, root, leaf);
    }

    /* ========== ADMIN / PAUSE ========== */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /* ========== VIEWS ========== */

    function getUsageAnchor(bytes32 anchorId) external view returns (UsageAnchor memory) {
        require(usageAnchors[anchorId].exists, "EdgeCharge: Anchor does not exist");
        return usageAnchors[anchorId];
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        require(invoices[invoiceId].exists, "EdgeCharge: Invoice does not exist");
        return invoices[invoiceId];
    }

    function getEnterpriseEscrow(address enterprise) external view returns (uint256) {
        return enterpriseEscrow[enterprise];
    }

    function getProviderBalance(address provider) external view returns (uint256) {
        return providerBalances[provider];
    }

    /* ========== EMERGENCY OWNER WITHDRAW (only if needed) ========== */
    /// @notice Emergency withdraw ERC20 from contract to owner (use only in emergency)
    function emergencyWithdrawToken(address token, uint256 amount, address to) external onlyOwner nonReentrant {
        IERC20(token).safeTransfer(to, amount);
    }
}
