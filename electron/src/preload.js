const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  isElectron: true,
  isDesktop: true,

  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  validateFolder: (candidatePath) =>
    ipcRenderer.invoke("dialog:validate-folder", candidatePath),
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

  // Local filesystem, scoped to a workspace root passed on every call and
  // re-validated in the main process each time (see main.js's
  // resolveWithinRoot) — the renderer never gets direct fs access, only
  // these narrow, root-relative operations.
  readDirectory: (root, relPath) =>
    ipcRenderer.invoke("fs:read-directory", { root, relPath }),
  readFile: (root, relPath) => ipcRenderer.invoke("fs:read-file", { root, relPath }),
  writeFile: (root, relPath, content) =>
    ipcRenderer.invoke("fs:write-file", { root, relPath, content }),
  createFile: (root, relPath) => ipcRenderer.invoke("fs:create-file", { root, relPath }),
  createDirectory: (root, relPath) =>
    ipcRenderer.invoke("fs:create-directory", { root, relPath }),
  deletePath: (root, relPath) => ipcRenderer.invoke("fs:delete-path", { root, relPath }),
  renamePath: (root, relPath, newRelPath) =>
    ipcRenderer.invoke("fs:rename-path", { root, relPath, newRelPath }),
});
