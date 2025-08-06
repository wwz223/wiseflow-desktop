# WiseFlow Desktop 部署指南

## 📦 打包和分发

### 🚀 快速打包

```bash
# 1. 安装依赖
npm install

# 2. 安装Python依赖 (重要!)
npm run python-install

# 3. 构建和打包
npm run pack-all

# 4. 创建分发包
npm run dist-all
```

### 📁 打包结构

打包后的应用会包含以下结构：

```
WiseFlow Desktop.app/
├── Contents/
│   ├── MacOS/
│   │   └── WiseFlow Desktop
│   ├── Resources/
│   │   ├── app/
│   │   │   ├── build/           # React前端文件
│   │   │   ├── python-backend/  # Python后端服务
│   │   │   │   ├── wiseflow_service.py
│   │   │   │   ├── requirements.txt
│   │   │   │   └── ...
│   │   │   └── public/
│   │   │       ├── electron.js
│   │   │       └── preload.js
│   │   └── ...
│   └── Info.plist
```

## 🔧 打包配置

### Python 后端集成

1. **自动路径解析**: Electron 会自动查找打包后的 Python 脚本路径
2. **Python 可执行文件检测**: 自动检测 `python3` 或 `python` 命令
3. **跨平台支持**: 支持 macOS、Windows、Linux

### 路径处理

- **开发环境**: 使用相对路径 `./python-backend/wiseflow_service.py`
- **生产环境**: 使用打包路径 `process.resourcesPath/app/python-backend/wiseflow_service.py`

## 🎯 用户使用流程

### 1. 安装应用

用户安装 WiseFlow Desktop 后，Python 后端会自动包含在应用内部。

### 2. 启动服务

1. 打开 WiseFlow Desktop 应用
2. 进入"设置"页面
3. 点击"启动服务"按钮
4. 应用会自动：
   - 检测系统中的 Python 可执行文件
   - 使用打包的 Python 脚本
   - 启动后端服务

### 3. 配置路径（可选）

如果自动检测失败，用户可以手动指定：
- **Python路径**: 指向系统中的 `python3` 或 `python` 可执行文件
- **脚本路径**: 通常不需要修改，使用默认打包路径

## 🛠️ 开发者打包流程

### 准备工作

1. **确保 Python 依赖已安装**
   ```bash
   cd python-backend
   pip3 install -r requirements.txt
   ```

2. **测试 Python 服务**
   ```bash
   npm run python-service
   curl http://localhost:8080/api/status
   ```

3. **测试前端应用**
   ```bash
   npm run electron-dev
   ```

### 构建步骤

1. **清理旧文件**
   ```bash
   npm run clean
   ```

2. **构建 React 应用**
   ```bash
   npm run build
   ```

3. **打包 Electron 应用**
   ```bash
   # 创建可运行的应用包 (用于测试)
   npm run pack

   # 创建分发安装包 (用于分发)
   npm run dist
   ```

### 平台特定打包

```bash
# macOS
npm run dist -- --mac

# Windows
npm run dist -- --win

# Linux
npm run dist -- --linux
```

## 📋 分发清单

### 必需文件

- ✅ React 前端构建文件 (`build/`)
- ✅ Electron 主进程文件 (`public/electron.js`, `public/preload.js`)
- ✅ Python 后端服务 (`python-backend/`)
- ✅ 应用配置文件 (`package.json`)

### Python 依赖

确保以下 Python 包已安装并可用：
- `aiohttp` - HTTP 服务器
- `aiohttp-cors` - CORS 支持
- `feedparser` - RSS 解析

## 🔍 故障排除

### 常见问题

1. **Python 未找到**
   - 确保系统安装了 Python 3.x
   - 检查 `python3` 或 `python` 命令是否可用
   - 用户可在设置中手动指定 Python 路径

2. **脚本文件未找到**
   - 检查 `python-backend/` 文件夹是否被正确打包
   - 确认 `wiseflow_service.py` 文件存在

3. **端口占用**
   - 默认端口 8080 被占用时，用户可在设置中更改端口
   - 应用会显示端口冲突错误并建议解决方案

4. **权限问题**
   - macOS: 用户可能需要在"系统偏好设置 > 安全性与隐私"中允许应用运行
   - Windows: 可能需要管理员权限

### 调试信息

用户可以在 Electron 开发者工具中查看详细错误信息：
1. 启动应用
2. 按 `Cmd+Option+I` (macOS) 或 `Ctrl+Shift+I` (Windows/Linux)
3. 查看控制台错误信息

## 📈 版本管理

### 版本号规则

使用语义化版本：`MAJOR.MINOR.PATCH`

- **MAJOR**: 重大功能变更或不兼容更新
- **MINOR**: 新功能添加
- **PATCH**: 错误修复和小改进

### 发布流程

1. 更新 `package.json` 中的版本号
2. 运行完整测试
3. 创建发布包: `npm run dist-all`
4. 测试安装包
5. 发布到分发平台

## 🎯 部署最佳实践

1. **自动化构建**: 使用 CI/CD 管道自动化打包过程
2. **多平台测试**: 在目标平台上测试安装包
3. **签名和公证**: 为生产环境对应用进行数字签名
4. **自动更新**: 考虑集成自动更新机制
5. **错误报告**: 集成错误报告和分析工具

---

🎉 **恭喜！你现在可以将 WiseFlow Desktop 打包和分发给用户了！**