# WiseFlow Desktop

基于 Electron + React + Tailwind CSS + PocketBase 构建的智能信息挖掘桌面客户端。

## 项目简介

WiseFlow Desktop 是 [WiseFlow](https://github.com/TeamWiseFlow/wiseflow) 项目的桌面客户端，提供了一个直观易用的图形界面来管理信息源、配置关键点、展示挖掘到的信息，并集成了 Python 后端服务和 PocketBase 数据库。

### 核心功能

- 🚀 **双服务管理** - 一键启动/停止 Python WiseFlow 服务和 PocketBase 数据库
- 📡 **信息源管理** - 支持 RSS、网站、快手、微博、公众号等多种信息源
- 🎯 **关键点配置** - 智能关键词管理，支持频率设置、状态控制和详细说明
- 📊 **多维数据展示** - 信息流、快手缓存、微博缓存等多种数据源展示
- 🗄️ **PocketBase 集成** - 统一数据管理，支持实时同步和权限控制
- ⚙️ **完整配置** - 服务端口、数据库连接、用户偏好等全面配置
- 📈 **实时监控** - 双服务状态监控、连接轮询和详细日志
- 💾 **数据导出** - 支持数据导出和备份

## 技术栈

- **前端框架**: React 18
- **桌面框架**: Electron 22
- **数据库**: PocketBase (嵌入式 Go 数据库)
- **样式库**: Tailwind CSS
- **图标库**: Lucide React
- **HTTP 客户端**: Axios + PocketBase SDK
- **状态管理**: React Hooks
- **构建工具**: Create React App + Electron Builder
- **Python 集成**: PyInstaller 二进制模式

## 系统要求

- **Node.js**: 16+ (用于构建和开发)
- **Python**: 3.8+ (包含在 PyInstaller 二进制中，无需单独安装)
- **操作系统**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **内存**: 建议 8GB+ (PocketBase + Python 服务)
- **存储**: 500MB+ 可用空间

## 安装步骤

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd wiseflow-desktop
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建 Python 二进制 (可选)

```bash
# 构建 PyInstaller 二进制文件
npm run build-python-binary
```

### 4. 开发模式运行

```bash
# 方式一：启动开发服务器 + Electron
npm run electron:serve

# 方式二：分步启动
npm start          # 启动 React 开发服务器
npm run electron   # 启动 Electron (另一个终端)
```

### 5. 构建生产版本

```bash
# 完整构建流程
npm run dist       # 构建 React + 打包 Electron 应用

# 分步构建
npm run build      # 仅构建 React 应用
npm run pack       # 仅打包 Electron (用于测试)
```

## 项目结构

```
wiseflow-desktop/
├── public/
│   ├── electron.js          # Electron 主进程 (服务管理 + IPC)
│   ├── preload.js          # 预加载脚本
│   └── index.html          # HTML 模板 (CSP 配置)
├── src/
│   ├── App.js              # React 主应用 (统一状态管理)
│   ├── App.css             # 应用样式
│   ├── api/
│   │   ├── wiseflowClient.js    # Python 服务 API 客户端
│   │   └── pocketbaseClient.js  # PocketBase 数据库客户端
│   ├── index.js            # React 入口
│   └── index.css           # 基础样式
├── python-backend/
│   ├── wiseflow_service.py      # Python 服务源码
│   ├── build_binary.py          # PyInstaller 构建脚本
│   └── requirements.txt         # Python 依赖
├── resources/
│   ├── mac/wiseflow_service     # macOS PyInstaller 二进制
│   └── pocketbase               # PocketBase 可执行文件
├── assets/
│   └── logo.png                 # 应用图标
├── tailwind.config.js           # Tailwind 配置
├── package.json                 # 项目配置 + Electron Builder
└── README.md                   # 项目说明
```

## 配置说明

### 双服务架构

应用采用双服务架构，提供完整的数据挖掘能力：

#### Python WiseFlow 服务
- **二进制模式**: 使用 PyInstaller 打包的独立可执行文件
- **端口配置**: 默认 8080，可在设置中修改
- **数据目录**: 自动在用户数据目录创建 `wiseflow-data`
- **自动启动**: 应用启动时可选择自动启动服务

#### PocketBase 数据库服务
- **嵌入式数据库**: 轻量级 Go 数据库，无需额外安装
- **端口配置**: 默认 8090，可在设置中修改
- **数据目录**: 自动在用户数据目录创建 `pocketbase-data`
- **管理界面**: `http://localhost:8090/_/` (需要管理员登录)

### 数据源优先级

应用采用智能数据源选择策略：

1. **PocketBase** (主要数据源) - 实时同步，功能完整
2. **Python API** (备用数据源) - 兼容模式，基础功能
3. **本地状态** (最终回退) - 离线模式，临时存储

### 环境变量

创建 `.env` 文件（可选）：

```env
# Python 服务配置
REACT_APP_API_BASE_URL=http://localhost:8080

# PocketBase 配置
REACT_APP_POCKETBASE_URL=http://localhost:8090

# 开发模式
ELECTRON_IS_DEV=true
```

## 使用指南

### 首次使用

1. **启动应用**: 运行桌面应用
2. **启动 PocketBase**: 在仪表板点击"启动 PocketBase"
3. **配置数据库**: 首次启动会自动创建管理员账户 (`test@example.com` / `1234567890`)
4. **启动 Python 服务**: 点击"启动服务"，应用会自动轮询连接
5. **添加信息源**: 在信息源页面添加 RSS、网站、社交媒体等信息源
6. **配置关键词**: 在关键点页面设置监控关键词、频率和条件
7. **查看数据**: 在信息流、快手数据、微博数据页面查看挖掘结果

### 功能详解

#### 🏠 仪表板
- **双服务状态**: Python 服务 + PocketBase 状态监控
- **统计总览**: 信息源、关键词、信息流、缓存数据统计
- **连接管理**: 智能轮询重连、手动重连控制
- **实时日志**: Python 服务日志 + PocketBase 操作日志

#### 📡 信息源管理
- **多种类型**: RSS、Web、快手 (ks)、微博 (wb)、公众号 (mp)
- **状态控制**: 启用/禁用信息源
- **CRUD 操作**: 通过 PocketBase 统一管理
- **数据同步**: 实时同步到数据库

#### 🎯 关键点配置 (增强版)
- **丰富字段**: 关键词、启用状态、监控频率、说明、限制条件
- **智能显示**: PocketBase 连接时显示详细信息，断线时简化显示
- **状态徽章**: 绿色 (已启用) / 灰色 (已禁用)
- **快速操作**: 一键删除、实时更新

#### 📊 多维数据展示
- **信息流**: 通用信息展示，支持关联关键词
- **快手数据**: 视频信息、用户数据、播放统计
- **微博数据**: 内容、互动数据、IP 定位、用户信息
- **实时搜索**: 所有页面支持搜索过滤

## 开发指南

### 项目架构

**前端 (React)**:
- 统一状态管理 (`src/App.js`)
- 双 API 客户端 (WiseFlow + PocketBase)
- 响应式 UI (Tailwind CSS)

**后端服务**:
- Python WiseFlow 服务 (PyInstaller 二进制)
- PocketBase 数据库 (Go 二进制)

**桌面集成 (Electron)**:
- 主进程服务管理 (`public/electron.js`)
- IPC 通信 (`public/preload.js`)
- 自动更新支持

### 添加新功能

1. **数据操作**: 在 `src/api/pocketbaseClient.js` 中添加新的数据方法
2. **UI 组件**: 在 `src/App.js` 中添加新的渲染函数
3. **服务集成**: 在 `public/electron.js` 中添加 IPC 处理器
4. **Python API**: 在 `src/api/wiseflowClient.js` 中添加备用 API 方法

### 样式定制

使用 Tailwind CSS 进行样式定制：

```javascript
// 示例：自定义按钮样式
<button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
  点击我
</button>
```

### 状态管理

使用 React Hooks 进行统一状态管理：

```javascript
// 服务状态
const [serviceStatus, setServiceStatus] = useState('stopped');
const [pocketbaseStatus, setPocketbaseStatus] = useState('stopped');

// 连接状态
const [isBackendConnected, setIsBackendConnected] = useState(false);
const [isPocketBaseConnected, setIsPocketBaseConnected] = useState(false);

// 数据状态
const [sources, setSources] = useState([]);
const [keywords, setKeywords] = useState([]);
const [keywordObjects, setKeywordObjects] = useState([]);
```

### 数据流管理

**PocketBase 优先策略**:
```javascript
if (isPocketBaseConnected) {
  // 使用 PocketBase API
  const response = await pbClient.getSources();
} else if (isBackendConnected) {
  // 降级到 Python API
  const response = await apiClient.getSources();
} else {
  // 使用本地状态
  // 离线模式
}
```

## 打包和分发

### 构建命令

```bash
# 完整构建 (推荐)
npm run dist              # 自动构建 React + 打包所有平台

# 分步构建
npm run build             # 构建 React 应用
npm run pack              # 仅打包当前平台 (用于测试)

# Python 服务构建
npm run build-python-binary    # 构建 PyInstaller 二进制

# 完全重建
npm run full-rebuild      # 清理 + 构建 + 打包
```

### 平台支持

- **Windows**: `.exe` 安装程序 (NSIS)
- **macOS**: `.dmg` 磁盘映像 (支持 Intel + Apple Silicon)
- **Linux**: `.AppImage` 便携应用

### 分发内容

每个打包都包含：
- Electron 应用本体
- Python WiseFlow 二进制 (`resources/`)
- PocketBase 二进制 (`resources/`)
- 应用图标和资源文件

### 自动更新

集成 `electron-updater` 实现自动更新：

```javascript
// 在 electron.js 中
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

## 故障排除

### 常见问题

1. **Python 服务启动失败**
   - 检查二进制文件是否存在于 `resources/` 目录
   - 查看控制台日志获取详细错误信息
   - 确保用户数据目录有写入权限

2. **PocketBase 连接失败**
   - 检查端口是否被占用 (默认 8090)
   - 确认管理员账户已创建 (`test@example.com` / `1234567890`)
   - 查看 PocketBase 日志了解启动状态

3. **数据同步问题**
   - 优先检查 PocketBase 连接状态
   - Python API 作为备用数据源
   - 查看双服务状态指示器

4. **端口冲突**
   - Python 服务: 修改设置中的端口配置
   - PocketBase: 修改 PocketBase 设置中的端口
   - 重启相应服务使配置生效

5. **权限问题**
   - **macOS**: 在系统偏好设置中允许应用运行，可能需要绕过 Gatekeeper
   - **Windows**: 以管理员身份运行，Windows Defender 可能误报
   - **Linux**: 检查二进制文件执行权限 (`chmod +x`)

### 调试模式

开发模式下启用调试：

```bash
# 启用详细日志
DEBUG=* npm run electron:serve

# 启用开发者工具
npm run electron:serve    # 自动打开 DevTools

# 手动打开开发者工具
# Ctrl+Shift+I (Windows/Linux) 或 Cmd+Option+I (macOS)
```

### 日志位置

**应用数据目录**:
- **Windows**: `%APPDATA%/wiseflow-desktop/`
- **macOS**: `~/Library/Application Support/wiseflow-desktop/`
- **Linux**: `~/.config/wiseflow-desktop/`

**服务数据目录**:
- **WiseFlow 数据**: `{userData}/wiseflow-data/`
- **PocketBase 数据**: `{userData}/pocketbase-data/`

**实时日志查看**:
- 应用内仪表板的日志区域
- Electron 主进程控制台
- 浏览器开发者工具控制台

## API 文档

### PocketBase 数据操作

应用主要通过 PocketBase SDK 进行数据操作：

```javascript
// 获取信息源
const sourcesResponse = await pbClient.getSources();

// 添加关键词
const keywordResponse = await pbClient.addKeyword({
  focuspoint: "关键词",
  activated: true,
  freq: 24
});

// 获取缓存数据
const ksCacheResponse = await pbClient.getKsCache(10, 0);
```

### Python API (备用)

当 PocketBase 不可用时，降级到 Python API：

```javascript
// 获取服务状态
const status = await apiClient.checkConnection();

// 获取发现信息
const infoResponse = await apiClient.getDiscoveredInfo(limit, offset);
```

### IPC 通信

Electron 主进程与渲染进程的双服务通信：

```javascript
// 启动 Python 服务
const pythonResult = await window.electronAPI.startPythonService(config);

// 启动 PocketBase 服务
const pbResult = await window.electronAPI.startPocketBaseService(config);

// 主进程处理
ipcMain.handle('start-python-service', async (event, config) => {
  // 启动 PyInstaller 二进制
});

ipcMain.handle('start-pocketbase-service', async (event, config) => {
  // 启动 PocketBase 二进制
});
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 React Hooks 最佳实践
- 保持组件简洁和可复用
- 添加适当的注释和文档

### 测试

```bash
# 运行测试
npm test

# 生成测试覆盖率报告
npm run test:coverage
```

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 支持和反馈

- **问题报告**: [GitHub Issues](https://github.com/your-repo/issues)
- **功能请求**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **邮件联系**: support@wiseflow.example.com

## 更新日志

### v2.0.0 (2024-12-XX) - PocketBase 集成版
- 🚀 **PocketBase 集成**: 嵌入式数据库，实时数据同步
- 🔧 **PyInstaller 二进制**: Python 服务独立打包，无需环境依赖
- 📊 **多维数据展示**: 快手数据、微博数据专门页面
- 🎯 **增强关键词管理**: 支持频率设置、状态控制、详细说明
- 🔄 **智能轮询重连**: 自动检测服务状态，智能重连
- 🎨 **UI/UX 改进**: 响应式设计，状态指示，详细日志
- 📱 **跨平台图标**: 统一应用图标，支持所有平台
- ⚡ **性能优化**: 双服务架构，数据源优先级策略

### v1.0.0 (2024-XX-XX) - 初始版本
- 🎉 首个正式版本发布
- ✅ 完整的信息源管理功能
- ✅ 关键词配置和过滤
- ✅ Python 服务集成
- ✅ 跨平台支持

## 路线图

### 近期计划
- [ ] 数据可视化图表和趋势分析
- [ ] 高级搜索和过滤功能
- [ ] 数据导出格式扩展 (CSV, JSON, PDF)
- [ ] 服务性能监控和指标

### 中期计划
- [ ] 插件系统和扩展支持
- [ ] 多用户权限管理
- [ ] 云端数据同步
- [ ] 移动端伴侣应用

### 长期计划
- [ ] AI 智能分析和推荐
- [ ] 多语言支持 (English, 日本語)
- [ ] 企业级部署方案
- [ ] 开放 API 生态

---

**感谢使用 WiseFlow Desktop！** 如果这个项目对您有帮助，请考虑给个 ⭐️