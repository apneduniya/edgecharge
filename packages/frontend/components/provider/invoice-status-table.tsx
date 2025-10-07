import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusIcon } from "@/components/shared/status-icon";
import { AddressDisplay } from "@/components/shared/address-display";
import { Hash } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Invoice } from "@/lib/types";

interface InvoiceStatusTableProps {
  invoices: Invoice[];
  onView?: (invoice: Invoice) => void;
  onMore?: (invoice: Invoice) => void;
}

export function InvoiceStatusTable({ 
  invoices, 
  onView, 
  onMore 
}: InvoiceStatusTableProps) {
  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      label: 'Invoice ID',
    },
    {
      key: 'invoiceHash',
      label: 'Invoice Hash',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Hash className="h-3 w-3" />
          <AddressDisplay address={String(value)} showCopy={true} />
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
      render: (value) => (
        <div className="flex items-center space-x-2">
          <StatusIcon status={String(value)} />
          <StatusBadge status={String(value)} />
        </div>
      ),
    },
    {
      key: 'anchoredDate',
      label: 'Anchored Date',
      render: (value) => value ? formatDate(Number(value)) : "Not anchored",
    },
    {
      key: 'transactionHash',
      label: 'Transaction',
      render: (value) => value ? (
        <AddressDisplay address={String(value)} showExplorer={true} />
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={invoices}
      onView={onView}
      onMore={onMore}
    />
  );
}
