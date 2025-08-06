const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 配置管理
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  // Python 服务管理
  startPythonService: (config) =>
    ipcRenderer.invoke('start-python-service', config),
  stopPythonService: () => ipcRenderer.invoke('stop-python-service'),
  checkPythonService: () => ipcRenderer.invoke('check-python-service'),

  // PocketBase 服务管理
  startPocketBaseService: (config) =>
    ipcRenderer.invoke('start-pocketbase-service', config),
  stopPocketBaseService: () => ipcRenderer.invoke('stop-pocketbase-service'),
  checkPocketBaseService: () => ipcRenderer.invoke('check-pocketbase-service'),

  // 文件系统操作
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  exportData: (data, filename) =>
    ipcRenderer.invoke('export-data', data, filename),

  // UI 交互
  showMessage: (options) => ipcRenderer.invoke('show-message', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // 事件监听
  onPythonServiceStarted: (callback) =>
    ipcRenderer.on('python-service-started', callback),
  onPythonServiceStopped: (callback) =>
    ipcRenderer.on('python-service-stopped', callback),
  onPythonLog: (callback) => ipcRenderer.on('python-log', callback),
  onPythonError: (callback) => ipcRenderer.on('python-error', callback),
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', callback),

  // PocketBase 事件监听
  onPocketBaseServiceStarted: (callback) =>
    ipcRenderer.on('pocketbase-service-started', callback),
  onPocketBaseServiceStopped: (callback) =>
    ipcRenderer.on('pocketbase-service-stopped', callback),
  onPocketBaseLog: (callback) => ipcRenderer.on('pocketbase-log', callback),

  // 移除事件监听
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // 系统信息
  platform: process.platform,
  version: process.versions.electron,
});

// 防止在渲染进程中意外访问 Node.js API
// eslint-disable-next-line no-undef
delete window.require;
// eslint-disable-next-line no-undef
delete window.exports;
// eslint-disable-next-line no-undef
delete window.module;
