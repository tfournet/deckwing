const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { existsSync } = require('fs');
const { pathToFileURL } = require('url');
const { ensureClaude } = require('./claude-manager');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const SESSION_CLEANUP_MS = 15 * 60 * 1000;
const TRAY_ICON_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAnUlEQVR4Ae3WsQ2AMAxFUY9J2p0Z2kk7MpNm6QwCoQDbKchJzz4nGf8rA8MwDMMwDMMwDMMwjL4L+8wQdWwQfQ+pt4EHrtFKMd43Gv4Q0VvtTDHkJWA9dEr1HrTJ3TlSjf4Kf6o2rOdeNvuyzVi6n+Q2eI/7duv8bNtq45y+3cSeCXJmSf+R17/90Y7lHfe9q0N3TzbrbvJcL3ghWvkhaA5W7QAAAABJRU5ErkJggg==';

let mainWindow = null;
let tray = null;
let server = null;
let cleanupTimer = null;
let serverPort = null;
let isQuitting = false;

function toImportURL(filePath) {
  return pathToFileURL(filePath).href;
}

function getRequestedPort() {
  const raw = process.env.PORT;
  if (!raw) return 0;
  const port = Number(raw);
  return Number.isInteger(port) && port > 0 ? port : 0;
}

function getTrayIcon() {
  const image = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL).resize({ width: 16, height: 16 });
  if (process.platform === 'darwin') {
    image.setTemplateImage(true);
  }
  return image;
}

function findGitBash() {
  if (process.platform !== 'win32') return null;
  if (process.env.CLAUDE_CODE_GIT_BASH_PATH && existsSync(process.env.CLAUDE_CODE_GIT_BASH_PATH)) {
    return process.env.CLAUDE_CODE_GIT_BASH_PATH;
  }

  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe'),
    path.join(process.env.ProgramFiles || '', 'Git', 'bin', 'bash.exe'),
    path.join(process.env.ProgramFiles || '', 'Git', 'usr', 'bin', 'bash.exe'),
  ].filter(Boolean);

  return candidates.find(candidate => existsSync(candidate)) || null;
}

function getAppURL() {
  if (!serverPort) {
    throw new Error('DeckWing server has not started yet.');
  }
  return `http://localhost:${serverPort}`;
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    const { screen } = require('electron');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
      width: Math.min(width, 1920),
      height: Math.min(height, 1080),
      minWidth: 1024,
      minHeight: 700,
      show: false,
      autoHideMenuBar: true,
      title: 'DeckWing',
      webPreferences: {
        preload: PRELOAD_PATH,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    mainWindow.once('ready-to-show', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
      updateTrayMenu();
    });

    mainWindow.loadURL(getAppURL());
  } else {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }

  updateTrayMenu();
}

function hideWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  updateTrayMenu();
}

function toggleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    showWindow();
    return;
  }

  if (mainWindow.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
}

function updateTrayMenu() {
  if (!tray) return;

  const visible = !!(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => {
        if (visible) {
          hideWindow();
        } else {
          showWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]));
}

function createTray() {
  if (tray) return;

  tray = new Tray(getTrayIcon());
  tray.setToolTip('DeckWing');
  tray.on('click', toggleWindow);
  updateTrayMenu();
}

async function startServer() {
  if (!existsSync(path.join(DIST_DIR, 'index.html'))) {
    throw new Error(`Missing built frontend at ${path.join(DIST_DIR, 'index.html')}. Run \"npm run build\" first.`);
  }

  await import('dotenv/config');

  const [{ default: webApp }, { cleanStaleSessions }, expressModule] = await Promise.all([
    import(toImportURL(path.join(ROOT, 'server', 'app.js'))),
    import(toImportURL(path.join(ROOT, 'server', 'ai', 'chat-engine.js'))),
    import('express'),
  ]);

  webApp.use(expressModule.default.static(DIST_DIR));
  webApp.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'not found' });
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  cleanupTimer = setInterval(cleanStaleSessions, SESSION_CLEANUP_MS);
  cleanupTimer.unref?.();

  const requestedPort = getRequestedPort();
  server = await new Promise((resolve, reject) => {
    const instance = webApp.listen(requestedPort, '127.0.0.1', () => resolve(instance));
    instance.once('error', reject);
  });

  serverPort = server.address().port;
}

function stopServer() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }

  if (server) {
    server.close();
    server = null;
    serverPort = null;
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (serverPort || (mainWindow && !mainWindow.isDestroyed())) {
      showWindow();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
    stopServer();
  });

  app.whenReady().then(async () => {
    app.setName('DeckWing');
    process.env.npm_package_version = app.getVersion();

    const gitBash = findGitBash();
    if (gitBash) {
      process.env.CLAUDE_CODE_GIT_BASH_PATH = gitBash;
    }

    try {
      await ensureClaude();
    } catch (error) {
      console.warn('[electron] Claude Code setup skipped:', error instanceof Error ? error.message : error);
    }

    await startServer();
    createTray();
    showWindow();
  }).catch((error) => {
    console.error('[electron] Failed to start DeckWing:', error);
    app.quit();
  });

  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      return;
    }

    if (!isQuitting) {
      return;
    }

    app.quit();
  });

  app.on('activate', () => {
    if (serverPort || (mainWindow && !mainWindow.isDestroyed())) {
      showWindow();
    }
  });
}
