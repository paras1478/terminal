const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  showNotification: (title, body) =>
    ipcRenderer.invoke("notification:show", { title, body }),

  // Local terminal, backed by node-pty running in the main process (never
  // exposed directly to the renderer — only these narrow, validated calls are).
  terminalStart: (sessionId, cwd, cols, rows) =>
    ipcRenderer.invoke("terminal:start", { sessionId, cwd, cols, rows }),
  terminalInput: (sessionId, data) =>
    ipcRenderer.invoke("terminal:input", { sessionId, data }),
  terminalResize: (sessionId, cols, rows) =>
    ipcRenderer.invoke("terminal:resize", { sessionId, cols, rows }),
  terminalKill: (sessionId) => ipcRenderer.invoke("terminal:kill", { sessionId }),
  onTerminalOutput: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("terminal:output", listener);
    return () => ipcRenderer.removeListener("terminal:output", listener);
  },
  onTerminalExit: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("terminal:exit", listener);
    return () => ipcRenderer.removeListener("terminal:exit", listener);
  },
});
