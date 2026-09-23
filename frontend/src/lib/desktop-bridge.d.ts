export interface DesktopBridge {
  isElectron: true;
  selectFolder: () => Promise<string | null>;
  showNotification: (title: string, body: string) => Promise<boolean>;
}

declare global {
  interface Window {
    desktopBridge?: DesktopBridge;
  }
}
