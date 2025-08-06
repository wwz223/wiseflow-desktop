import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Settings,
  Plus,
  Search,
  Filter,
  Globe,
  Rss,
  Twitter,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag,
  Download,
  FolderOpen,
  Save,
} from 'lucide-react';
import axios from 'axios';
import WiseFlowAPIClient from './api/wiseflowClient';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [serviceStatus, setServiceStatus] = useState('stopped'); // stopped, starting, running, error
  const [apiClient] = useState(() => new WiseFlowAPIClient('http://localhost:8080'));
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionPolling, setConnectionPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const pollingIntervalRef = useRef(null);
  const [serviceConfig, setServiceConfig] = useState({
    port: 8080,
    apiKey: '',
    miningInterval: 4,
  });
  const [sources, setSources] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [discoveredInfo, setDiscoveredInfo] = useState([]);

  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'rss',
    url: '',
  });
  const [logs, setLogs] = useState([]);

  // 初始化时加载配置
  useEffect(() => {
    loadConfig();
    setupEventListeners();
    checkBackendConnection();

    return () => {
      // 清理事件监听器
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('python-service-started');
        window.electronAPI.removeAllListeners('python-service-stopped');
        window.electronAPI.removeAllListeners('python-log');
        window.electronAPI.removeAllListeners('python-error');
        window.electronAPI.removeAllListeners('navigate-to');
      }
      // 清理轮询
      stopConnectionPolling();
    };
  }, []);

  // 检查后端连接状态
  const checkBackendConnection = async () => {
    try {
      const connected = await apiClient.checkConnection();
      setIsBackendConnected(connected);
      if (connected) {
        addLog('API连接成功');
        loadBackendData();
      } else {
        addLog('API连接失败，请稍后重试');
      }
      return connected;
    } catch (error) {
      console.log('后端连接检查失败:', error);
      setIsBackendConnected(false);
      addLog('API连接失败，请检查服务状态或点击重连');
      return false;
    }
  };

  // 手动重连API（启动轮询）
  const handleReconnectAPI = async () => {
    addLog('手动重连API...');
    startConnectionPolling();
  };

  // 开始轮询API连接
  const startConnectionPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setConnectionPolling(true);
    setPollingAttempts(0);
    addLog('开始轮询API连接...');
    
    // 立即尝试第一次连接
    const tryConnection = async () => {
      setPollingAttempts(prev => {
        const newAttempts = prev + 1;
        addLog(`尝试连接API (第${newAttempts}次)...`);
        return newAttempts;
      });
      
      try {
        const connected = await apiClient.checkConnection();
        if (connected) {
          setIsBackendConnected(true);
          addLog('✅ API连接成功！');
          loadBackendData();
          stopConnectionPolling();
          return true;
        }
      } catch (error) {
        // 连接失败，继续轮询
        console.log('API连接尝试失败:', error);
      }
      return false;
    };
    
    // 立即执行第一次尝试
    tryConnection().then(success => {
      if (!success) {
        // 如果第一次失败，开始定时轮询
        pollingIntervalRef.current = setInterval(async () => {
          setPollingAttempts(prev => {
            const newAttempts = prev + 1;
            addLog(`尝试连接API (第${newAttempts}次)...`);
            return newAttempts;
          });
          
          try {
            const connected = await apiClient.checkConnection();
            if (connected) {
              setIsBackendConnected(true);
              addLog('✅ API连接成功！');
              loadBackendData();
              stopConnectionPolling();
            }
          } catch (error) {
            console.log('API连接尝试失败:', error);
          }
        }, 3000); // 每3秒尝试一次
        
        // 最多尝试20次 (1分钟)
        setTimeout(() => {
          if (pollingIntervalRef.current && !isBackendConnected) {
            stopConnectionPolling();
            addLog('⚠️ API连接超时，请检查服务状态或手动重连');
          }
        }, 60000);
      }
    });
  };

  // 停止轮询API连接
  const stopConnectionPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setConnectionPolling(false);
    setPollingAttempts(0);
  };

  // 从后端加载数据
  const loadBackendData = async () => {
    try {
      // 加载信息源
      const sourcesResponse = await apiClient.getSources();
      if (sourcesResponse.sources) {
        setSources(sourcesResponse.sources);
      }

      // 加载关键词
      const keywordsResponse = await apiClient.getKeywords();
      if (keywordsResponse.keywords) {
        setKeywords(keywordsResponse.keywords.map(k => k.keyword));
      }

      // 加载发现的信息
      const infoResponse = await apiClient.getDiscoveredInfo(10, 0);
      if (infoResponse.info) {
        setDiscoveredInfo(infoResponse.info);
      }
    } catch (error) {
      console.error('加载后端数据失败:', error);
    }
  };

  const loadConfig = async () => {
    if (window.electronAPI) {
      try {
        const config = await window.electronAPI.getConfig();
        if (config) {
          setServiceConfig((prev) => ({ ...prev, ...config }));
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
  };

  const saveConfig = async (newConfig) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveConfig(newConfig);
        if (result.success) {
          setServiceConfig((prev) => ({ ...prev, ...newConfig }));
          return true;
        } else {
          console.error('Failed to save config:', result.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to save config:', error);
        return false;
      }
    }
    return false;
  };

  const setupEventListeners = () => {
    if (window.electronAPI) {
      window.electronAPI.onPythonServiceStarted(() => {
        setServiceStatus('running');
        addLog('Python 服务已启动');
        // 服务启动后开始轮询API连接
        startConnectionPolling();
      });

      window.electronAPI.onPythonServiceStopped((event, code) => {
        setServiceStatus('stopped');
        setIsBackendConnected(false);
        stopConnectionPolling(); // 停止轮询
        addLog(`Python 服务已停止 (退出码: ${code})`);
      });

      window.electronAPI.onPythonLog((event, data) => {
        addLog(`[服务] ${data.trim()}`);
      });

      window.electronAPI.onPythonError((event, data) => {
        addLog(`[错误] ${data.trim()}`);
        setServiceStatus('error');
      });

      window.electronAPI.onNavigateTo((event, tab) => {
        setCurrentTab(tab);
      });
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), { timestamp, message }]); // 保留最近100条日志
  };

  const handleStartService = async () => {
    if (!window.electronAPI) {
      alert('Electron API 不可用，请在 Electron 环境中运行');
      return;
    }

    setServiceStatus('starting');
    addLog('正在启动 Python 服务...');

    try {
      const result = await window.electronAPI.startPythonService(serviceConfig);
      if (!result.success) {
        setServiceStatus('error');
        addLog(`启动失败: ${result.error}`);
        await window.electronAPI.showMessage({
          type: 'error',
          title: '启动失败',
          message: result.error,
        });
      }
    } catch (error) {
      setServiceStatus('error');
      addLog(`启动异常: ${error.message}`);
    }
  };

  const handleStopService = async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      const result = await window.electronAPI.stopPythonService();
      if (result.success) {
        setServiceStatus('stopped');
        addLog('Python 服务已停止');
      } else {
        addLog(`停止失败: ${result.error}`);
      }
    } catch (error) {
      addLog(`停止异常: ${error.message}`);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim() || keywords.includes(newKeyword.trim())) {
      return;
    }

    try {
      if (isBackendConnected) {
        // 使用后端API
        await apiClient.addKeyword(newKeyword.trim());
        // 重新加载关键词列表
        const keywordsResponse = await apiClient.getKeywords();
        if (keywordsResponse.keywords) {
          setKeywords(keywordsResponse.keywords.map(k => k.keyword));
        }
      } else {
        // 后端未连接时使用本地状态
        setKeywords([...keywords, newKeyword.trim()]);
      }
      setNewKeyword('');
    } catch (error) {
      console.error('添加关键词失败:', error);
      // 失败时回退到本地状态
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = async (keyword) => {
    try {
      if (isBackendConnected) {
        // 使用后端API - 需要先找到关键词ID
        const keywordsResponse = await apiClient.getKeywords();
        const keywordObj = keywordsResponse.keywords?.find(k => k.keyword === keyword);
        if (keywordObj) {
          await apiClient.deleteKeyword(keywordObj.id);
          // 重新加载关键词列表
          const updatedResponse = await apiClient.getKeywords();
          if (updatedResponse.keywords) {
            setKeywords(updatedResponse.keywords.map(k => k.keyword));
          }
        }
      } else {
        // 后端未连接时使用本地状态
        setKeywords(keywords.filter((k) => k !== keyword));
      }
    } catch (error) {
      console.error('删除关键词失败:', error);
      // 失败时回退到本地状态
      setKeywords(keywords.filter((k) => k !== keyword));
    }
  };

  const addSource = async () => {
    if (!newSource.name || !newSource.url) {
      return;
    }

    try {
      if (isBackendConnected) {
        // 使用后端API
        await apiClient.addSource(newSource);
        // 重新加载信息源列表
        const sourcesResponse = await apiClient.getSources();
        if (sourcesResponse.sources) {
          setSources(sourcesResponse.sources);
        }
      } else {
        // 后端未连接时使用本地状态
        setSources([
          ...sources,
          {
            id: Date.now(),
            ...newSource,
            enabled: true,
            lastSync: '从未',
          },
        ]);
      }
      setNewSource({ name: '', type: 'rss', url: '' });
      setShowAddSource(false);
    } catch (error) {
      console.error('添加信息源失败:', error);
      // 失败时回退到本地状态
      setSources([
        ...sources,
        {
          id: Date.now(),
          ...newSource,
          enabled: true,
          lastSync: '从未',
        },
      ]);
      setNewSource({ name: '', type: 'rss', url: '' });
      setShowAddSource(false);
    }
  };

  const toggleSource = async (id) => {
    try {
      if (isBackendConnected) {
        // 使用后端API
        const source = sources.find(s => s.id === id);
        if (source) {
          await apiClient.updateSource(id, { enabled: !source.enabled });
          // 重新加载信息源列表
          const sourcesResponse = await apiClient.getSources();
          if (sourcesResponse.sources) {
            setSources(sourcesResponse.sources);
          }
        }
      } else {
        // 后端未连接时使用本地状态
        setSources(
          sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
        );
      }
    } catch (error) {
      console.error('切换信息源状态失败:', error);
      // 失败时回退到本地状态
      setSources(
        sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
      );
    }
  };

  const deleteSource = async (id) => {
    try {
      if (isBackendConnected) {
        // 使用后端API
        await apiClient.deleteSource(id);
        // 重新加载信息源列表
        const sourcesResponse = await apiClient.getSources();
        if (sourcesResponse.sources) {
          setSources(sourcesResponse.sources);
        }
      } else {
        // 后端未连接时使用本地状态
        setSources(sources.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error('删除信息源失败:', error);
      // 失败时回退到本地状态
      setSources(sources.filter((s) => s.id !== id));
    }
  };



  const exportData = async () => {
    if (window.electronAPI) {
      const data = {
        sources,
        keywords,
        discoveredInfo,
        exportTime: new Date().toISOString(),
      };
      const result = await window.electronAPI.exportData(
        data,
        'wiseflow-data.json'
      );
      if (result.success) {
        await window.electronAPI.showMessage({
          type: 'info',
          title: '导出成功',
          message: `数据已导出到: ${result.path}`,
        });
      }
    }
  };

  const getServiceStatusIcon = () => {
    switch (serviceStatus) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'starting':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'rss':
        return <Rss className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getRelevanceColor = (relevance) => {
    if (relevance >= 90) {
      return 'text-green-600 bg-green-100';
    }
    if (relevance >= 70) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-red-600 bg-red-100';
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* 服务状态卡片 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">服务状态</h2>
          {getServiceStatusIcon()}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              状态:{' '}
              <span className="font-medium">
                {serviceStatus === 'running'
                  ? '运行中'
                  : serviceStatus === 'starting'
                    ? '启动中...'
                    : serviceStatus === 'error'
                      ? '错误'
                      : '已停止'}
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-2">
              API连接:{' '}
              <span className={`font-medium ${isBackendConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isBackendConnected ? '已连接' : '未连接'}
              </span>
            </p>
            {serviceStatus === 'running' && (
              <p className="text-sm text-gray-600">
                端口: <span className="font-medium">{serviceConfig.port}</span>
              </p>
            )}
          </div>
          <div className="space-x-2">
            {serviceStatus === 'running' ? (
              <button
                onClick={handleStopService}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Square className="w-4 h-4 mr-2" />
                停止服务
              </button>
            ) : (
              <button
                onClick={handleStartService}
                disabled={serviceStatus === 'starting'}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                {serviceStatus === 'starting' ? '启动中...' : '启动服务'}
              </button>
            )}
            {serviceStatus === 'running' && !isBackendConnected && (
              <button
                onClick={connectionPolling ? stopConnectionPolling : handleReconnectAPI}
                disabled={isReconnecting}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isReconnecting || connectionPolling ? 'animate-spin' : ''}`} />
                {connectionPolling 
                  ? `尝试连接中... (${pollingAttempts}/20)` 
                  : isReconnecting 
                    ? '连接中...' 
                    : '重连API'
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 今日统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">今日挖掘</p>
              <p className="text-2xl font-bold text-gray-800">127</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">高相关度</p>
              <p className="text-2xl font-bold text-gray-800">23</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">活跃信源</p>
              <p className="text-2xl font-bold text-gray-800">
                {sources.filter((s) => s.enabled).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 最新发现 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">最新发现</h2>
        <div className="space-y-4">
          {discoveredInfo.slice(0, 3).map((info) => (
            <div key={info.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">
                    {info.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{info.summary}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>来源: {info.source}</span>
                    <span>{info.timestamp}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(
                    info.relevance
                  )}`}
                >
                  {info.relevance}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 服务日志 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">服务日志</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">信息源管理</h2>
        <div className="flex space-x-3">
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </button>
          <button
            onClick={() => setShowAddSource(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加信源
          </button>
        </div>
      </div>

      {/* 添加信源弹窗 */}
      {showAddSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">添加新信源</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名称
                </label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) =>
                    setNewSource({ ...newSource, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="信源名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型
                </label>
                <select
                  value={newSource.type}
                  onChange={(e) =>
                    setNewSource({ ...newSource, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rss">RSS订阅</option>
                  <option value="web">网站</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL/地址
                </label>
                <input
                  type="text"
                  value={newSource.url}
                  onChange={(e) =>
                    setNewSource({ ...newSource, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/feed"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={addSource}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                添加
              </button>
              <button
                onClick={() => setShowAddSource(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 信源列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            当前信源 ({sources.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sources.map((source) => (
            <div
              key={source.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(source.type)}
                  <span className="font-medium text-gray-800">
                    {source.name}
                  </span>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {source.type === 'rss'
                    ? 'RSS'
                    : source.type === 'web'
                      ? '网站'
                      : 'Twitter'}
                </span>
                <span className="text-sm text-gray-500 truncate max-w-xs">
                  {source.url}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  上次同步: {source.lastSync}
                </span>
                <button
                  onClick={() => toggleSource(source.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    source.enabled
                      ? 'text-green-600 hover:bg-green-100'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {source.enabled ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteSource(source.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKeywords = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">关键点配置</h2>

      {/* 添加关键词 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">添加关键词</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入关键词..."
          />
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 关键词列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          当前关键词 ({keywords.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <div
              key={keyword}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
            >
              <Tag className="w-3 h-3 mr-1" />
              <span className="text-sm">{keyword}</span>
              <button
                onClick={() => removeKeyword(keyword)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">信息流</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索信息..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {discoveredInfo.map((info) => (
          <div key={info.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex-1">
                {info.title}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getRelevanceColor(
                  info.relevance
                )}`}
              >
                相关度 {info.relevance}%
              </span>
            </div>
            <p className="text-gray-600 mb-4">{info.summary}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Globe className="w-4 h-4 mr-1" />
                  {info.source}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {info.timestamp}
                </span>
              </div>
              <div className="flex space-x-2">
                {info.tags.map((tag) => (
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
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">设置</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Python 服务配置
        </h3>
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              服务端口
            </label>
            <input
              type="number"
              value={serviceConfig.port}
              onChange={(e) =>
                setServiceConfig((prev) => ({
                  ...prev,
                  port: parseInt(e.target.value) || 8080,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API 密钥
            </label>
            <input
              type="password"
              value={serviceConfig.apiKey}
              onChange={(e) =>
                setServiceConfig((prev) => ({
                  ...prev,
                  apiKey: e.target.value,
                }))
              }
              placeholder="输入您的API密钥"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              挖掘频率
            </label>
            <select
              value={serviceConfig.miningInterval}
              onChange={(e) =>
                setServiceConfig((prev) => ({
                  ...prev,
                  miningInterval: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">每小时</option>
              <option value="4">每4小时</option>
              <option value="24">每天</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => saveConfig(serviceConfig)}
          className="mt-4 flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          保存配置
        </button>
      </div>

      {/* 应用信息 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">应用信息</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>版本: 1.0.0</p>
          <p>平台: {window.electronAPI?.platform || 'Unknown'}</p>
          <p>Electron 版本: {window.electronAPI?.version || 'Unknown'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">WiseFlow</h1>
              <div className="flex space-x-1">
                {[
                  { key: 'dashboard', label: '仪表盘', icon: Activity },
                  { key: 'sources', label: '信息源', icon: Globe },
                  { key: 'keywords', label: '关键点', icon: Tag },
                  { key: 'info', label: '信息流', icon: Rss },
                  { key: 'settings', label: '设置', icon: Settings },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setCurrentTab(key)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentTab === 'dashboard' && renderDashboard()}
        {currentTab === 'sources' && renderSources()}
        {currentTab === 'keywords' && renderKeywords()}
        {currentTab === 'info' && renderInfo()}
        {currentTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
}

export default App;
