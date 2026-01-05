import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  GitCommit, 
  Download, 
  Upload, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { 
  getGitStatus, 
  checkGitWarnings, 
  pullFromRemote, 
  pushToRemote, 
  commitAllChanges,
  getCurrentBranch 
} from '@/lib/gitUtils';
import type { GitStatus } from '@/lib/gitUtils';

interface GitWarningBannerProps {
  className?: string;
  threshold?: number;
  autoCheck?: boolean;
  checkInterval?: number;
}

export function GitWarningBanner({ 
  className = '', 
  threshold = 3,
  autoCheck = true,
  checkInterval = 30000 // 30 detik
}: GitWarningBannerProps) {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkGitStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getGitStatus();
      const branch = await getCurrentBranch();
      const warningResult = await checkGitWarnings({ threshold });

      setGitStatus(status);
      setCurrentBranch(branch);
      setWarnings(warningResult.warnings);
      setRecommendations(warningResult.recommendations);
      setIsVisible(warningResult.shouldWarn);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking git status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    try {
      const result = await pullFromRemote();
      if (result.success) {
        await checkGitStatus(); // Refresh status setelah pull
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    setIsLoading(true);
    try {
      const result = await pushToRemote();
      if (result.success) {
        await checkGitStatus(); // Refresh status setelah push
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    const message = prompt('Masukkan commit message:');
    if (!message) return;

    setIsLoading(true);
    try {
      const result = await commitAllChanges(message);
      if (result.success) {
        await checkGitStatus(); // Refresh status setelah commit
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    checkGitStatus();

    if (autoCheck) {
      const interval = setInterval(checkGitStatus, checkInterval);
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval, threshold]);

  if (!isVisible) return null;

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Peringatan Git Workflow
            </AlertTitle>
            <Badge variant="outline" className="ml-auto">
              <GitBranch className="h-3 w-3 mr-1" />
              {currentBranch}
            </Badge>
          </div>
          
          <AlertDescription className="text-amber-700 space-y-2">
            {/* Status File */}
            {gitStatus && (
              <div className="flex flex-wrap gap-2 mb-3">
                {gitStatus.modifiedFiles > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <GitCommit className="h-3 w-3 mr-1" />
                    {gitStatus.modifiedFiles} Modified
                  </Badge>
                )}
                {gitStatus.addedFiles > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ➕ {gitStatus.addedFiles} Added
                  </Badge>
                )}
                {gitStatus.deletedFiles > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    ➖ {gitStatus.deletedFiles} Deleted
                  </Badge>
                )}
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  Total: {gitStatus.totalChanges} files
                </Badge>
              </div>
            )}

            {/* Peringatan */}
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}

            {/* Rekomendasi */}
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-700">{recommendation}</span>
              </div>
            ))}
          </AlertDescription>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              onClick={handleCommit}
              size="sm"
              variant="outline"
              disabled={isLoading || !gitStatus?.hasChanges}
              className="bg-white hover:bg-gray-50"
            >
              <GitCommit className="h-4 w-4 mr-2" />
              Commit Changes
            </Button>

            <Button
              onClick={handlePull}
              size="sm"
              variant="outline"
              disabled={isLoading}
              className="bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Pull Remote
            </Button>

            <Button
              onClick={handlePush}
              size="sm"
              variant="outline"
              disabled={isLoading || !gitStatus?.hasChanges}
              className="bg-white hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Push Changes
            </Button>

            <Button
              onClick={checkGitStatus}
              size="sm"
              variant="ghost"
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Last Check Info */}
          {lastCheck && (
            <div className="text-xs text-amber-600 mt-2">
              Terakhir dicek: {lastCheck.toLocaleTimeString('id-ID')}
            </div>
          )}
        </div>

        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

// Komponen sederhana untuk menampilkan status git di sudut layar
interface GitStatusIndicatorProps {
  threshold?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function GitStatusIndicator({ 
  threshold = 3, 
  position = 'top-right' 
}: GitStatusIndicatorProps) {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [showFullWarning, setShowFullWarning] = useState(false);

  const checkStatus = async () => {
    const status = await getGitStatus();
    setGitStatus(status);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (!gitStatus?.isMoreThan3Files) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      <Button
        onClick={() => setShowFullWarning(!showFullWarning)}
        size="sm"
        variant="outline"
        className="bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        {gitStatus.totalChanges} files changed
      </Button>

      {showFullWarning && (
        <div className="absolute top-full mt-2 w-96 z-10">
          <GitWarningBanner 
            threshold={threshold}
            autoCheck={false}
          />
        </div>
      )}
    </div>
  );
}