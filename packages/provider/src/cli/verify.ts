#!/usr/bin/env tsx

/**
 * CLI tool for verifying provider signatures and Merkle roots
 * 
 * Usage:
 *   pnpm -w --filter provider dev verify --help
 *   pnpm -w --filter provider dev verify signature <record.json>
 *   pnpm -w --filter provider dev verify merkle <records.json>
 *   pnpm -w --filter provider dev verify proof <leaf.json> <proof.json> <root>
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { 
  verifyUsageRecordSignature, 
  verifyUsageRecordsAndBuildMerkle, 
  generateMerkleProof, 
  verifyMerkleProof,
  validateUsageRecord 
} from '../utils/verification.js';
import { UsageRecord } from '../domain/usageRecord.js';

const program = new Command();

program
  .name('edgecharge-verify')
  .description('Verify provider signatures and Merkle roots')
  .version('1.0.0');

program
  .command('signature')
  .description('Verify a single usage record signature')
  .argument('<file>', 'JSON file containing the usage record')
  .option('-o, --output <file>', 'Output file for verification result')
  .action(async (file, options) => {
    try {
      console.log(`🔍 Verifying signature for record in ${file}...`);
      
      const recordData = JSON.parse(readFileSync(file, 'utf8'));
      const record = recordData as UsageRecord;
      
      // Validate record structure first
      const validation = validateUsageRecord(record);
      if (!validation.isValid) {
        console.error(`❌ Record validation failed: ${validation.error}`);
        process.exit(1);
      }
      
      console.log('✅ Record structure is valid');
      
      // Verify signature
      const result = await verifyUsageRecordSignature(record);
      
      if (result.isValid) {
        console.log('✅ Signature is valid');
        console.log(`   Provider: ${record.provider}`);
        console.log(`   Node ID: ${record.nodeId}`);
        console.log(`   Window: ${new Date(record.windowStart * 1000).toISOString()} - ${new Date(record.windowEnd * 1000).toISOString()}`);
        console.log(`   Units: ${record.unitsConsumed}`);
        console.log(`   Rate ID: ${record.rateId}`);
        console.log(`   Nonce: ${record.nonce}`);
      } else {
        console.error(`❌ Signature verification failed: ${result.error}`);
        process.exit(1);
      }
      
      // Output result if requested
      if (options.output) {
        const output = {
          isValid: result.isValid,
          record: record,
          verifiedAt: new Date().toISOString(),
          error: result.error,
        };
        writeFileSync(options.output, JSON.stringify(output, null, 2));
        console.log(`📄 Verification result written to ${options.output}`);
      }
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    }
  });

program
  .command('merkle')
  .description('Verify multiple usage records and build Merkle tree')
  .argument('<file>', 'JSON file containing array of usage records')
  .option('-o, --output <file>', 'Output file for verification result')
  .action(async (file, options) => {
    try {
      console.log(`🔍 Verifying records and building Merkle tree from ${file}...`);
      
      const recordsData = JSON.parse(readFileSync(file, 'utf8'));
      const records = recordsData as UsageRecord[];
      
      if (!Array.isArray(records)) {
        console.error('❌ Input file must contain an array of usage records');
        process.exit(1);
      }
      
      console.log(`📊 Processing ${records.length} usage records...`);
      
      // Verify all records and build Merkle tree
      const result = await verifyUsageRecordsAndBuildMerkle(records);
      
      if (result.isValid) {
        console.log('✅ All signatures are valid');
        console.log(`   Merkle Root: ${result.merkleRoot}`);
        console.log(`   Total Usage: ${result.totalUsage.toString()}`);
        console.log(`   Leaf Count: ${result.leafCount}`);
        
        // Show summary of records
        const uniqueProviders = new Set(records.map(r => r.provider));
        const totalWindowTime = records.reduce((sum, r) => sum + (r.windowEnd - r.windowStart), 0);
        
        console.log(`   Unique Providers: ${uniqueProviders.size}`);
        console.log(`   Total Window Time: ${totalWindowTime} seconds`);
        
        // Show usage distribution
        const usageStats = records.reduce((stats, r) => {
          stats.min = Math.min(stats.min, r.unitsConsumed);
          stats.max = Math.max(stats.max, r.unitsConsumed);
          stats.sum += r.unitsConsumed;
          return stats;
        }, { min: Infinity, max: -Infinity, sum: 0 });
        
        console.log(`   Usage Range: ${usageStats.min} - ${usageStats.max}`);
        console.log(`   Average Usage: ${Math.round(usageStats.sum / records.length)}`);
        
      } else {
        console.error(`❌ Merkle verification failed: ${result.error}`);
        process.exit(1);
      }
      
      // Output result if requested
      if (options.output) {
        const output = {
          isValid: result.isValid,
          merkleRoot: result.merkleRoot,
          totalUsage: result.totalUsage.toString(),
          leafCount: result.leafCount,
          verifiedAt: new Date().toISOString(),
          error: result.error,
          records: records,
        };
        writeFileSync(options.output, JSON.stringify(output, null, 2));
        console.log(`📄 Verification result written to ${options.output}`);
      }
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    }
  });

program
  .command('proof')
  .description('Generate or verify Merkle proof for a specific leaf')
  .argument('<records-file>', 'JSON file containing array of usage records')
  .argument('<leaf-index>', 'Index of the leaf to generate proof for')
  .option('-v, --verify <root>', 'Verify proof against given Merkle root')
  .option('-o, --output <file>', 'Output file for proof')
  .action(async (recordsFile, leafIndex, options) => {
    try {
      console.log(`🔍 Generating Merkle proof for leaf ${leafIndex} from ${recordsFile}...`);
      
      const recordsData = JSON.parse(readFileSync(recordsFile, 'utf8'));
      const records = recordsData as UsageRecord[];
      
      if (!Array.isArray(records)) {
        console.error('❌ Input file must contain an array of usage records');
        process.exit(1);
      }
      
      const index = parseInt(leafIndex, 10);
      if (index < 0 || index >= records.length) {
        console.error(`❌ Invalid leaf index: ${index}. Must be between 0 and ${records.length - 1}`);
        process.exit(1);
      }
      
      // Generate proof
      const proofResult = generateMerkleProof(records, index);
      
      if (!proofResult) {
        console.error('❌ Failed to generate Merkle proof');
        process.exit(1);
      }
      
      console.log('✅ Merkle proof generated');
      console.log(`   Leaf Hash: ${proofResult.leafHash}`);
      console.log(`   Proof Length: ${proofResult.proof.length}`);
      console.log(`   Proof: ${proofResult.proof.join(', ')}`);
      
      // Verify proof if root is provided
      if (options.verify) {
        console.log(`🔍 Verifying proof against root: ${options.verify}...`);
        
        const isValid = verifyMerkleProof(proofResult.leafHash, proofResult.proof, options.verify);
        
        if (isValid) {
          console.log('✅ Proof verification successful');
        } else {
          console.error('❌ Proof verification failed');
          process.exit(1);
        }
      }
      
      // Output proof if requested
      if (options.output) {
        const output = {
          leafIndex: index,
          leafHash: proofResult.leafHash,
          proof: proofResult.proof,
          verifiedAt: new Date().toISOString(),
          record: records[index],
        };
        writeFileSync(options.output, JSON.stringify(output, null, 2));
        console.log(`📄 Proof written to ${options.output}`);
      }
      
    } catch (error) {
      console.error('❌ Proof generation failed:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate usage record structure and business rules')
  .argument('<file>', 'JSON file containing the usage record')
  .action(async (file) => {
    try {
      console.log(`🔍 Validating record structure in ${file}...`);
      
      const recordData = JSON.parse(readFileSync(file, 'utf8'));
      const record = recordData as UsageRecord;
      
      const result = validateUsageRecord(record);
      
      if (result.isValid) {
        console.log('✅ Record structure is valid');
        console.log(`   Provider: ${record.provider}`);
        console.log(`   Node ID: ${record.nodeId}`);
        console.log(`   Window: ${record.windowStart} - ${record.windowEnd}`);
        console.log(`   Units: ${record.unitsConsumed}`);
        console.log(`   Rate ID: ${record.rateId}`);
        console.log(`   Nonce: ${record.nonce}`);
        console.log(`   Signature: ${record.providerSig.substring(0, 20)}...`);
      } else {
        console.error(`❌ Record validation failed: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
