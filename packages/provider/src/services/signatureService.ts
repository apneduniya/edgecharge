import { privateKeyToAccount } from 'viem/accounts';
import { UnsignedUsageRecord } from '../domain/usageRecord.js';
import { createCanonicalJson } from '../utils/canonicalJson.js';

export interface ISignatureService {
  signUsageRecord(record: UnsignedUsageRecord): Promise<string>;
  getProviderAddress(): string;
}

export class SignatureService implements ISignatureService {
  private account: ReturnType<typeof privateKeyToAccount>;

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey);
  }

  async signUsageRecord(record: UnsignedUsageRecord): Promise<string> {
    // Create the canonical message string
    const messageString = createCanonicalJson(record);
    
    // Sign the message string using the provider's private key
    const signature = await this.account.signMessage({ message: { raw: messageString as `0x${string}` } });
    
    return signature;
  }

  getProviderAddress(): string {
    return this.account.address;
  }
}
