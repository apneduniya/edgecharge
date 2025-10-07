import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageData, Project } from "@/lib/types";

interface UsageAnalyticsProps {
  usageData: UsageData[];
  projects: Project[];
}

export function UsageAnalytics({ usageData, projects }: UsageAnalyticsProps) {
  const maxUsage = Math.max(...projects.map(p => p.usage));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Usage Trend</CardTitle>
          <CardDescription>
            Daily usage patterns over the last week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usageData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{data.date}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">{data.usage} units</span>
                  <span className="text-sm font-medium">${data.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Breakdown</CardTitle>
          <CardDescription>
            Usage distribution across projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{project.name}</span>
                  <span className="text-sm">{project.usage.toFixed(2)} units</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${(project.usage / maxUsage) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
