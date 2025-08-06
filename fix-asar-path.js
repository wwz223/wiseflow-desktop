#!/usr/bin/env node
/**
 * 修复Asar路径问题
 * 解决打包后空白页面的问题
 */

const fs = require('fs');
const path = require('path');

function fixElectronPaths() {
  console.log('🔧 修复Electron路径配置...');
  
  const electronPath = path.join(__dirname, 'public', 'electron.js');
  let content = fs.readFileSync(electronPath, 'utf8');
  
  // 修复主要的路径问题
  const fixes = [
    {
      search: /const isDev = process\.env\.NODE_ENV !== 'production';/,
      replace: 'const isDev = require(\'electron-is-dev\');'
    },
    {
      search: /\/\/ 加载应用[\s\S]*?mainWindow\.loadURL\(startUrl\);/,
      replace: `// 加载应用
  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else {
    // 生产环境：正确处理asar路径
    startUrl = \`file://\${path.join(__dirname, '../build/index.html')}\`;
  }

  console.log('Loading URL:', startUrl);
  console.log('isDev:', isDev);
  console.log('__dirname:', __dirname);
  console.log('Current working directory:', process.cwd());

  mainWindow.loadURL(startUrl);`
    }
  ];
  
  fixes.forEach((fix, index) => {
    if (fix.search.test(content)) {
      content = content.replace(fix.search, fix.replace);
      console.log(`✅ 应用修复 ${index + 1}`);
    } else {
      console.log(`⚠️  跳过修复 ${index + 1} (未找到匹配)`);
    }
  });
  
  fs.writeFileSync(electronPath, content);
  console.log('✅ Electron路径修复完成');
}

function addAsarDebugging() {
  console.log('🔍 添加Asar调试信息...');
  
  const electronPath = path.join(__dirname, 'public', 'electron.js');
  let content = fs.readFileSync(electronPath, 'utf8');
  
  // 在createWindow函数开始处添加调试信息
  const debugCode = `
  // Asar调试信息
  console.log('=== Asar Debug Info ===');
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('__dirname:', __dirname);
  console.log('app.getAppPath():', app.getAppPath());
  console.log('isDev:', isDev);
  
  // 检查关键文件是否存在
  const checkPaths = [
    path.join(__dirname, '../build/index.html'),
    path.join(__dirname, '../build/static'),
    path.join(__dirname, 'preload.js')
  ];
  
  checkPaths.forEach(checkPath => {
    console.log(\`Path exists \${checkPath}: \${fs.existsSync(checkPath)}\`);
  });
  console.log('========================');
`;
  
  // 在createWindow函数开始处插入调试代码
  const functionStart = 'function createWindow() {';
  if (content.includes(functionStart)) {
    content = content.replace(functionStart, functionStart + debugCode);
    console.log('✅ 调试信息添加完成');
  } else {
    console.log('❌ 未找到createWindow函数');
  }
  
  fs.writeFileSync(electronPath, content);
}

function main() {
  console.log('🚀 修复Asar路径问题工具');
  console.log('========================\n');
  
  try {
    fixElectronPaths();
    addAsarDebugging();
    
    console.log('\n🎉 修复完成！');
    console.log('💡 请运行以下命令重新打包测试:');
    console.log('   npm run build');
    console.log('   npm run pack');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

main();