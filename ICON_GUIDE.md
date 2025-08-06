# WiseFlow Desktop 图标指南

## 📱 图标概述

WiseFlow Desktop 现在使用 `assets/logo.png` 作为统一的应用图标。

### 🎨 设计说明

- **文件**: `assets/logo.png` (960x960, JPEG格式)
- **用途**: 所有平台统一使用此logo文件
- **自动转换**: electron-builder 会自动将PNG转换为各平台所需格式

### 📁 图标文件结构

```
assets/
└── logo.png              # 主图标文件 (960x960)

public/
├── favicon.ico           # 网页图标 (logo.png副本)
├── icon-192.png          # PWA 图标 (logo.png副本)
└── icon-512.png          # PWA 图标 (logo.png副本)
```

### 🛠️ 平台配置

#### 所有平台
- **源文件**: `assets/logo.png`
- **macOS**: `package.json` > `build.mac.icon` → 自动转换为 .icns
- **Windows**: `package.json` > `build.win.icon` → 自动转换为 .ico
- **Linux**: `package.json` > `build.linux.icon` → 直接使用 .png

#### Web/PWA
- **文件**: `public/manifest.json`
- **图标**: 全部使用 logo.png 的副本
- **自动适配**: 浏览器会根据需要缩放图标

### 🔄 更换图标

如需更换图标，非常简单：

1. **替换图标文件**:
   ```bash
   # 将新的图标文件替换 assets/logo.png
   cp /path/to/new-logo.png assets/logo.png
   ```

2. **更新 Web 图标**:
   ```bash
   cp assets/logo.png public/favicon.ico
   cp assets/logo.png public/icon-192.png
   cp assets/logo.png public/icon-512.png
   ```

3. **重新打包应用**:
   ```bash
   npm run build && npm run pack
   ```

就这么简单！electron-builder 会自动处理格式转换。

### ✅ 验证图标

打包完成后，您可以通过以下方式验证图标：

1. **应用图标**: 在 Finder 中查看 `dist/mac-arm64/` 目录
2. **应用包内**: 检查 `WiseFlow.app/Contents/Resources/icon.icns`
3. **运行应用**: 查看 Dock 和应用窗口中的图标
4. **Web 图标**: 在浏览器中查看 React 应用的 favicon

### 🎯 优势

使用单个 logo.png 文件的优势：

1. **简化管理**: 只需维护一个图标文件
2. **自动转换**: electron-builder 自动处理格式转换
3. **一致性**: 所有平台使用相同的原始图标
4. **易于更新**: 替换一个文件即可更新所有平台图标

### 📏 建议规格

- **分辨率**: 建议使用 512x512 或更高分辨率
- **格式**: PNG 格式最佳，支持透明背景
- **设计**: 简洁清晰，在小尺寸下仍可识别

---

🎨 **注意**: 当前使用的 logo.png 是 960x960 的 JPEG 格式，electron-builder 会自动优化处理。