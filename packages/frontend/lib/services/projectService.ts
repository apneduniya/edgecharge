import { 
  IProjectService, 
  Project, 
  ServiceError 
} from './interfaces';

export class ProjectService implements IProjectService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${this.baseUrl}/enterprise/projects`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      return data.data.map(this.transformProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new ServiceError(`Failed to fetch projects: ${error}`, 'PROJECT_FETCH_ERROR');
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    try {
      const response = await fetch(`${this.baseUrl}/enterprise/projects/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch project');
      }

      return this.transformProject(data.data);
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw new ServiceError(`Failed to fetch project: ${error}`, 'PROJECT_FETCH_ERROR');
    }
  }

  async getProjectUsage(
    projectId: string, 
    startTime?: number, 
    endTime?: number
  ): Promise<number> {
    try {
      const params = new URLSearchParams();
      if (startTime) params.append('startTime', startTime.toString());
      if (endTime) params.append('endTime', endTime.toString());

      const response = await fetch(
        `${this.baseUrl}/enterprise/projects/${projectId}/usage?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch project usage');
      }

      return data.data.usage || 0;
    } catch (error) {
      console.error(`Error fetching usage for project ${projectId}:`, error);
      throw new ServiceError(`Failed to fetch project usage: ${error}`, 'USAGE_FETCH_ERROR');
    }
  }

  async getProjectCost(
    projectId: string, 
    startTime?: number, 
    endTime?: number
  ): Promise<number> {
    try {
      const params = new URLSearchParams();
      if (startTime) params.append('startTime', startTime.toString());
      if (endTime) params.append('endTime', endTime.toString());

      const response = await fetch(
        `${this.baseUrl}/enterprise/projects/${projectId}/cost?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch project cost');
      }

      return data.data.cost || 0;
    } catch (error) {
      console.error(`Error fetching cost for project ${projectId}:`, error);
      throw new ServiceError(`Failed to fetch project cost: ${error}`, 'COST_FETCH_ERROR');
    }
  }

  private transformProject(data: any): Project {
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      usage: data.usage,
      cost: data.cost,
      lastUpdated: data.lastUpdated,
      providers: data.providers,
      trend: data.trend,
    };
  }

  // Helper methods for project management
  async createProject(projectData: Partial<Project>): Promise<Project> {
    try {
      const response = await fetch(`${this.baseUrl}/enterprise/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create project');
      }

      return this.transformProject(data.data);
    } catch (error) {
      console.error('Error creating project:', error);
      throw new ServiceError(`Failed to create project: ${error}`, 'PROJECT_CREATE_ERROR');
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    try {
      const response = await fetch(`${this.baseUrl}/enterprise/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update project');
      }

      return this.transformProject(data.data);
    } catch (error) {
      console.error(`Error updating project ${projectId}:`, error);
      throw new ServiceError(`Failed to update project: ${error}`, 'PROJECT_UPDATE_ERROR');
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/enterprise/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error);
      throw new ServiceError(`Failed to delete project: ${error}`, 'PROJECT_DELETE_ERROR');
    }
  }

  // Helper method to get project status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  // Helper method to get trend icon
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  }

  // Helper method to format usage
  formatUsage(usage: number): string {
    if (usage >= 1000000) {
      return `${(usage / 1000000).toFixed(1)}M`;
    } else if (usage >= 1000) {
      return `${(usage / 1000).toFixed(1)}K`;
    }
    return usage.toFixed(1);
  }

  // Helper method to format cost
  formatCost(cost: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cost);
  }
}
