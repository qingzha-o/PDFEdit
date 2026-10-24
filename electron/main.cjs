const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { URL } = require('node:url');

const { app, BrowserWindow, Menu, shell, session, dialog } = require('electron');

const IS_SMOKE = process.argv.includes('--smoke-test');
const APP_ROOT = app.isPackaged
  ? path.join(process.resourcesPath, 'app')
  : path.join(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pfb': 'application/octet-stream',
  '.bcmap': 'application/octet-stream',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
};

let mainWindow = null;
let localServer = null;
let localPort = 0;

function sendText(res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(text);
}

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', `http://127.0.0.1:${localPort}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/index.html';
      const relative = pathname.replace(/^[/\\]+/, '');
      const filePath = path.resolve(APP_ROOT, relative);
      if (filePath !== APP_ROOT && !filePath.startsWith(APP_ROOT + path.sep)) {
        sendText(res, 403, 'Forbidden');
        return;
      }
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch {
        sendText(res, 404, 'Not found');
        return;
      }
      if (!stat.isFile()) {
        sendText(res, 404, 'Not found');
        return;
      }
      const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': stat.size,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error(error);
      sendText(res, 500, 'Internal error');
    }
  });
}

function startServer() {
  localServer = createStaticServer();
  return new Promise((resolve, reject) => {
    localServer.once('error', reject);
    localServer.listen(0, '127.0.0.1', () => {
      localPort = localServer.address().port;
      resolve(localPort);
    });
  });
}

function stopServer() {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
}

async function runSmokeTest(win) {
  const payload = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        const pages = window.__folio?.state?.pages?.length || 0;
        const blocks = document.querySelectorAll('.pdf-block').length;
        if (pages > 0 && blocks > 0) {
          resolve({
            ok: true,
            title: document.title,
            pages,
            blocks,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            sample: window.__folio.state.fileName,
          });
          return;
        }
        if (Date.now() - started > 25000) {
          resolve({
            ok: false,
            error: 'timeout',
            pages,
            blocks,
            body: document.body.innerText.slice(0, 800),
          });
          return;
        }
        setTimeout(tick, 300);
      };
      tick();
    });
  `);
  const resultPath = path.join(os.tmpdir(), 'folio-smoke-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('FOLIO_SMOKE_RESULT', resultPath, JSON.stringify(payload));
  if (IS_SMOKE) {
    setTimeout(() => app.exit(payload.ok ? 0 : 1), 200);
  }
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1040,
    minHeight: 700,
    show: false,
    backgroundColor: '#141917',
    autoHideMenuBar: true,
    title: 'Folio · PDF 文本工作室',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}/`)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });
  mainWindow.webContents.on('did-finish-load', () => {
    if (IS_SMOKE) runSmokeTest(mainWindow);
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('Failed to load app window', code, description);
  });
  mainWindow.once('ready-to-show', () => {
    if (!IS_SMOKE) mainWindow.show();
  });

  let forceClose = false;
  let closePromptOpen = false;
  mainWindow.on('close', async (event) => {
    if (forceClose || IS_SMOKE) return;
    event.preventDefault();
    if (closePromptOpen) return;
    closePromptOpen = true;
    let dirty = false;
    try {
      const check = mainWindow.webContents.executeJavaScript(
        'Boolean(window.__folio?.state?.dirty || window.__folio?.state?.session?.dirty)'
      );
      dirty = await Promise.race([
        check,
        new Promise((resolve) => setTimeout(() => resolve(false), 1500)),
      ]);
      if (dirty) {
        const choice = await dialog.showMessageBox(mainWindow, {
          type: 'warning',
          buttons: ['取消', '退出'],
          defaultId: 0,
          cancelId: 0,
          noLink: true,
          title: 'Folio PDF Studio',
          message: '当前文档还有未应用的修改',
          detail: '直接退出会丢失未应用的文字修改。确定要退出吗？',
        });
        if (choice.response !== 1) return;
      }
    } catch (error) {
      console.error('Close check failed', error);
    } finally {
      closePromptOpen = false;
    }

    forceClose = true;
    // destroy() bypasses the browser beforeunload handler, which otherwise
    // prevents the window from closing after a PDF has been edited.
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const suffix = IS_SMOKE ? '/?sample=1' : '/';
  mainWindow.loadURL(`http://127.0.0.1:${port}${suffix}`);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.folio.pdfstudio');
    app.setName('Folio PDF Studio');
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => {
      callback(false);
    });

    try {
      const port = await startServer();
      createWindow(port);
    } catch (error) {
      console.error('Failed to start local server', error);
      app.exit(1);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(localPort);
    });
  });

  app.on('window-all-closed', () => {
    stopServer();
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', stopServer);
}
