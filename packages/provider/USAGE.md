# EdgeCharge Provider Usage Guide

## Quick Start

### 1. Setup Environment

Create a `.env` file in the provider directory:

```bash
# Required: Generate a private key for your provider
PROVIDER_PRIVATE_KEY=0x$(openssl rand -hex 32)

# Required: Unique node identifier
NODE_ID=node-001

# Optional: Relayer URL (default: http://localhost:8787)
RELAYER_URL=http://localhost:8787

# Optional: Submission interval (default: 30 seconds)
SUBMISSION_INTERVAL_MS=30000
```

### 2. Install Dependencies

```bash
pnpm -w i
```

### 3. Run the Demo

```bash
pnpm -w --filter provider demo
```

This will show you:
- Usage simulation examples
- Relayer health check
- Single record submission
- Continuous operation demo

### 4. Start Continuous Operation

```bash
pnpm -w --filter provider dev start
```

## CLI Commands

### Start Continuous Operation
```bash
pnpm -w --filter provider dev start
```
- Generates usage records every 30 seconds (configurable)
- Signs records with your private key
- Submits to relayer automatically
- Shows real-time metrics

### Submit Single Record
```bash
pnpm -w --filter provider dev submit-once
```
- Generates one usage record
- Signs and submits immediately
- Good for testing

### Generate Simulations
```bash
pnpm -w --filter provider dev simulate --count 10
```
- Shows usage simulation data
- No signing or submission
- Good for understanding metrics

### Check Relayer Health
```bash
pnpm -w --filter provider dev health
```
- Tests relayer connectivity
- Verifies API is working

## Usage Record Format

The provider generates records like this:

```json
{
  "provider": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "nodeId": "node-001",
  "windowStart": 1690000000,
  "windowEnd": 1690000060,
  "unitsConsumed": 12345,
  "rateId": "rate-gpu-bandwidth-1",
  "nonce": "0x1234567890abcdef...",
  "providerSig": "0xabcd1234efgh5678..."
}
```

## Usage Simulation

The provider simulates realistic edge computing usage:

### GPU Utilization
- Random between 20-80% (configurable)
- Gradual changes with variance
- Correlates with compute workload

### Bandwidth Usage
- Random between 1MB-100MB (configurable)
- Correlates with GPU usage
- Realistic data transfer patterns

### Compute Units
- Derived from GPU + bandwidth
- Formula: `(gpu% * 10) + (bandwidthMB * 0.1) + randomness`
- Used for billing calculations

## Integration Flow

```
Provider → Usage Simulation → Signing → HTTP API → Relayer → Blockchain
```

1. **Provider** generates usage metrics
2. **Signing** creates ECDSA signature
3. **HTTP API** submits to relayer
4. **Relayer** batches and creates Merkle trees
5. **Blockchain** anchors Merkle roots

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROVIDER_PRIVATE_KEY` | Required | 64-char hex private key |
| `NODE_ID` | Required | Unique node identifier |
| `RELAYER_URL` | `http://localhost:8787` | Relayer API endpoint |
| `SUBMISSION_INTERVAL_MS` | `30000` | Submission interval |
| `GPU_USAGE_MIN` | `20` | Min GPU utilization % |
| `GPU_USAGE_MAX` | `80` | Max GPU utilization % |
| `BANDWIDTH_USAGE_MIN` | `1048576` | Min bandwidth bytes |
| `BANDWIDTH_USAGE_MAX` | `104857600` | Max bandwidth bytes |
| `WINDOW_DURATION_SECONDS` | `60` | Usage window duration |
| `RATE_ID` | `rate-gpu-bandwidth-1` | Billing rate ID |

## Security Notes

- **Private Key**: Store securely, never commit to git
- **Signatures**: All records are cryptographically signed
- **Nonces**: Random nonces prevent replay attacks
- **Canonical JSON**: Consistent serialization for verification

## Troubleshooting

### Common Issues

1. **"Invalid environment"**
   - Check all required environment variables
   - Ensure private key is 64 hex characters with 0x prefix

2. **"Relayer health check failed"**
   - Ensure relayer is running: `pnpm -w --filter relayer dev`
   - Check relayer URL in configuration
   - Verify network connectivity

3. **"Failed to submit usage record"**
   - Check relayer logs for errors
   - Verify relayer API is working
   - Check network connectivity

4. **"Invalid private key"**
   - Generate new key: `openssl rand -hex 32`
   - Ensure it starts with 0x
   - Check for typos in .env file

### Debug Mode

Enable verbose logging:
```bash
DEBUG=provider:* pnpm -w --filter provider dev start
```

## Example Output

```
🚀 Starting continuous usage record submission...
📊 Submission interval: 30000ms
🔗 Relayer URL: http://localhost:8787
🖥️  Node ID: node-001
👤 Provider address: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
✅ Usage record submitted successfully: {
  nodeId: 'node-001',
  windowStart: '2023-07-22T10:00:00.000Z',
  windowEnd: '2023-07-22T10:01:00.000Z',
  unitsConsumed: 12345,
  gpuUtilization: '65.23%',
  bandwidthBytes: '45.67MB',
  status: 'queued'
}
```

## Next Steps

1. **Production Setup**: Use real private keys and secure storage
2. **Monitoring**: Add logging and metrics collection
3. **Scaling**: Run multiple provider instances
4. **Customization**: Modify usage simulation patterns
5. **Integration**: Connect to real edge computing infrastructure
