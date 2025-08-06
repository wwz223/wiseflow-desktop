# Electron 打包空白页面排障指南

## 🚨 问题描述
应用在开发环境(`npm run electron-dev`)运行正常，但打包后打开是空白页面且控制台无输出。

## 🔍 诊断步骤

### 1. 运行诊断工具
```bash
npm run debug-package
```

### 2. 检查基础结构
确认以下文件存在：
- `build/index.html` - React构建输出
- `build/static/js/` - JavaScript文件
- `build/static/css/` - CSS文件
- `public/electron.js` - Electron主进程
- `public/preload.js` - 预加载脚本

### 3. 手动验证打包结果
```bash
# 清理并重新构建
npm run clean
npm run build

# 检查build目录
ls -la build/

# 检查index.html内容
head -20 build/index.html
```

## 🔧 常见问题和解决方案

### 1. 路径问题
**症状**: 找不到静态资源

**检查**: 
```bash
# 检查Electron主进程中的路径
grep -n "build/index.html" public/electron.js
```

**解决**: 确保路径配置正确
```javascript
const startUrl = isDev
  ? 'http://localhost:3000'
  : `file://${path.join(__dirname, '../build/index.html')}`;
```

### 2. CSP策略过严
**症状**: 控制台显示CSP阻止错误

**解决**: 已修改CSP策略，允许更多资源类型：
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' data: file:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..." />
```

### 3. React应用未加载
**症状**: HTML加载但React应用不启动

**检查**: 打开开发者工具查看：
- Console错误信息
- Network面板中的资源加载状态
- Elements面板中是否有React根元素

### 4. 权限问题
**症状**: 文件访问被拒绝

**解决**: 检查文件权限，确保可执行文件有正确权限
```bash
chmod +x path/to/executable
```

## 🛠️ 快速修复流程

### 方法1: 自动修复脚本
```bash
npm run fix-package
```

### 方法2: 手动修复
```bash
# 1. 完全清理
npm run clean

# 2. 重新构建React应用
npm run build

# 3. 验证构建结果
ls -la build/
cat build/index.html | grep -E "(root|script)"

# 4. 重新打包Electron
npm run pack

# 5. 测试打包结果
./dist/mac/WiseFlow\ Desktop.app/Contents/MacOS/WiseFlow\ Desktop
```

### 方法3: 分步调试
```bash
# 1. 用开发者工具打包
export NODE_ENV=production
npm run pack

# 2. 运行时启用调试
DEBUG=* ./dist/mac/WiseFlow\ Desktop.app/Contents/MacOS/WiseFlow\ Desktop
```

## 📊 调试信息收集

### 控制台输出
打包后的应用现在会自动打开开发者工具，检查：
- 主进程控制台输出
- 渲染进程控制台错误
- Network面板加载状态

### 关键日志信息
查找这些关键信息：
```
Loading URL: file://...
isDev: false
DOM ready
Page finished loading
Window ready to show
```

### 文件完整性检查
```bash
# 检查关键文件大小
du -h build/index.html
du -h build/static/js/main.*.js
du -h build/static/css/main.*.css

# 检查文件内容
grep -c "React" build/static/js/main.*.js
```

## 🎯 验证修复

### 成功标志
- ✅ 应用窗口正常显示UI内容
- ✅ 开发者工具无错误信息
- ✅ 控制台显示所有预期日志
- ✅ React应用功能正常

### 进一步测试
```bash
# 测试基本功能
1. 检查导航栏是否显示
2. 测试页面切换
3. 尝试启动Python服务
4. 检查设置页面
```

## 📞 如仍有问题

1. 运行完整诊断: `npm run debug-package`
2. 收集所有控制台输出
3. 检查主进程和渲染进程错误
4. 验证文件权限和路径
5. 尝试在不同系统上测试

## 📝 已应用的修复

1. ✅ 修改了CSP策略以支持打包环境
2. ✅ 添加了详细的调试日志
3. ✅ 在生产环境也开启开发者工具
4. ✅ 增加了文件加载事件监听
5. ✅ 创建了自动诊断和修复工具