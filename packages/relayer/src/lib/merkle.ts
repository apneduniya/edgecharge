import { keccak256, toBytes, Hex } from 'viem';

export type Hash = Hex; // 0x-prefixed bytes32

export function hashLeafCanonicalJson(obj: unknown): Hash {
  const json = JSON.stringify(obj);
  return keccak256(toBytes(json));
}

export function hashPairCommutative(a: Hash, b: Hash): Hash {
  return a.toLowerCase() < b.toLowerCase()
    ? keccak256(concatBytes(a, b))
    : keccak256(concatBytes(b, a));
}

function concatBytes(a: Hash, b: Hash) {
  const ab = new Uint8Array(64);
  ab.set(toBytes(a));
  ab.set(toBytes(b), 32);
  return ab;
}

export function buildMerkleRoot(leaves: Hash[]): Hash {
  if (leaves.length === 0) return ('0x' + '00'.repeat(32)) as Hash;
  let layer = [...leaves];
  layer.sort();
  while (layer.length > 1) {
    const next: Hash[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? layer[i];
      next.push(hashPairCommutative(left, right));
    }
    next.sort();
    layer = next;
  }
  return layer[0] as Hash;
}


