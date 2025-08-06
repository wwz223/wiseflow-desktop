#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动构建WiseFlow服务二进制文件
支持多平台打包
"""

import os
import sys
import subprocess
import shutil
import platform
from pathlib import Path

def get_platform_info():
    """获取平台信息"""
    system = platform.system().lower()
    if system == 'darwin':
        return 'mac'
    elif system == 'windows':
        return 'win'
    elif system == 'linux':
        return 'linux'
    else:
        return 'unknown'

def install_pyinstaller():
    """安装PyInstaller"""
    try:
        import PyInstaller
        print("✅ PyInstaller 已安装")
        return True
    except ImportError:
        print("📦 正在安装 PyInstaller...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
            print("✅ PyInstaller 安装完成")
            return True
        except subprocess.CalledProcessError:
            print("❌ PyInstaller 安装失败")
            return False

def create_spec_file():
    """创建优化的 .spec 文件"""
    spec_content = """# -*- mode: python ; coding: utf-8 -*-

import sys
from pathlib import Path

# 添加当前目录到路径
sys.path.insert(0, str(Path.cwd()))

a = Analysis(
    ['wiseflow_service.py'],
    pathex=[str(Path.cwd())],
    binaries=[],
    datas=[
        # 如果有数据文件，在这里添加
    ],
    hiddenimports=[
        'aiohttp',
        'aiohttp.web',
        'aiohttp_cors', 
        'feedparser',
        'sqlite3',
        'asyncio',
        'json',
        'logging',
        'datetime',
        'urllib.parse',
        're'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
        'PIL',
        'PyQt5',
        'PyQt6'
    ],
    noarchive=False,
    optimize=2,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='wiseflow_service',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None
)
"""
    with open('wiseflow_service_optimized.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)
    print("✅ 优化的 .spec 文件已创建")

def build_binary():
    """构建二进制文件"""
    print("🔨 开始构建二进制文件...")
    
    try:
        # 使用优化的spec文件构建
        cmd = [
            sys.executable, '-m', 'PyInstaller',
            '--clean',
            '--noconfirm',
            'wiseflow_service_optimized.spec'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ 二进制文件构建成功")
            return True
        else:
            print("❌ 构建失败:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ 构建过程出错: {e}")
        return False

def copy_to_resources():
    """复制二进制文件到资源目录"""
    platform_name = get_platform_info()
    
    # 源文件路径
    binary_name = 'wiseflow_service.exe' if platform_name == 'win' else 'wiseflow_service'
    src_path = Path('dist') / binary_name
    
    # 目标路径
    resources_dir = Path('..') / 'resources' / platform_name
    resources_dir.mkdir(parents=True, exist_ok=True)
    dst_path = resources_dir / binary_name
    
    if src_path.exists():
        shutil.copy2(src_path, dst_path)
        # 在Unix系统上确保可执行权限
        if platform_name in ['mac', 'linux']:
            os.chmod(dst_path, 0o755)
        
        print(f"✅ 二进制文件已复制到: {dst_path}")
        print(f"📁 文件大小: {dst_path.stat().st_size / (1024*1024):.1f} MB")
        return True
    else:
        print(f"❌ 源文件不存在: {src_path}")
        return False

def cleanup():
    """清理临时文件"""
    cleanup_dirs = ['build', 'dist']
    cleanup_files = ['wiseflow_service_optimized.spec']
    
    for dir_name in cleanup_dirs:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
            print(f"🧹 已清理: {dir_name}/")
    
    for file_name in cleanup_files:
        if os.path.exists(file_name):
            os.remove(file_name)
            print(f"🧹 已清理: {file_name}")

def main():
    print("🚀 WiseFlow 服务二进制构建工具")
    print(f"📍 当前平台: {get_platform_info()}")
    print("=" * 50)
    
    # 检查依赖
    if not install_pyinstaller():
        return False
    
    # 安装项目依赖
    print("📦 检查项目依赖...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ 项目依赖检查完成")
    except subprocess.CalledProcessError:
        print("❌ 项目依赖安装失败")
        return False
    
    # 创建优化的spec文件
    create_spec_file()
    
    # 构建二进制文件
    if not build_binary():
        return False
    
    # 复制到资源目录
    if not copy_to_resources():
        return False
    
    # 清理临时文件
    cleanup()
    
    print("=" * 50)
    print("🎉 构建完成！")
    print("💡 提示: 现在可以在Electron应用中使用打包的二进制文件了")
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)