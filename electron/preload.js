const { contextBridge, ipcRenderer } = require('electron');
const allowedChannels = ['secure-channel'];

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
  
  // Install state management
  getInstallState: () => ipcRenderer.invoke('get-install-state'),
  onInstallState: (callback) => ipcRenderer.on('install-state', (_event, data) => callback(data)),
  
  // Event handlers
  onServerOutput: (callback) => ipcRenderer.on('server-output', (_event, data) => callback(data)),
  onServerError: (callback) => ipcRenderer.on('server-error', (_event, data) => callback(data)),
  onServerExit: (callback) => ipcRenderer.on('server-exit', (_event, code) => callback(code))
});

ipcRenderer.on('message', (event, channel, data) => {
    if (!allowedChannels.includes(channel)) {
        console.error('Blocked unauthorized channel:', channel);
        return;
    }
    // Process data securely
});
