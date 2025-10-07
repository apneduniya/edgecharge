import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: StatsCardProps) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</CardTitle>
        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {description}
          </p>
        )}
        {trend && (
          <p className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 
            trend.direction === 'down' ? 'text-red-600 dark:text-red-400' : 
            'text-slate-500 dark:text-slate-400'
          }`}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
