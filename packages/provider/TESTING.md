# EdgeCharge Provider Testing Guide

This guide covers comprehensive testing and verification of provider signatures and Merkle root validation.

## Overview

The EdgeCharge provider system includes multiple layers of verification:

1. **Provider Signature Verification** - ECDSA signatures on usage records
2. **Merkle Tree Construction** - Off-chain Merkle root generation
3. **Integration Testing** - End-to-end provider-to-relayer flow
4. **CLI Verification Tools** - Command-line verification utilities

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm -w --filter provider test

# Run specific test files
pnpm -w --filter provider test src/test/signature.test.ts
pnpm -w --filter provider test src/test/merkle.test.ts
pnpm -w --filter provider test src/test/integration.test.ts
```

### Test Categories

#### 1. Signature Tests (`signature.test.ts`)

Tests provider signature generation and verification:

```typescript
// Test signature generation
it('should generate valid ECDSA signatures', async () => {
  const signature = await signatureService.signUsageRecord(record);
  assert.ok(signature.startsWith('0x'));
  assert.ok(signature.length >= 130);
});

// Test signature verification
it('should verify valid signatures', async () => {
  const isValid = await verifyMessage({
    address: providerAddress,
    message: { raw: messageHash },
    signature: signature,
  });
  assert.ok(isValid);
});
```

**What it tests:**
- ECDSA signature generation
- Signature verification with viem
- Canonical JSON consistency
- Edge cases and error handling

#### 2. Merkle Tree Tests (`merkle.test.ts`)

Tests Merkle root generation and verification:

```typescript
// Test single leaf Merkle tree
it('should create valid Merkle root for single leaf', () => {
  const merkleRoot = buildMerkleRoot([leafHash]);
  assert.equal(merkleRoot, leafHash); // Single leaf = root
});

// Test multiple leaves
it('should create consistent Merkle root for multiple leaves', () => {
  const merkleRoot = buildMerkleRoot(leafHashes);
  assert.ok(merkleRoot.startsWith('0x'));
  assert.equal(merkleRoot.length, 66);
});
```

**What it tests:**
- Merkle root construction
- Commutative hashing
- Proof generation and verification
- Edge cases (empty trees, odd numbers, large trees)

#### 3. Integration Tests (`integration.test.ts`)

Tests end-to-end provider-to-relayer flow:

```typescript
// Test complete record generation
it('should generate valid usage records with proper structure', async () => {
  const record = await providerService.generateAndSubmitUsageRecord();
  assert.ok(record.provider.startsWith('0x'));
  assert.ok(record.providerSig.startsWith('0x'));
});

// Test Merkle tree compatibility
it('should generate records compatible with relayer Merkle tree construction', async () => {
  const records = await generateMultipleRecords();
  const merkleRoot = buildMerkleRoot(leafHashes);
  assert.ok(merkleRoot.startsWith('0x'));
});
```

**What it tests:**
- Complete usage record generation
- Signature verification integration
- Merkle tree compatibility with relayer
- Error handling and edge cases

## CLI Verification Tools

### Signature Verification

```bash
# Verify a single usage record signature
pnpm -w --filter provider verify signature record.json

# Verify with output file
pnpm -w --filter provider verify signature record.json -o result.json
```

**Example record.json:**
```json
{
  "provider": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "nodeId": "node-001",
  "windowStart": 1690000000,
  "windowEnd": 1690000060,
  "unitsConsumed": 1000,
  "rateId": "rate-test-1",
  "nonce": "0x1234567890abcdef1234567890abcdef",
  "providerSig": "0xabcd1234efgh5678..."
}
```

### Merkle Tree Verification

```bash
# Verify multiple records and build Merkle tree
pnpm -w --filter provider verify merkle records.json

# Verify with output file
pnpm -w --filter provider verify merkle records.json -o merkle-result.json
```

**Example records.json:**
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
    "providerSig": "0xabcd1234efgh5678..."
  },
  {
    "provider": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "nodeId": "node-002",
    "windowStart": 1690000060,
    "windowEnd": 1690000120,
    "unitsConsumed": 1500,
    "rateId": "rate-test-1",
    "nonce": "0x22222222222222222222222222222222",
    "providerSig": "0xefgh5678ijkl9012..."
  }
]
```

### Merkle Proof Generation

```bash
# Generate Merkle proof for a specific leaf
pnpm -w --filter provider verify proof records.json 0

# Verify proof against a Merkle root
pnpm -w --filter provider verify proof records.json 0 -v 0x1234...

# Save proof to file
pnpm -w --filter provider verify proof records.json 0 -o proof.json
```

### Record Validation

```bash
# Validate record structure and business rules
pnpm -w --filter provider verify validate record.json
```

## Verification Process

### 1. Provider Signature Verification

```typescript
// Step 1: Validate record structure
const validation = validateUsageRecord(record);
if (!validation.isValid) {
  throw new Error(`Invalid record: ${validation.error}`);
}

// Step 2: Create canonical object (without signature)
const canonicalRecord = {
  provider: record.provider,
  nodeId: record.nodeId,
  windowStart: record.windowStart,
  windowEnd: record.windowEnd,
  unitsConsumed: record.unitsConsumed,
  rateId: record.rateId,
  nonce: record.nonce,
};

// Step 3: Create message hash
const messageHash = JSON.stringify(canonicalRecord);

// Step 4: Verify signature
const isValid = await verifyMessage({
  address: record.provider,
  message: { raw: messageHash },
  signature: record.providerSig,
});
```

### 2. Merkle Root Construction

```typescript
// Step 1: Create leaf hashes from canonical objects
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

// Step 2: Build Merkle tree
const merkleRoot = buildMerkleRoot(leafHashes);

// Step 3: Calculate total usage
const totalUsage = records.reduce((sum, record) => sum + BigInt(record.unitsConsumed), 0n);
```

### 3. Merkle Proof Verification

```typescript
// Step 1: Generate proof for specific leaf
const proof = generateMerkleProof(records, leafIndex);

// Step 2: Verify proof
const isValid = verifyMerkleProof(leafHash, proof, merkleRoot);
```

## Test Data Generation

### Generate Test Records

```bash
# Generate test records using the demo
pnpm -w --filter provider demo

# Generate multiple records for testing
pnpm -w --filter provider dev simulate --count 10
```

### Create Test Files

```typescript
// Create test record file
const testRecord = {
  provider: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  nodeId: "test-node-001",
  windowStart: 1690000000,
  windowEnd: 1690000060,
  unitsConsumed: 1000,
  rateId: "rate-test-1",
  nonce: "0x1234567890abcdef1234567890abcdef",
  providerSig: "0xabcd1234efgh5678...", // Generated by provider
};

writeFileSync('test-record.json', JSON.stringify(testRecord, null, 2));
```

## Integration with Relayer

### Test Provider-to-Relayer Flow

1. **Start Relayer:**
```bash
pnpm -w --filter relayer dev
```

2. **Start Provider:**
```bash
pnpm -w --filter provider dev start
```

3. **Monitor Relayer Logs:**
```bash
# Look for anchored usage records
tail -f relayer.log | grep "Anchored usage"
```

4. **Verify On-Chain:**
```bash
# Check contract events
# Use the relayer's /anchors endpoint
curl http://localhost:8787/anchors
```

### End-to-End Verification

```bash
# 1. Generate test records
pnpm -w --filter provider dev simulate --count 5

# 2. Submit to relayer
pnpm -w --filter provider dev submit-once

# 3. Verify relayer received and processed
curl http://localhost:8787/anchors

# 4. Verify Merkle root on-chain
# Check the EdgeCharge contract for UsageAnchored events
```

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

## Best Practices

1. **Always verify signatures** before processing records
2. **Use canonical JSON** for consistent hashing
3. **Test edge cases** (empty trees, single leaves, large datasets)
4. **Validate business rules** (time windows, usage amounts)
5. **Monitor integration** between provider and relayer
6. **Keep test data** for regression testing

## Security Considerations

1. **Private Key Security:** Never commit private keys to version control
2. **Signature Verification:** Always verify signatures before trusting data
3. **Nonce Uniqueness:** Ensure nonces are unique to prevent replay attacks
4. **Canonical Serialization:** Use consistent JSON serialization for signatures
5. **Merkle Tree Integrity:** Verify Merkle roots match expected values
