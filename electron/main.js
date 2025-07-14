const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
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
  
  const preloadPath = path.resolve(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', fs.existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js')
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
  
  // Open DevTools in development for debugging
  if (!app.isPackaged || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
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
  
  // Determine the correct executable and script path
  let execPath;
  let args;
  let scriptPath;
  
  if (app.isPackaged) {
    // In packaged app, use Electron executable with ELECTRON_RUN_AS_NODE
    execPath = process.execPath;
    scriptPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.js');
    args = [scriptPath];
  } else {
    // In development, use the system Node.js
    execPath = 'node';
    scriptPath = path.join(__dirname, '../dist/index.js');
    args = [scriptPath];
  }
  
  // Verify the script exists
  if (!fs.existsSync(scriptPath)) {
    return { success: false, error: 'MCP server not found. Please build the project first.' };
  }
  
  try {
    child = spawn(execPath, args, {
      env: { 
        ...process.env, 
        ...config,
        // Tell Electron to run as Node.js when packaged
        ELECTRON_RUN_AS_NODE: app.isPackaged ? '1' : undefined
      },
      cwd: app.isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..'),
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
  // Defensive: default config to empty object
  config = config || {};
  const maskedAccountId = config.AVATAX_ACCOUNT_ID ? '***' + config.AVATAX_ACCOUNT_ID.slice(-4) : 'missing';
  console.log('Test connection called with config:', {
    accountId: maskedAccountId,
    environment: config.AVATAX_ENVIRONMENT ?? 'missing'
  });

  // Fail fast if required config is missing
  if (!config.AVATAX_ACCOUNT_ID || !config.AVATAX_LICENSE_KEY) {
    return { success: false, error: 'Account ID or license key not supplied' };
  }

  try {
    const https = require('https');
    const hostname = config.AVATAX_ENVIRONMENT === 'production' ? 'rest.avatax.com' : 'sandbox-rest.avatax.com';
    const credentials = Buffer.from(`${config.AVATAX_ACCOUNT_ID}:${config.AVATAX_LICENSE_KEY}`).toString('base64');
    return await new Promise((resolve) => {
      const req = https.request({
        hostname,
        port: 443,
        path: '/api/v2/utilities/ping',
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true, response: data });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        });
      });
      const timeout = setTimeout(() => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout (10 s)' });
      }, 10000);
      req.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      });
      req.end();
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Address validation handler
ipcMain.handle('validate-address', async (_e, addressData) => {
  console.log('Address validation called');

  // Get current config for credentials
  const config = store.get('config', {});
  
  // Check if credentials are configured
  if (!config.AVATAX_ACCOUNT_ID || !config.AVATAX_LICENSE_KEY) {
    return { valid: false, errors: ['AvaTax credentials not configured'] };
  }

  // Validate required address fields
  if (!addressData || !addressData.line1 || !addressData.city || !addressData.region || !addressData.postalCode) {
    return { valid: false, errors: ['Required address fields missing: line1, city, region, postalCode'] };
  }

  try {
    const https = require('https');
    const hostname = config.AVATAX_ENVIRONMENT === 'production' ? 'rest.avatax.com' : 'sandbox-rest.avatax.com';
    const credentials = Buffer.from(`${config.AVATAX_ACCOUNT_ID}:${config.AVATAX_LICENSE_KEY}`).toString('base64');
    
    // Prepare address validation request
    const addressPayload = {
      line1: addressData.line1,
      line2: addressData.line2 || undefined,
      line3: addressData.line3 || undefined,
      city: addressData.city,
      region: addressData.region,
      postalCode: addressData.postalCode,
      country: addressData.country || 'US'
    };

    const postData = JSON.stringify(addressPayload);

    return await new Promise((resolve) => {
      const req = https.request({
        hostname,
        port: 443,
        path: '/api/v2/addresses/resolve',
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (res.statusCode === 200) {
              // Check if address was successfully validated
              if (result.validatedAddresses && result.validatedAddresses.length > 0) {
                const validatedAddress = result.validatedAddresses[0];
                resolve({
                  valid: true,
                  normalized: {
                    line1: validatedAddress.line1,
                    line2: validatedAddress.line2,
                    line3: validatedAddress.line3,
                    city: validatedAddress.city,
                    region: validatedAddress.region,
                    postalCode: validatedAddress.postalCode,
                    country: validatedAddress.country
                  },
                  coordinates: validatedAddress.latitude && validatedAddress.longitude ? {
                    latitude: validatedAddress.latitude,
                    longitude: validatedAddress.longitude
                  } : undefined,
                  messages: result.messages || []
                });
              } else {
                resolve({
                  valid: false,
                  messages: result.messages || ['Address could not be validated'],
                  errors: result.errors || ['No validated addresses returned']
                });
              }
            } else {
              resolve({
                valid: false,
                errors: [`HTTP ${res.statusCode}: ${result.error || result.message || data}`],
                messages: result.messages || []
              });
            }
          } catch (parseError) {
            resolve({
              valid: false,
              errors: [`Failed to parse response: ${parseError.message}`]
            });
          }
        });
      });

      const timeout = setTimeout(() => {
        req.destroy();
        resolve({ valid: false, errors: ['Address validation timeout (15 seconds)'] });
      }, 15000);

      req.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ valid: false, errors: [`Network error: ${err.message}`] });
      });

      req.write(postData);
      req.end();
    });
  } catch (err) {
    return { valid: false, errors: [`Validation error: ${err.message}`] };
  }
});

// Install state handler
ipcMain.handle('get-install-state', () => {
  return checkInstallState();
});

// Company fetching handler
ipcMain.handle('get-companies', async (_e, config) => {
  // Defensive: default config to empty object
  config = config || {};
  const maskedAccountId = config.AVATAX_ACCOUNT_ID ? '***' + config.AVATAX_ACCOUNT_ID.slice(-4) : 'missing';
  console.log('Get companies called with config:', {
    accountId: maskedAccountId,
    environment: config.AVATAX_ENVIRONMENT ?? 'missing'
  });

  // Fail fast if required config is missing
  if (!config.AVATAX_ACCOUNT_ID || !config.AVATAX_LICENSE_KEY) {
    return { success: false, error: 'Account ID or license key not supplied' };
  }

  try {
    const https = require('https');
    const hostname = config.AVATAX_ENVIRONMENT === 'production' ? 'rest.avatax.com' : 'sandbox-rest.avatax.com';
    const credentials = Buffer.from(`${config.AVATAX_ACCOUNT_ID}:${config.AVATAX_LICENSE_KEY}`).toString('base64');
    return await new Promise((resolve) => {
      const req = https.request({
        hostname,
        port: 443,
        path: '/api/v2/companies',
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const responseData = JSON.parse(data);
              // Extract just the companies array with relevant fields
              const companies = responseData.value ? responseData.value.map(company => ({
                id: company.id,
                companyCode: company.companyCode,
                name: company.name,
                isActive: company.isActive,
                isDefault: company.isDefault
              })) : [];
              resolve({ success: true, companies: companies });
            } catch (parseError) {
              resolve({ success: false, error: `Failed to parse response: ${parseError.message}` });
            }
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        });
      });
      const timeout = setTimeout(() => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout (10 s)' });
      }, 10000);
      req.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      });
      req.end();
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Auto-updater configuration
autoUpdater.checkForUpdatesAndNotify = false; // We want manual control
autoUpdater.autoDownload = false; // We want to ask user first
autoUpdater.autoInstallOnAppQuit = false; // Manual install

// Configure for self-signed certificates
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Allow self-signed certificates for development/self-hosted scenarios
process.env['ELECTRON_UPDATER_ALLOW_SELF_SIGNED'] = 'true';

// Set update server (GitHub releases)
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'JoshMcMillen',
  repo: 'avatax-mcp-server'
});

// Update IPC handlers
let lastUpdateInfo = null; // Store the last update check result

ipcMain.handle('check-for-updates', async () => {
  try {
    console.log('Checking for updates...');
    const result = await autoUpdater.checkForUpdates();
    lastUpdateInfo = result; // Store the result for download
    return {
      success: true,
      updateAvailable: result && result.updateInfo,
      currentVersion: app.getVersion(),
      latestVersion: result?.updateInfo?.version
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    lastUpdateInfo = null; // Clear on error
    return {
      success: false,
      error: error.message,
      currentVersion: app.getVersion()
    };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    // Ensure we have update info before attempting download
    if (!lastUpdateInfo || !lastUpdateInfo.updateInfo) {
      throw new Error('No update available. Please check for updates first.');
    }
    
    console.log('Starting update download...');
    
    // Temporarily disable certificate validation for self-signed certificates
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    
    await autoUpdater.downloadUpdate();
    
    // Re-enable certificate validation
    delete process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading update:', error);
    
    // Re-enable certificate validation in case of error
    delete process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
    
    // Handle certificate-related errors more gracefully
    if (error.message && error.message.includes('not trusted by the trust provider')) {
      return { 
        success: false, 
        error: 'Certificate verification failed. Update downloaded but may require manual verification.' 
      };
    }
    
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  try {
    console.log('Installing update...');
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error) {
    console.error('Error installing update:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'available', 
      version: info.version,
      releaseNotes: info.releaseNotes 
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'not-available', 
      version: info.version 
    });
  }
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  lastUpdateInfo = null; // Clear update info on error
  
  let errorMessage = err.message;
  
  // Handle certificate-related errors more gracefully
  if (err.message && (
    err.message.includes('not trusted by the trust provider') ||
    err.message.includes('not signed by the application owner') ||
    err.message.includes('certificate')
  )) {
    errorMessage = 'Certificate verification issue. The update is available but requires manual verification due to self-signed certificate.';
    console.log('Certificate validation bypassed for self-signed certificate');
  }
  
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'error', 
      error: errorMessage 
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(logMessage);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloading', 
      progress: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  lastUpdateInfo = null; // Clear update info after download
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloaded', 
      version: info.version 
    });
  }
});

app.on('window-all-closed', () => {
  if (child) child.kill();
  app.quit();
});

// Auto-updater
app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') {
    autoUpdater.checkForUpdatesAndNotify();
  }
});
