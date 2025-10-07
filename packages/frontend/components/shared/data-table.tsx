import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";

export interface Column<T = Record<string, unknown>> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  onView?: (row: T) => void;
  onMore?: (row: T) => void;
  showActions?: boolean;
}

export function DataTable<T = Record<string, unknown>>({ 
  columns, 
  data, 
  onView, 
  onMore, 
  showActions = true 
}: DataTableProps<T>) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={`px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 ${column.className}`}>
                {column.label}
              </TableHead>
            ))}
            {showActions && (
              <TableHead key="actions-header" className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {columns.map((column) => (
                <TableCell key={String(column.key)} className={`px-6 py-4 ${column.className}`}>
                  {column.render 
                    ? column.render(row[column.key], row)
                    : String(row[column.key])
                  }
                </TableCell>
              ))}
              {showActions && (
                <TableCell key={`actions-${index}`} className="text-right px-6 py-4">
                  <div className="flex items-center justify-end space-x-2">
                    {onView && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onView(row)}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onMore && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onMore(row)}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
