console.log('TEST: Preload script starting...');

const { contextBridge, ipcRenderer } = require('electron');

console.log('TEST: About to expose object...');

contextBridge.exposeInMainWorld('mcpTest', {
  test: () => 'hello world'
});

console.log('TEST: Object exposed successfully!');
