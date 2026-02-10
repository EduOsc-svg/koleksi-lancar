import { useState, useEffect, useCallback, useRef } from 'react';
import { syncQueue, getQueueCount } from '@/lib/offlineQueue';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineQueue() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(getQueueCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(() => {
    setPendingCount(getQueueCount());
  }, []);

  const doSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    const count = getQueueCount();
    if (count === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const result = await syncQueue();
      if (result.synced > 0) {
        toast.success(`${result.synced} operasi berhasil disinkronkan`);
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['payment_logs'] });
        queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
        queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
        queryClient.invalidateQueries({ queryKey: ['collection_trend'] });
        queryClient.invalidateQueries({ queryKey: ['aggregated_payments'] });
        queryClient.invalidateQueries({ queryKey: ['installment_coupons'] });
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} operasi gagal disinkronkan`);
      }
    } catch {
      toast.error('Gagal menyinkronkan antrian offline');
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      refreshCount();
    }
  }, [queryClient, refreshCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      doSync();
    }
  }, [isOnline, doSync]);

  // Listen for queue changes from other parts of the app
  useEffect(() => {
    const handler = () => refreshCount();
    window.addEventListener('offline-queue-updated', handler);
    return () => window.removeEventListener('offline-queue-updated', handler);
  }, [refreshCount]);

  return { isOnline, pendingCount, isSyncing, doSync, refreshCount };
}

/** Dispatch this event after adding to queue so the count updates */
export function notifyQueueUpdated() {
  window.dispatchEvent(new Event('offline-queue-updated'));
}
