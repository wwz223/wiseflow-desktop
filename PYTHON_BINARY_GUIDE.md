# Python 服务二进制打包指南

## 🎯 概述

WiseFlow Desktop 现在支持两种 Python 服务运行模式：

1. **二进制模式** (推荐) - 使用 PyInstaller 打包的独立可执行文件
2. **脚本模式** (备用) - 使用 Python 解释器运行脚本

## 🔨 构建二进制文件

### 自动构建 (推荐)

```bash
# 构建当前平台的二进制文件
npm run build-python-binary

# 构建并重新打包整个应用
npm run rebuild-service
```

### 手动构建

```bash
cd python-backend

# 安装PyInstaller
pip install pyinstaller

# 使用优化的构建脚本
python3 build_binary.py

# 或者使用原始的spec文件
pyinstaller --clean wiseflow_service.spec
```

## 📁 文件结构

```
wiseflow-desktop/
├── resources/
│   ├── mac/
│   │   └── wiseflow_service         # macOS 二进制文件
│   ├── win/
│   │   └── wiseflow_service.exe     # Windows 二进制文件
│   └── linux/
│       └── wiseflow_service         # Linux 二进制文件
├── python-backend/
│   ├── wiseflow_service.py          # 源脚本 (备用)
│   ├── build_binary.py              # 构建脚本
│   └── requirements.txt             # Python依赖
```

## ⚙️ 运行逻辑

1. **启动时检查**: Electron 首先检查是否存在当前平台的二进制文件
2. **优先使用二进制**: 如果找到二进制文件，直接执行
3. **回退到脚本**: 如果二进制文件不存在，使用 Python 解释器运行脚本
4. **错误处理**: 提供详细的错误信息和解决建议

## 📊 性能对比

| 模式       | 启动速度   | 内存占用     | 依赖要求       | 分发便利性 |
| ---------- | ---------- | ------------ | -------------- | ---------- |
| 二进制模式 | 快 (~2 秒) | 较高 (~50MB) | 无 Python 要求 | 优秀       |
| 脚本模式   | 慢 (~5 秒) | 较低 (~20MB) | 需要 Python    | 一般       |

## 🚀 打包发布

### 完整构建流程

```bash
# 1. 构建Python二进制文件
npm run build-python-binary

# 2. 构建React前端
npm run build

# 3. 打包Electron应用
npm run dist

# 4. 测试打包结果
# 检查 dist/ 目录中的安装包
```

### 验证二进制文件

```bash
# 手动测试二进制文件
./resources/mac/wiseflow_service --port 8080

# 检查API响应
curl http://localhost:8080/api/status
```

## 🔧 故障排除

### 常见问题

1. **二进制文件不存在**

   ```
   Error: 二进制文件不存在，回退到Python脚本模式
   ```

   解决方案：运行 `npm run build-python-binary`

2. **权限问题** (macOS/Linux)

   ```
   Error: Permission denied
   ```

   解决方案：确保二进制文件有执行权限

   ```bash
   chmod +x resources/mac/wiseflow_service
   ```

3. **依赖缺失**
   ```
   ModuleNotFoundError: No module named 'aiohttp'
   ```
   解决方案：检查 PyInstaller 构建时的隐藏导入配置

### 调试模式

开启详细日志：

```bash
# 开发环境
DEBUG=* npm run electron-dev

# 查看服务启动日志
tail -f ~/Library/Logs/wiseflow-desktop/main.log
```

## 🎯 最佳实践

1. **开发阶段**: 使用脚本模式便于快速迭代
2. **测试阶段**: 构建二进制文件进行集成测试
3. **发布阶段**: 始终包含二进制文件以获得最佳用户体验
4. **多平台**: 在 CI/CD 中为每个目标平台构建对应的二进制文件

## 📈 未来计划

- [ ] 支持增量更新二进制文件
- [ ] 添加二进制文件数字签名
- [ ] 实现跨平台交叉编译
- [ ] 集成自动化构建流程
