/**
 * WiseFlow Desktop 打包配置
 * 用于自定义 electron-builder 行为
 */

const path = require('path');
const fs = require('fs');

// 打包前的准备工作
function beforePack(context) {
  console.log('📦 准备打包 WiseFlow Desktop...');

  // 检查 Python 后端文件
  const pythonBackendPath = path.join(context.appDir, 'python-backend');
  if (fs.existsSync(pythonBackendPath)) {
    console.log('✅ Python 后端文件夹找到:', pythonBackendPath);

    // 列出将被打包的 Python 文件
    const files = fs.readdirSync(pythonBackendPath);
    console.log('📁 Python 后端文件:', files.join(', '));
  } else {
    console.warn('⚠️  Python 后端文件夹未找到:', pythonBackendPath);
  }
}

// 打包后的处理
function afterPack(context) {
  console.log('✅ WiseFlow Desktop 打包完成!');
  console.log('📍 输出路径:', context.outDir);
}

module.exports = {
  beforePack,
  afterPack,

  // Electron Builder 配置
  electronBuilderConfig: {
    appId: 'com.wiseflow.desktop',
    productName: 'WiseFlow',
    directories: {
      output: 'dist',
    },
    files: [
      'build/**/*',
      'public/electron.js',
      'public/preload.js',
      'python-backend/**/*',
      'node_modules/**/*',
      '!node_modules/.cache/**/*',
    ],
    extraResources: [
      {
        from: 'python-backend',
        to: 'python-backend',
        filter: ['**/*'],
      },
      {
        from: 'resources',
        to: 'resources',
        filter: ['**/*'],
      },
    ],
    mac: {
      category: 'public.app-category.productivity',
      target: [
        {
          target: 'dmg',
          arch: ['x64', 'arm64'],
        },
      ],
      icon: 'assets/icon.icns',
    },
    win: {
      target: [
        {
          target: 'nsis',
          arch: ['x64'],
        },
      ],
      icon: 'assets/icon.ico',
    },
    linux: {
      target: [
        {
          target: 'AppImage',
          arch: ['x64'],
        },
      ],
      icon: 'assets/icon.png',
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
    },
  },
};
