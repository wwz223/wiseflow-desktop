#!/usr/bin/env node
/**
 * 打包调试工具
 * 帮助诊断Electron打包后的问题
 */

const fs = require('fs');
const path = require('path');

function checkPackageStructure() {
  console.log('🔍 检查打包结构...\n');
  
  const buildDir = path.join(__dirname, 'build');
  const publicDir = path.join(__dirname, 'public');
  
  console.log('📁 检查 build 目录:');
  if (fs.existsSync(buildDir)) {
    console.log('✅ build 目录存在');
    const buildFiles = fs.readdirSync(buildDir);
    console.log('📄 文件列表:', buildFiles.join(', '));
    
    // 检查 index.html
    const indexPath = path.join(buildDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html 存在');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      console.log('📝 文件大小:', indexContent.length, '字符');
      
      // 检查是否包含React应用
      if (indexContent.includes('id="root"')) {
        console.log('✅ 包含React根元素');
      } else {
        console.log('❌ 缺少React根元素');
      }
      
      // 检查是否包含script标签
      if (indexContent.includes('<script')) {
        console.log('✅ 包含JavaScript文件');
      } else {
        console.log('❌ 缺少JavaScript文件');
      }
    } else {
      console.log('❌ index.html 不存在');
    }
  } else {
    console.log('❌ build 目录不存在');
  }
  
  console.log('\n📁 检查 public 目录:');
  if (fs.existsSync(publicDir)) {
    console.log('✅ public 目录存在');
    const publicFiles = fs.readdirSync(publicDir);
    console.log('📄 文件列表:', publicFiles.join(', '));
    
    // 检查关键文件
    ['electron.js', 'preload.js'].forEach(file => {
      const filePath = path.join(publicDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} 存在`);
      } else {
        console.log(`❌ ${file} 不存在`);
      }
    });
  } else {
    console.log('❌ public 目录不存在');
  }
}

function generateFixScript() {
  console.log('\n🔧 生成修复脚本...\n');
  
  const fixScript = `#!/usr/bin/env node
/**
 * 自动修复打包问题
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function fixPackaging() {
  console.log('🔧 开始修复打包问题...');
  
  // 1. 清理旧文件
  console.log('1. 清理旧文件...');
  if (fs.existsSync('build')) {
    fs.rmSync('build', { recursive: true, force: true });
    console.log('✅ 已清理 build 目录');
  }
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('✅ 已清理 dist 目录');
  }
  
  // 2. 重新构建
  console.log('2. 重新构建 React 应用...');
  await runCommand('npm', ['run', 'build']);
  
  // 3. 验证构建结果
  console.log('3. 验证构建结果...');
  const indexPath = path.join('build', 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ React 应用构建成功');
  } else {
    console.error('❌ React 应用构建失败');
    return;
  }
  
  // 4. 打包 Electron
  console.log('4. 打包 Electron 应用...');
  await runCommand('npm', ['run', 'pack']);
  
  console.log('🎉 修复完成！');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'inherit' });
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(\`Command failed with code \${code}\`));
      }
    });
  });
}

fixPackaging().catch(console.error);
`;

  fs.writeFileSync('fix-package.js', fixScript);
  fs.chmodSync('fix-package.js', '755');
  console.log('✅ 修复脚本已生成: fix-package.js');
}

function main() {
  console.log('🚀 WiseFlow Desktop 打包诊断工具\n');
  
  checkPackageStructure();
  generateFixScript();
  
  console.log('\n💡 建议的修复步骤:');
  console.log('1. 运行修复脚本: node fix-package.js');
  console.log('2. 或手动执行:');
  console.log('   npm run clean');
  console.log('   npm run build');
  console.log('   npm run pack');
  console.log('3. 检查打包后的应用');
}

main();