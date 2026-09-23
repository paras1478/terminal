const { app, BrowserWindow, dialog, ipcMain, Notification } = require("electron");
const path = require("path");

const APP_URL = process.env.APP_URL || "https://terminal-1-riuw.onrender.com";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(APP_URL);
}

ipcMain.handle("dialog:select-folder", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("notification:show", (_event, { title, body }) => {
  if (!Notification.isSupported()) {
    return false;
  }
  new Notification({ title: String(title ?? "Notification"), body: String(body ?? "") }).show();
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
