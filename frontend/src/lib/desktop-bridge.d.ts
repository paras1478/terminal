export interface DesktopBridge {
  isElectron: true;
  selectFolder: () => Promise<string | null>;
}

declare global {
  interface Window {
    desktopBridge?: DesktopBridge;
  }
}
