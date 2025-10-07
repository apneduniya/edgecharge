# EdgeCharge Invoicing Service

A comprehensive invoicing service that listens for blockchain events, computes costs using rate cards, generates PDF/CSV invoices, and anchors invoice hashes on the blockchain.

## Overview

The EdgeCharge invoicing service is a key component of the EdgeCharge ecosystem that:

- **Listens for UsageAnchored events** from the EdgeCharge smart contract
- **Computes costs** using configurable rate cards
- **Generates PDF and CSV invoices** with detailed line items
- **Anchors invoice hashes** on the blockchain for auditability
- **Provides CLI interface** for manual operations and monitoring

## Architecture

```
Blockchain Events → Event Listener → Rate Card Service → Invoice Generator → Blockchain Anchor
                                                              ↓
                                                        PDF/CSV Files
```

### Core Components

- **Blockchain Event Service**: Listens for `UsageAnchored` events
- **Rate Card Service**: Manages pricing and computes costs
- **Invoice Generators**: Creates PDF and CSV invoice files
- **Hash Service**: Computes deterministic invoice hashes
- **Blockchain Anchor Service**: Anchors invoice hashes on-chain
- **Invoicing Service**: Orchestrates the complete workflow

## Features

### ✅ Implemented Features

- **Event Listening**: Real-time blockchain event monitoring
- **Cost Computation**: Flexible rate card system with multiple billing types
- **PDF Generation**: Professional HTML-based invoice templates
- **CSV Generation**: Detailed data export with multiple formats
- **Hash Computation**: Deterministic invoice hashing for blockchain anchoring
- **Blockchain Anchoring**: On-chain invoice hash storage
- **CLI Interface**: Complete command-line management
- **Configuration**: Environment-based setup with validation

### 🔄 Workflow

1. **Event Detection**: Service listens for `UsageAnchored` events
2. **Cost Calculation**: Uses rate cards to compute billing amounts
3. **Invoice Generation**: Creates PDF and CSV files
4. **Hash Computation**: Generates deterministic invoice hash
5. **Blockchain Anchoring**: Stores hash on-chain via `anchorInvoice()`
6. **File Storage**: Saves generated files to configured directory

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- EdgeCharge contract deployed and accessible
- Relayer private key for blockchain operations

### Installation

```bash
# Install workspace dependencies
pnpm -w i

# Install invoicing-specific dependencies
pnpm -w --filter invoicing i
```

### Environment Configuration

Create `.env` in the invoicing directory:

```bash
# Blockchain configuration
U2U_RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
EDGECHARGE_ADDRESS=0x6715671733872Ce246A260F0497400430c4dEeD4
RELAYER_PRIVATE_KEY=0x<64-character-hex-string>

# Invoicing configuration
INVOICE_OUTPUT_DIR=./invoices
DEFAULT_CURRENCY=USD
DEFAULT_DUE_DAYS=30

# Enterprise configuration (for demo)
ENTERPRISE_ADDRESS=0x0000000000000000000000000000000000000000
ENTERPRISE_NAME=Demo Enterprise
ENTERPRISE_EMAIL=billing@demo-enterprise.com

# Provider configuration
PROVIDER_NAME=EdgeCharge Provider
PROVIDER_EMAIL=billing@edgecharge-provider.com
PROVIDER_WEBSITE=https://edgecharge-provider.com

# Event listening configuration
EVENT_POLLING_INTERVAL_MS=10000
AUTO_GENERATE_INVOICES=true
AUTO_ANCHOR_INVOICES=true
INVOICE_GENERATION_DELAY_MS=5000

# File format preferences
GENERATE_PDF=true
GENERATE_CSV=true
```

## Usage

### CLI Commands

#### Start the Service

```bash
# Start the invoicing service
pnpm -w --filter invoicing cli start

# Start with verbose logging
pnpm -w --filter invoicing cli start --verbose
```

#### Generate Invoices

```bash
# Generate invoice for specific anchors
pnpm -w --filter invoicing cli generate --anchors "0x123...,0x456..."

# Generate invoice for provider in time range
pnpm -w --filter invoicing cli generate --provider 0x742d35Cc... --start 1690000000 --end 1690000060
```

#### List Invoices

```bash
# List all invoices
pnpm -w --filter invoicing cli list

# List invoices by status
pnpm -w --filter invoicing cli list --status anchored
```

#### Anchor Invoices

```bash
# Anchor a specific invoice on blockchain
pnpm -w --filter invoicing cli anchor invoice-123
```

#### Service Status

```bash
# Show service status and statistics
pnpm -w --filter invoicing cli status
```

#### Rate Card Management

```bash
# List all rate cards
pnpm -w --filter invoicing cli rate-cards --list

# Add rate cards from file (future feature)
pnpm -w --filter invoicing cli rate-cards --add rate-cards.json
```

### Programmatic Usage

```typescript
import { InvoicingService } from '@edgecharge/invoicing';

// Initialize services
const invoicingService = new InvoicingService(
  blockchainEventService,
  rateCardService,
  pdfGenerator,
  csvGenerator,
  hashService,
  anchorService,
);

// Start the service
await invoicingService.start();

// Generate invoice manually
const invoice = await invoicingService.generateInvoiceForProvider(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  1690000000,
  1690000060
);
```

## Rate Cards

### Default Rate Cards

The service includes default rate cards for common edge computing services:

- **rate-gpu-bandwidth-1**: Standard GPU + bandwidth rate ($0.001/unit)
- **rate-gpu-premium**: Premium GPU rate ($0.002/unit)
- **rate-bandwidth-only**: Bandwidth-only rate ($0.0001/unit)

### Rate Card Configuration

Rate cards are stored in `./config/rate-cards.json` and support:

- **Multiple billing types**: per_unit, per_hour, per_gb, per_mb
- **Time-based pricing**: effective dates and expiration
- **Minimum/maximum charges**: billing limits
- **Provider-specific rates**: different rates per provider

### Custom Rate Cards

```json
{
  "defaultRateCards": [...],
  "customRateCards": [
    {
      "rateId": "custom-rate-1",
      "provider": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "name": "Custom GPU Rate",
      "description": "Custom rate for specific provider",
      "currency": "USD",
      "unitPrice": 0.005,
      "unit": "compute-unit",
      "billingType": "per_unit",
      "minimumCharge": 0.10,
      "effectiveFrom": 1690000000,
      "isActive": true
    }
  ]
}
```

## Invoice Generation

### PDF Invoices

- **Professional HTML templates** with responsive design
- **Detailed line items** with usage data and pricing
- **Blockchain metadata** including transaction hashes
- **Customizable branding** via environment variables

### CSV Exports

- **Multiple formats**: invoice summary, line items, rate analysis
- **Comprehensive data**: all invoice fields and metadata
- **Excel compatibility**: properly escaped CSV format
- **Batch processing**: multiple invoices in single file

### Invoice Structure

```typescript
interface Invoice {
  invoiceId: string;
  enterprise: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'draft' | 'generated' | 'anchored' | 'paid';
  billingPeriod: { start: number; end: number };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    rateId: string;
    usageData: {
      anchorId?: string;
      windowStart: number;
      windowEnd: number;
      unitsConsumed: number;
    };
  }>;
  metadata?: {
    invoiceHash?: string;
    blockchainTxHash?: string;
    generatedAt?: number;
    anchoredAt?: number;
  };
}
```

## Blockchain Integration

### Event Listening

The service listens for `UsageAnchored` events:

```solidity
event UsageAnchored(
    bytes32 indexed anchorId,
    address indexed provider,
    uint256 windowStart,
    uint256 windowEnd,
    uint256 totalUsage
);
```

### Invoice Anchoring

Generated invoices are anchored on-chain via `anchorInvoice()`:

```solidity
function anchorInvoice(
    uint256 invoiceId,
    bytes32 invoiceHash
) external onlyRelayer
```

### Hash Computation

Invoice hashes are computed deterministically using:

- **Canonical JSON serialization** with sorted fields
- **Keccak256 hashing** for consistency with blockchain
- **Exclusion of metadata** to ensure deterministic hashing
- **Validation** of all required fields

## File Structure

```
src/
├── cli/
│   └── index.ts              # CLI interface
├── config/
│   └── env.ts                # Environment configuration
├── contracts/
│   └── edgeCharge.ts         # Contract ABI/address resolution
├── domain/
│   ├── invoice.ts            # Invoice schema and types
│   ├── rateCard.ts           # Rate card schema and types
│   └── usageAnchor.ts        # Usage anchor schema and types
├── services/
│   ├── blockchainEventService.ts    # Event listening
│   ├── rateCardService.ts           # Rate card management
│   ├── pdfInvoiceGenerator.ts       # PDF generation
│   ├── csvInvoiceGenerator.ts       # CSV generation
│   ├── invoiceHashService.ts        # Hash computation
│   ├── blockchainAnchorService.ts   # Blockchain anchoring
│   └── invoicingService.ts          # Main orchestrator
└── index.ts                  # Main entry point
```

## Development

### Key Design Principles

- **SOLID Principles**: Single responsibility, dependency injection
- **Interface Segregation**: Clean interfaces for all services
- **Dependency Inversion**: Services depend on abstractions
- **Configuration**: Environment-based setup with validation
- **Error Handling**: Comprehensive error handling and logging

### Adding New Features

1. **Create domain models** in `src/domain/`
2. **Implement services** following existing patterns
3. **Add CLI commands** in `src/cli/index.ts`
4. **Update configuration** in `src/config/env.ts`
5. **Add tests** and documentation

## Troubleshooting

### Common Issues

1. **"Blockchain configuration issues"**
   - Verify `U2U_RPC_URL` and network connectivity
   - Check `EDGECHARGE_ADDRESS` is correct
   - Ensure `RELAYER_PRIVATE_KEY` is valid and authorized

2. **"No rate cards found"**
   - Check `RATE_CARD_FILE` path exists
   - Verify rate card JSON format is valid
   - Ensure rate cards are active and within effective dates

3. **"Failed to generate invoice"**
   - Check invoice validation errors
   - Verify rate card exists for the rate ID
   - Ensure usage data is valid

4. **"Transaction failed"**
   - Check relayer account has sufficient funds
   - Verify relayer is authorized in contract
   - Check network congestion and gas prices

### Debug Mode

Enable verbose logging:

```bash
DEBUG=invoicing:* pnpm -w --filter invoicing cli start --verbose
```

## Security Considerations

- **Private Key Security**: Store relayer private keys securely
- **Hash Verification**: Always verify invoice hashes before anchoring
- **Rate Card Validation**: Validate all rate card data before use
- **File Permissions**: Secure invoice output directory
- **Network Security**: Use HTTPS for all external connections

## Contributing

When modifying the invoicing service:

1. Follow SOLID principles and clean architecture
2. Maintain interface contracts for services
3. Update configuration schemas when adding new options
4. Add appropriate error handling and logging
5. Update this README for any API or configuration changes
6. Test with real blockchain events and transactions

## Integration with EdgeCharge Ecosystem

The invoicing service integrates with:

- **Provider Package**: Uses rate IDs from provider configuration
- **Relayer Package**: Listens for anchors submitted by relayer
- **Contracts Package**: Interacts with EdgeCharge smart contract
- **Frontend Package**: Provides invoice data for dashboard display

This creates a complete billing and invoicing solution for the EdgeCharge DePIN platform.
