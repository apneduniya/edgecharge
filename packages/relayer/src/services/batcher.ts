import { loadEnv } from '../config/env.js';
import { buildMerkleRoot, hashLeafCanonicalJson } from '../lib/merkle.js';
import { drainLeavesForWindow, recordAnchor } from './state.js';
import { submitAnchor } from '../usecases/submitAnchor.js';

export function startBatcher() {
  const env = loadEnv();
  const intervalMs = env.BATCH_INTERVAL_MS;

  setInterval(async () => {
    const now = Math.floor(Date.now() / 1000);
    const leaves = drainLeavesForWindow(now, Math.floor(intervalMs / 1000));
    if (leaves.length === 0) return;

    const provider = leaves[0].provider as `0x${string}`;
    const windowStart = Math.min(...leaves.map(l => l.windowStart));
    const windowEnd = Math.max(...leaves.map(l => l.windowEnd));
    const totalUsage = leaves.reduce((a, l) => a + BigInt(l.unitsConsumed), 0n);

    const leafHashes = leaves.map(l => hashLeafCanonicalJson({
      provider: l.provider,
      nodeId: l.nodeId,
      windowStart: l.windowStart,
      windowEnd: l.windowEnd,
      unitsConsumed: l.unitsConsumed,
      rateId: l.rateId,
      nonce: l.nonce,
    }));
    const merkleRoot = buildMerkleRoot(leafHashes);

    try {
      const receipt = await submitAnchor({
        provider,
        windowStart,
        windowEnd,
        merkleRoot,
        totalUsage,
      });

      const anchor = {
        anchorId: undefined as any,
        provider,
        windowStart,
        windowEnd,
        merkleRoot,
        totalUsage,
        submittedAt: Date.now(),
      };
      recordAnchor(anchor);
      console.log('Anchored usage:', { tx: receipt.transactionHash, provider, windowStart, windowEnd, totalUsage, merkleRoot });
    } catch (err) {
      console.error('Anchor submit failed:', err);
    }
  }, intervalMs).unref();
}


