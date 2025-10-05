# EdgeCharge Provider

A Node.js provider agent that generates signed usage records for edge computing resources (GPU, bandwidth) and submits them to the EdgeCharge relayer for billing and anchoring.

## Overview

The provider agent simulates edge computing resource usage and creates cryptographically signed usage records that can be verified and anchored on-chain. It follows the EdgeCharge protocol for DePIN billing.

## Features

- **Usage Simulation**: Realistic simulation of GPU utilization and bandwidth usage
- **Cryptographic Signing**: ECDSA signatures for usage record authenticity
- **Continuous Operation**: Configurable interval-based usage record generation
- **Relayer Integration**: HTTP API integration with EdgeCharge relayer
- **CLI Interface**: Command-line tools for operation and testing

## Architecture

```
Provider Agent → Usage Simulation → Signing → HTTP API → Relayer → Blockchain
```

### Core Components

- **Usage Simulator**: Generates realistic GPU and bandwidth usage metrics
- **Signature Service**: Creates ECDSA signatures for usage records
- **Relayer Client**: HTTP client for submitting records to relayer
- **Provider Service**: Orchestrates the complete workflow
- **CLI Interface**: Command-line interface for operation

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- EdgeCharge relayer running and accessible
- Provider private key for signing

### Installation

```bash
# Install workspace dependencies
pnpm -w i

# Install provider-specific dependencies
pnpm -w --filter provider i
```

### Environment Configuration

Create `.env` in the provider directory:

```bash
# Required: Provider private key for signing usage records
PROVIDER_PRIVATE_KEY=0x<64-character-hex-string>

# Required: Unique node identifier
NODE_ID=node-001

# Optional: Relayer URL (default: http://localhost:8787)
RELAYER_URL=http://localhost:8787

# Optional: Submission interval in milliseconds (default: 30000 = 30 seconds)
SUBMISSION_INTERVAL_MS=30000

# Optional: Usage simulation configuration
GPU_USAGE_MIN=20          # Minimum GPU utilization percentage
GPU_USAGE_MAX=80          # Maximum GPU utilization percentage
GPU_USAGE_VARIANCE=0.1    # Variance factor for GPU usage changes
BANDWIDTH_USAGE_MIN=1048576      # Minimum bandwidth in bytes (1MB)
BANDWIDTH_USAGE_MAX=104857600    # Maximum bandwidth in bytes (100MB)
BANDWIDTH_USAGE_VARIANCE=0.2     # Variance factor for bandwidth changes
WINDOW_DURATION_SECONDS=60       # Usage window duration in seconds
RATE_ID=rate-gpu-bandwidth-1     # Rate identifier for billing
```

## Usage

### CLI Commands

#### Start Continuous Operation

```bash
# Start continuous usage record generation and submission
pnpm -w --filter provider dev start
```

This will:
1. Check relayer health
2. Start generating usage records every 30 seconds (configurable)
3. Sign and submit records to the relayer
4. Display real-time status and metrics

#### Submit Single Record

```bash
# Generate and submit a single usage record
pnpm -w --filter provider dev submit-once
```

#### Generate Simulations

```bash
# Generate usage simulation data without submitting
pnpm -w --filter provider dev simulate --count 10
```

#### Check Relayer Health

```bash
# Check if the relayer is accessible and healthy
pnpm -w --filter provider dev health
```

### Production Build

```bash
# Build TypeScript
pnpm -w --filter provider build

# Start production server
pnpm -w --filter provider start
```

## Usage Record Format

The provider generates usage records in the following format:

```json
{
  "provider": "0x...",
  "nodeId": "node-001",
  "windowStart": 1690000000,
  "windowEnd": 1690000060,
  "unitsConsumed": 12345,
  "rateId": "rate-gpu-bandwidth-1",
  "nonce": "0x...",
  "providerSig": "0x..."
}
```

### Field Descriptions

- **provider**: Ethereum address of the provider (derived from private key)
- **nodeId**: Unique identifier for the edge computing node
- **windowStart**: Unix timestamp for usage window start
- **windowEnd**: Unix timestamp for usage window end
- **unitsConsumed**: Computed usage units (derived from GPU + bandwidth)
- **rateId**: Billing rate identifier
- **nonce**: Unique nonce to prevent replay attacks
- **providerSig**: ECDSA signature of the usage record

## Usage Simulation

The provider simulates realistic edge computing usage patterns:

### GPU Utilization
- Configurable min/max utilization percentages
- Gradual changes with configurable variance
- Realistic correlation with compute workload

### Bandwidth Usage
- Configurable min/max bandwidth in bytes
- Correlation with GPU utilization
- Realistic data transfer patterns

### Compute Units
- Derived from both GPU utilization and bandwidth
- Formula: `(gpuUtilization * 10) + (bandwidthBytes / 1MB * 0.1) + randomness`

## Security

- **ECDSA Signatures**: All usage records are cryptographically signed
- **Nonce Generation**: Random nonces prevent replay attacks
- **Canonical JSON**: Consistent serialization for signature verification
- **Private Key Security**: Private keys should be stored securely

## Integration with EdgeCharge

The provider integrates with the EdgeCharge ecosystem:

1. **Relayer**: Submits signed usage records via HTTP API
2. **Batching**: Relayer batches records into time windows
3. **Merkle Trees**: Records are included in Merkle trees for verification
4. **Blockchain**: Merkle roots are anchored on-chain for auditability

## Development

### File Structure

```
src/
├── cli/
│   └── index.ts              # CLI interface
├── config/
│   └── env.ts                # Environment configuration
├── domain/
│   ├── providerConfig.ts     # Provider configuration schema
│   ├── usageRecord.ts        # Usage record schema
│   └── usageSimulation.ts    # Usage simulation types
├── services/
│   ├── nonceGenerator.ts     # Nonce generation service
│   ├── providerService.ts    # Main provider orchestration
│   ├── relayerClient.ts      # HTTP client for relayer
│   ├── signatureService.ts   # ECDSA signing service
│   └── usageSimulator.ts     # Usage simulation service
└── index.ts                  # Main entry point
```

### Key Design Principles

- **SOLID Principles**: Single responsibility, dependency injection
- **Interface Segregation**: Clean interfaces for all services
- **Dependency Inversion**: Services depend on abstractions
- **Configuration**: Environment-based configuration with validation
- **Error Handling**: Comprehensive error handling and logging

## Troubleshooting

### Common Issues

1. **"Invalid environment"**: Check all required environment variables
2. **"Relayer health check failed"**: Ensure relayer is running and accessible
3. **"Failed to submit usage record"**: Check relayer API and network connectivity
4. **"Invalid private key"**: Ensure private key is 64 hex characters with 0x prefix

### Debug Mode

Enable verbose logging by setting:
```bash
DEBUG=provider:*
```

## Contributing

When modifying the provider:

1. Follow SOLID principles and clean architecture
2. Maintain interface contracts for services
3. Update configuration schemas when adding new options
4. Add appropriate error handling and logging
5. Update this README for any API or configuration changes
