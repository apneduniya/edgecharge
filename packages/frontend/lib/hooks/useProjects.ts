import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectService } from '../services';
import { Project } from '../services/interfaces';

// Hook for fetching all projects
export function useProjects() {
  const projectService = getProjectService();

  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Hook for fetching a specific project
export function useProject(projectId: string) {
  const projectService = getProjectService();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId),
    enabled: !!projectId,
    staleTime: 60000, // 1 minute
  });
}

// Hook for fetching project usage
export function useProjectUsage(
  projectId: string, 
  startTime?: number, 
  endTime?: number
) {
  const projectService = getProjectService();

  return useQuery({
    queryKey: ['project', 'usage', projectId, startTime, endTime],
    queryFn: () => projectService.getProjectUsage(projectId, startTime, endTime),
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
  });
}

// Hook for fetching project cost
export function useProjectCost(
  projectId: string, 
  startTime?: number, 
  endTime?: number
) {
  const projectService = getProjectService();

  return useQuery({
    queryKey: ['project', 'cost', projectId, startTime, endTime],
    queryFn: () => projectService.getProjectCost(projectId, startTime, endTime),
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
  });
}

// Hook for creating a project
export function useCreateProject() {
  const projectService = getProjectService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: Partial<Project>) => projectService.createProject(projectData),
    onSuccess: (newProject) => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Add the new project to the cache
      queryClient.setQueryData(['project', newProject.id], newProject);
    },
  });
}

// Hook for updating a project
export function useUpdateProject() {
  const projectService = getProjectService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: Partial<Project> }) =>
      projectService.updateProject(projectId, updates),
    onSuccess: (updatedProject) => {
      // Update the project in the cache
      queryClient.setQueryData(['project', updatedProject.id], updatedProject);
      // Invalidate projects list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Hook for deleting a project
export function useDeleteProject() {
  const projectService = getProjectService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: (_, projectId) => {
      // Remove the project from the cache
      queryClient.removeQueries({ queryKey: ['project', projectId] });
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Hook for refreshing project data
export function useRefreshProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all project-related queries
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

// Hook for project statistics
export function useProjectStats() {
  const { data: projects, isLoading, error } = useProjects();

  const stats = projects ? {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    paused: projects.filter(p => p.status === 'paused').length,
    inactive: projects.filter(p => p.status === 'inactive').length,
    totalUsage: projects.reduce((sum, p) => sum + p.usage, 0),
    totalCost: projects.reduce((sum, p) => sum + p.cost, 0),
    averageUsage: projects.length > 0 ? projects.reduce((sum, p) => sum + p.usage, 0) / projects.length : 0,
    averageCost: projects.length > 0 ? projects.reduce((sum, p) => sum + p.cost, 0) / projects.length : 0,
  } : null;

  return {
    stats,
    isLoading,
    error,
  };
}
