// import axios from 'axios';

// class WiseFlowAPI {
//   constructor(baseURL = 'http://localhost:8080') {
//     this.api = axios.create({
//       baseURL,
//       timeout: 30000,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     // 请求拦截器
//     this.api.interceptors.request.use(
//       (config) => {
//         console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
//         return config;
//       },
//       (error) => {
//         console.error('API Request Error:', error);
//         return Promise.reject(error);
//       }
//     );

//     // 响应拦截器
//     this.api.interceptors.response.use(
//       (response) => {
//         console.log(`API Response: ${response.status} ${response.config.url}`);
//         return response;
//       },
//       (error) => {
//         console.error('API Response Error:', error.response?.data || error.message);
//         return Promise.reject(error);
//       }
//     );
//   }

//   // 更新 API 基础 URL
//   setBaseURL(baseURL) {
//     this.api.defaults.baseURL = baseURL;
//   }

//   // 设置认证头
//   setAuthToken(token) {
//     if (token) {
//       this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     } else {
//       delete this.api.defaults.headers.common['Authorization'];
//     }
//   }

//   // 健康检查
//   async healthCheck() {
//     try {
//       const response = await this.api.get('/health');
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 获取服务状态
//   async getStatus() {
//     try {
//       const response = await this.api.get('/api/status');
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 信息源管理
//   async getSources() {
//     try {
//       const response = await this.api.get('/api/sources');
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async createSource(source) {
//     try {
//       const response = await this.api.post('/api/sources', source);
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async updateSource(id, source) {
//     try {
//       const response = await this.api.put(`/api/sources/${id}`, source);
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async deleteSource(id) {
//     try {
//       await this.api.delete(`/api/sources/${id}`);
//       return { success: true };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async toggleSource(id, enabled) {
//     try {
//       const response = await this.api.patch(`/api/sources/${id}/toggle`, { enabled });
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async syncSource(id) {
//     try {
//       const response = await this.api.post(`/api/sources/${id}/sync`);
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 关键词管理
//   async getKeywords() {
//     try {
//       const response = await this.api.get('/api/keywords');
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async createKeyword(keyword) {
//     try {
//       const response = await this.api.post('/api/keywords', { keyword });
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async deleteKeyword(keyword) {
//     try {
//       await this.api.delete(`/api/keywords/${encodeURIComponent(keyword)}`);
//       return { success: true };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async updateKeywords(keywords) {
//     try {
//       const response = await this.api.put('/api/keywords', { keywords });
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 挖掘到的信息
//   async getDiscoveredInfo(params = {}) {
//     try {
//       const response = await this.api.get('/api/discoveries', { params });
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async getDiscoveryById(id) {
//     try {
//       const response = await this.api.get(`/api/discoveries/${id}`);
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async markDiscoveryAsRead(id) {
//     try {
//       const response = await this.api.patch(`/api/discoveries/${id}/read`);
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async deleteDiscovery(id) {
//     try {
//       await this.api.delete(`/api/discoveries/${id}`);
//       return { success: true };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 统计信息
//   async getStatistics(period = 'today') {
//     try {
//       const response = await this.api.get(`/api/statistics?period=${period}`);
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 配置管理
//   async getConfig() {
//     try {
//       const response = await this.api.get('/api/config');
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   async updateConfig(config) {
//     try {
//       const response = await this.api.put('/api/config', config);
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 手动触发挖掘
//   async triggerMining() {
//     try {
//       const response = await this.api.post('/api/mining/trigger');
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 获取挖掘任务状态
//   async getMiningStatus() {
//     try {
//       const response = await this.api.get('/api/mining/status');
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 导出数据
//   async exportData(format = 'json', filters = {}) {
//     try {
//       const response = await this.api.get('/api/export', {
//         params: { format, ...filters },
//         responseType: 'blob'
//       });
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 导入数据
//   async importData(file) {
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
//       const response = await this.api.post('/api/import', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // 测试连接
//   async testConnection() {
//     try {
//       const response = await this.api.get('/api/test', { timeout: 5000 });
//       return { success: true, data: response.data };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // WebSocket 连接（用于实时更新）
//   connectWebSocket(onMessage, onError, onClose) {
//     const wsUrl = this.api.defaults.baseURL?.replace('http', 'ws') + '/ws';
//     const ws = new WebSocket(wsUrl);

//     ws.onopen = () => {
//       console.log('WebSocket connected');
//     };

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         onMessage && onMessage(data);
//       } catch (error) {
//         console.error('WebSocket message parse error:', error);
//       }
//     };

//     ws.onerror = (error) => {
//       console.error('WebSocket error:', error);
//       onError && onError(error);
//     };

//     ws.onclose = () => {
//       console.log('WebSocket disconnected');
//       onClose && onClose();
//     };

//     return ws;
//   }
// }

// // 创建默认实例
// const wiseflowAPI = new WiseFlowAPI();

// export default wiseflowAPI;
// export { WiseFlowAPI };