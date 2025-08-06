const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
} = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');
const fs = require('fs');
const isDev = process.env.NODE_ENV !== 'production';

// 获取资源路径
function getResourcePath(relativePath) {
  if (isDev) {
    return path.join(__dirname, '..', relativePath);
  } else {
    return path.join(process.resourcesPath, 'app', relativePath);
  }
}

// 查找Python可执行文件
function findPythonExecutable() {
  const possiblePaths = ['python3', 'python', '/usr/bin/python3', '/usr/local/bin/python3'];
  
  for (const pythonPath of possiblePaths) {
    try {
      const result = spawn(pythonPath, ['--version'], { stdio: 'pipe' });
      if (result) {
        return pythonPath;
      }
    } catch (error) {
      continue;
    }
  }
  
  return 'python3'; // 默认回退
}

// 初始化配置存储
const store = new Store();

let mainWindow;
let pythonProcess = null;

// 注意：安全编码设置将在 app.whenReady() 中进行

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // 开发环境禁用 web 安全，生产环境启用
      allowRunningInsecureContent: false, // 禁止不安全内容
      experimentalFeatures: false, // 禁用实验性功能
    },
    icon: path.join(__dirname, 'assets/icon.png'), // 如果有图标的话
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  // 加载应用
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 打开开发者工具（仅在开发模式下）
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
    // 关闭 Python 进程
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 设置应用菜单
function createMenu() {
  const template = [
    {
      label: 'WiseFlow',
      submenu: [
        {
          label: '关于 WiseFlow',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 WiseFlow',
              message: 'WiseFlow Desktop v1.0.0',
              detail:
                '智能信息挖掘桌面客户端\n\n基于 AI 技术，从海量信息中挖掘您真正感兴趣的内容。',
            });
          },
        },
        { type: 'separator' },
        {
          label: '偏好设置',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'settings');
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        {
          label: '强制重新加载',
          accelerator: 'CmdOrCtrl+Shift+R',
          role: 'forceReload',
        },
        { label: '切换开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '切换全屏', accelerator: 'F11', role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '了解更多',
          click: () => {
            shell.openExternal('https://github.com/TeamWiseFlow/wiseflow');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用就绪时的处理
app.whenReady().then(() => {
  // 启用安全编码支持（修复 macOS 警告）
  if (process.platform === 'darwin') {
    app.applicationSupportsSecureRestorableState = true;
  }

  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时的处理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前的清理
app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
});

// IPC 处理器

// 获取应用配置
ipcMain.handle('get-config', () => {
  return store.store;
});

// 保存应用配置
ipcMain.handle('save-config', (event, config) => {
  try {
    Object.keys(config).forEach((key) => {
      store.set(key, config[key]);
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 启动 Python 服务
ipcMain.handle('start-python-service', async (event, config) => {
  try {
    if (pythonProcess) {
      return { success: false, error: '服务已在运行中' };
    }

    // 使用配置的Python路径，如果没有则自动查找
    const pythonPath = config.pythonPath || findPythonExecutable();
    
    // 获取Python脚本的正确路径
    let scriptPath;
    if (config.scriptPath && config.scriptPath !== '') {
      // 如果用户指定了路径，使用用户路径
      scriptPath = config.scriptPath;
    } else {
      // 否则使用打包后的默认路径
      scriptPath = getResourcePath('python-backend/wiseflow_service.py');
    }
    
    const port = config.port || 8080;

    // 检查脚本文件是否存在
    if (!fs.existsSync(scriptPath)) {
      return { 
        success: false, 
        error: `Python 脚本文件不存在: ${scriptPath}` 
      };
    }

    pythonProcess = spawn(pythonPath, [scriptPath, '--port', port.toString()], {
      stdio: 'pipe',
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
      mainWindow.webContents.send('python-log', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      const logData = data.toString();
      console.log(`Python stderr: ${logData}`);
      
      // 区分真正的错误和正常日志
      if (logData.includes('ERROR') || logData.includes('Traceback') || logData.includes('Exception')) {
        mainWindow.webContents.send('python-error', logData);
      } else {
        // aiohttp的访问日志等正常输出作为普通日志处理
        mainWindow.webContents.send('python-log', logData);
      }
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      pythonProcess = null;
      mainWindow.webContents.send('python-service-stopped', code);
    });

    // 等待一小段时间确保进程启动
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (pythonProcess && !pythonProcess.killed) {
      mainWindow.webContents.send('python-service-started');
      return { success: true };
    } else {
      return { success: false, error: '进程启动失败' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 停止 Python 服务
ipcMain.handle('stop-python-service', () => {
  try {
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
      return { success: true };
    } else {
      return { success: false, error: '服务未在运行' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 检查 Python 服务状态
ipcMain.handle('check-python-service', () => {
  return {
    running: pythonProcess !== null && !pythonProcess.killed,
    pid: pythonProcess ? pythonProcess.pid : null,
  };
});

// 选择文件夹
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (!result.canceled) {
    return { success: true, path: result.filePaths[0] };
  } else {
    return { success: false };
  }
});

// 选择文件
ipcMain.handle('select-file', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || [
      { name: 'Python Files', extensions: ['py'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled) {
    return { success: true, path: result.filePaths[0] };
  } else {
    return { success: false };
  }
});

// 显示消息框
ipcMain.handle('show-message', (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

// 打开外部链接
ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// 导出数据
ipcMain.handle('export-data', async (event, data, filename) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled) {
      const fs = require('fs');
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, path: result.filePath };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
