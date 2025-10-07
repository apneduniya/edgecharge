import fs from 'node:fs';
import path from 'node:path';
import { RateCard, RateCardConfig, RateCardConfigSchema, DEFAULT_RATE_CARDS } from '../domain/rateCard.js';
import { loadEnv } from '../config/env.js';

export interface IRateCardService {
  getRateCard(rateId: string, provider: string): Promise<RateCard | null>;
  getAllRateCards(): Promise<RateCard[]>;
  getActiveRateCards(): Promise<RateCard[]>;
  calculateCost(rateId: string, provider: string, unitsConsumed: number): Promise<number>;
  loadRateCards(): Promise<void>;
  saveRateCards(): Promise<void>;
}

export class RateCardService implements IRateCardService {
  private rateCards: RateCard[] = [];
  private env: ReturnType<typeof loadEnv>;
  private configFilePath: string;

  constructor() {
    this.env = loadEnv();
    this.configFilePath = path.resolve(this.env.RATE_CARD_FILE);
  }

  async loadRateCards(): Promise<void> {
    try {
      // Check if rate card file exists
      if (fs.existsSync(this.configFilePath)) {
        const fileContent = fs.readFileSync(this.configFilePath, 'utf8');
        const config = JSON.parse(fileContent);
        const validatedConfig = RateCardConfigSchema.parse(config);
        
        this.rateCards = [
          ...validatedConfig.defaultRateCards,
          ...validatedConfig.customRateCards,
        ];
        
        console.log(`📋 Loaded ${this.rateCards.length} rate cards from ${this.configFilePath}`);
      } else {
        // Initialize with default rate cards
        this.rateCards = [...DEFAULT_RATE_CARDS];
        await this.saveRateCards();
        console.log(`📋 Initialized with ${this.rateCards.length} default rate cards`);
      }
    } catch (error) {
      console.error('❌ Error loading rate cards:', error);
      // Fallback to default rate cards
      this.rateCards = [...DEFAULT_RATE_CARDS];
      console.log('📋 Using default rate cards as fallback');
    }
  }

  async saveRateCards(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const config: RateCardConfig = {
        defaultRateCards: DEFAULT_RATE_CARDS,
        customRateCards: this.rateCards.filter(rc => !DEFAULT_RATE_CARDS.some(drc => drc.rateId === rc.rateId)),
      };

      fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2));
      console.log(`💾 Saved rate cards to ${this.configFilePath}`);
    } catch (error) {
      console.error('❌ Error saving rate cards:', error);
      throw error;
    }
  }

  async getRateCard(rateId: string, provider: string): Promise<RateCard | null> {
    const now = Math.floor(Date.now() / 1000);
    
    const rateCard = this.rateCards.find(rc => 
      rc.rateId === rateId && 
      rc.provider.toLowerCase() === provider.toLowerCase() &&
      rc.isActive &&
      rc.effectiveFrom <= now &&
      (rc.effectiveTo === undefined || rc.effectiveTo >= now)
    );

    return rateCard || null;
  }

  async getAllRateCards(): Promise<RateCard[]> {
    return [...this.rateCards];
  }

  async getActiveRateCards(): Promise<RateCard[]> {
    const now = Math.floor(Date.now() / 1000);
    
    return this.rateCards.filter(rc => 
      rc.isActive &&
      rc.effectiveFrom <= now &&
      (rc.effectiveTo === undefined || rc.effectiveTo >= now)
    );
  }

  async calculateCost(rateId: string, provider: string, unitsConsumed: number): Promise<number> {
    const rateCard = await this.getRateCard(rateId, provider);
    
    if (!rateCard) {
      console.warn(`⚠️  No active rate card found for rateId: ${rateId}, provider: ${provider}`);
      // Return a default cost calculation
      return Math.max(0.01, unitsConsumed * 0.001); // $0.001 per unit, minimum $0.01
    }

    let cost = 0;

    switch (rateCard.billingType) {
      case 'per_unit':
        cost = unitsConsumed * rateCard.unitPrice;
        break;
      case 'per_hour':
        // For per_hour billing, we need to calculate hours from the usage data
        // This is a simplified calculation - in practice, you'd need more context
        const hours = Math.max(1, unitsConsumed / 3600); // Assume 1 hour minimum
        cost = hours * rateCard.unitPrice;
        break;
      case 'per_gb':
        const gb = unitsConsumed / (1024 * 1024 * 1024); // Convert to GB
        cost = gb * rateCard.unitPrice;
        break;
      case 'per_mb':
        const mb = unitsConsumed / (1024 * 1024); // Convert to MB
        cost = mb * rateCard.unitPrice;
        break;
      default:
        cost = unitsConsumed * rateCard.unitPrice;
    }

    // Apply minimum charge
    if (rateCard.minimumCharge && cost < rateCard.minimumCharge) {
      cost = rateCard.minimumCharge;
    }

    // Apply maximum charge if specified
    if (rateCard.maximumCharge && cost > rateCard.maximumCharge) {
      cost = rateCard.maximumCharge;
    }

    // Round to 2 decimal places
    return Math.round(cost * 100) / 100;
  }

  // Helper method to add or update a rate card
  async addOrUpdateRateCard(rateCard: RateCard): Promise<void> {
    const existingIndex = this.rateCards.findIndex(rc => 
      rc.rateId === rateCard.rateId && 
      rc.provider.toLowerCase() === rateCard.provider.toLowerCase()
    );

    if (existingIndex >= 0) {
      this.rateCards[existingIndex] = rateCard;
      console.log(`📝 Updated rate card: ${rateCard.rateId}`);
    } else {
      this.rateCards.push(rateCard);
      console.log(`➕ Added new rate card: ${rateCard.rateId}`);
    }

    await this.saveRateCards();
  }

  // Helper method to get rate card by ID only (for backward compatibility)
  async getRateCardById(rateId: string): Promise<RateCard | null> {
    const now = Math.floor(Date.now() / 1000);
    
    const rateCard = this.rateCards.find(rc => 
      rc.rateId === rateId &&
      rc.isActive &&
      rc.effectiveFrom <= now &&
      (rc.effectiveTo === undefined || rc.effectiveTo >= now)
    );

    return rateCard || null;
  }
}
