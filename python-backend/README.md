# WiseFlow Python 后端服务

这个文件夹包含了 WiseFlow Desktop 应用的 Python 后端服务。

## 📁 文件结构

```
python-backend/
├── wiseflow_service.py       # 主要的Python后端服务
├── start_service.py          # 服务启动器脚本
├── requirements.txt          # Python依赖列表
├── README_PYTHON_SERVICE.md  # 详细的服务文档
└── README.md                 # 本文件
```

## 🚀 快速启动

### 1. 安装依赖

```bash
# 在项目根目录执行
npm run python-install

# 或者在此文件夹内执行
cd python-backend
pip3 install -r requirements.txt
```

### 2. 启动服务

```bash
# 在项目根目录执行
npm run python-service

# 或者在此文件夹内执行
cd python-backend
python3 wiseflow_service.py
```

### 3. 使用启动器

```bash
# 在此文件夹内执行
python3 start_service.py --port 8080
```

## 🔧 配置

### 默认配置
- **服务端口**: 8080
- **数据库文件**: `wiseflow.db` (在运行目录创建)
- **挖掘间隔**: 4小时

### 自定义配置
```bash
# 指定端口
python3 wiseflow_service.py --port 8081

# 指定数据库文件
python3 wiseflow_service.py --db /path/to/custom.db
```

## 📊 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/status` | GET | 获取服务状态 |
| `/api/sources` | GET/POST/PUT/DELETE | 信息源管理 |
| `/api/keywords` | GET/POST/DELETE | 关键词管理 |
| `/api/discovered` | GET | 获取发现的信息 |
| `/api/mine` | POST | 开始/停止挖掘 |
| `/api/config` | GET/POST | 配置管理 |

## 🧪 测试

```bash
# 启动服务
python3 wiseflow_service.py --port 8080

# 在另一个终端测试
curl http://localhost:8080/api/status
curl http://localhost:8080/api/sources
curl http://localhost:8080/api/keywords
```

## 📚 详细文档

更多详细信息请查看：
- [Python服务详细文档](./README_PYTHON_SERVICE.md)
- [项目集成指南](../INTEGRATION_GUIDE.md)

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   lsof -i :8080
   # 更换端口或终止占用进程
   ```

2. **依赖安装失败**
   ```bash
   # 更新pip
   pip3 install --upgrade pip
   # 重新安装
   pip3 install -r requirements.txt
   ```

3. **权限问题**
   ```bash
   chmod +x wiseflow_service.py start_service.py
   ```

## 📈 开发

### 添加新功能

1. 在 `wiseflow_service.py` 中添加新的路由和处理函数
2. 更新数据库模式（如需要）
3. 在前端 API 客户端中添加对应方法
4. 更新文档

### 代码结构

- **WiseFlowService 类**: 主要的服务类
- **路由设置**: `setup_routes()` 方法
- **数据库操作**: 各种数据库交互方法
- **挖掘逻辑**: `perform_mining()` 和相关方法

---

🎯 **目标**: 为 WiseFlow Desktop 提供强大的智能信息挖掘后端支持！