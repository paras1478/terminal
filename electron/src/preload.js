const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  showNotification: (title, body) =>
    ipcRenderer.invoke("notification:show", { title, body }),
});
