#!/usr/bin/env node

/**
 * PocketBase 连接测试工具
 * 用于验证 PocketBase 服务是否正常运行
 */

const https = require('https');
const http = require('http');

async function testPocketBaseConnection(port = 8090) {
  const baseUrl = `http://localhost:${port}`;
  
  console.log(`🔍 测试 PocketBase 连接: ${baseUrl}`);
  
  // 测试1: 健康检查
  console.log('\n1. 测试健康检查 API...');
  try {
    const healthResponse = await makeRequest(`${baseUrl}/api/health`);
    console.log('✅ 健康检查成功:', healthResponse.substring(0, 100));
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }
  
  // 测试2: 集合列表
  console.log('\n2. 测试集合列表 API...');
  try {
    const collectionsResponse = await makeRequest(`${baseUrl}/api/collections`);
    const collections = JSON.parse(collectionsResponse);
    console.log(`✅ 集合列表获取成功，共 ${collections.length} 个集合`);
    
    // 显示业务相关的集合
    const businessCollections = collections.filter(c => 
      ['sources', 'focus_points', 'infos', 'crawled_data'].includes(c.name)
    );
    
    if (businessCollections.length > 0) {
      console.log('📊 业务集合:');
      businessCollections.forEach(c => {
        console.log(`   - ${c.name} (${c.type})`);
      });
    } else {
      console.log('⚠️  未找到业务集合，可能需要创建数据库结构');
    }
  } catch (error) {
    console.log('❌ 集合列表获取失败:', error.message);
  }
  
  // 测试3: 管理界面
  console.log('\n3. 测试管理界面...');
  try {
    const adminResponse = await makeRequest(`${baseUrl}/_/`);
    console.log('✅ 管理界面可访问');
    console.log(`🌐 管理界面地址: ${baseUrl}/_/`);
  } catch (error) {
    console.log('❌ 管理界面访问失败:', error.message);
  }
  
  console.log('\n🏁 测试完成');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    
    const req = lib.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 运行测试
const port = process.argv[2] || 8090;
testPocketBaseConnection(parseInt(port))
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });