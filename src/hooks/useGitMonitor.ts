import { useState, useEffect, useCallback } from 'react';
import { 
  getGitStatus, 
  checkGitWarnings, 
  getCurrentBranch,
  GitStatus 
} from '@/lib/gitUtils';

interface UseGitMonitorOptions {
  threshold?: number;
  autoCheck?: boolean;
  checkInterval?: number;
  onWarning?: (warnings: string[], recommendations: string[]) => void;
}

interface GitMonitorState {
  gitStatus: GitStatus | null;
  currentBranch: string;
  warnings: string[];
  recommendations: string[];
  isLoading: boolean;
  lastCheck: Date | null;
  shouldWarn: boolean;
}

/**
 * Custom hook untuk memantau status git secara otomatis
 */
export function useGitMonitor({
  threshold = 3,
  autoCheck = true,
  checkInterval = 30000, // 30 detik
  onWarning
}: UseGitMonitorOptions = {}) {
  const [state, setState] = useState<GitMonitorState>({
    gitStatus: null,
    currentBranch: '',
    warnings: [],
    recommendations: [],
    isLoading: false,
    lastCheck: null,
    shouldWarn: false
  });

  const checkGitStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const gitStatus = await getGitStatus();
      const currentBranch = await getCurrentBranch();
      const warningResult = await checkGitWarnings({ threshold });

      const newState: GitMonitorState = {
        gitStatus,
        currentBranch,
        warnings: warningResult.warnings,
        recommendations: warningResult.recommendations,
        isLoading: false,
        lastCheck: new Date(),
        shouldWarn: warningResult.shouldWarn
      };

      setState(newState);

      // Call onWarning callback if there are warnings
      if (warningResult.shouldWarn && onWarning) {
        onWarning(warningResult.warnings, warningResult.recommendations);
      }

      return newState;
    } catch (error) {
      console.error('Error checking git status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastCheck: new Date()
      }));
    }
  }, [threshold, onWarning]);

  const refreshStatus = useCallback(() => {
    return checkGitStatus();
  }, [checkGitStatus]);

  useEffect(() => {
    // Initial check
    checkGitStatus();

    if (autoCheck) {
      const interval = setInterval(checkGitStatus, checkInterval);
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval, checkGitStatus]);

  return {
    ...state,
    refreshStatus
  };
}

/**
 * Hook sederhana untuk mendapatkan status git saat ini tanpa auto-monitoring
 */
export function useGitStatus() {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await getGitStatus();
      setGitStatus(status);
      return status;
    } catch (error) {
      console.error('Error fetching git status:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    gitStatus,
    isLoading,
    refreshStatus: fetchStatus
  };
}