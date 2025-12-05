import { useState, useEffect, useCallback } from "react";
import {
  subscribeToNetworkStatus,
  subscribeToQueueChanges,
  checkNetworkStatus,
  getNetworkStatus,
  getOfflineQueue,
  clearCache,
  getCacheSize,
} from "@/lib/offline-storage";

type OfflineState = {
  isOnline: boolean;
  isLoading: boolean;
  pendingActions: number;
  cacheSize: number;
};

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: getNetworkStatus(),
    isLoading: true,
    pendingActions: 0,
    cacheSize: 0,
  });

  useEffect(() => {
    const init = async () => {
      const online = await checkNetworkStatus();
      const queue = await getOfflineQueue();
      const cache = await getCacheSize();

      setState({
        isOnline: online,
        isLoading: false,
        pendingActions: queue.length,
        cacheSize: cache.count,
      });
    };

    init();

    const unsubscribeNetwork = subscribeToNetworkStatus(async (online) => {
      const queue = await getOfflineQueue();
      setState((prev) => ({
        ...prev,
        isOnline: online,
        pendingActions: queue.length,
      }));
    });

    const unsubscribeQueue = subscribeToQueueChanges((count) => {
      setState((prev) => ({
        ...prev,
        pendingActions: count,
      }));
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeQueue();
    };
  }, []);

  const refreshStatus = useCallback(async () => {
    const online = await checkNetworkStatus();
    const queue = await getOfflineQueue();
    const cache = await getCacheSize();

    setState({
      isOnline: online,
      isLoading: false,
      pendingActions: queue.length,
      cacheSize: cache.count,
    });
  }, []);

  const clearOfflineCache = useCallback(async () => {
    await clearCache();
    await refreshStatus();
  }, [refreshStatus]);

  return {
    ...state,
    refreshStatus,
    clearCache: clearOfflineCache,
  };
}
