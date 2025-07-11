const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const store = new Store();
let child;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.ico') // optional
  });
  
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Load saved config
  // (Removed unused 'load-config' IPC message send)
}

app.whenReady().then(createWindow);

ipcMain.handle('launch', (_e, config) => {
  store.set('config', config);
  
  if (child) {
    child.kill();
    child = null;
  }
  
  // Use node.exe to run the JS directly instead of trying to package
  const nodePath = process.execPath; // Gets the path to node.exe
  const scriptPath = path.join(__dirname, '../dist/index.js');
  
  // Verify the script exists
  if (!fs.existsSync(scriptPath)) {
    return { success: false, error: 'MCP server not found. Please build the project first.' };
  }
  
  try {
    child = spawn(nodePath, [scriptPath], {
      env: { ...process.env, ...config },
      cwd: path.join(__dirname, '..'),
      detached: false,
      shell: false
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
      mainWindow.webContents.send('server-output', data.toString());
    });
    
    child.stderr.on('data', (data) => {
      mainWindow.webContents.send('server-error', data.toString());
    });
    
    child.on('error', (error) => {
      mainWindow.webContents.send('server-error', error.message);
    });
    
    child.on('exit', (code) => {
      mainWindow.webContents.send('server-exit', code);
      child = null;
    });
    
    return { success: true, pid: child.pid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop', () => {
  if (child) {
    child.kill();
    child = null;
    return { success: true };
  }
  return { success: false, error: 'No server running' };
});

ipcMain.handle('get-status', () => {
  return { running: !!child, pid: child?.pid };
});

// Configuration management handlers
ipcMain.handle('load-config', () => {
  try {
    const config = store.get('config', {});
    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
});

ipcMain.handle('save-config', (_e, config) => {
  try {
    store.set('config', config);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to save configuration: ${error.message}`);
  }
});

ipcMain.handle('clear-config', () => {
  try {
    store.delete('config');
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to clear configuration: ${error.message}`);
  }
});

// Connection testing handler
ipcMain.handle('test-connection', async (_e, config) => {
  try {
    const https = require('https');
    const baseUrl = config.AVATAX_ENVIRONMENT === 'production' 
      ? 'https://rest.avatax.com'
      : 'https://sandbox-rest.avatax.com';
    
    const credentials = Buffer.from(`${config.AVATAX_ACCOUNT_ID}:${config.AVATAX_LICENSE_KEY}`).toString('base64');
    
    return new Promise((resolve) => {
      const options = {
        hostname: config.AVATAX_ENVIRONMENT === 'production' ? 'rest.avatax.com' : 'sandbox-rest.avatax.com',
        port: 443,
        path: '/api/v2/utilities/ping',
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true, response: data });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.on('window-all-closed', () => {
  if (child) child.kill();
  app.quit();
});
