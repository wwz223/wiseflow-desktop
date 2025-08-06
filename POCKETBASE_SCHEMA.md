# PocketBase 数据库结构映射

## 实际数据库集合

根据提供的 PocketBase 数据库结构，主要的业务集合包括：

### 1. `sources` - 信息源
```json
{
  "id": "string",
  "type": "select", // 'web', 'rss', 'ks', 'wb', 'mp'
  "creators": "text", // 创建者/名称
  "url": "url"
}
```

**前端映射**：
- `creators` → `name` (显示名称)
- `type` → `type` (源类型)
- `url` → `url` (源地址)

### 2. `focus_points` - 关注点（关键词）
```json
{
  "id": "string",
  "focuspoint": "text", // 关注点内容
  "activated": "bool", // 是否激活
  "freq": "number", // 频率 (2-999)
  "restrictions": "text", // 限制条件
  "explanation": "text", // 说明
  "role": "text", // 角色
  "purpose": "text", // 目的
  "custom_table": "text", // 自定义表
  "search": "select", // 搜索引擎 ['bing', 'wb', 'ks', 'github', 'ebay', 'arxiv']
  "sources": "relation" // 关联的信息源
}
```

**前端映射**：
- `focuspoint` → `keyword` (关键词内容)
- `activated` → 显示状态
- `freq` → 频率设置

### 3. `infos` - 信息内容
```json
{
  "id": "string",
  "content": "text", // 信息内容
  "focuspoint": "relation", // 关联的关注点
  "source": "url", // 来源URL
  "references": "text", // 参考信息
  "updated": "date" // 更新时间
}
```

**前端映射**：
- `content` → `content` (信息内容)
- `source` → `url` (来源链接)
- `focuspoint.focuspoint` → `title` (标题，通过关联获取)
- `updated` → `created` (创建时间)

### 4. `crawled_data` - 爬取的数据
```json
{
  "id": "string",
  "url": "url", // 爬取的URL
  "title": "text", // 标题
  "html": "text", // 原始HTML
  "markdown": "text", // Markdown格式
  "cleaned_html": "text", // 清理后的HTML
  "link_dict": "text", // 链接字典
  "screenshot": "text", // 截图
  "downloaded_files": "json", // 下载的文件
  "author": "text", // 作者
  "publish_date": "text", // 发布日期
  "updated": "date" // 更新时间
}
```

### 5. 缓存集合
- `ks_cache` - 快手数据缓存
- `wb_cache` - 微博数据缓存

## 数据操作映射

### 前端 → PocketBase
1. **添加关键词** → 创建 `focus_points` 记录
   - `keyword` → `focuspoint`
   - 默认设置 `activated: true`, `freq: 4`

2. **添加信息源** → 创建 `sources` 记录
   - `name` → `creators`
   - `type` → `type`
   - `url` → `url`

3. **获取发现信息** → 查询 `infos` 集合
   - 展开 `focuspoint` 关联获取关键词信息
   - 使用 `updated` 字段排序

### 统计数据
- 信息源数量：`sources` 集合总数
- 关键词数量：`focus_points` 集合总数  
- 信息数量：`infos` 集合总数
- 爬取数据数量：`crawled_data` 集合总数

## 实时更新
可以订阅以下集合的实时更新：
- `sources` - 信息源变更
- `focus_points` - 关注点变更
- `infos` - 新信息到达
- `crawled_data` - 新爬取数据

## 注意事项
1. 所有写操作（创建、更新、删除）可能需要管理员权限
2. 某些集合的规则设置为 `null`，表示需要超级用户权限
3. 关联查询需要使用 `expand` 参数
4. 日期字段使用 PocketBase 的 `date` 或 `autodate` 类型