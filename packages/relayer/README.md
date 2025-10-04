# EdgeCharge Relayer

A Node.js relayer service that collects provider-signed usage data, batches it into Merkle trees, and submits usage anchors to the EdgeCharge smart contract on U2U Nebulas testnet.

## Overview

The relayer acts as an intermediary between edge computing providers and the blockchain, implementing the core batching and anchoring logic for the EdgeCharge billing system. It:

- Accepts signed usage leaves from providers via HTTP API
- Batches leaves by time windows (configurable interval)
- Computes Merkle roots over canonical JSON hashes
- Submits aggregated usage anchors to the EdgeCharge contract
- Maintains audit trail of submitted anchors

## Architecture

```
Provider → HTTP API → Relayer → Batcher → Blockchain
                ↓
            In-Memory State
                ↓
            Merkle Tree Builder
```

### Core Components

- **HTTP Server**: Express.js API for leaf ingestion and anchor queries
- **Batcher**: Interval-based worker that processes pending leaves
- **Merkle Builder**: Computes Merkle roots using canonical JSON hashing
- **Contract Adapter**: Handles blockchain interactions via wagmi/viem
- **State Manager**: In-memory storage for leaves and anchor records

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- U2U Nebulas testnet account with funds
- EdgeCharge contract deployed and relayer authorized

### Installation

```bash
# Install workspace dependencies
pnpm -w i

# Install relayer-specific dependencies
pnpm -w --filter relayer i
```

### Environment Configuration

Create `.env` in the relayer directory:

```bash
# Required: U2U Nebulas testnet RPC endpoint
U2U_RPC_URL=https://rpc-nebulas-testnet.u2u.xyz

# Required: Relayer private key (must be authorized in EdgeCharge contract)
RELAYER_PRIVATE_KEY=0x<64-character-hex-string>

# Optional: Override contract address (defaults to Ignition deployment)
EDGECHARGE_ADDRESS=0x6715671733872Ce246A260F0497400430c4dEeD4

# Optional: Batching interval in milliseconds (default: 60000 = 1 minute)
BATCH_INTERVAL_MS=60000
```

### Contract Authorization

Ensure your relayer address is authorized in the EdgeCharge contract:

```solidity
// Call this from the contract owner account
edgeCharge.authorizeRelayer(relayerAddress);
```

## Running the Relayer

### Development Mode

```bash
pnpm -w --filter relayer dev
```

### Production Build

```bash
# Build TypeScript
pnpm -w --filter relayer build

# Start production server
pnpm -w --filter relayer start
```

The relayer will start on port 8787 by default (configurable via `PORT` env var).

## API Reference

### Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{ "ok": true }
```

#### `POST /leaves`
Submit a provider-signed usage leaf for batching.

**Request Body:**
```json
{
  "provider": "0x...",
  "nodeId": "node-123",
  "windowStart": 1690000000,
  "windowEnd": 1690000060,
  "unitsConsumed": 12345,
  "rateId": "rate-std-1",
  "nonce": "uuid-or-counter",
  "providerSig": "0x..."
}
```

**Response:**
```json
{ "status": "queued" }
```

#### `GET /anchors`
Retrieve recently submitted usage anchors.

**Response:**
```json
{
  "anchors": [
    {
      "provider": "0x...",
      "windowStart": 1690000000,
      "windowEnd": 1690000060,
      "merkleRoot": "0x...",
      "totalUsage": "12345",
      "submittedAt": 1690000100000
    }
  ]
}
```

## Batching Logic

The relayer processes leaves in configurable time windows:

1. **Collection**: Leaves are queued via HTTP API
2. **Batching**: Every `BATCH_INTERVAL_MS`, leaves with `windowEnd` in the last interval are processed
3. **Aggregation**: 
   - Sum `unitsConsumed` → `totalUsage`
   - Compute Merkle root over canonical JSON hashes
   - Determine time window bounds
4. **Submission**: Call `EdgeCharge.submitUsageAnchor()` on-chain
5. **Recording**: Store anchor metadata locally

### Merkle Tree Construction

- Leaves are hashed using `keccak256(JSON.stringify(canonicalObject))`
- Tree uses commutative hashing (order-independent)
- Each layer is sorted before pairing
- Compatible with OpenZeppelin MerkleProof verification

## File Structure

```
src/
├── config/
│   ├── chain.ts          # U2U Nebulas testnet configuration
│   └── env.ts            # Environment variable validation
├── contracts/
│   └── edgeCharge.ts     # Contract ABI/address resolution
├── domain/
│   └── leaf.ts           # Leaf schema and validation
├── lib/
│   └── merkle.ts         # Merkle tree utilities
├── server/
│   └── http.ts           # Express.js API routes
├── services/
│   ├── batcher.ts        # Interval-based batching worker
│   └── state.ts          # In-memory state management
├── usecases/
│   └── submitAnchor.ts   # On-chain anchor submission
└── index.ts              # Main entry point
```

## Development

### Key Configuration Points

- **Batching Interval**: Modify `BATCH_INTERVAL_MS` in environment
- **Leaf Format**: Update `LeafSchema` in `src/domain/leaf.ts`
- **Merkle Hashing**: Customize in `src/lib/merkle.ts`
- **Chain Target**: Change in `src/config/chain.ts`
- **Contract Address**: Set `EDGECHARGE_ADDRESS` or update Ignition deployment

### Testing

The relayer includes a demo mode that runs when executed directly:

```bash
pnpm -w --filter relayer dev
```

This will:
1. Start the HTTP server
2. Start the batcher
3. Submit a test anchor to verify connectivity

### Monitoring

- Check `/health` for service status
- Monitor `/anchors` for recent submissions
- Watch console logs for batch processing and transaction receipts

## Security Considerations

- **Relayer Authorization**: Only authorized addresses can submit anchors
- **Provider Signatures**: Currently accepted but not verified (TODO)
- **State Persistence**: Currently in-memory only (TODO: IPFS/disk storage)
- **Rate Limiting**: Not implemented (TODO)

## Limitations & TODOs

- Provider signature verification not implemented
- In-memory state (no persistence)
- Single provider per batch assumption
- No Merkle proof generation API
- No rate limiting or authentication
- No IPFS integration for raw leaf storage

## Integration with EdgeCharge Contract

The relayer interacts with the EdgeCharge contract's `submitUsageAnchor` function:

```solidity
function submitUsageAnchor(
    address provider,
    uint256 windowStart,
    uint256 windowEnd,
    bytes32 merkleRoot,
    uint256 totalUsage
) external onlyRelayer returns (bytes32 anchorId)
```

This creates an on-chain anchor that can be:
- Queried for usage data
- Disputed if fraudulent
- Used for invoice generation
- Verified via Merkle proofs

## Troubleshooting

### Common Issues

1. **"Not authorized relayer"**: Ensure relayer address is authorized in contract
2. **"EdgeCharge address not found"**: Set `EDGECHARGE_ADDRESS` or deploy via Ignition
3. **RPC connection errors**: Verify `U2U_RPC_URL` and network connectivity
4. **Transaction failures**: Check relayer account has sufficient funds for gas

### Debug Mode

Enable verbose logging by setting:
```bash
DEBUG=relayer:*
```

## Contributing

When modifying the relayer:

1. Update tests in `packages/contracts/test/EdgeCharge.ts`
2. Ensure Merkle tree compatibility with contract verification
3. Maintain canonical JSON hashing consistency
4. Update this README for any API changes

