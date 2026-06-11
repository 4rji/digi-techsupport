const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

const logWrapper = (name, fn) => async (...args) => {
  console.log(`Calling ${name} with arguments:`, args);
  try {
    const result = await fn(...args);
    console.log(`${name} result:`, result);
    return result;
  } catch (error) {
    console.error(`${name} error:`, error);
    return { success: false, error: error.message };
  }
};

contextBridge.exposeInMainWorld('appAPI', {
  testTCPPort: logWrapper('testTCPPort', (host, port, timeout = 3000) => {
    return ipcRenderer.invoke('test-tcp-port', host, port, timeout);
  })
});
