export interface TerminalStartResult {
  ok: boolean;
  error?: string;
}

export interface TerminalOutputPayload {
  sessionId: string;
  data: string;
}

export interface TerminalExitPayload {
  sessionId: string;
  exitCode: number;
}

export interface SelectFolderResult {
  canceled: boolean;
  path?: string;
}

export interface ValidateFolderResult {
  ok: boolean;
  error?: string;
  path?: string;
}

export interface FsNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FsNode[];
}

export interface FsReadDirectoryResult {
  ok: boolean;
  error?: string;
  node?: FsNode;
}

export interface FsReadFileResult {
  ok: boolean;
  error?: string;
  path?: string;
  content?: string;
  truncated?: boolean;
}

export interface FsWriteResult {
  ok: boolean;
  error?: string;
  path?: string;
}

export interface DesktopBridge {
  isElectron: true;
  isDesktop: true;

  selectFolder: () => Promise<SelectFolderResult>;
  validateFolder: (candidatePath: string) => Promise<ValidateFolderResult>;
  showNotification: (title: string, body: string) => Promise<boolean>;

  terminalStart: (
    sessionId: string,
    cwd: string,
    cols: number,
    rows: number,
  ) => Promise<TerminalStartResult>;
  terminalInput: (sessionId: string, data: string) => Promise<void>;
  terminalResize: (sessionId: string, cols: number, rows: number) => Promise<void>;
  terminalKill: (sessionId: string) => Promise<void>;
  onTerminalOutput: (callback: (payload: TerminalOutputPayload) => void) => () => void;
  onTerminalExit: (callback: (payload: TerminalExitPayload) => void) => () => void;

  readDirectory: (root: string, relPath?: string) => Promise<FsReadDirectoryResult>;
  readFile: (root: string, relPath: string) => Promise<FsReadFileResult>;
  writeFile: (root: string, relPath: string, content: string) => Promise<FsWriteResult>;
  createFile: (root: string, relPath: string) => Promise<FsWriteResult>;
  createDirectory: (root: string, relPath: string) => Promise<FsWriteResult>;
  deletePath: (root: string, relPath: string) => Promise<FsWriteResult>;
  renamePath: (root: string, relPath: string, newRelPath: string) => Promise<FsWriteResult>;
}

declare global {
  interface Window {
    desktopBridge?: DesktopBridge;
  }
}
