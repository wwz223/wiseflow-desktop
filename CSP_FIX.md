# CSP 修复说明

## 🚨 问题
前端应用试图连接到Python后端API时遇到CSP错误：
```
Refused to connect to 'http://localhost:8080/api/status' because it violates the document's Content Security Policy.
```

## ✅ 解决方案

### 修复的CSP配置
在 `public/index.html` 中更新了Content Security Policy：

**修复前：**
```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
/>
<!-- connect-src 'self' ws://localhost:3000; WebSocket 相关，暂时注释 -->
```

**修复后：**
```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:3000 http://localhost:8080 http://localhost:8081;"
/>
```

### 🔧 关键变化
1. **添加了 `connect-src` 指令** - 控制应用可以连接到哪些URL
2. **允许WebSocket连接** - `ws://localhost:3000` (React开发服务器)
3. **允许API连接** - `http://localhost:8080` 和 `http://localhost:8081` (Python后端API)

### 📊 支持的连接
- ✅ `'self'` - 同源连接
- ✅ `ws://localhost:3000` - React开发服务器WebSocket
- ✅ `http://localhost:8080` - Python后端API (默认端口)
- ✅ `http://localhost:8081` - Python后端API (备用端口)

## 🎯 现在应该工作的功能

### 前端API连接
- ✅ 应用启动时自动检查API连接
- ✅ 显示"API连接: 已连接"状态
- ✅ 所有数据操作与后端同步

### API端点测试
```bash
# Python服务状态
curl http://localhost:8080/api/status

# 获取信息源
curl http://localhost:8080/api/sources

# 获取关键词
curl http://localhost:8080/api/keywords
```

## 🚀 测试步骤

1. **确认Python服务运行**:
   ```bash
   curl http://localhost:8080/api/status
   ```

2. **启动前端应用**:
   ```bash
   npm run electron-dev
   ```

3. **检查连接状态**:
   - 仪表盘显示"API连接: 已连接"
   - 没有CSP错误在控制台中出现

4. **测试功能**:
   - 添加关键词应该直接同步到后端
   - 管理信息源应该实时更新
   - 发现信息显示后端数据

## 💡 如果仍有问题

### 检查开发者工具控制台
1. 打开Electron开发者工具 (Ctrl+Shift+I 或 Cmd+Opt+I)
2. 查看Console面板是否还有CSP错误
3. 查看Network面板确认API请求是否发送

### 验证API连接
```javascript
// 在浏览器控制台中测试
fetch('http://localhost:8080/api/status')
  .then(res => res.json())
  .then(data => console.log('API响应:', data))
  .catch(err => console.error('API错误:', err));
```

---

🎉 **CSP修复完成！前端应用现在可以正常连接到Python后端API了！**