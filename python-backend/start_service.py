#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WiseFlow Service Starter
简化的服务启动器
"""

import subprocess
import sys
import os
import argparse

def install_dependencies():
    """安装Python依赖"""
    print("正在安装Python依赖...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("依赖安装完成!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"依赖安装失败: {e}")
        return False

def start_service(port=8080):
    """启动WiseFlow服务"""
    print(f"正在启动WiseFlow服务，端口: {port}")
    try:
        subprocess.run([sys.executable, 'wiseflow_service.py', '--port', str(port)])
    except KeyboardInterrupt:
        print("\n服务已停止")
    except Exception as e:
        print(f"服务启动失败: {e}")

def main():
    parser = argparse.ArgumentParser(description='WiseFlow Service Starter')
    parser.add_argument('--port', type=int, default=8080, help='服务端口 (默认: 8080)')
    parser.add_argument('--install', action='store_true', help='安装依赖')
    
    args = parser.parse_args()
    
    # 检查是否需要安装依赖
    if args.install:
        if not install_dependencies():
            return
    
    # 检查依赖是否已安装
    try:
        import aiohttp
        import feedparser
    except ImportError:
        print("检测到缺少依赖，正在自动安装...")
        if not install_dependencies():
            print("请手动运行: pip install -r requirements.txt")
            return
    
    # 启动服务
    start_service(args.port)

if __name__ == '__main__':
    main()