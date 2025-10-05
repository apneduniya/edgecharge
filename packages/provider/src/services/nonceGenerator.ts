import { randomBytes } from 'node:crypto';

export interface INonceGenerator {
  generateNonce(): string;
}

export class NonceGenerator implements INonceGenerator {
  generateNonce(): string {
    // Generate a random 16-byte nonce and convert to hex
    const nonce = randomBytes(16).toString('hex');
    return `0x${nonce}`;
  }
}
