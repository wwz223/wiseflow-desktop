# WiseFlow Desktop 完整集成指南

## 🎯 项目概述

WiseFlow Desktop 是一个智能信息挖掘桌面应用，包含：
- **React 前端**: 美观的用户界面
- **Electron 桌面框架**: 跨平台桌面应用
- **Python 后端服务**: 智能信息挖掘引擎

## 🚀 快速启动

### 方式1: 完整开发环境（推荐）

```bash
# 1. 安装Python依赖
npm run python-install

# 2. 启动完整开发环境（前端+后端+Electron）
npm run dev-full
```

### 方式2: 分步启动

```bash
# 1. 启动Python后端服务
npm run python-service
# 或者
python3 wiseflow_service.py

# 2. 在另一个终端启动前端+Electron
npm run electron-dev
```

### 方式3: 仅前端开发

```bash
# 启动React开发服务器
npm start

# 在浏览器中访问 http://localhost:3000
```

## 📁 项目结构

```
wiseflow-desktop/
├── src/                          # React前端源码
│   ├── App.js                    # 主应用组件
│   ├── api/                      # API客户端
│   │   └── wiseflowClient.js     # Python后端API客户端
│   └── examples/                 # 使用示例
│       └── backendIntegration.js # 后端集成示例
├── public/                       # 公共资源
│   ├── electron.js              # Electron主进程
│   ├── preload.js               # 安全接口
│   ├── index.html               # HTML模板
│   └── manifest.json            # Web应用清单
├── python-backend/               # Python后端服务
│   ├── wiseflow_service.py      # 主要的Python后端服务
│   ├── start_service.py         # Python服务启动器
│   ├── requirements.txt         # Python依赖
│   ├── README.md                # Python后端文档
│   └── README_PYTHON_SERVICE.md # 详细的服务文档
├── api/                         # 原有API文件
└── INTEGRATION_GUIDE.md         # 本集成指南
```

## 🔧 Python 后端服务

### 功能特性

- ✅ **REST API**: 完整的HTTP接口
- ✅ **信息源管理**: RSS、网站、Twitter等
- ✅ **智能挖掘**: 基于关键词的相关性评分
- ✅ **数据存储**: SQLite数据库
- ✅ **自动化任务**: 定时信息挖掘
- ✅ **CORS支持**: 跨域请求支持

### API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/status` | GET | 服务状态 |
| `/api/sources` | GET/POST/PUT/DELETE | 信息源管理 |
| `/api/keywords` | GET/POST/DELETE | 关键词管理 |
| `/api/discovered` | GET | 获取发现的信息 |
| `/api/mine` | POST | 开始/停止挖掘 |
| `/api/config` | GET/POST | 配置管理 |

### 测试API

```bash
# 启动服务
cd python-backend
python3 wiseflow_service.py --port 8080

# 在另一个终端测试
curl http://localhost:8080/api/status
curl http://localhost:8080/api/sources
curl http://localhost:8080/api/keywords
```

## 🖥️ 前端应用

### 主要页面

1. **📊 仪表盘**: 服务状态、统计信息、最新发现
2. **🌐 信息源**: 管理RSS订阅、网站等信息源
3. **🔑 关键点**: 配置挖掘关键词
4. **📰 信息流**: 浏览发现的相关信息
5. **⚙️ 设置**: Python服务配置

### API 客户端使用

```javascript
import WiseFlowAPIClient from './src/api/wiseflowClient';

// 创建客户端
const apiClient = new WiseFlowAPIClient('http://localhost:8080');

// 获取服务状态
const status = await apiClient.getStatus();

// 获取信息源
const sources = await apiClient.getSources();

// 添加关键词
await apiClient.addKeyword('人工智能');

// 开始挖掘
await apiClient.startMining();
```

## 🔗 前后端通信

### 方式1: Electron IPC (当前实现)

```javascript
// 通过Electron主进程与Python服务通信
window.electronAPI.startPythonService(config);
window.electronAPI.onPythonServiceStarted(callback);
```

### 方式2: 直接HTTP API (新增)

```javascript
// 直接与Python服务HTTP API通信
const apiClient = new WiseFlowAPIClient();
const status = await apiClient.getStatus();
```

## 📊 数据流

```
[前端UI] ←→ [Electron主进程] ←→ [Python服务]
    ↑                              ↓
    └─────── HTTP API ─────────────┘
```

## 🛠️ 开发工具

### 可用的npm脚本

```bash
# 前端开发
npm start                    # 启动React开发服务器
npm run build               # 构建生产版本

# Electron开发
npm run electron            # 启动Electron（需要先build）
npm run electron-dev        # 开发模式（热重载）
npm run electron-pack       # 打包应用

# Python后端
npm run python-service      # 启动Python服务
npm run python-install      # 安装Python依赖
npm run setup-python        # 设置Python环境

# 完整开发环境
npm run dev-full            # 同时启动前后端和Electron
```

### 调试技巧

1. **前端调试**: 在浏览器或Electron开发者工具中调试
2. **后端调试**: 查看Python服务控制台输出
3. **API调试**: 使用curl或Postman测试API
4. **数据库查看**: 使用SQLite工具查看`wiseflow.db`

## 🎯 使用场景

### 场景1: 纯前端开发

如果只需要开发前端界面：

```bash
npm start
# 在浏览器中访问 http://localhost:3000
```

### 场景2: 完整功能开发

如果需要测试完整功能：

```bash
npm run dev-full
# 同时启动前端、后端和Electron
```

### 场景3: 后端API开发

如果只需要开发后端API：

```bash
cd python-backend
python3 wiseflow_service.py
# 使用curl或Postman测试API
```

## 📝 配置说明

### Electron配置 (public/electron.js)

- 窗口尺寸: 1200x800
- 安全设置: 禁用node集成，启用上下文隔离
- 开发模式: 自动打开开发者工具

### Python服务配置

- 默认端口: 8080
- 数据库: wiseflow.db
- 挖掘间隔: 4小时
- CORS: 支持跨域请求

### 前端配置

- 开发端口: 3000
- CSP: 允许内联脚本和样式
- WebSocket: 支持热重载（可选）

## 🚨 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :8080
   
   # 更换端口
   cd python-backend
   python3 wiseflow_service.py --port 8081
   ```

2. **Python依赖问题**
   ```bash
   # 检查Python版本
   python3 --version
   
   # 重新安装依赖
   cd python-backend
   pip3 install -r requirements.txt
   ```

3. **前端空白页面**
   - 检查控制台错误
   - 确保React服务正常启动
   - 刷新Electron窗口 (Cmd+R)

4. **API连接失败**
   - 确认Python服务已启动
   - 检查端口是否正确
   - 查看网络连接

### 日志查看

- **前端日志**: 浏览器/Electron开发者工具控制台
- **Electron日志**: 终端输出
- **Python日志**: Python服务控制台输出

## 🔮 后续扩展

1. **更多信息源**: 支持Twitter API、微博等
2. **高级算法**: 机器学习相关性评分
3. **实时通知**: WebSocket推送新发现
4. **数据可视化**: 图表展示挖掘结果
5. **导出功能**: 支持多种格式导出

## 📦 打包和部署

### 快速打包

```bash
# 1. 安装所有依赖
npm install
npm run python-install

# 2. 构建并打包应用
npm run pack-all

# 3. 创建分发包
npm run dist-all
```

### 打包特性

- ✅ **Python后端自动集成**: Python服务自动打包到应用中
- ✅ **路径自动解析**: 开发和生产环境路径自动适配
- ✅ **Python可执行文件检测**: 自动查找系统Python
- ✅ **跨平台支持**: macOS、Windows、Linux

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md) - 详细的打包和分发指南
- [Python服务详细文档](./python-backend/README_PYTHON_SERVICE.md)
- [Python后端快速指南](./python-backend/README.md)
- [Electron官方文档](https://www.electronjs.org/docs)
- [React官方文档](https://reactjs.org/docs)
- [API客户端使用示例](./src/examples/backendIntegration.js)

---

🎉 **恭喜！你现在拥有一个完整的、可打包的智能信息挖掘桌面应用！**