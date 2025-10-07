import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from "lucide-react";
import { STATUS_ICONS, TREND_ICONS } from "@/lib/constants";

interface StatusIconProps {
  status: string;
  className?: string;
}

interface TrendIconProps {
  trend: string;
  className?: string;
}

export function StatusIcon({ status, className }: StatusIconProps) {
  const iconName = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
  
  const iconProps = { className: `h-4 w-4 ${className || ''}` };
  
  switch (iconName) {
    case 'CheckCircle':
      return <CheckCircle {...iconProps} />;
    case 'AlertCircle':
      return <AlertCircle {...iconProps} />;
    case 'Clock':
      return <Clock {...iconProps} />;
    default:
      return <CheckCircle {...iconProps} />;
  }
}

export function TrendIcon({ trend, className }: TrendIconProps) {
  const iconName = TREND_ICONS[trend as keyof typeof TREND_ICONS];
  
  const iconProps = { className: `h-4 w-4 ${className || ''}` };
  
  switch (iconName) {
    case 'TrendingUp':
      return <TrendingUp {...iconProps} />;
    case 'TrendingDown':
      return <TrendingDown {...iconProps} />;
    case 'Minus':
      return <Minus {...iconProps} />;
    default:
      return <TrendingUp {...iconProps} />;
  }
}
