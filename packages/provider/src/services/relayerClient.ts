import { UsageRecord } from '../domain/usageRecord.js';

export interface IRelayerClient {
  submitUsageRecord(record: UsageRecord): Promise<{ status: string }>;
  checkHealth(): Promise<{ ok: boolean }>;
}

export class RelayerClient implements IRelayerClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async submitUsageRecord(record: UsageRecord): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit usage record: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async checkHealth(): Promise<{ ok: boolean }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}
