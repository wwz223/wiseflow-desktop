#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up WiseFlow Desktop...\n');

// 检查 Node.js 版本
const nodeVersion = process.version;
const requiredVersion = 'v16.0.0';

if (nodeVersion < requiredVersion) {
  console.error(`❌ Node.js ${requiredVersion} or higher is required. Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// 检查并创建必要的目录
const directories = [
  'src/components',
  'src/utils',
  'src/hooks',
  'public/assets',
  'logs'
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// 创建环境变量文件
const envContent = `# WiseFlow Desktop Environment Variables
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_VERSION=1.0.0
ELECTRON_IS_DEV=true

# Python Service Configuration
PYTHON_SERVICE_PORT=8080
PYTHON_SERVICE_HOST=localhost

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
`;

const envPath = path.join(process.cwd(), '.env.example');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('📝 Created .env.example file');
}

// 创建启动脚本
const startScript = `#!/bin/bash

echo "🚀 Starting WiseFlow Desktop in development mode..."

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# 启动应用
npm run electron-dev
`;

const startScriptPath = path.join(process.cwd(), 'start-dev.sh');
if (!fs.existsSync(startScriptPath)) {
  fs.writeFileSync(startScriptPath, startScript);
  // 添加执行权限
  if (process.platform !== 'win32') {
    execSync(`chmod +x ${startScriptPath}`);
  }
  console.log('📜 Created start-dev.sh script');
}

// Windows 启动脚本
const startBat = `@echo off
echo 🚀 Starting WiseFlow Desktop in development mode...

if not exist "node_modules" (
  echo 📦 Installing dependencies...
  npm install
)

npm run electron-dev
`;

const startBatPath = path.join(process.cwd(), 'start-dev.bat');
if (!fs.existsSync(startBatPath)) {
  fs.writeFileSync(startBatPath, startBat);
  console.log('📜 Created start-dev.bat script');
}

// 创建基本的工具函数文件
const utilsContent = `// WiseFlow Desktop Utilities

export const formatDate = (date) => {
  if (!date) return '未知';
  
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return \`\${minutes}分钟前\`;
  if (hours < 24) return \`\${hours}小时前\`;
  if (days < 7) return \`\${days}天前\`;
  
  return target.toLocaleDateString('zh-CN');
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return \`\${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} \${sizes[i]}\`;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};
`;

const utilsPath = path.join(process.cwd(), 'src/utils/index.js');
if (!fs.existsSync(utilsPath)) {
  fs.writeFileSync(utilsPath, utilsContent);
  console.log('🛠️ Created utils/index.js');
}

// 创建自定义 Hook
const hooksContent = `import { useState, useEffect, useCallback, useRef } from 'react';

// 本地存储 Hook
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":, error\`);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":, error\`);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// 防抖 Hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 网络状态 Hook
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// 前一个值 Hook
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

// 异步状态 Hook
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction(...args);
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    value,
    error,
    pending: status === 'pending',
    success: status === 'success',
    failed: status === 'error'
  };
};
`;

const hooksPath = path.join(process.cwd(), 'src/hooks/index.js');
if (!fs.existsSync(hooksPath)) {
  fs.writeFileSync(hooksPath, hooksContent);
  console.log('🪝 Created hooks/index.js');
}

console.log('\n✨ Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Copy .env.example to .env and configure your settings');
console.log('2. Install dependencies: npm install');
console.log('3. Start development: npm run electron-dev');
console.log('4. Or use the convenience scripts: ./start-dev.sh (Linux/Mac) or start-dev.bat (Windows)');
console.log('\n🎉 Happy coding!');