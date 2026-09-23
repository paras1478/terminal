const { app, BrowserWindow, dialog, ipcMain, Notification } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_URL = process.env.APP_URL || "https://terminal-1-riuw.onrender.com";
const SHELL = process.platform === "win32" ? "powershell.exe" : "bash";

/**
 * The backend (which may run remotely, e.g. on Render) has no access to the
 * user's local filesystem, so it cannot host a real terminal for a local
 * project. Electron runs node-pty itself, keyed by the same sessionId the
 * backend uses for session metadata, and streams output back to the
 * renderer via webContents.send — the renderer never gets direct access to
 * node-pty or the filesystem itself (contextIsolation/sandbox stay on).
 */
const ptyBySessionId = new Map();

function loadPty() {
  // eslint-disable-next-line global-require
  return require("node-pty");
}

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

/**
 * Starts (or reuses) a local PTY for a session, rooted at cwd. cwd is
 * whatever the renderer/backend has stored as the workspace's identifier —
 * here, on the user's own machine, is the only place it's meaningful to
 * resolve and validate it against the real filesystem.
 */
ipcMain.handle("terminal:start", (event, { sessionId, cwd, cols, rows }) => {
  if (typeof sessionId !== "string" || !sessionId) {
    return { ok: false, error: "Missing sessionId" };
  }
  if (typeof cwd !== "string" || !cwd) {
    return { ok: false, error: "Missing workspace path" };
  }

  const resolvedCwd = path.resolve(cwd);
  let stat;
  try {
    stat = fs.statSync(resolvedCwd);
  } catch {
    return { ok: false, error: `Folder does not exist on this machine: ${resolvedCwd}` };
  }
  if (!stat.isDirectory()) {
    return { ok: false, error: `Not a folder: ${resolvedCwd}` };
  }

  const existing = ptyBySessionId.get(sessionId);
  if (existing) {
    existing.kill();
    ptyBySessionId.delete(sessionId);
  }

  let pty;
  try {
    pty = loadPty();
  } catch (err) {
    return { ok: false, error: `node-pty is unavailable: ${err.message}` };
  }

  const shell = pty.spawn(SHELL, [], {
    name: "xterm-color",
    cols: Number(cols) > 0 ? Number(cols) : 80,
    rows: Number(rows) > 0 ? Number(rows) : 24,
    cwd: resolvedCwd,
    env: process.env,
  });

  ptyBySessionId.set(sessionId, shell);

  shell.onData((data) => {
    if (!event.sender.isDestroyed()) {
      event.sender.send("terminal:output", { sessionId, data });
    }
  });

  shell.onExit(({ exitCode }) => {
    ptyBySessionId.delete(sessionId);
    if (!event.sender.isDestroyed()) {
      event.sender.send("terminal:exit", { sessionId, exitCode });
    }
  });

  return { ok: true };
});

ipcMain.handle("terminal:input", (_event, { sessionId, data }) => {
  const shell = ptyBySessionId.get(sessionId);
  shell?.write(String(data ?? ""));
});

ipcMain.handle("terminal:resize", (_event, { sessionId, cols, rows }) => {
  const shell = ptyBySessionId.get(sessionId);
  if (shell && Number(cols) > 0 && Number(rows) > 0) {
    shell.resize(Number(cols), Number(rows));
  }
});

ipcMain.handle("terminal:kill", (_event, { sessionId }) => {
  const shell = ptyBySessionId.get(sessionId);
  if (shell) {
    shell.kill();
    ptyBySessionId.delete(sessionId);
  }
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
  for (const shell of ptyBySessionId.values()) {
    shell.kill();
  }
  ptyBySessionId.clear();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
