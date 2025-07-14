const { contextBridge, ipcRenderer } = require('electron');
// removed 'os' import; use environment vars for homedir

contextBridge.exposeInMainWorld('mcp', {
  // Server management
  launch: (config) => ipcRenderer.invoke('launch', config),
  stop: () => ipcRenderer.invoke('stop'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  
  // Configuration management
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  clearConfig: () => ipcRenderer.invoke('clear-config'),
  testConnection: (config) => ipcRenderer.invoke('test-connection', config),
  getCompanies: (config) => ipcRenderer.invoke('get-companies', config),
  validateAddress: (addressData) => ipcRenderer.invoke('validate-address', addressData),
  
  // Update management
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Install state management
  getInstallState: () => ipcRenderer.invoke('get-install-state'),
  
  // System information
  platform: process.platform,
  isPackaged: !process.defaultApp,
  homedir: process.env.HOME || process.env.USERPROFILE,
  
  // Event handlers with proper cleanup
  onServerOutput: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('server-output', subscription);
    return () => ipcRenderer.removeListener('server-output', subscription);
  },
  onServerError: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('server-error', subscription);
    return () => ipcRenderer.removeListener('server-error', subscription);
  },
  onServerExit: (callback) => {
    const subscription = (_event, code) => callback(code);
    ipcRenderer.on('server-exit', subscription);
    return () => ipcRenderer.removeListener('server-exit', subscription);
  },
  onInstallState: (callback) => {
    const subscription = (_event, state) => callback(state);
    ipcRenderer.on('install-state', subscription);
    return () => ipcRenderer.removeListener('install-state', subscription);
  },
  onUpdateStatus: (callback) => {
    const subscription = (_event, status) => callback(status);
    ipcRenderer.on('update-status', subscription);
    return () => ipcRenderer.removeListener('update-status', subscription);
  }
});