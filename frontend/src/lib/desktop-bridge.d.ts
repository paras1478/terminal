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

export interface DesktopBridge {
  isElectron: true;
  selectFolder: () => Promise<string | null>;
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
}

declare global {
  interface Window {
    desktopBridge?: DesktopBridge;
  }
}
