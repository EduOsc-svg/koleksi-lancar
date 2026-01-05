import React, { createContext, useContext, ReactNode } from 'react';
import { useGitMonitor } from '@/hooks/useGitMonitor';
import { GitWarningBanner, GitStatusIndicator } from '@/components/GitWarningBanner';
import { useToast } from '@/hooks/use-toast';

interface GitWarningProviderProps {
  children: ReactNode;
  threshold?: number;
  autoCheck?: boolean;
  checkInterval?: number;
  showBanner?: boolean;
  showIndicator?: boolean;
  showToast?: boolean;
  indicatorPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface GitWarningContextType {
  gitStatus: any;
  currentBranch: string;
  warnings: string[];
  recommendations: string[];
  isLoading: boolean;
  refreshStatus: () => Promise<any>;
  shouldWarn: boolean;
}

const GitWarningContext = createContext<GitWarningContextType | undefined>(undefined);

/**
 * Provider untuk sistem peringatan git yang bisa digunakan di seluruh aplikasi
 */
export function GitWarningProvider({
  children,
  threshold = 3,
  autoCheck = true,
  checkInterval = 60000, // 1 menit untuk provider level
  showBanner = true,
  showIndicator = true,
  showToast = false,
  indicatorPosition = 'top-right'
}: GitWarningProviderProps) {
  const { toast } = useToast();

  const gitMonitor = useGitMonitor({
    threshold,
    autoCheck,
    checkInterval,
    onWarning: (warnings, recommendations) => {
      if (showToast && warnings.length > 0) {
        toast({
          title: 'Git Workflow Warning',
          description: warnings[0],
          variant: 'destructive',
        });
      }
    }
  });

  return (
    <GitWarningContext.Provider value={gitMonitor}>
      {children}
      
      {/* Banner Warning */}
      {showBanner && gitMonitor.shouldWarn && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <GitWarningBanner 
            threshold={threshold}
            autoCheck={false}
          />
        </div>
      )}

      {/* Status Indicator */}
      {showIndicator && (
        <GitStatusIndicator 
          threshold={threshold}
          position={indicatorPosition}
        />
      )}
    </GitWarningContext.Provider>
  );
}

/**
 * Hook untuk menggunakan context git warning
 */
export function useGitWarning() {
  const context = useContext(GitWarningContext);
  if (context === undefined) {
    throw new Error('useGitWarning must be used within a GitWarningProvider');
  }
  return context;
}

/**
 * Higher-order component untuk menambahkan git monitoring ke komponen
 */
export function withGitWarning<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<GitWarningProviderProps> = {}
) {
  return function WrappedComponent(props: P) {
    return (
      <GitWarningProvider {...options}>
        <Component {...props} />
      </GitWarningProvider>
    );
  };
}