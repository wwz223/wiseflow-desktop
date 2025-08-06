#!/usr/bin/env node
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
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

fixPackaging().catch(console.error);
