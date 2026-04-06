// Git utilities - browser-safe stubs (actual git operations not available in browser)

export interface GitStatus {
  modifiedFiles: number;
  addedFiles: number;
  deletedFiles: number;
  totalChanges: number;
  untrackedFiles: number;
  hasUncommittedChanges: boolean;
  branch: string;
  lastCommitMessage: string;
  lastCommitDate: string;
  filesList: string[];
}

const emptyStatus: GitStatus = {
  modifiedFiles: 0,
  addedFiles: 0,
  deletedFiles: 0,
  totalChanges: 0,
  untrackedFiles: 0,
  hasUncommittedChanges: false,
  branch: 'main',
  lastCommitMessage: '',
  lastCommitDate: '',
  filesList: [],
};

export async function getGitStatus(): Promise<GitStatus> {
  return emptyStatus;
}

export async function commitAllChanges(_message?: string): Promise<string> {
  return 'Git operations not available in browser';
}

export async function getCurrentBranch(): Promise<string> {
  return 'main';
}
