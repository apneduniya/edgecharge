# EdgeCharge Provider Verification Guide

This guide shows you how to verify provider signatures and Merkle roots for the EdgeCharge system.

## Quick Start

### 1. Run Unit Tests

```bash
# Run all tests
pnpm -w --filter provider test

# Run specific test categories
pnpm -w --filter provider test src/test/signature.test.ts
pnpm -w --filter provider test src/test/merkle.test.ts
pnpm -w --filter provider test src/test/integration.test.ts
```

### 2. Generate Test Data

```bash
# Generate a single usage record
pnpm -w --filter provider dev submit-once

# Generate multiple records for testing
pnpm -w --filter provider dev simulate --count 5
```

### 3. Verify Signatures

```bash
# Verify a single record signature
pnpm -w --filter provider verify signature record.json

# Validate record structure
pnpm -w --filter provider verify validate record.json
```

### 4. Verify Merkle Trees

```bash
# Verify multiple records and build Merkle tree
pnpm -w --filter provider verify merkle records.json

# Generate Merkle proof for specific leaf
pnpm -w --filter provider verify proof records.json 0
```

## Verification Process

### Step 1: Provider Signature Verification

The provider signs usage records using ECDSA signatures. Here's how to verify them:

```typescript
// 1. Create canonical object (without signature)
const canonicalRecord = {
  provider: record.provider,
  nodeId: record.nodeId,
  windowStart: record.windowStart,
  windowEnd: record.windowEnd,
  unitsConsumed: record.unitsConsumed,
  rateId: record.rateId,
  nonce: record.nonce,
};

// 2. Create message hash
const messageHash = JSON.stringify(canonicalRecord);

// 3. Verify signature
const isValid = await verifyMessage({
  address: record.provider,
  message: { raw: messageHash },
  signature: record.providerSig,
});
```

### Step 2: Merkle Root Construction

The relayer builds Merkle trees from verified usage records:

```typescript
// 1. Create leaf hashes from canonical objects
const leafHashes = records.map(record => {
  const canonicalObject = {
    provider: record.provider,
    nodeId: record.nodeId,
    windowStart: record.windowStart,
    windowEnd: record.windowEnd,
    unitsConsumed: record.unitsConsumed,
    rateId: record.rateId,
    nonce: record.nonce,
  };
  
  const json = JSON.stringify(canonicalObject);
  return keccak256(toBytes(json));
});

// 2. Build Merkle tree
const merkleRoot = buildMerkleRoot(leafHashes);

// 3. Calculate total usage
const totalUsage = records.reduce((sum, record) => sum + BigInt(record.unitsConsumed), 0n);
```

### Step 3: Merkle Proof Verification

Generate and verify Merkle proofs for dispute resolution:

```typescript
// 1. Generate proof for specific leaf
const proof = generateMerkleProof(records, leafIndex);

// 2. Verify proof
const isValid = verifyMerkleProof(leafHash, proof, merkleRoot);
```

## CLI Commands

### Signature Verification

```bash
# Verify single record
pnpm -w --filter provider verify signature record.json

# Verify with output file
pnpm -w --filter provider verify signature record.json -o result.json
```

**Example Output:**
```
🔍 Verifying signature for record in record.json...
✅ Record structure is valid
✅ Signature is valid
   Provider: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
   Node ID: node-001
   Window: 2023-07-22T10:00:00.000Z - 2023-07-22T10:01:00.000Z
   Units: 1000
   Rate ID: rate-test-1
   Nonce: 0x1234567890abcdef1234567890abcdef
```

### Merkle Tree Verification

```bash
# Verify multiple records
pnpm -w --filter provider verify merkle records.json

# Verify with output file
pnpm -w --filter provider verify merkle records.json -o merkle-result.json
```

**Example Output:**
```
🔍 Verifying records and building Merkle tree from records.json...
📊 Processing 3 usage records...
✅ All signatures are valid
   Merkle Root: 0xabcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678
   Total Usage: 3500
   Leaf Count: 3
   Unique Providers: 1
   Total Window Time: 180 seconds
   Usage Range: 1000 - 1500
   Average Usage: 1167
```

### Merkle Proof Generation

```bash
# Generate proof for leaf at index 0
pnpm -w --filter provider verify proof records.json 0

# Verify proof against Merkle root
pnpm -w --filter provider verify proof records.json 0 -v 0xabcd1234...

# Save proof to file
pnpm -w --filter provider verify proof records.json 0 -o proof.json
```

**Example Output:**
```
🔍 Generating Merkle proof for leaf 0 from records.json...
✅ Merkle proof generated
   Leaf Hash: 0x1111111111111111111111111111111111111111111111111111111111111111
   Proof Length: 2
   Proof: 0x2222222222222222222222222222222222222222222222222222222222222222, 0x3333333333333333333333333333333333333333333333333333333333333333
```

### Record Validation

```bash
# Validate record structure
pnpm -w --filter provider verify validate record.json
```

**Example Output:**
```
🔍 Validating record structure in record.json...
✅ Record structure is valid
   Provider: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
   Node ID: node-001
   Window: 1690000000 - 1690000060
   Units: 1000
   Rate ID: rate-test-1
   Nonce: 0x1234567890abcdef1234567890abcdef
   Signature: 0xabcd1234efgh5678...
```

## Test Data Examples

### Single Usage Record

```json
{
  "provider": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "nodeId": "node-001",
  "windowStart": 1690000000,
  "windowEnd": 1690000060,
  "unitsConsumed": 1000,
  "rateId": "rate-test-1",
  "nonce": "0x1234567890abcdef1234567890abcdef",
  "providerSig": "0xabcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012ghij3456klmn7890opqr1234stuv5678wxyz9012"
}
```

### Multiple Usage Records

```json
[
  {
    "provider": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "nodeId": "node-001",
    "windowStart": 1690000000,
    "windowEnd": 1690000060,
    "unitsConsumed": 1000,
    "rateId": "rate-test-1",
    "nonce": "0x11111111111111111111111111111111",
    "providerSig": "0xabcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012ghij3456klmn7890opqr1234stuv5678wxyz9012"
  },
  {
    "provider": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "nodeId": "node-002",
    "windowStart": 1690000060,
    "windowEnd": 1690000120,
    "unitsConsumed": 1500,
    "rateId": "rate-test-1",
    "nonce": "0x22222222222222222222222222222222",
    "providerSig": "0xefgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012ghij3456klmn7890opqr1234stuv5678wxyz9012abcd1234"
  }
]
```

## Integration Testing

### End-to-End Verification

1. **Start Relayer:**
```bash
pnpm -w --filter relayer dev
```

2. **Start Provider:**
```bash
pnpm -w --filter provider dev start
```

3. **Monitor Integration:**
```bash
# Check relayer health
curl http://localhost:8787/health

# Check anchored records
curl http://localhost:8787/anchors
```

4. **Verify On-Chain:**
```bash
# Check contract events for UsageAnchored
# The relayer should show anchored usage records in logs
```

### Test Scenarios

#### Scenario 1: Valid Records
```bash
# Generate valid records
pnpm -w --filter provider dev simulate --count 3

# Submit to relayer
pnpm -w --filter provider dev submit-once

# Verify processing
curl http://localhost:8787/anchors
```

#### Scenario 2: Invalid Signatures
```bash
# Create invalid record
echo '{"provider":"0x1234...","nodeId":"test","windowStart":0,"windowEnd":1,"unitsConsumed":0,"rateId":"test","nonce":"0x1234","providerSig":"0xinvalid"}' > invalid-record.json

# Try to verify
pnpm -w --filter provider verify signature invalid-record.json
# Should fail with signature verification error
```

#### Scenario 3: Merkle Tree Verification
```bash
# Generate multiple records
pnpm -w --filter provider dev simulate --count 5

# Verify Merkle tree construction
pnpm -w --filter provider verify merkle records.json

# Generate proof for specific leaf
pnpm -w --filter provider verify proof records.json 2
```

## Security Considerations

### Signature Security
- **ECDSA Signatures:** All usage records are cryptographically signed
- **Canonical JSON:** Consistent serialization prevents signature malleability
- **Nonce Uniqueness:** Random nonces prevent replay attacks
- **Address Verification:** Signatures are tied to specific provider addresses

### Merkle Tree Security
- **Commutative Hashing:** Order-independent tree construction
- **Proof Verification:** Merkle proofs enable efficient verification
- **Root Integrity:** Merkle roots are anchored on-chain for auditability
- **Leaf Validation:** All leaves must have valid signatures

### Best Practices
1. **Always verify signatures** before processing records
2. **Use canonical JSON** for consistent hashing
3. **Validate business rules** (time windows, usage amounts)
4. **Test edge cases** (empty trees, single leaves, large datasets)
5. **Monitor integration** between provider and relayer
6. **Keep audit trails** of all verification results

## Troubleshooting

### Common Issues

1. **Signature Verification Fails:**
   - Check canonical JSON serialization
   - Verify private key matches provider address
   - Ensure message hash is correct

2. **Merkle Root Mismatch:**
   - Check leaf hash generation
   - Verify commutative hashing
   - Ensure consistent sorting

3. **Integration Issues:**
   - Verify relayer is running
   - Check network connectivity
   - Validate record format

### Debug Mode

```bash
# Enable debug logging
DEBUG=provider:* pnpm -w --filter provider test

# Verbose test output
pnpm -w --filter provider test --verbose
```

## API Reference

### Verification Functions

```typescript
// Verify single record signature
verifyUsageRecordSignature(record: UsageRecord): Promise<VerificationResult>

// Verify multiple records and build Merkle tree
verifyUsageRecordsAndBuildMerkle(records: UsageRecord[]): Promise<MerkleVerificationResult>

// Generate Merkle proof
generateMerkleProof(records: UsageRecord[], leafIndex: number): { proof: string[], leafHash: string } | null

// Verify Merkle proof
verifyMerkleProof(leafHash: string, proof: string[], root: string): boolean

// Validate record structure
validateUsageRecord(record: UsageRecord): VerificationResult
```

### Test Utilities

```typescript
// Run signature tests
pnpm -w --filter provider test src/test/signature.test.ts

// Run Merkle tests
pnpm -w --filter provider test src/test/merkle.test.ts

// Run integration tests
pnpm -w --filter provider test src/test/integration.test.ts
```

This verification system ensures the integrity and authenticity of all usage records in the EdgeCharge system, providing cryptographic guarantees for billing and dispute resolution.
