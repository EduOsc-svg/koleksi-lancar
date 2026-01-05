import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitStatus {
  modifiedFiles: number;
  addedFiles: number;
  deletedFiles: number;
  totalChanges: number;
  hasChanges: boolean;
  isMoreThan3Files: boolean;
}

export interface GitWarningOptions {
  threshold?: number;
  ignorePatterns?: string[];
}

/**
 * Mendapatkan status git untuk menghitung jumlah file yang berubah
 */
export async function getGitStatus(): Promise<GitStatus> {
  try {
    const { stdout } = await execAsync('git status --porcelain');
    const lines = stdout.trim().split('\n').filter(line => line.length > 0);
    
    let modifiedFiles = 0;
    let addedFiles = 0;
    let deletedFiles = 0;

    for (const line of lines) {
      const status = line.substring(0, 2);
      
      if (status.includes('M')) modifiedFiles++;
      if (status.includes('A')) addedFiles++;
      if (status.includes('D')) deletedFiles++;
    }

    const totalChanges = modifiedFiles + addedFiles + deletedFiles;

    return {
      modifiedFiles,
      addedFiles,
      deletedFiles,
      totalChanges,
      hasChanges: totalChanges > 0,
      isMoreThan3Files: totalChanges > 3
    };
  } catch (error) {
    console.error('Error getting git status:', error);
    return {
      modifiedFiles: 0,
      addedFiles: 0,
      deletedFiles: 0,
      totalChanges: 0,
      hasChanges: false,
      isMoreThan3Files: false
    };
  }
}

/**
 * Mengecek apakah ada remote changes yang perlu dipull
 */
export async function checkRemoteChanges(): Promise<boolean> {
  try {
    // Fetch latest dari remote
    await execAsync('git fetch');
    
    // Cek apakah ada commits di remote yang belum ada di local
    const { stdout } = await execAsync('git rev-list HEAD...@{u} --count');
    const behindCount = parseInt(stdout.trim(), 10);
    
    return behindCount > 0;
  } catch (error) {
    console.error('Error checking remote changes:', error);
    return false;
  }
}

/**
 * Mendapatkan informasi branch saat ini
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execAsync('git branch --show-current');
    return stdout.trim();
  } catch (error) {
    console.error('Error getting current branch:', error);
    return 'unknown';
  }
}

/**
 * Mengecek apakah working directory bersih (tidak ada uncommitted changes)
 */
export async function isWorkingDirectoryClean(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('git status --porcelain');
    return stdout.trim().length === 0;
  } catch (error) {
    console.error('Error checking working directory:', error);
    return false;
  }
}

/**
 * Pull dari remote branch
 */
export async function pullFromRemote(): Promise<{ success: boolean; message: string }> {
  try {
    const { stdout } = await execAsync('git pull');
    return {
      success: true,
      message: stdout
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Push ke remote branch
 */
export async function pushToRemote(): Promise<{ success: boolean; message: string }> {
  try {
    const { stdout } = await execAsync('git push');
    return {
      success: true,
      message: stdout
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Commit semua perubahan dengan pesan yang diberikan
 */
export async function commitAllChanges(message: string): Promise<{ success: boolean; message: string }> {
  try {
    await execAsync('git add .');
    const { stdout } = await execAsync(`git commit -m "${message}"`);
    return {
      success: true,
      message: stdout
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Mengecek dan memberikan peringatan berdasarkan status git
 */
export async function checkGitWarnings(options: GitWarningOptions = {}): Promise<{
  shouldWarn: boolean;
  warnings: string[];
  recommendations: string[];
}> {
  const threshold = options.threshold || 3;
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const gitStatus = await getGitStatus();
  const hasRemoteChanges = await checkRemoteChanges();
  const currentBranch = await getCurrentBranch();

  // Warning untuk banyak file yang berubah
  if (gitStatus.isMoreThan3Files) {
    warnings.push(
      `⚠️ Terdeteksi ${gitStatus.totalChanges} file yang berubah (lebih dari ${threshold} file)`
    );
    recommendations.push('📤 Pertimbangkan untuk melakukan commit dan push untuk menghindari konflik');
    
    if (hasRemoteChanges) {
      warnings.push('⚠️ Ada perubahan baru di remote repository');
      recommendations.push('📥 Lakukan git pull terlebih dahulu sebelum push');
    }
  }

  // Warning untuk remote changes
  if (hasRemoteChanges && !gitStatus.hasChanges) {
    warnings.push('ℹ️ Ada pembaruan di remote repository');
    recommendations.push('📥 Lakukan git pull untuk mendapatkan perubahan terbaru');
  }

  return {
    shouldWarn: warnings.length > 0,
    warnings,
    recommendations
  };
}