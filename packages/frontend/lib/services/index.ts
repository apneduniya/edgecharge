// Service factory and main exports
import { BlockchainService } from './blockchainService';
import { InvoicingService } from './invoicingService';
import { ProjectService } from './projectService';
import { AnalyticsService } from './analyticsService';
import { 
  IBlockchainService, 
  IInvoicingService, 
  IProjectService, 
  IAnalyticsService,
  ServiceConfig 
} from './interfaces';

// Service factory class
export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getBlockchainService(): IBlockchainService {
    if (!this.services.has('blockchain')) {
      this.services.set('blockchain', new BlockchainService());
    }
    return this.services.get('blockchain');
  }

  getInvoicingService(): IInvoicingService {
    if (!this.services.has('invoicing')) {
      this.services.set('invoicing', new InvoicingService());
    }
    return this.services.get('invoicing');
  }

  getProjectService(): IProjectService {
    if (!this.services.has('project')) {
      this.services.set('project', new ProjectService());
    }
    return this.services.get('project');
  }

  getAnalyticsService(): IAnalyticsService {
    if (!this.services.has('analytics')) {
      this.services.set('analytics', new AnalyticsService());
    }
    return this.services.get('analytics');
  }

  // Method to configure services with custom config
  configure(config: Partial<ServiceConfig>): void {
    // This would allow for custom configuration of services
    console.log('Configuring services with:', config);
  }

  // Method to clear all services (useful for testing)
  clear(): void {
    this.services.clear();
  }
}

// Convenience function to get service factory instance
export const getServiceFactory = (): ServiceFactory => {
  return ServiceFactory.getInstance();
};

// Convenience functions to get individual services
export const getBlockchainService = (): IBlockchainService => {
  return getServiceFactory().getBlockchainService();
};

export const getInvoicingService = (): IInvoicingService => {
  return getServiceFactory().getInvoicingService();
};

export const getProjectService = (): IProjectService => {
  return getServiceFactory().getProjectService();
};

export const getAnalyticsService = (): IAnalyticsService => {
  return getServiceFactory().getAnalyticsService();
};

// Export all interfaces and types
export * from './interfaces';

// Export individual services
export { BlockchainService } from './blockchainService';
export { InvoicingService } from './invoicingService';
export { ProjectService } from './projectService';
export { AnalyticsService } from './analyticsService';
