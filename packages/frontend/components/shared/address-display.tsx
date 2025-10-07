import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { EXPLORER_URLS } from "@/lib/constants";

interface AddressDisplayProps {
  address: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  maxLength?: number;
  className?: string;
}

export function AddressDisplay({ 
  address, 
  showCopy = true, 
  showExplorer = false,
  className = ""
}: AddressDisplayProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    // In real app, show toast notification
    console.log("Copied to clipboard:", address);
  };

  const handleViewExplorer = () => {
    const explorerUrl = `${EXPLORER_URLS.u2u}/tx/${address}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="font-mono text-sm truncate max-w-[120px]">
        {formatAddress(address)}
      </span>
      
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
      
      {showExplorer && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewExplorer}
          className="h-6 w-6 p-0"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
