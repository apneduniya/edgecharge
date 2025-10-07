import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusIcon } from "@/components/shared/status-icon";
import { AddressDisplay } from "@/components/shared/address-display";
import { formatDateTime } from "@/lib/utils";
import { UsageAnchor } from "@/lib/types";

interface AnchorTableProps {
  anchors: UsageAnchor[];
  onView?: (anchor: UsageAnchor) => void;
  onMore?: (anchor: UsageAnchor) => void;
}

export function AnchorTable({ anchors, onView, onMore }: AnchorTableProps) {
  const columns: Column<UsageAnchor>[] = [
    {
      key: 'id',
      label: 'Anchor ID',
      render: (value) => (
        <AddressDisplay address={String(value)} showCopy={true} />
      ),
    },
    {
      key: 'windowStart',
      label: 'Time Window',
      render: (value, row) => (
        <div className="text-sm">
          <div>{formatDateTime(Number(value))}</div>
          <div className="text-muted-foreground">
            to {formatDateTime(row.windowEnd)}
          </div>
        </div>
      ),
    },
    {
      key: 'totalUsage',
      label: 'Usage',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{Number(value).toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">units</span>
        </div>
      ),
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
      key: 'merkleRoot',
      label: 'Merkle Root',
      render: (value) => (
        <AddressDisplay address={String(value)} showCopy={true} />
      ),
    },
    {
      key: 'transactionHash',
      label: 'Transaction',
      render: (value) => (
        <AddressDisplay address={String(value)} showExplorer={true} />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={anchors}
      onView={onView}
      onMore={onMore}
    />
  );
}
