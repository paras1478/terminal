const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
});
