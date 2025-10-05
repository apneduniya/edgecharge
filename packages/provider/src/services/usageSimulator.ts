import { UsageSimulationConfig, UsageMetrics, SimulationResult } from '../domain/usageSimulation.js';

export interface IUsageSimulator {
  simulateUsage(): SimulationResult;
}

export class UsageSimulator implements IUsageSimulator {
  private config: UsageSimulationConfig;
  private lastGpuUsage: number;
  private lastBandwidthUsage: number;

  constructor(config: UsageSimulationConfig) {
    this.config = config;
    // Initialize with random starting values
    this.lastGpuUsage = this.randomInRange(config.gpuUsage.min, config.gpuUsage.max);
    this.lastBandwidthUsage = this.randomInRange(config.bandwidthUsage.min, config.bandwidthUsage.max);
  }

  simulateUsage(): SimulationResult {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.config.windowDurationSeconds;
    const windowEnd = now;

    const metrics = this.generateMetrics();
    
    return {
      metrics,
      timestamp: now,
      windowStart,
      windowEnd,
    };
  }

  private generateMetrics(): UsageMetrics {
    // Simulate realistic usage patterns with some correlation between GPU and bandwidth
    const gpuUtilization = this.simulateGpuUsage();
    const bandwidthBytes = this.simulateBandwidthUsage();
    
    // Compute units are derived from both GPU utilization and bandwidth
    // Higher GPU usage typically correlates with more data processing
    const computeUnits = Math.floor(
      (gpuUtilization * 10) + // Base units from GPU
      (bandwidthBytes / (1024 * 1024)) * 0.1 + // Additional units from bandwidth
      Math.random() * 5 // Some randomness
    );

    return {
      gpuUtilization,
      bandwidthBytes,
      computeUnits,
    };
  }

  private simulateGpuUsage(): number {
    // Simulate gradual changes in GPU usage with some variance
    const target = this.randomInRange(this.config.gpuUsage.min, this.config.gpuUsage.max);
    const variance = this.config.gpuUsage.variance;
    
    // Move towards target with some randomness
    const change = (target - this.lastGpuUsage) * (1 - variance) + 
                   (Math.random() - 0.5) * variance * 20;
    
    this.lastGpuUsage = Math.max(0, Math.min(100, this.lastGpuUsage + change));
    return Math.round(this.lastGpuUsage * 100) / 100; // Round to 2 decimal places
  }

  private simulateBandwidthUsage(): number {
    // Simulate bandwidth usage with some correlation to GPU usage
    const baseBandwidth = this.randomInRange(this.config.bandwidthUsage.min, this.config.bandwidthUsage.max);
    const variance = this.config.bandwidthUsage.variance;
    
    // Higher GPU usage might indicate more data processing
    const gpuMultiplier = 1 + (this.lastGpuUsage / 100) * 0.5;
    const change = (baseBandwidth - this.lastBandwidthUsage) * (1 - variance) + 
                   (Math.random() - 0.5) * variance * this.lastBandwidthUsage;
    
    this.lastBandwidthUsage = Math.max(0, this.lastBandwidthUsage + change);
    return Math.round(this.lastBandwidthUsage * gpuMultiplier);
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
