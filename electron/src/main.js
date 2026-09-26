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

/**
 * Validates a candidate workspace folder against the real local filesystem.
 * Shared by the folder-picker result and by re-validation when reopening a
 * session (see docs in New Session / session persistence): the picker result
 * itself is already a real path (Electron's native dialog only returns paths
 * that existed at selection time), but the folder can be deleted/renamed
 * afterward, and a stored path from a previous run must always be re-checked
 * here rather than trusted.
 */
function validateFolderPath(candidate) {
  if (typeof candidate !== "string" || !candidate.trim()) {
    return { ok: false, error: "No folder selected." };
  }

  const resolved = path.resolve(candidate);
  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch {
    return { ok: false, error: "Selected folder does not exist.", path: resolved };
  }

  if (!stat.isDirectory()) {
    return { ok: false, error: "Selected path is not a folder.", path: resolved };
  }

  try {
    fs.accessSync(resolved, fs.constants.R_OK);
  } catch {
    return { ok: false, error: "Unable to access this folder.", path: resolved };
  }

  return { ok: true, path: resolved };
}

ipcMain.handle("dialog:select-folder", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  return { canceled: false, path: result.filePaths[0] };
});

ipcMain.handle("dialog:validate-folder", (_event, candidate) => {
  return validateFolderPath(candidate);
});

const IGNORED_DIR_NAMES = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo"]);
const SECRET_LIKE_PATTERN = /(^|[\\/])\.env(\.|$)|\.pem$|\.key$|(^|[\\/])id_rsa$/i;
const MAX_FILE_READ_BYTES = 1_000_000;

function isSecretLikePath(relPath) {
  return SECRET_LIKE_PATTERN.test(relPath.replace(/\\/g, "/"));
}

/**
 * Resolves a workspace-relative path against its root and rejects any
 * attempt to escape the root (e.g. "../../etc/passwd") — mirrors
 * backend/src/agent/workspace-fs.util.ts's resolveWithinWorkspace, since the
 * renderer is untrusted here in exactly the same way a network client would
 * be for the backend's own file endpoints.
 */
function resolveWithinRoot(root, relPath) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, relPath || ".");
  const rel = path.relative(resolvedRoot, resolvedTarget);

  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes workspace root: ${relPath}`);
  }

  return resolvedTarget;
}

function buildFileNode(root, absPath, relPath) {
  const name = relPath === "." ? relPath : path.basename(relPath);
  const stat = fs.statSync(absPath);

  if (!stat.isDirectory()) {
    return { name, path: relPath.split(path.sep).join("/"), type: "file", size: stat.size };
  }

  const entries = fs.readdirSync(absPath, { withFileTypes: true });
  const children = [];

  for (const entry of entries) {
    if (IGNORED_DIR_NAMES.has(entry.name)) continue;
    if (isSecretLikePath(entry.name)) continue;

    const childRel = relPath === "." ? entry.name : `${relPath}${path.sep}${entry.name}`;
    const childAbs = path.join(absPath, entry.name);

    try {
      if (entry.isDirectory()) {
        children.push(buildFileNode(root, childAbs, childRel));
      } else if (entry.isFile()) {
        const childStat = fs.statSync(childAbs);
        children.push({
          name: entry.name,
          path: childRel.split(path.sep).join("/"),
          type: "file",
          size: childStat.size,
        });
      }
    } catch {
      // skip unreadable entries (permissions, broken symlinks, etc.)
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { name, path: relPath.split(path.sep).join("/"), type: "directory", children };
}

ipcMain.handle("fs:read-directory", (_event, { root, relPath }) => {
  const validated = validateFolderPath(root);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  try {
    const absPath = resolveWithinRoot(validated.path, relPath ?? ".");
    return { ok: true, node: buildFileNode(validated.path, absPath, relPath || ".") };
  } catch {
    return { ok: false, error: "Unable to access this folder." };
  }
});

ipcMain.handle("fs:read-file", (_event, { root, relPath }) => {
  const validated = validateFolderPath(root);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  if (isSecretLikePath(relPath || "")) {
    return { ok: false, error: "Access to this file is not allowed." };
  }
  try {
    const absPath = resolveWithinRoot(validated.path, relPath);
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) {
      return { ok: false, error: "Path is not a file." };
    }
    const truncated = stat.size > MAX_FILE_READ_BYTES;
    const buffer = fs.readFileSync(absPath);
    const content = buffer.subarray(0, MAX_FILE_READ_BYTES).toString("utf-8");
    return { ok: true, path: relPath, content, truncated };
  } catch {
    return { ok: false, error: "Unable to read this file." };
  }
});

ipcMain.handle("fs:write-file", (_event, { root, relPath, content }) => {
  const validated = validateFolderPath(root);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  if (isSecretLikePath(relPath || "")) {
    return { ok: false, error: "Writing to this file is not allowed." };
  }
  try {
    const absPath = resolveWithinRoot(validated.path, relPath);
    fs.writeFileSync(absPath, String(content ?? ""), "utf-8");
    return { ok: true, path: relPath };
  } catch {
    return { ok: false, error: "Unable to save this file." };
  }
});

ipcMain.handle("fs:create-file", (_event, { root, relPath }) => {
  const validated = validateFolderPath(root);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  try {
    const absPath = resolveWithinRoot(validated.path, relPath);
    if (fs.existsSync(absPath)) {
      return { ok: false, error: "A file or folder already exists at this path." };
    }
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, "", "utf-8");
    return { ok: true, path: relPath };
  } catch {
    return { ok: false, error: "Unable to create this file." };
  }
});

ipcMain.handle("fs:create-directory", (_event, { root, relPath }) => {
  const validated = validateFolderPath(root);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  try {
    const absPath = resolveWithinRoot(validated.path, relPath);
    if (fs.existsSync(absPath)) {
      return { ok: false, error: "A file or folder already exists at this path." };
    }
    fs.mkdirSync(absPath, { recursive: true });
    return { ok: true, path: relPath };
  } catch {
    return { ok: false, error: "Unable to create this folder." };
  }
});

ipcMain.handle("fs:delete-path", (_event, { root, relPath }) => {
  const validated = validateFolderPath(root);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  if (!relPath || relPath === ".") {
    return { ok: false, error: "Cannot delete the workspace root." };
  }
  try {
    const absPath = resolveWithinRoot(validated.path, relPath);
    fs.rmSync(absPath, { recursive: true, force: true });
    return { ok: true, path: relPath };
  } catch {
    return { ok: false, error: "Unable to delete this item." };
  }
});

ipcMain.handle("fs:rename-path", (_event, { root, relPath, newRelPath }) => {
  const validated = validateFolderPath(root);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  try {
    const fromAbs = resolveWithinRoot(validated.path, relPath);
    const toAbs = resolveWithinRoot(validated.path, newRelPath);
    if (fs.existsSync(toAbs)) {
      return { ok: false, error: "A file or folder already exists at this path." };
    }
    fs.mkdirSync(path.dirname(toAbs), { recursive: true });
    fs.renameSync(fromAbs, toAbs);
    return { ok: true, path: newRelPath };
  } catch {
    return { ok: false, error: "Unable to rename this item." };
  }
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
    return { ok: false, error: "Terminal failed to start." };
  }

  const validated = validateFolderPath(cwd);
  if (!validated.ok) {
    console.error(`[terminal:start] invalid cwd for session ${sessionId}: ${validated.error} (${cwd})`);
    return { ok: false, error: validated.error };
  }
  const resolvedCwd = validated.path;

  const existing = ptyBySessionId.get(sessionId);
  if (existing) {
    existing.kill();
    ptyBySessionId.delete(sessionId);
  }

  let pty;
  try {
    pty = loadPty();
  } catch (err) {
    console.error(`[terminal:start] node-pty unavailable: ${err.message}`);
    return { ok: false, error: "Terminal failed to start." };
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
