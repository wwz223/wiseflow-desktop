# WiseFlow Desktop

基于 Electron + React + Tailwind CSS 构建的智能信息挖掘桌面客户端。

## 项目简介

WiseFlow Desktop 是 [WiseFlow](https://github.com/TeamWiseFlow/wiseflow) 项目的桌面客户端，提供了一个直观易用的图形界面来管理信息源、配置关键点、展示挖掘到的信息，并控制 Python 后端服务。

### 核心功能

- 🚀 **服务管理** - 一键启动/停止 Python WiseFlow 服务
- 📡 **信息源管理** - 支持 RSS、网站、Twitter 等多种信息源
- 🎯 **关键点配置** - 智能关键词管理和过滤
- 📊 **信息流展示** - 美观的信息卡片展示，支持相关度评分
- ⚙️ **配置管理** - 完整的服务配置和偏好设置
- 📈 **实时监控** - 服务状态监控和日志查看
- 💾 **数据导出** - 支持数据导出和备份

## 技术栈

- **前端框架**: React 18
- **桌面框架**: Electron 22
- **样式库**: Tailwind CSS
- **图标库**: Lucide React
- **HTTP 客户端**: Axios
- **状态管理**: React Hooks
- **构建工具**: Create React App

## 系统要求

- Node.js 16+ 
- Python 3.8+ (用于运行 WiseFlow 后端服务)
- 操作系统: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)

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

### 3. 安装额外依赖

```bash
# 如果没有自动安装，手动安装 electron-is-dev
npm install electron-is-dev --save-dev
```

### 4. 开发模式运行

```bash
# 启动开发服务器和 Electron
npm run electron-dev
```

### 5. 构建生产版本

```bash
# 构建 React 应用
npm run build

# 打包 Electron 应用
npm run dist
```

## 项目结构

```
wiseflow-desktop/
├── public/
│   ├── electron.js          # Electron 主进程
│   ├── preload.js          # 预加载脚本
│   └── index.html          # HTML 模板
├── src/
│   ├── App.js              # React 主应用
│   ├── App.css             # 应用样式
│   ├── index.js            # React 入口
│   └── index.css           # 基础样式
├── api/
│   └── wiseflow_api.js     # Python 服务 API 接口
├── tailwind.config.js      # Tailwind 配置
├── package.json            # 项目配置
└── README.md              # 项目说明
```

## 配置说明

### Electron 配置

在 `public/electron.js` 中，您可以配置：

- 窗口大小和属性
- 菜单栏设置
- 安全策略
- IPC 通信接口

### Python 服务集成

应用需要与 WiseFlow Python 服务进行通信：

1. **配置 Python 路径**: 在设置页面指定 Python 可执行文件路径
2. **设置脚本路径**: 选择 WiseFlow 主脚本文件
3. **配置服务端口**: 默认使用 8080 端口
4. **API 密钥**: 如果 Python 服务需要认证

### 环境变量

创建 `.env` 文件（可选）：

```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080/ws
ELECTRON_IS_DEV=true
```

## 使用指南

### 首次使用

1. **启动应用**: 运行桌面应用
2. **配置服务**: 进入设置页面，配置 Python 服务参数
3. **启动服务**: 在仪表板点击"启动服务"
4. **添加信源**: 在信息源页面添加您感兴趣的信息源
5. **设置关键词**: 在关键点页面配置相关关键词
6. **查看结果**: 在信息流页面查看挖掘到的信息

### 功能详解

#### 仪表板
- 显示服务运行状态
- 今日挖掘统计
- 最新发现预览
- 实时服务日志

#### 信息源管理
- 支持 RSS 订阅源
- 网站爬取配置
- Twitter 账号监控
- 批量导入/导出

#### 关键点配置
- 智能关键词匹配
- 支持正则表达式
- 权重设置
- 分类管理

#### 信息流
- 按相关度排序
- 实时搜索过滤
- 标签分类
- 详情查看

## 开发指南

### 添加新功能

1. **前端组件**: 在 `src/App.js` 中添加新的渲染函数
2. **API 接口**: 在 `api/wiseflow_api.js` 中添加新的 API 方法
3. **Electron 集成**: 在 `public/electron.js` 中添加 IPC 处理器

### 样式定制

使用 Tailwind CSS 进行样式定制：

```javascript
// 示例：自定义按钮样式
<button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
  点击我
</button>
```

### 状态管理

使用 React Hooks 进行状态管理：

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

## 打包和分发

### Windows

```bash
npm run dist
# 生成的文件在 dist/ 目录下
```

### macOS

```bash
npm run dist
# 生成 .dmg 文件
```

### Linux

```bash
npm run dist
# 生成 AppImage 文件
```

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
   - 检查 Python 路径是否正确
   - 确保 WiseFlow 依赖已安装
   - 查看服务日志获取详细错误信息

2. **端口冲突**
   - 修改服务端口配置
   - 检查是否有其他服务占用端口

3. **权限问题**
   - macOS: 在系统偏好设置中允许应用运行
   - Windows: 以管理员身份运行
   - Linux: 检查文件执行权限

### 调试模式

开发模式下启用调试：

```bash
# 启用详细日志
DEBUG=* npm run electron-dev

# 或仅启用特定模块
DEBUG=main npm run electron-dev
```

### 日志位置

- **Windows**: `%APPDATA%/wiseflow-desktop/logs/`
- **macOS**: `~/Library/Logs/wiseflow-desktop/`
- **Linux**: `~/.config/wiseflow-desktop/logs/`

## API 文档

### 与 Python 服务通信

应用通过 REST API 与 Python 服务通信：

```javascript
// 获取服务状态
const status = await wiseflowAPI.getStatus();

// 添加信息源
const result = await wiseflowAPI.createSource({
  name: "示例源",
  type: "rss",
  url: "https://example.com/feed"
});
```

### IPC 通信

Electron 主进程与渲染进程通信：

```javascript
// 渲染进程
const result = await window.electronAPI.startPythonService(config);

// 主进程
ipcMain.handle('start-python-service', async (event, config) => {
  // 启动 Python 服务逻辑
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

### v1.0.0 (2024-XX-XX)
- 🎉 首个正式版本发布
- ✅ 完整的信息源管理功能
- ✅ 关键词配置和过滤
- ✅ Python 服务集成
- ✅ 跨平台支持

## 路线图

- [ ] 更多信息源类型支持
- [ ] 高级过滤和搜索功能
- [ ] 数据可视化图表
- [ ] 移动端同步
- [ ] 插件系统
- [ ] 多语言支持

---

**感谢使用 WiseFlow Desktop！** 如果这个项目对您有帮助，请考虑给个 ⭐️