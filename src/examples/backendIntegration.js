/**
 * Python 后端集成示例
 * 展示如何在 React 组件中使用 WiseFlow API 客户端
 */

import React, { useState, useEffect } from 'react';
import WiseFlowAPIClient from '../api/wiseflowClient';

// 创建 API 客户端实例
const apiClient = new WiseFlowAPIClient('http://localhost:8080');

const BackendIntegrationExample = () => {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [sources, setSources] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [discoveredInfo, setDiscoveredInfo] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // 检查服务连接
  useEffect(() => {
    checkServiceConnection();
  }, []);

  const checkServiceConnection = async () => {
    const connected = await apiClient.checkConnection();
    setIsConnected(connected);
    
    if (connected) {
      loadServiceData();
    }
  };

  // 加载服务数据
  const loadServiceData = async () => {
    try {
      // 获取服务状态
      const status = await apiClient.getStatus();
      setServiceStatus(status);

      // 获取信息源
      const sourcesData = await apiClient.getSources();
      setSources(sourcesData.sources || []);

      // 获取关键词
      const keywordsData = await apiClient.getKeywords();
      setKeywords(keywordsData.keywords || []);

      // 获取发现的信息
      const infoData = await apiClient.getDiscoveredInfo(10, 0);
      setDiscoveredInfo(infoData.info || []);

    } catch (error) {
      console.error('加载服务数据失败:', error);
    }
  };

  // 添加新信息源
  const handleAddSource = async () => {
    try {
      const newSource = {
        name: 'AI News',
        type: 'rss',
        url: 'https://example.com/ai-news.rss'
      };

      await apiClient.addSource(newSource);
      await loadServiceData(); // 重新加载数据
      alert('信息源添加成功！');
    } catch (error) {
      alert('添加信息源失败: ' + error.message);
    }
  };

  // 添加新关键词
  const handleAddKeyword = async () => {
    try {
      const keyword = 'ChatGPT';
      await apiClient.addKeyword(keyword);
      await loadServiceData(); // 重新加载数据
      alert('关键词添加成功！');
    } catch (error) {
      alert('添加关键词失败: ' + error.message);
    }
  };

  // 开始挖掘
  const handleStartMining = async () => {
    try {
      await apiClient.startMining();
      alert('信息挖掘已启动！');
      await loadServiceData(); // 更新状态
    } catch (error) {
      alert('启动挖掘失败: ' + error.message);
    }
  };

  // 停止挖掘
  const handleStopMining = async () => {
    try {
      await apiClient.stopMining();
      alert('信息挖掘已停止！');
      await loadServiceData(); // 更新状态
    } catch (error) {
      alert('停止挖掘失败: ' + error.message);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          无法连接到后端服务
        </h2>
        <p className="text-red-600 mb-4">
          请确保 Python 后端服务正在运行在 http://localhost:8080
        </p>
        <button
          onClick={checkServiceConnection}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重新连接
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Python 后端集成示例
      </h1>

      {/* 服务状态 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 mb-2">
          服务状态
        </h2>
        {serviceStatus && (
          <div className="text-sm text-green-700">
            <p>状态: {serviceStatus.status}</p>
            <p>版本: {serviceStatus.version}</p>
            <p>挖掘活跃: {serviceStatus.mining_active ? '是' : '否'}</p>
            <p>时间戳: {serviceStatus.timestamp}</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-4">
        <button
          onClick={handleAddSource}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          添加测试信息源
        </button>
        <button
          onClick={handleAddKeyword}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          添加测试关键词
        </button>
        <button
          onClick={handleStartMining}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          开始挖掘
        </button>
        <button
          onClick={handleStopMining}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          停止挖掘
        </button>
        <button
          onClick={loadServiceData}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          刷新数据
        </button>
      </div>

      {/* 信息源列表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          信息源 ({sources.length})
        </h2>
        <div className="space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="p-2 bg-gray-50 rounded">
              <div className="font-medium">{source.name}</div>
              <div className="text-sm text-gray-600">
                类型: {source.type} | URL: {source.url}
              </div>
              <div className="text-xs text-gray-500">
                状态: {source.enabled ? '启用' : '禁用'} | 
                最后同步: {source.lastSync}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 关键词列表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          关键词 ({keywords.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword.id}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {keyword.keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 发现的信息 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          发现的信息 ({discoveredInfo.length})
        </h2>
        <div className="space-y-3">
          {discoveredInfo.map((info) => (
            <div key={info.id} className="p-3 border border-gray-200 rounded">
              <div className="font-medium text-gray-800">{info.title}</div>
              <div className="text-sm text-gray-600 mt-1">{info.summary}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  来源: {info.source} | 相关性: {info.relevance}%
                </div>
                <div className="flex space-x-1">
                  {info.tags && info.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackendIntegrationExample;