import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Invoice } from "@/lib/types";

interface InvoiceTableProps {
  invoices: Invoice[];
  onView?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
}

export function InvoiceTable({ 
  invoices, 
  onView, 
  onDownload
}: InvoiceTableProps) {
  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      label: 'Invoice ID',
    },
    {
      key: 'projectName',
      label: 'Project',
      render: (value, row) => (
        <div>
          <div className="font-medium">{String(value)}</div>
          {row.projectId && (
            <div className="text-sm text-muted-foreground">{row.projectId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={String(value)} />,
    },
    {
      key: 'generatedDate',
      label: 'Generated',
      render: (value) => formatDate(Number(value)),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value) => formatDate(Number(value)),
    },
    {
      key: 'actions' as keyof Invoice, // Using 'actions' as unique key
      label: 'Actions',
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(row)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDownload(row)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={invoices}
      showActions={false}
    />
  );
}
