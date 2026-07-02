const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

const SENSITIVE_FIELD_NAMES = ['password', 'token', 'secret', 'key'];

const redactSensitive = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    const normalizedKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELD_NAMES.some(field => normalizedKey.includes(field));
    return [key, isSensitive ? '[redacted]' : redactSensitive(entry)];
  }));
};

const redactArgs = (name, args) => {
  if (name === 'sshSaveAdminPassword') {
    return ['[redacted]'];
  }
  if (name === 'digiSaveCredentials') {
    return ['[redacted]'];
  }
  if (name === 'saveTextFile') {
    return args.map((arg) => {
      if (!arg || typeof arg !== 'object') return arg;
      return {
        title: arg.title,
        buttonLabel: arg.buttonLabel,
        defaultPath: arg.defaultPath,
        content: typeof arg.content === 'string' ? `[${arg.content.length} chars]` : '',
        filters: Array.isArray(arg.filters) ? `[${arg.filters.length} filters]` : ''
      };
    });
  }
  if (name === 'updateSavedSupportFile') {
    return args.map((arg, index) => {
      if (index === 0) return arg;
      if (!arg || typeof arg !== 'object') return arg;
      return {
        alias: arg.alias,
        title: arg.title,
        notes: typeof arg.notes === 'string' ? `[${arg.notes.length} chars]` : ''
      };
    });
  }
  if (name === 'generateSupportTemplate' || name === 'analyzeSupportFile') {
    return args.map((arg) => {
      if (!arg || typeof arg !== 'object') return arg;
      return {
        provider: arg.provider,
        apiKey: arg.apiKey ? '[redacted]' : '',
        skill: typeof arg.skill === 'string' ? `[${arg.skill.length} chars]` : '',
        query: typeof arg.query === 'string' ? `[${arg.query.length} chars]` : '',
        selectedFileId: arg.selectedFileId || '',
        sourceText: typeof arg.sourceText === 'string' ? `[${arg.sourceText.length} chars]` : '',
        templates: Array.isArray(arg.templates) ? `[${arg.templates.length} templates]` : ''
      };
    });
  }
  return args.map(redactSensitive);
};

const redactSavedFile = (file) => {
  if (!file || typeof file !== 'object') return file;
  return {
    ...file,
    notes: typeof file.notes === 'string' ? `[${file.notes.length} chars]` : ''
  };
};

const redactResult = (name, result) => {
  if (name === 'sshAdminPassword' && result && typeof result === 'object') {
    return { ...result, password: result.hasPassword ? '[redacted]' : '' };
  }
  // Archive open results carry the whole file tree and summary; log sizes only
  // so the console does not retain (and print) huge structures.
  if (['importSupportFile', 'openSavedSupportFile'].includes(name) && result && typeof result === 'object') {
    return {
      ...result,
      tree: Array.isArray(result.tree) ? `[${result.tree.length} root nodes]` : result.tree,
      summary: result.summary ? '[summary]' : result.summary,
      savedFile: redactSavedFile(result.savedFile)
    };
  }
  // Entry content can be megabytes of text; log its length only.
  if (name === 'getSupportFileEntryContent' && result && typeof result === 'object') {
    return {
      ...result,
      text: typeof result.text === 'string' ? `[${result.text.length} chars]` : result.text
    };
  }
  if (name === 'searchSupportArchive' && result && typeof result === 'object') {
    return {
      ...result,
      files: Array.isArray(result.files) ? `[${result.files.length} files, ${result.totalMatches || 0} matches]` : result.files
    };
  }
  if (name === 'compareSupportArchives' && result && typeof result === 'object') {
    return {
      ...result,
      files: Array.isArray(result.files) ? `[${result.files.length} files]` : result.files
    };
  }
  if ([
    'listSavedSupportFiles',
    'updateSavedSupportFile',
    'deleteSavedSupportFile'
  ].includes(name) && result && typeof result === 'object') {
    return {
      ...result,
      file: redactSavedFile(result.file),
      savedFile: redactSavedFile(result.savedFile),
      files: Array.isArray(result.files) ? result.files.map(redactSavedFile) : result.files
    };
  }
  return redactSensitive(result);
};

const logWrapper = (name, fn) => async (...args) => {
  console.log(`Calling ${name} with arguments:`, redactArgs(name, args));
  try {
    const result = await fn(...args);
    console.log(`${name} result:`, redactResult(name, result));
    return result;
  } catch (error) {
    console.error(`${name} error:`, error);
    return { success: false, error: error.message };
  }
};

contextBridge.exposeInMainWorld('appAPI', {
  changeAppZoom: logWrapper('changeAppZoom', (direction) => {
    return ipcRenderer.invoke('change-app-zoom', direction);
  }),
  pingHost: logWrapper('pingHost', (host, timeout = 3000) => {
    return ipcRenderer.invoke('ping-host', host, timeout);
  }),
  testTCPPort: logWrapper('testTCPPort', (host, port, timeout = 3000) => {
    return ipcRenderer.invoke('test-tcp-port', host, port, timeout);
  }),
  sshConnect: logWrapper('sshConnect', (options) => {
    return ipcRenderer.invoke('ssh-connect', options);
  }),
  sshDefaults: logWrapper('sshDefaults', (host) => {
    return ipcRenderer.invoke('ssh-defaults', host);
  }),
  sshAdminPassword: logWrapper('sshAdminPassword', () => {
    return ipcRenderer.invoke('ssh-admin-password');
  }),
  sshSaveAdminPassword: logWrapper('sshSaveAdminPassword', (password) => {
    return ipcRenderer.invoke('ssh-save-admin-password', password);
  }),
  sshWrite: logWrapper('sshWrite', (sessionId, data) => {
    return ipcRenderer.invoke('ssh-write', sessionId, data);
  }),
  sshResize: logWrapper('sshResize', (sessionId, cols, rows) => {
    return ipcRenderer.invoke('ssh-resize', sessionId, cols, rows);
  }),
  sshDisconnect: logWrapper('sshDisconnect', (sessionId) => {
    return ipcRenderer.invoke('ssh-disconnect', sessionId);
  }),
  generateSupportTemplate: logWrapper('generateSupportTemplate', (options) => {
    return ipcRenderer.invoke('generate-support-template', options);
  }),
  analyzeSupportFile: logWrapper('analyzeSupportFile', (sessionId, options) => {
    return ipcRenderer.invoke('analyze-support-file', sessionId, options);
  }),
  importSupportFile: logWrapper('importSupportFile', () => {
    return ipcRenderer.invoke('import-support-file');
  }),
  getSupportFileEntryContent: logWrapper('getSupportFileEntryContent', (sessionId, entryId) => {
    return ipcRenderer.invoke('get-support-file-entry-content', sessionId, entryId);
  }),
  searchSupportArchive: logWrapper('searchSupportArchive', (sessionId, options) => {
    return ipcRenderer.invoke('search-support-archive', sessionId, options);
  }),
  compareSupportArchives: logWrapper('compareSupportArchives', (sessionIdA, sessionIdB) => {
    return ipcRenderer.invoke('compare-support-archives', sessionIdA, sessionIdB);
  }),
  listSavedSupportFiles: logWrapper('listSavedSupportFiles', () => {
    return ipcRenderer.invoke('list-saved-support-files');
  }),
  openSavedSupportFile: logWrapper('openSavedSupportFile', (fileId) => {
    return ipcRenderer.invoke('open-saved-support-file', fileId);
  }),
  updateSavedSupportFile: logWrapper('updateSavedSupportFile', (fileId, updates) => {
    return ipcRenderer.invoke('update-saved-support-file', fileId, updates);
  }),
  deleteSavedSupportFile: logWrapper('deleteSavedSupportFile', (fileId) => {
    return ipcRenderer.invoke('delete-saved-support-file', fileId);
  }),
  saveTextFile: logWrapper('saveTextFile', (options) => {
    return ipcRenderer.invoke('save-text-file', options);
  }),
  digiGetCredentials: logWrapper('digiGetCredentials', () => {
    return ipcRenderer.invoke('digi-get-credentials');
  }),
  digiSaveCredentials: logWrapper('digiSaveCredentials', (credentials) => {
    return ipcRenderer.invoke('digi-save-credentials', credentials);
  }),
  digiGetDevices: logWrapper('digiGetDevices', (options) => {
    return ipcRenderer.invoke('digi-get-devices', options);
  }),
  onSSHData: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('ssh-data', listener);
    return () => ipcRenderer.removeListener('ssh-data', listener);
  },
  onSSHClose: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('ssh-close', listener);
    return () => ipcRenderer.removeListener('ssh-close', listener);
  },
  onSSHError: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('ssh-error', listener);
    return () => ipcRenderer.removeListener('ssh-error', listener);
  }
});
