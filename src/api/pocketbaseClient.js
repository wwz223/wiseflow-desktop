/**
 * PocketBase 客户端
 * 用于与 PocketBase 后端数据库通信
 */

import PocketBase from 'pocketbase';

class PocketBaseClient {
  constructor(url = 'http://localhost:8090') {
    this.pb = new PocketBase(url);
    this.isConnected = false;
    // 自动进行管理员认证
    this.authenticateAdmin();
  }

  /**
   * 管理员认证
   */
  async authenticateAdmin() {
    try {
      // 使用硬编码的管理员账户进行认证
      await this.pb.collection('_superusers').authWithPassword('test@example.com', '1234567890');
      console.log('PocketBase 管理员认证成功');
      return true;
    } catch (error) {
      console.log('PocketBase 管理员认证失败:', error.message);
      // 如果是404错误，说明还没有创建管理员账户
      if (error.status === 404) {
        console.log('提示: 请先访问 PocketBase 管理界面创建管理员账户');
      }
      return false;
    }
  }

  /**
   * 验证用户名密码
   */
  async verifyUser(username, password) {
    const user = await this.pb
      .collection('_superusers')
      .authWithPassword(username, password);
    return user;
  }

  /** */

  /*
   * 更新服务端口
   */
  updatePort(port) {
    const newUrl = `http://localhost:${port}`;
    this.pb = new PocketBase(newUrl);
    this.isConnected = false;
    // 重新进行管理员认证
    this.authenticateAdmin();
  }

  /**
   * 获取当前端口
   */
  getCurrentPort() {
    const match = this.pb.baseUrl.match(/:(\d+)$/);
    return match ? parseInt(match[1]) : 8090;
  }

  /**
   * 检查连接状态
   */
  async checkConnection() {
    try {
      // 在 Electron 环境中，使用 PocketBase SDK 的内置方法
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Electron 环境：先尝试认证，再检查连接
        try {
          // 先进行管理员认证
          await this.authenticateAdmin();
          
          // 认证成功后检查健康状态
          const healthResult = await this.pb.health.check();
          this.isConnected = true;
          return true;
        } catch (pbError) {
          // SDK 方法失败，尝试一个简单的数据库操作
          try {
            // 尝试获取集合列表（即使失败也能说明服务在运行）
            await this.pb.collections.getList(1, 1);
            this.isConnected = true;
            return true;
          } catch (collectionError) {
            // 如果是认证错误(401/403)，说明服务在运行
            if (
              collectionError.status === 401 ||
              collectionError.status === 403
            ) {
              this.isConnected = true;
              return true;
            }
            throw collectionError;
          }
        }
      } else {
        // 浏览器环境：使用 fetch（但在 Electron 中应该不会到达这里）
        const response = await fetch(`${this.pb.baseUrl}/api/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.code === 200) {
            this.isConnected = true;
            return true;
          }
        }
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('PocketBase connection failed:', error.message || error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 初始化数据库集合（如果不存在）
   */
  async initializeCollections() {
    try {
      // 检查是否需要管理员权限
      const collections = ['sources', 'focus_points', 'infos', 'crawled_data'];

      for (const collectionName of collections) {
        try {
          // 尝试获取集合信息
          await this.pb.collections.getOne(collectionName);
        } catch (error) {
          if (error.status === 404) {
            console.log(
              `Collection ${collectionName} not found, needs to be created via admin panel`
            );
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error initializing collections:', error);
      return false;
    }
  }

  /**
   * 获取信息源列表
   */
  async getSources() {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      // 使用 getFullList 获取所有记录
      const records = await this.pb.collection('sources').getFullList();
      return {
        success: true,
        sources: records.map((record) => ({
          id: record.id,
          name: record.creators || `${record.type} 源`, // 使用 creators 字段作为名称
          type: record.type,
          url: record.url,
          enabled: true, // 默认启用
          creators: record.creators,
          created: record.created,
          updated: record.updated,
        })),
      };
    } catch (error) {
      console.error('获取信息源失败:', error);
      // 处理权限错误
      if (error.status === 403) {
        return {
          success: false,
          error:
            '需要管理员权限访问信息源。请在 PocketBase 管理界面中登录管理员账户。',
          sources: [],
          needsAuth: true,
        };
      }
      return {
        success: false,
        error: error.message,
        sources: [],
        needsAuth: error.status === 401,
      };
    }
  }

  /**
   * 添加信息源
   */
  async addSource(sourceData) {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      const record = await this.pb.collection('sources').create({
        type: sourceData.type,
        url: sourceData.url,
        creators: sourceData.name, // 将 name 映射到 creators 字段
      });
      return {
        success: true,
        source: {
          id: record.id,
          name: record.creators || `${record.type} 源`,
          type: record.type,
          url: record.url,
          enabled: true,
          creators: record.creators,
          created: record.created,
          updated: record.updated,
        },
      };
    } catch (error) {
      console.error('添加信息源失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 删除信息源
   */
  async deleteSource(sourceId) {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      await this.pb.collection('sources').delete(sourceId);
      return { success: true };
    } catch (error) {
      console.error('删除信息源失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取关注点列表（关键词）
   */
  async getKeywords() {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      // 使用 getFullList 获取所有记录
      const records = await this.pb.collection('focus_points').getFullList();
      return {
        success: true,
        keywords: records.map((record) => ({
          id: record.id,
          keyword: record.focuspoint, // 使用 focuspoint 字段
          activated: record.activated,
          freq: record.freq,
          restrictions: record.restrictions,
          explanation: record.explanation,
          created: record.created,
        })),
      };
    } catch (error) {
      console.error('获取关注点失败:', error);
      // 处理权限错误
      if (error.status === 403) {
        return {
          success: false,
          error:
            '需要管理员权限访问关注点。请在 PocketBase 管理界面中登录管理员账户。',
          keywords: [],
          needsAuth: true,
        };
      }
      return {
        success: false,
        error: error.message,
        keywords: [],
        needsAuth: error.status === 401,
      };
    }
  }

  /**
   * 添加关注点（关键词）
   */
  async addKeyword(keyword) {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      const record = await this.pb.collection('focus_points').create({
        focuspoint: keyword.trim(),
        activated: true,
        freq: 4, // 默认频率 4 小时
      });
      return {
        success: true,
        keyword: {
          id: record.id,
          keyword: record.focuspoint,
          activated: record.activated,
          freq: record.freq,
          created: record.created,
        },
      };
    } catch (error) {
      console.error('添加关注点失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 删除关注点（关键词）
   */
  async deleteKeyword(keywordId) {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      await this.pb.collection('focus_points').delete(keywordId);
      return { success: true };
    } catch (error) {
      console.error('删除关注点失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取发现的信息
   */
  async getDiscoveredInfo(limit = 10, offset = 0) {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      const records = await this.pb.collection('infos').getList(1, limit, {
        sort: '-updated',
        expand: 'focuspoint', // 展开关注点关联
      });

      return {
        success: true,
        info: records.items.map((record) => ({
          id: record.id,
          title: record.expand?.focuspoint?.focuspoint || '信息摘要', // 使用关注点作为标题
          content: record.content,
          url: record.source, // source 字段是 URL
          source: record.source,
          relevance: 85, // 默认相关度
          keywords: record.expand?.focuspoint
            ? [record.expand.focuspoint.focuspoint]
            : [],
          references: record.references,
          focuspoint: record.focuspoint,
          created: record.updated, // 使用 updated 字段
        })),
        totalItems: records.totalItems,
        page: records.page,
        perPage: records.perPage,
        totalPages: records.totalPages,
      };
    } catch (error) {
      console.error('获取信息失败:', error);
      return {
        success: false,
        error: error.message,
        info: [],
      };
    }
  }

  /**
   * 订阅实时数据更新
   */
  subscribeToUpdates(collectionName, callback) {
    try {
      this.pb.collection(collectionName).subscribe('*', callback);
      return true;
    } catch (error) {
      console.error(`订阅 ${collectionName} 更新失败:`, error);
      return false;
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(collectionName) {
    try {
      this.pb.collection(collectionName).unsubscribe();
      return true;
    } catch (error) {
      console.error(`取消订阅 ${collectionName} 失败:`, error);
      return false;
    }
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll() {
    try {
      this.pb.cancelAllSubscriptions();
      return true;
    } catch (error) {
      console.error('取消所有订阅失败:', error);
      return false;
    }
  }

  /**
   * 获取快手缓存数据
   */
  async getKsCache(limit = 10, offset = 0) {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      const records = await this.pb.collection('ks_cache').getList(1, limit, {
        sort: '-updated',
      });

      return {
        success: true,
        data: records.items.map((record) => ({
          id: record.id,
          title: record.title,
          desc: record.desc,
          create_time: record.create_time,
          user_id: record.user_id,
          nickname: record.nickname,
          liked_count: record.liked_count,
          viewd_count: record.viewd_count,
          video_url: record.video_url,
          video_play_url: record.video_play_url,
          source_keyword: record.source_keyword,
          video_type: record.video_type,
          updated: record.updated,
        })),
        totalItems: records.totalItems,
      };
    } catch (error) {
      console.error('获取快手缓存数据失败:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        totalItems: 0,
      };
    }
  }

  /**
   * 获取微博缓存数据
   */
  async getWbCache(limit = 10, offset = 0) {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      const records = await this.pb.collection('wb_cache').getList(1, limit, {
        sort: '-updated',
      });

      return {
        success: true,
        data: records.items.map((record) => ({
          id: record.id,
          content: record.content,
          create_time: record.create_time,
          comments_count: record.comments_count,
          liked_count: record.liked_count,
          shared_count: record.shared_count,
          note_url: record.note_url,
          ip_location: record.ip_location,
          user_id: record.user_id,
          nickname: record.nickname,
          gender: record.gender,
          profile_url: record.profile_url,
          source_keyword: record.source_keyword,
          updated: record.updated,
        })),
        totalItems: records.totalItems,
      };
    } catch (error) {
      console.error('获取微博缓存数据失败:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        totalItems: 0,
      };
    }
  }

  /**
   * 获取统计数据
   */
  async getStats() {
    try {
      // 确保已认证
      await this.authenticateAdmin();
      
      const [sourcesCount, focusPointsCount, infosCount, crawledDataCount, ksCacheCount, wbCacheCount] =
        await Promise.all([
          this.pb
            .collection('sources')
            .getList(1, 1)
            .then((r) => r.totalItems),
          this.pb
            .collection('focus_points')
            .getList(1, 1)
            .then((r) => r.totalItems),
          this.pb
            .collection('infos')
            .getList(1, 1)
            .then((r) => r.totalItems),
          this.pb
            .collection('crawled_data')
            .getList(1, 1)
            .then((r) => r.totalItems),
          this.pb
            .collection('ks_cache')
            .getList(1, 1)
            .then((r) => r.totalItems),
          this.pb
            .collection('wb_cache')
            .getList(1, 1)
            .then((r) => r.totalItems),
        ]);

      return {
        success: true,
        stats: {
          sourcesCount,
          keywordsCount: focusPointsCount,
          infoCount: infosCount,
          crawledDataCount,
          ksCacheCount,
          wbCacheCount,
          todayInfo: infosCount, // 简化处理，实际应该按日期过滤
        },
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        success: false,
        error: error.message,
        stats: {
          sourcesCount: 0,
          keywordsCount: 0,
          infoCount: 0,
          crawledDataCount: 0,
          todayInfo: 0,
        },
      };
    }
  }
}

export default PocketBaseClient;
