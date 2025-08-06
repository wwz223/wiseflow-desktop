#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WiseFlow Backend Service
智能信息挖掘后端服务
"""

import asyncio
import json
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import aiohttp
import feedparser
import re
from urllib.parse import urljoin, urlparse
from aiohttp import web
from aiohttp.web import middleware
from aiohttp_cors import setup as cors_setup, ResourceOptions
import sqlite3
import os
import time

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WiseFlowService:
    def __init__(self, port: int = 8080, db_path: str = "wiseflow.db"):
        self.port = port
        self.db_path = db_path
        self.app = web.Application(middlewares=[self.cors_middleware])
        self.setup_routes()
        self.setup_database()
        self.mining_task = None
        self.sources = []
        self.keywords = []
        self.mining_interval = 4  # 小时
        
    @middleware
    async def cors_middleware(self, request, handler):
        """CORS 中间件"""
        # 处理预检请求
        if request.method == 'OPTIONS':
            response = web.Response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Max-Age'] = '86400'  # 24小时
            return response
        
        # 处理实际请求
        response = await handler(request)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

    def setup_database(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建信息源表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                url TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                last_sync TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建关键词表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS keywords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT NOT NULL UNIQUE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建发现信息表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS discovered_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                summary TEXT,
                url TEXT,
                source_name TEXT,
                relevance REAL,
                tags TEXT,
                published_at TEXT,
                discovered_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 插入默认数据
        default_sources = [
            ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', 1),
            ('Hacker News', 'web', 'https://news.ycombinator.com', 1),
        ]
        
        for source in default_sources:
            cursor.execute('''
                INSERT OR IGNORE INTO sources (name, type, url, enabled)
                VALUES (?, ?, ?, ?)
            ''', source)
        
        default_keywords = ['人工智能', '机器学习', '大模型', 'AI新闻']
        for keyword in default_keywords:
            cursor.execute('INSERT OR IGNORE INTO keywords (keyword) VALUES (?)', (keyword,))
        
        conn.commit()
        conn.close()
        logger.info("数据库初始化完成")

    def setup_routes(self):
        """设置路由"""
        # 服务状态
        self.app.router.add_get('/api/status', self.get_status)
        
        # 信息源管理
        self.app.router.add_get('/api/sources', self.get_sources)
        self.app.router.add_post('/api/sources', self.add_source)
        self.app.router.add_put('/api/sources/{source_id}', self.update_source)
        self.app.router.add_delete('/api/sources/{source_id}', self.delete_source)
        
        # 关键词管理
        self.app.router.add_get('/api/keywords', self.get_keywords)
        self.app.router.add_post('/api/keywords', self.add_keyword)
        self.app.router.add_delete('/api/keywords/{keyword_id}', self.delete_keyword)
        
        # 信息挖掘
        self.app.router.add_get('/api/discovered', self.get_discovered_info)
        self.app.router.add_post('/api/mine', self.start_mining)
        self.app.router.add_post('/api/mine/stop', self.stop_mining)
        
        # 配置
        self.app.router.add_get('/api/config', self.get_config)
        self.app.router.add_post('/api/config', self.update_config)

    async def get_status(self, request):
        """获取服务状态"""
        return web.json_response({
            'status': 'running',
            'version': '1.0.0',
            'mining_active': self.mining_task is not None,
            'timestamp': datetime.now().isoformat()
        })

    async def get_sources(self, request):
        """获取信息源列表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM sources ORDER BY created_at DESC')
        sources = []
        for row in cursor.fetchall():
            sources.append({
                'id': row[0],
                'name': row[1],
                'type': row[2],
                'url': row[3],
                'enabled': bool(row[4]),
                'lastSync': row[5] or '从未',
                'createdAt': row[6]
            })
        conn.close()
        return web.json_response({'sources': sources})

    async def add_source(self, request):
        """添加信息源"""
        data = await request.json()
        name = data.get('name')
        source_type = data.get('type')
        url = data.get('url')
        
        if not all([name, source_type, url]):
            return web.json_response({'error': '缺少必要参数'}, status=400)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sources (name, type, url, enabled)
            VALUES (?, ?, ?, 1)
        ''', (name, source_type, url))
        source_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return web.json_response({
            'id': source_id,
            'message': '信息源添加成功'
        })

    async def update_source(self, request):
        """更新信息源"""
        source_id = request.match_info['source_id']
        data = await request.json()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 构建更新语句
        updates = []
        params = []
        
        if 'enabled' in data:
            updates.append('enabled = ?')
            params.append(int(data['enabled']))
        
        if 'name' in data:
            updates.append('name = ?')
            params.append(data['name'])
        
        if 'url' in data:
            updates.append('url = ?')
            params.append(data['url'])
        
        if updates:
            params.append(source_id)
            cursor.execute(f'''
                UPDATE sources SET {', '.join(updates)}
                WHERE id = ?
            ''', params)
            conn.commit()
        
        conn.close()
        return web.json_response({'message': '信息源更新成功'})

    async def delete_source(self, request):
        """删除信息源"""
        source_id = request.match_info['source_id']
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sources WHERE id = ?', (source_id,))
        conn.commit()
        conn.close()
        
        return web.json_response({'message': '信息源删除成功'})

    async def get_keywords(self, request):
        """获取关键词列表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM keywords ORDER BY created_at DESC')
        keywords = []
        for row in cursor.fetchall():
            keywords.append({
                'id': row[0],
                'keyword': row[1],
                'createdAt': row[2]
            })
        conn.close()
        return web.json_response({'keywords': keywords})

    async def add_keyword(self, request):
        """添加关键词"""
        data = await request.json()
        keyword = data.get('keyword', '').strip()
        
        if not keyword:
            return web.json_response({'error': '关键词不能为空'}, status=400)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute('INSERT INTO keywords (keyword) VALUES (?)', (keyword,))
            keyword_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return web.json_response({
                'id': keyword_id,
                'message': '关键词添加成功'
            })
        except sqlite3.IntegrityError:
            conn.close()
            return web.json_response({'error': '关键词已存在'}, status=400)

    async def delete_keyword(self, request):
        """删除关键词"""
        keyword_id = request.match_info['keyword_id']
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM keywords WHERE id = ?', (keyword_id,))
        conn.commit()
        conn.close()
        
        return web.json_response({'message': '关键词删除成功'})

    async def get_discovered_info(self, request):
        """获取发现的信息"""
        limit = int(request.query.get('limit', 50))
        offset = int(request.query.get('offset', 0))
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM discovered_info 
            ORDER BY discovered_at DESC 
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        info_list = []
        for row in cursor.fetchall():
            tags = json.loads(row[6]) if row[6] else []
            info_list.append({
                'id': row[0],
                'title': row[1],
                'summary': row[2],
                'url': row[3],
                'source': row[4],
                'relevance': row[5],
                'tags': tags,
                'timestamp': row[7],
                'discoveredAt': row[8]
            })
        
        conn.close()
        return web.json_response({'info': info_list})

    async def start_mining(self, request):
        """开始信息挖掘"""
        if self.mining_task and not self.mining_task.done():
            return web.json_response({'message': '挖掘任务已在运行中'})
        
        self.mining_task = asyncio.create_task(self.mining_loop())
        return web.json_response({'message': '信息挖掘已启动'})

    async def stop_mining(self, request):
        """停止信息挖掘"""
        if self.mining_task and not self.mining_task.done():
            self.mining_task.cancel()
            return web.json_response({'message': '信息挖掘已停止'})
        
        return web.json_response({'message': '没有运行中的挖掘任务'})

    async def get_config(self, request):
        """获取配置"""
        return web.json_response({
            'mining_interval': self.mining_interval,
            'port': self.port
        })

    async def update_config(self, request):
        """更新配置"""
        data = await request.json()
        if 'mining_interval' in data:
            self.mining_interval = data['mining_interval']
        
        return web.json_response({'message': '配置更新成功'})

    async def mining_loop(self):
        """挖掘循环"""
        try:
            while True:
                logger.info("开始执行信息挖掘...")
                await self.perform_mining()
                logger.info(f"挖掘完成，等待 {self.mining_interval} 小时...")
                await asyncio.sleep(self.mining_interval * 3600)  # 转换为秒
        except asyncio.CancelledError:
            logger.info("挖掘任务已取消")

    async def perform_mining(self):
        """执行挖掘任务"""
        # 获取启用的信息源
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM sources WHERE enabled = 1')
        sources = cursor.fetchall()
        
        cursor.execute('SELECT keyword FROM keywords')
        keywords = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        if not keywords:
            logger.warning("没有配置关键词，跳过挖掘")
            return
        
        discovered_count = 0
        
        for source in sources:
            source_id, name, source_type, url, enabled, last_sync, created_at = source
            
            try:
                if source_type == 'rss':
                    discovered_count += await self.mine_rss_source(name, url, keywords)
                elif source_type == 'web':
                    discovered_count += await self.mine_web_source(name, url, keywords)
                
                # 更新最后同步时间
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE sources SET last_sync = ? WHERE id = ?',
                    (datetime.now().isoformat(), source_id)
                )
                conn.commit()
                conn.close()
                
            except Exception as e:
                logger.error(f"挖掘源 {name} 时出错: {e}")
        
        logger.info(f"本次挖掘发现 {discovered_count} 条相关信息")

    async def mine_rss_source(self, source_name: str, url: str, keywords: List[str]) -> int:
        """挖掘RSS源"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=30) as response:
                    content = await response.text()
            
            feed = feedparser.parse(content)
            discovered_count = 0
            
            for entry in feed.entries[:10]:  # 限制处理最新的10条
                title = entry.get('title', '')
                summary = entry.get('summary', entry.get('description', ''))
                link = entry.get('link', '')
                published = entry.get('published', '')
                
                # 计算相关性
                relevance = self.calculate_relevance(title + ' ' + summary, keywords)
                
                if relevance > 50:  # 只保存相关性大于50%的信息
                    tags = self.extract_tags(title + ' ' + summary, keywords)
                    
                    conn = sqlite3.connect(self.db_path)
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT OR IGNORE INTO discovered_info 
                        (title, summary, url, source_name, relevance, tags, published_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (title, summary, link, source_name, relevance, json.dumps(tags), published))
                    
                    if cursor.rowcount > 0:
                        discovered_count += 1
                    
                    conn.commit()
                    conn.close()
            
            return discovered_count
            
        except Exception as e:
            logger.error(f"RSS挖掘失败 {url}: {e}")
            return 0

    async def mine_web_source(self, source_name: str, url: str, keywords: List[str]) -> int:
        """挖掘网站源（简化版本）"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=30) as response:
                    content = await response.text()
            
            # 简单的HTML解析，提取标题
            title_pattern = r'<title[^>]*>([^<]+)</title>'
            titles = re.findall(title_pattern, content, re.IGNORECASE)
            
            discovered_count = 0
            
            for title in titles[:5]:  # 处理前5个标题
                relevance = self.calculate_relevance(title, keywords)
                
                if relevance > 60:  # 网站内容要求更高的相关性
                    tags = self.extract_tags(title, keywords)
                    
                    conn = sqlite3.connect(self.db_path)
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT OR IGNORE INTO discovered_info 
                        (title, summary, url, source_name, relevance, tags, published_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (title, f"来自 {source_name}", url, source_name, relevance, json.dumps(tags), datetime.now().isoformat()))
                    
                    if cursor.rowcount > 0:
                        discovered_count += 1
                    
                    conn.commit()
                    conn.close()
            
            return discovered_count
            
        except Exception as e:
            logger.error(f"网站挖掘失败 {url}: {e}")
            return 0

    def calculate_relevance(self, text: str, keywords: List[str]) -> float:
        """计算相关性得分"""
        if not text or not keywords:
            return 0.0
        
        text_lower = text.lower()
        matched_keywords = 0
        total_matches = 0
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            matches = text_lower.count(keyword_lower)
            if matches > 0:
                matched_keywords += 1
                total_matches += matches
        
        # 计算相关性：匹配关键词数量占比 * 70% + 匹配次数权重 * 30%
        keyword_ratio = matched_keywords / len(keywords)
        match_weight = min(total_matches / 10, 1.0)  # 最多10次匹配为满分
        
        relevance = (keyword_ratio * 0.7 + match_weight * 0.3) * 100
        return min(relevance, 100.0)

    def extract_tags(self, text: str, keywords: List[str]) -> List[str]:
        """从文本中提取匹配的标签"""
        tags = []
        text_lower = text.lower()
        
        for keyword in keywords:
            if keyword.lower() in text_lower:
                tags.append(keyword)
        
        return tags

    async def run(self):
        """运行服务"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        logger.info(f"WiseFlow 服务已启动，端口: {self.port}")


def main():
    parser = argparse.ArgumentParser(description='WiseFlow Backend Service')
    parser.add_argument('--port', type=int, default=8080, help='服务端口 (默认: 8080)')
    parser.add_argument('--db', type=str, default='wiseflow.db', help='数据库文件路径')
    
    args = parser.parse_args()
    
    service = WiseFlowService(port=args.port, db_path=args.db)
    
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(service.run())
        loop.run_forever()
    except KeyboardInterrupt:
        logger.info("服务已停止")


if __name__ == '__main__':
    main()