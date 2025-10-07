import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIcon } from "@/components/shared/status-icon";
import { AddressDisplay } from "@/components/shared/address-display";
import { formatDateTime } from "@/lib/utils";
import { UsageAnchor } from "@/lib/types";

interface RecentActivityProps {
  anchors: UsageAnchor[];
}

export function RecentActivity({ anchors }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest anchors and invoice updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {anchors.slice(0, 3).map((anchor) => (
            <div key={anchor.id} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <StatusIcon status={anchor.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Usage anchor confirmed
                </p>
                <p className="text-sm text-muted-foreground">
                  {anchor.totalUsage.toFixed(2)} units • {formatDateTime(anchor.windowStart)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <AddressDisplay 
                  address={anchor.transactionHash} 
                  showExplorer={true}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
