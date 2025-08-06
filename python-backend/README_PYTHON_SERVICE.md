# WiseFlow Python 后端服务

## 简介

这是一个简单的Python后端服务，用于WiseFlow桌面应用的信息挖掘功能。

## 功能特性

- 🔍 **信息源管理**: 支持RSS订阅、网站抓取
- 🎯 **关键词挖掘**: 基于关键词的智能信息过滤
- 📊 **相关性评分**: 自动计算信息相关性
- 💾 **数据存储**: SQLite数据库存储
- 🌐 **REST API**: 提供完整的HTTP API接口

## 快速开始

### 1. 安装依赖

```bash
# 方式1: 使用启动脚本自动安装
python3 start_service.py --install

# 方式2: 手动安装
pip3 install -r requirements.txt
```

### 2. 启动服务

```bash
# 使用默认端口8080
python3 start_service.py

# 或者指定端口
python3 start_service.py --port 8080

# 直接启动服务
python3 wiseflow_service.py --port 8080
```

### 3. 在桌面应用中配置

1. 打开WiseFlow桌面应用
2. 进入"设置"页面
3. 配置Python服务路径:
   - Python路径: `python3` 或完整路径
   - 脚本路径: `/path/to/wiseflow_service.py`
   - 服务端口: `8080`
4. 点击"启动服务"

## API 接口

### 服务状态
- `GET /api/status` - 获取服务状态

### 信息源管理
- `GET /api/sources` - 获取信息源列表
- `POST /api/sources` - 添加信息源
- `PUT /api/sources/{id}` - 更新信息源
- `DELETE /api/sources/{id}` - 删除信息源

### 关键词管理
- `GET /api/keywords` - 获取关键词列表
- `POST /api/keywords` - 添加关键词
- `DELETE /api/keywords/{id}` - 删除关键词

### 信息挖掘
- `GET /api/discovered` - 获取发现的信息
- `POST /api/mine` - 开始挖掘任务
- `POST /api/mine/stop` - 停止挖掘任务

### 配置管理
- `GET /api/config` - 获取配置
- `POST /api/config` - 更新配置

## 配置说明

### 默认配置
- 服务端口: `8080`
- 数据库文件: `wiseflow.db`
- 挖掘间隔: `4小时`

### 支持的信息源类型
- **RSS订阅**: 自动解析RSS/Atom订阅
- **网站**: 简单的网页标题抓取
- **Twitter**: (待实现)

## 数据库结构

服务使用SQLite数据库存储数据，包含以下表：

1. **sources** - 信息源配置
2. **keywords** - 关键词列表
3. **discovered_info** - 发现的信息

## 故障排除

### 常见问题

1. **端口占用错误**
   ```bash
   # 检查端口占用
   lsof -i :8080
   
   # 更换端口
   python3 start_service.py --port 8081
   ```

2. **依赖安装失败**
   ```bash
   # 更新pip
   pip3 install --upgrade pip
   
   # 手动安装依赖
   pip3 install aiohttp aiohttp-cors feedparser
   ```

3. **权限问题**
   ```bash
   # 设置执行权限
   chmod +x wiseflow_service.py start_service.py
   ```

4. **网络连接问题**
   - 检查RSS源URL是否可访问
   - 确认防火墙设置允许HTTP请求

### 日志查看

服务运行时会输出详细日志，包括：
- 服务启动信息
- 挖掘任务执行情况
- 错误和异常信息

## 扩展开发

### 添加新的信息源类型

1. 在 `WiseFlowService` 类中添加新的挖掘方法
2. 在 `perform_mining` 方法中调用新方法
3. 更新数据库架构（如需要）

### 自定义相关性算法

修改 `calculate_relevance` 方法来实现自定义的相关性计算逻辑。

### 添加新的API接口

在 `setup_routes` 方法中添加新的路由，并实现对应的处理方法。

## 许可证

MIT License