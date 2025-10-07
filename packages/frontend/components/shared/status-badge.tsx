import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG } from "@/lib/constants";
import { StatusVariant } from "@/lib/types";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  
  if (!config) {
    return (
      <Badge 
        variant="secondary" 
        className={`px-3 py-1 text-xs font-semibold rounded-full ${className}`}
      >
        {status}
      </Badge>
    );
  }

  const variantClasses = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    secondary: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    outline: "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  };

  return (
    <Badge 
      className={`px-3 py-1 text-xs font-semibold rounded-full ${variantClasses[config.variant as keyof typeof variantClasses]} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
