/**
 * WiseFlow API 客户端
 * 用于与Python后端服务通信
 */

class WiseFlowAPIClient {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = baseURL;
  }

  /**
   * 发送HTTP请求
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }

  // 服务状态
  async getStatus() {
    return this.request('/api/status');
  }

  // 信息源管理
  async getSources() {
    return this.request('/api/sources');
  }

  async addSource(source) {
    return this.request('/api/sources', {
      method: 'POST',
      body: JSON.stringify(source)
    });
  }

  async updateSource(id, updates) {
    return this.request(`/api/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteSource(id) {
    return this.request(`/api/sources/${id}`, {
      method: 'DELETE'
    });
  }

  // 关键词管理
  async getKeywords() {
    return this.request('/api/keywords');
  }

  async addKeyword(keyword) {
    return this.request('/api/keywords', {
      method: 'POST',
      body: JSON.stringify({ keyword })
    });
  }

  async deleteKeyword(id) {
    return this.request(`/api/keywords/${id}`, {
      method: 'DELETE'
    });
  }

  // 信息挖掘
  async getDiscoveredInfo(limit = 50, offset = 0) {
    return this.request(`/api/discovered?limit=${limit}&offset=${offset}`);
  }

  async startMining() {
    return this.request('/api/mine', {
      method: 'POST'
    });
  }

  async stopMining() {
    return this.request('/api/mine/stop', {
      method: 'POST'
    });
  }

  // 配置管理
  async getConfig() {
    return this.request('/api/config');
  }

  async updateConfig(config) {
    return this.request('/api/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  // 检查服务连接
  async checkConnection() {
    try {
      await this.getStatus();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default WiseFlowAPIClient;