import { Wifi, WifiOff, CloudUpload, Loader2 } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, doSync } = useOfflineQueue();

  return (
    <div className="flex items-center gap-2">
      {/* Pending queue badge */}
      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2"
              onClick={doSync}
              disabled={!isOnline || isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                {pendingCount}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing
              ? 'Menyinkronkan...'
              : isOnline
                ? `${pendingCount} operasi menunggu sinkronisasi. Klik untuk sync.`
                : `${pendingCount} operasi tersimpan offline`}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Online/Offline status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline ? 'Online' : 'Offline — operasi akan disimpan dan disinkronkan nanti'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
