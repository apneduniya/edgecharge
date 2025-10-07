import { DataTable } from "@/components/shared/data-table";
import type { Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { TrendIcon } from "@/components/shared/status-icon";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Project } from "@/lib/types";

interface ProjectTableProps {
  projects: Project[];
  onView?: (project: Project) => void;
  onMore?: (project: Project) => void;
}

export function ProjectTable({ projects, onView, onMore }: ProjectTableProps) {
  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project',
      render: (value, row) => (
        <div>
          <div className="font-semibold">{String(value)}</div>
          <div className="text-sm text-muted-foreground">{row.id}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={String(value)} />,
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (value) => `${Number(value).toFixed(2)} units`,
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'providers',
      label: 'Providers',
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (value) => <TrendIcon trend={String(value)} />,
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (value) => formatDate(Number(value)),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={projects}
      onView={onView}
      onMore={onMore}
    />
  );
}
