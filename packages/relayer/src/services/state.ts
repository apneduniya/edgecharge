import type { Leaf } from '../domain/leaf.js';

export type AnchorRecord = {
  anchorId?: `0x${string}`;
  provider: `0x${string}`;
  windowStart: number;
  windowEnd: number;
  merkleRoot: `0x${string}`;
  totalUsage: bigint;
  submittedAt?: number;
};

const pendingLeaves: Leaf[] = [];
const submittedAnchors: AnchorRecord[] = [];

export function addLeaf(leaf: Leaf) {
  pendingLeaves.push(leaf);
}

export function drainLeavesForWindow(now: number, windowSeconds = 60) {
  const cutoff = now - windowSeconds;
  const batch = pendingLeaves.filter(l => l.windowEnd <= now && l.windowEnd > cutoff);
  // remove batched
  for (const b of batch) {
    const idx = pendingLeaves.indexOf(b);
    if (idx !== -1) pendingLeaves.splice(idx, 1);
  }
  return batch;
}

export function recordAnchor(anchor: AnchorRecord) {
  submittedAnchors.push(anchor);
}

export function listAnchors() {
  return submittedAnchors.slice(-100).reverse();
}


