const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const os = require('os');
const store = new Store();
let child;
let mainWindow;

// Check for post-install/upgrade state
function checkInstallState() {
  let installState = {
    isFirstRun: false,
    isPostUpgrade: false,
    fromVersion: null
  };

  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      
      // Check for first run flag
      try {
        const firstRunResult = execSync('reg query "HKCU\\Software\\AvaTax MCP Server" /v FirstRun 2>nul', {encoding: 'utf8'});
        if (firstRunResult.includes('FirstRun')) {
          installState.isFirstRun = true;
          // Clear the flag
          try {
            execSync('reg delete "HKCU\\Software\\AvaTax MCP Server" /v FirstRun /f 2>nul');
          } catch (e) {
            console.log('Could not clear FirstRun flag:', e.message);
          }
        }
      } catch (e) {
        // FirstRun key doesn't exist, which is normal
      }
      
      // Check for post-upgrade flag
      try {
        const upgradeResult = execSync('reg query "HKCU\\Software\\AvaTax MCP Server" /v PostUpgrade 2>nul', {encoding: 'utf8'});
        if (upgradeResult.includes('PostUpgrade')) {
          installState.isPostUpgrade = true;
          
          // Get from version
          try {
            const versionResult = execSync('reg query "HKCU\\Software\\AvaTax MCP Server" /v FromVersion 2>nul', {encoding: 'utf8'});
            const match = versionResult.match(/FromVersion\s+REG_SZ\s+(.+)/);
            if (match) {
              installState.fromVersion = match[1].trim();
            }
          } catch (e) {
            // FromVersion key doesn't exist
          }
          
          // Clear the flags
          try {
            execSync('reg delete "HKCU\\Software\\AvaTax MCP Server" /v PostUpgrade /f 2>nul');
            execSync('reg delete "HKCU\\Software\\AvaTax MCP Server" /v FromVersion /f 2>nul');
          } catch (e) {
            console.log('Could not clear upgrade flags:', e.message);
          }
        }
      } catch (e) {
        // PostUpgrade key doesn't exist, which is normal
      }
    } catch (error) {
      console.log('Error checking install state:', error);
    }
  }
  
  console.log('Install state:', installState);
  return installState;
}

function createWindow() {
  const installState = checkInstallState();
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    // icon: path.join(__dirname, 'icon.ico'), // optional - commented out until icon is created
    show: false // Don't show until ready
  });
  
  // Show and focus window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // If this is a fresh install or upgrade, make sure window gets attention
    if (installState.isFirstRun || installState.isPostUpgrade) {
      mainWindow.focus();
      if (process.platform === 'win32') {
        mainWindow.flashFrame(true);
        mainWindow.setAlwaysOnTop(true);
        // Remove always on top after a short delay
        setTimeout(() => {
          mainWindow.setAlwaysOnTop(false);
        }, 2000);
      }
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Check install state and notify renderer when ready
  mainWindow.webContents.once('dom-ready', () => {
    // Always send install state, but don't force config tab
    setTimeout(() => {
      mainWindow.webContents.send('install-state', installState);
    }, 1000);
  });
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

// Install state handler
ipcMain.handle('get-install-state', () => {
  return checkInstallState();
});

app.on('window-all-closed', () => {
  if (child) child.kill();
  app.quit();
});
