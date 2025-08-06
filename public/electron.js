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
// 修复：正确检测生产环境 - 检查是否在asar包中
const isDev = __dirname.indexOf('app.asar') === -1;
// 生产环境下减少控制台输出
if (isDev) {
  console.log('=== WiseFlow Desktop Starting (Development) ===');
  console.log('isDev:', isDev);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('__dirname:', __dirname);
}

// 获取资源路径
function getResourcePath(relativePath) {
  let resourcePath;
  if (isDev) {
    resourcePath = path.join(__dirname, '..', relativePath);
  } else {
    // 生产环境：使用app.asar中的路径
    resourcePath = path.join(__dirname, '..', relativePath);
  }
  if (isDev) {
    console.log(`getResourcePath(${relativePath}) -> ${resourcePath}`);
  }
  return resourcePath;
}

// 获取打包后的二进制文件路径
function getExecutablePath(platform = process.platform) {
  const platformMap = {
    darwin: 'mac',
    win32: 'win',
    linux: 'linux',
  };

  const platformName = platformMap[platform] || 'linux';
  const binaryName =
    platform === 'win32' ? 'wiseflow_service.exe' : 'wiseflow_service';

  if (isDev) {
    // 开发环境：检查是否有本地构建的二进制文件
    const devBinaryPath = path.join(
      __dirname,
      '..',
      'resources',
      platformName,
      binaryName
    );
    if (fs.existsSync(devBinaryPath)) {
      return devBinaryPath;
    }
    return null;
  } else {
    // 生产环境：使用打包的二进制文件
    return path.join(
      process.resourcesPath,
      'resources',
      platformName,
      binaryName
    );
  }
}

// 注意：已移除 findPythonExecutable 函数，现在仅使用二进制模式

// 初始化配置存储
const store = new Store();

let mainWindow;
let pythonProcess = null;

// 注意：安全编码设置将在 app.whenReady() 中进行

function createWindow() {
  // 仅在开发模式下显示调试信息
  if (isDev) {
    console.log('=== Development Debug Info ===');
    console.log('process.resourcesPath:', process.resourcesPath);
    console.log('__dirname:', __dirname);
    console.log('app.getAppPath():', app.getAppPath());

    // 检查关键文件是否存在
    const checkPaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(__dirname, '../build/static'),
      path.join(__dirname, 'preload.js'),
    ];

    checkPaths.forEach((checkPath) => {
      console.log(`Path exists ${checkPath}: ${fs.existsSync(checkPath)}`);
    });
    console.log('=============================');
  }

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
      webSecurity: isDev ? false : true, // 开发环境禁用 web 安全，生产环境启用但放宽限制
      allowRunningInsecureContent: false, // 禁止不安全内容
      experimentalFeatures: false, // 禁用实验性功能
    },
    icon: path.join(__dirname, 'assets/icon.png'), // 如果有图标的话
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  // 加载应用
  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else {
    // 生产环境：正确处理asar路径
    startUrl = `file://${path.join(__dirname, '../build/index.html')}`;
  }

  if (isDev) {
    console.log('Loading URL:', startUrl);
    console.log('isDev:', isDev);
    console.log('__dirname:', __dirname);
    console.log('Current working directory:', process.cwd());
  }

  mainWindow.loadURL(startUrl);

  // 监听加载失败事件
  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        'Failed to load:',
        errorCode,
        errorDescription,
        validatedURL
      );
      console.error('isDev:', isDev);
      console.error('startUrl:', startUrl);
      console.error('__dirname:', __dirname);
    }
  );

  // 监听DOM准备就绪
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready');
    console.log('Page URL:', mainWindow.webContents.getURL());
  });

  // 监听页面加载完成
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
    console.log('Final URL:', mainWindow.webContents.getURL());
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();

    // 暂时强制显示开发者工具来调试
    // mainWindow.webContents.openDevTools();

    // 生产环境下默认不打开开发者工具
    // 如需调试，可以通过菜单手动打开
  });

  // 打开开发者工具（开发模式下）
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

  // 添加控制台消息捕获
  mainWindow.webContents.on(
    'console-message',
    (event, level, message, line, sourceId) => {
      console.log(
        `[Renderer ${level}]`,
        message,
        sourceId ? `(${sourceId}:${line})` : ''
      );
    }
  );

  // 监听渲染进程崩溃
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Render process gone:', details);
  });

  // 监听响应式崩溃
  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Window became unresponsive');
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('Window became responsive again');
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
  if (isDev) {
    console.log('App is ready, starting initialization...');
  }

  // 启用安全编码支持（修复 macOS 警告）
  if (process.platform === 'darwin') {
    app.applicationSupportsSecureRestorableState = true;
  }

  try {
    createWindow();
    createMenu();
    if (isDev) {
      console.log('Window and menu created successfully');
    }
  } catch (error) {
    console.error('Error during app initialization:', error);
  }

  app.on('activate', () => {
    console.log('App activated');
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

// 启动 Python 服务 (仅支持二进制模式)
ipcMain.handle('start-python-service', async (event, config) => {
  try {
    if (pythonProcess) {
      return { success: false, error: '服务已在运行中' };
    }

    const port = config.port || 8080;
    const args = ['--port', port.toString()];

    // 仅使用打包的二进制文件
    const binaryPath = getExecutablePath();
    if (!binaryPath || !fs.existsSync(binaryPath)) {
      return {
        success: false,
        error: `二进制文件不存在: ${
          binaryPath || '未知路径'
        }。请先运行 "npm run build-python-binary" 构建二进制文件。`,
      };
    }

    console.log(`使用打包的二进制文件: ${binaryPath}`);

    // 创建可写的数据目录
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'wiseflow-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 启动二进制进程
    pythonProcess = spawn(binaryPath, args, {
      stdio: 'pipe',
      cwd: dataDir, // 设置工作目录为可写的数据目录
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Service stdout: ${data}`);
      mainWindow.webContents.send('python-log', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      const logData = data.toString();
      console.log(`Service stderr: ${logData}`);

      // 区分真正的错误和正常日志
      if (
        logData.includes('ERROR') ||
        logData.includes('Traceback') ||
        logData.includes('Exception')
      ) {
        mainWindow.webContents.send('python-error', logData);
      } else {
        // aiohttp的访问日志等正常输出作为普通日志处理
        mainWindow.webContents.send('python-log', logData);
      }
    });

    pythonProcess.on('close', (code) => {
      console.log(`Service process exited with code ${code}`);
      pythonProcess = null;
      mainWindow.webContents.send('python-service-stopped', code);
    });

    // 等待一小段时间确保进程启动
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (pythonProcess && !pythonProcess.killed) {
      mainWindow.webContents.send('python-log', '服务已启动 (二进制模式)');
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
