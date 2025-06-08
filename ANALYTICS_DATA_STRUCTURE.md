# 埋点数据结构设计文档

> 本文档定义了项目中所有埋点事件的完整数据结构，用于数据库设计和数据分析。
> 
> **创建时间**: 2025-06-08  
> **版本**: 1.0  
> **适用范围**: 电商App埋点系统

## 📋 目录

- [1. 数据结构概述](#1-数据结构概述)
- [2. 核心业务事件](#2-核心业务事件)
- [3. 订单流程事件](#3-订单流程事件)
- [4. 用户行为事件](#4-用户行为事件)
- [5. 全局数据结构](#5-全局数据结构)
- [6. 数据库设计建议](#6-数据库设计建议)

---

## 1. 数据结构概述

### 1.1 基础事件结构

所有埋点事件都遵循统一的数据结构：

```typescript
interface AnalyticsEvent {
  event_name: string;           // 事件名称，用于区分不同类型的用户行为
  page_name: string | null;     // 当前页面名称，null表示全局事件
  referrer_page: string | null; // 来源页面，用于分析用户行为路径
  event_properties: EventProperty[]; // 事件具体属性，包含业务数据
}

type EventProperty = Record<string, any>; // 灵活的事件属性类型
```

### 1.2 全局数据包装

```typescript
interface AnalyticsData {
  user_id: number | null;       // 用户ID，未登录时为null
  device_id: string;            // 设备标识，区分不同设备
  version: string;              // 应用版本号
  session_id: string;           // 会话ID，用于关联同一次会话的所有事件
  event_list: AnalyticsEvent[]; // 事件列表，支持批量发送
}
```

---

## 2. 核心业务事件

### 2.1 应用启动事件 `app_launch`

**用途**: 跟踪应用启动成功率，分析应用稳定性

```json
{
  "event_name": "app_launch",
  "page_name": null,
  "referrer_page": null,
  "event_properties": [{
    "is_open": 1,  // Number: 启动状态 (1=成功, 0=失败)
    "timestamp": "2025-06-08 14:30:00"  // String: 事件发生时间
  }]
}
```

**数据库字段建议**:
- `is_open`: TINYINT(1) NOT NULL COMMENT '启动状态'
- `timestamp`: DATETIME NOT NULL COMMENT '启动时间'

---

### 2.2 用户登录事件 `login`

**用途**: 分析用户登录行为，统计登录成功率和偏好登录方式

```json
{
  "event_name": "login",
  "page_name": "login",
  "referrer_page": null,
  "event_properties": [{
    "is_login": 1,  // Number: 登录结果 (1=成功, 0=失败)
    "login_method": "phone",  // String: 登录方式 ("phone" | "email" | "google" | "facebook")
    "timestamp": "2025-06-08 14:30:00"  // String: 登录时间
  }]
}
```

**数据库字段建议**:
- `is_login`: TINYINT(1) NOT NULL COMMENT '登录结果'
- `login_method`: VARCHAR(20) NOT NULL COMMENT '登录方式'
- `timestamp`: DATETIME NOT NULL COMMENT '登录时间'

---

### 2.3 用户注册事件 `register`

**用途**: 分析用户注册转化率，统计注册渠道偏好

```json
{
  "event_name": "register",
  "page_name": "register",
  "referrer_page": null,
  "event_properties": [{
    "is_register": 1,  // Number: 注册结果 (1=成功, 0=失败)
    "register_method": "phone",  // String: 注册方式 ("phone" | "email" | "google" | "facebook")
    "timestamp": "2025-06-08 14:30:00"  // String: 注册时间
  }]
}
```

**数据库字段建议**:
- `is_register`: TINYINT(1) NOT NULL COMMENT '注册结果'
- `register_method`: VARCHAR(20) NOT NULL COMMENT '注册方式'
- `timestamp`: DATETIME NOT NULL COMMENT '注册时间'

---

### 2.4 商品浏览事件 `product_view`

**用途**: 分析商品热度，优化商品推荐算法

```json
{
  "event_name": "product_view",
  "page_name": "product_view",
  "referrer_page": "home",  // String: 来源页面，分析用户浏览路径
  "event_properties": [{
    "offer_id": 123456,        // Number: 商品ID，主要标识
    "category_id": 1001,       // Number: 分类ID，用于分类分析
    "price": 99.99,           // Number: 商品价格，用于价格分析
    "sku_id": 789,            // Number: SKU ID，区分商品变体
    "currency": "CFA",        // String: 货币类型
    "product_name": "商品名称", // String: 商品名称，用于搜索和分析
    "product_img": "https://example.com/image.jpg",  // String: 商品图片URL
    "timestamp": "2025-06-08 14:30:00"  // String: 浏览时间
  }]
}
```

**数据库字段建议**:
- `offer_id`: BIGINT NOT NULL COMMENT '商品ID'
- `category_id`: INT NOT NULL COMMENT '分类ID'
- `price`: DECIMAL(10,2) NOT NULL COMMENT '商品价格'
- `sku_id`: BIGINT NOT NULL COMMENT 'SKU ID'
- `currency`: VARCHAR(10) NOT NULL COMMENT '货币类型'
- `product_name`: VARCHAR(500) NOT NULL COMMENT '商品名称'
- `product_img`: TEXT COMMENT '商品图片URL'
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '浏览时间'

---

### 2.5 搜索事件 `search`

**用途**: 分析用户搜索行为，优化搜索算法和商品推荐

```json
{
  "event_name": "search",
  "page_name": "search",
  "referrer_page": "home",  // String: 固定为home，搜索入口
  "event_properties": [{
    "key_word": "手机",  // String: 搜索关键词，核心分析数据
    "timestamp": "2025-06-08 14:30:00"  // String: 搜索时间
  }]
}
```

**数据库字段建议**:
- `key_word`: VARCHAR(200) NOT NULL COMMENT '搜索关键词'
- `timestamp`: DATETIME NOT NULL COMMENT '搜索时间'

**索引建议**: 对 `key_word` 建立全文索引，支持搜索热词分析

---

### 2.6 主分类浏览事件 `category`

**用途**: 分析分类热度，优化分类展示顺序

```json
{
  "event_name": "category",
  "page_name": "category",
  "referrer_page": "home",  // String: 默认来源页面
  "event_properties": [{
    "category_id": 1001,       // Number: 分类ID，主要标识
    "category_name": "电子产品", // String: 分类名称
    "level": 1,               // Number: 分类层级 (可选)
    "category_type": "main_category",  // String: 分类类型标识
    "timestamp": "2025-06-08 14:30:00"  // String: 浏览时间
  }]
}
```

**数据库字段建议**:
- `category_id`: INT NOT NULL COMMENT '分类ID'
- `category_name`: VARCHAR(100) NOT NULL COMMENT '分类名称'
- `level`: TINYINT COMMENT '分类层级'
- `category_type`: VARCHAR(20) NOT NULL COMMENT '分类类型'
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '浏览时间'

---

### 2.7 子分类浏览事件 `sub_category`

**用途**: 分析子分类热度，了解用户细分需求

```json
{
  "event_name": "sub_category",
  "page_name": "sub_category",
  "referrer_page": "category",  // String: 默认来源页面
  "event_properties": [{
    "category_id": 2001,       // Number: 子分类ID
    "category_name": "智能手机", // String: 子分类名称
    "level": 2,               // Number: 分类层级 (可选)
    "timestamp": "2025-06-08 14:30:00"  // String: 浏览时间
  }]
}
```

**数据库字段建议**:
- `category_id`: INT NOT NULL COMMENT '子分类ID'
- `category_name`: VARCHAR(100) NOT NULL COMMENT '子分类名称'
- `level`: TINYINT COMMENT '分类层级'
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '浏览时间'

---

### 2.8 添加购物车事件 `addToCart`

**用途**: 分析购买意向，计算转化漏斗

```json
{
  "event_name": "addToCart",
  "page_name": "addToCart",
  "referrer_page": "search",  // String: 固定为search
  "event_properties": [{
    "offer_id": 123456,        // Number: 商品ID
    "category_id": 1001,       // Number: 分类ID
    "price": 99.99,           // Number: 单价
    "all_price": 199.98,      // Number: 总价 (单价 × 数量)
    "currency": "CFA",        // String: 货币类型
    "sku_id": 789,            // Number: SKU ID
    "quantity": 2,            // Number: 添加数量
    "product_name": "商品名称", // String: 商品名称
    "sku_img": "https://example.com/sku.jpg",   // String: SKU图片URL
    "all_quantity": 2,        // Number: 总数量 (当前添加的数量)
    "level": 1,               // Number: 商品等级 (可选)
    "timestamp": "2025-06-08 14:30:00"  // String: 添加时间
  }]
}
```

**数据库字段建议**:
- `offer_id`: BIGINT NOT NULL COMMENT '商品ID'
- `category_id`: INT NOT NULL COMMENT '分类ID'
- `price`: DECIMAL(10,2) NOT NULL COMMENT '单价'
- `all_price`: DECIMAL(10,2) NOT NULL COMMENT '总价'
- `currency`: VARCHAR(10) NOT NULL COMMENT '货币类型'
- `sku_id`: BIGINT NOT NULL COMMENT 'SKU ID'
- `quantity`: INT NOT NULL COMMENT '添加数量'
- `product_name`: VARCHAR(500) NOT NULL COMMENT '商品名称'
- `sku_img`: TEXT COMMENT 'SKU图片URL'
- `all_quantity`: INT NOT NULL COMMENT '总数量'
- `level`: TINYINT COMMENT '商品等级'
- `timestamp`: DATETIME NOT NULL COMMENT '添加时间'

---

## 3. 订单流程事件

### 3.1 地址信息事件 `address`

**用途**: 分析用户地理分布，优化物流配送

```json
{
  "event_name": "address",
  "page_name": "address",
  "referrer_page": "cart",  // String: 默认来源页面
  "event_properties": [{
    "last_name": "张",         // String: 用户姓氏
    "first_name": "三",        // String: 用户名字
    "country": "中国",         // String: 国家，重要的地理分析维度
    "phone_number": 13800138000,  // Number: 电话号码
    "whatsApp_number": 13800138000, // Number: WhatsApp号码
    "timestamp": "2025-06-08 14:30:00"  // String: 填写时间
  }]
}
```

**数据库字段建议**:
- `last_name`: VARCHAR(50) NOT NULL COMMENT '姓氏'
- `first_name`: VARCHAR(50) NOT NULL COMMENT '名字'
- `country`: VARCHAR(50) NOT NULL COMMENT '国家'
- `phone_number`: BIGINT NOT NULL COMMENT '电话号码'
- `whatsapp_number`: BIGINT NOT NULL COMMENT 'WhatsApp号码'
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '填写时间'

**分析建议**: 对 `country` 字段进行地理分析，了解用户分布

---

### 3.2 物流信息事件 `shipping`

**用途**: 分析用户物流偏好，优化物流方案

```json
{
  "event_name": "shipping",
  "page_name": "shipping",
  "referrer_page": "address",  // String: 默认来源页面
  "event_properties": [{
    "shipping_method": 1,      // Number: 物流方式ID
    "shipping_price_outside": 50.0,  // Number: 境外运费
    "shipping_price_within": 20.0,   // Number: 境内运费
    "currency": "CFA",         // String: 货币类型
    "forwarder_name": "顺丰快递", // String: 物流商名称
    "country_city": "北京",     // String: 国家城市
    "timestamp": "2025-06-08 14:30:00"  // String: 选择时间
  }]
}
```

**数据库字段建议**:
- `shipping_method`: INT NOT NULL COMMENT '物流方式ID'
- `shipping_price_outside`: DECIMAL(10,2) NOT NULL COMMENT '境外运费'
- `shipping_price_within`: DECIMAL(10,2) NOT NULL COMMENT '境内运费'
- `currency`: VARCHAR(10) NOT NULL COMMENT '货币类型'
- `forwarder_name`: VARCHAR(100) NOT NULL COMMENT '物流商名称'
- `country_city`: VARCHAR(100) NOT NULL COMMENT '国家城市'
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '选择时间'

---

### 3.3 支付方式事件 `payment`

**用途**: 分析支付方式偏好，优化支付流程

```json
{
  "event_name": "payment",
  "page_name": "payment",
  "referrer_page": "shipping",  // String: 默认来源页面
  "event_properties": [{
    "pay_method": "PayPal",    // String: 支付方式
    "offline_payment": 0,      // Number: 是否线下支付 (0=否, 1=是)
    "all_price": 299.98,       // Number: 支付总价
    "currency": "CFA",         // String: 货币类型
    "pay_product": "商品名称",  // String: 支付商品 (可选)
    "shipping_method": 1,      // Number: 物流方式ID
    "shipping_price_outside": 50.0,  // Number: 境外运费
    "shipping_price_within": 20.0,   // Number: 境内运费
    "timestamp": "2025-06-08 14:30:00"  // String: 选择时间
  }]
}
```

**数据库字段建议**:
- `pay_method`: VARCHAR(50) NOT NULL COMMENT '支付方式'
- `offline_payment`: TINYINT(1) NOT NULL COMMENT '是否线下支付'
- `all_price`: DECIMAL(12,2) NOT NULL COMMENT '支付总价'
- `currency`: VARCHAR(10) NOT NULL COMMENT '货币类型'
- `pay_product`: VARCHAR(500) COMMENT '支付商品'
- `shipping_method`: INT NOT NULL COMMENT '物流方式ID'
- `shipping_price_outside`: DECIMAL(10,2) NOT NULL COMMENT '境外运费'
- `shipping_price_within`: DECIMAL(10,2) NOT NULL COMMENT '境内运费'
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '选择时间'

---

### 3.4 订单预览事件 `order`

**用途**: 分析订单确认行为，计算下单转化率

```json
{
  "event_name": "order",
  "page_name": "order",
  "referrer_page": "pay_method",  // String: 默认来源页面
  "event_properties": [{
    "timestamp": "2025-06-08 14:30:00"  // String: 预览时间
  }]
}
```

**数据库字段建议**:
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '预览时间'

---

### 3.5 结账事件 `checkout`

**用途**: 分析支付成功率，计算最终转化

```json
{
  "event_name": "checkout",
  "page_name": "checkout",
  "referrer_page": "perview",  // String: 默认来源页面
  "event_properties": [{
    "is_suc": 1,               // Number: 结账状态 (1=成功, 0=失败)
    "all_price": 299.98,       // Number: 最终支付金额
    "currency": "CFA",         // String: 货币类型
    "shipping_method": 1,      // Number: 选择的物流方式
    "shipping_price_outside": 50.0,  // Number: 境外运费
    "shipping_price_within": 20.0,   // Number: 境内运费
    "pay_product": "商品名称",  // String: 支付商品 (可选)
    "timestamp": "2025-06-08 14:30:00"  // String: 结账时间
  }]
}
```

**数据库字段建议**:
- `is_suc`: TINYINT(1) NOT NULL COMMENT '结账状态'
- `all_price`: DECIMAL(12,2) NOT NULL COMMENT '最终支付金额'
- `currency`: VARCHAR(10) NOT NULL COMMENT '货币类型'
- `shipping_method`: INT NOT NULL COMMENT '物流方式'
- `shipping_price_outside`: DECIMAL(10,2) NOT NULL COMMENT '境外运费'
- `shipping_price_within`: DECIMAL(10,2) NOT NULL COMMENT '境内运费'
- `pay_product`: VARCHAR(500) COMMENT '支付商品'
- `referrer_page`: VARCHAR(50) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '结账时间'

**关键分析指标**: 结账成功率 = (is_suc=1的数量) / (总数量)

---

## 4. 用户行为事件

### 4.1 页面浏览事件 `page_view`

**用途**: 分析用户页面访问路径，优化页面流程

```json
{
  "event_name": "page_view",
  "page_name": "ProductDetail",  // String: 动态页面名称
  "referrer_page": "home",       // String: 来源页面
  "event_properties": [{
    "timestamp": "2025-06-08 14:30:00"  // String: 进入时间
  }]
}
```

**数据库字段建议**:
- `page_name`: VARCHAR(100) NOT NULL COMMENT '页面名称'
- `referrer_page`: VARCHAR(100) COMMENT '来源页面'
- `timestamp`: DATETIME NOT NULL COMMENT '进入时间'

**分析建议**: 
- 页面热度分析：统计每个页面的访问次数
- 用户路径分析：通过 referrer_page 分析用户行为路径

---

### 4.2 页面离开事件 `page_leave`

**用途**: 分析页面停留时长，评估页面质量

```json
{
  "event_name": "page_leave",
  "page_name": "ProductDetail",  // String: 动态页面名称
  "referrer_page": null,
  "event_properties": [{
    "duration": 45,  // Number: 停留时长 (秒)
    "timestamp": "2025-06-08 14:30:45"  // String: 离开时间
  }]
}
```

**数据库字段建议**:
- `page_name`: VARCHAR(100) NOT NULL COMMENT '页面名称'
- `duration`: INT NOT NULL COMMENT '停留时长(秒)'
- `timestamp`: DATETIME NOT NULL COMMENT '离开时间'

**关键分析指标**:
- 平均停留时长：AVG(duration)
- 跳出率：duration < 5秒的比例

---

### 4.3 错误事件 `error`

**用途**: 监控应用稳定性，快速定位问题

```json
{
  "event_name": "error",
  "page_name": "ProductDetail",  // String: 错误发生的页面
  "referrer_page": null,
  "event_properties": [{
    "error_message": "Network request failed",  // String: 错误信息
    "error_stack": "Error: Network request failed\n    at fetch...",  // String: 错误堆栈 (可选)
    "context": "ProductDetail",                 // String: 错误上下文
    "user_agent": "ios",                       // String: 用户代理
    "timestamp": "2025-06-08 14:30:00"         // String: 错误时间
  }]
}
```

**数据库字段建议**:
- `page_name`: VARCHAR(100) NOT NULL COMMENT '错误页面'
- `error_message`: TEXT NOT NULL COMMENT '错误信息'
- `error_stack`: TEXT COMMENT '错误堆栈'
- `context`: VARCHAR(100) NOT NULL COMMENT '错误上下文'
- `user_agent`: VARCHAR(50) NOT NULL COMMENT '用户代理'
- `timestamp`: DATETIME NOT NULL COMMENT '错误时间'

**监控建议**:
- 错误率监控：按页面统计错误发生频率
- 错误分类：按 error_message 分类统计

---

### 4.4 会话结束事件 `session_end`

**用途**: 分析用户会话质量，评估应用粘性

```json
{
  "event_name": "session_end",
  "page_name": null,
  "referrer_page": null,
  "event_properties": [{
    "session_duration": 1800,  // Number: 会话时长 (秒)
    "page_count": 8,          // Number: 访问页面数
    "event_count": 25,        // Number: 触发事件总数
    "timestamp": "2025-06-08 15:00:00"  // String: 会话结束时间
  }]
}
```

**数据库字段建议**:
- `session_duration`: INT NOT NULL COMMENT '会话时长(秒)'
- `page_count`: INT NOT NULL COMMENT '访问页面数'
- `event_count`: INT NOT NULL COMMENT '事件总数'
- `timestamp`: DATETIME NOT NULL COMMENT '会话结束时间'

**关键分析指标**:
- 平均会话时长：AVG(session_duration)
- 会话深度：AVG(page_count)
- 用户活跃度：AVG(event_count)

---

## 5. 全局数据结构

### 5.1 完整数据包结构

```json
{
  "user_id": 123,                    // Number|null: 用户ID，未登录时为null
  "device_id": "ios",               // String: 设备类型标识
  "version": "1749392643547-abc123", // String: 应用版本号
  "session_id": "1749392643547-xyz", // String: 会话唯一标识
  "event_list": [                   // Array: 事件列表，支持批量上报
    {
      "event_name": "app_launch",
      "page_name": null,
      "referrer_page": null,
      "event_properties": [...]
    },
    // ... 更多事件
  ]
}
```

### 5.2 系统配置参数

```typescript
// 发送策略配置
const ANALYTICS_CONFIG = {
  BATCH_SIZE: 10,              // 批量发送阈值：10个事件
  TIMER_INTERVAL: 30000,       // 定时发送间隔：30秒
  MAX_STORAGE: 1000,          // 最大本地存储事件数：1000个
  RETRY_DELAYS: [1000, 5000, 15000], // 重试延迟：1秒、5秒、15秒
  TIMESTAMP_FORMAT: "YYYY-MM-DD HH:MM:SS" // 时间戳格式
};
```

---

## 6. 数据库设计建议

### 6.1 主表设计

```sql
-- 事件主表
CREATE TABLE analytics_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  user_id BIGINT COMMENT '用户ID',
  device_id VARCHAR(50) NOT NULL COMMENT '设备ID',
  session_id VARCHAR(100) NOT NULL COMMENT '会话ID',
  version VARCHAR(50) NOT NULL COMMENT '应用版本',
  event_name VARCHAR(50) NOT NULL COMMENT '事件名称',
  page_name VARCHAR(100) COMMENT '页面名称',
  referrer_page VARCHAR(100) COMMENT '来源页面',
  event_data JSON NOT NULL COMMENT '事件详细数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  event_timestamp DATETIME NOT NULL COMMENT '事件发生时间',
  
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_event_name (event_name),
  INDEX idx_event_timestamp (event_timestamp),
  INDEX idx_created_at (created_at)
) COMMENT '埋点事件主表';
```

### 6.2 分表策略建议

```sql
-- 按事件类型分表 (推荐)
CREATE TABLE analytics_user_behavior LIKE analytics_events;  -- 用户行为事件
CREATE TABLE analytics_business LIKE analytics_events;       -- 业务事件
CREATE TABLE analytics_system LIKE analytics_events;         -- 系统事件

-- 按时间分表 (大数据量时使用)
CREATE TABLE analytics_events_202506 LIKE analytics_events;  -- 按月分表
```

### 6.3 索引优化建议

```sql
-- 常用查询索引
CREATE INDEX idx_user_event_time ON analytics_events (user_id, event_name, event_timestamp);
CREATE INDEX idx_session_events ON analytics_events (session_id, event_timestamp);
CREATE INDEX idx_device_events ON analytics_events (device_id, event_timestamp);

-- 全文搜索索引 (用于搜索关键词分析)
ALTER TABLE analytics_events ADD FULLTEXT(event_data);
```

### 6.4 数据分析视图

```sql
-- 用户行为漏斗分析视图
CREATE VIEW user_funnel_analysis AS
SELECT 
  DATE(event_timestamp) as date,
  COUNT(DISTINCT CASE WHEN event_name = 'app_launch' THEN user_id END) as app_launches,
  COUNT(DISTINCT CASE WHEN event_name = 'product_view' THEN user_id END) as product_views,
  COUNT(DISTINCT CASE WHEN event_name = 'addToCart' THEN user_id END) as add_to_carts,
  COUNT(DISTINCT CASE WHEN event_name = 'checkout' AND JSON_EXTRACT(event_data, '$.is_suc') = 1 THEN user_id END) as checkouts
FROM analytics_events 
WHERE event_timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(event_timestamp);

-- 商品热度分析视图
CREATE VIEW product_popularity AS
SELECT 
  JSON_EXTRACT(event_data, '$.offer_id') as offer_id,
  JSON_EXTRACT(event_data, '$.product_name') as product_name,
  COUNT(*) as view_count,
  COUNT(DISTINCT user_id) as unique_viewers,
  AVG(JSON_EXTRACT(event_data, '$.price')) as avg_price
FROM analytics_events 
WHERE event_name = 'product_view'
  AND event_timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY JSON_EXTRACT(event_data, '$.offer_id')
ORDER BY view_count DESC;
```

### 6.5 数据清理策略

```sql
-- 数据保留策略 (建议保留1年数据)
DELETE FROM analytics_events 
WHERE created_at < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);

-- 数据归档策略
CREATE TABLE analytics_events_archive AS 
SELECT * FROM analytics_events 
WHERE created_at < DATE_SUB(CURDATE(), INTERVAL 6 MONTH);
```

---

## 7. 数据分析指标建议

### 7.1 关键业务指标 (KPI)

1. **用户转化漏斗**
   - 应用启动 → 商品浏览 → 添加购物车 → 支付成功

2. **核心转化率**
   - 商品转化率：添加购物车 / 商品浏览
   - 支付转化率：支付成功 / 添加购物车

3. **用户行为指标**
   - 平均会话时长
   - 页面跳出率
   - 用户留存率

### 7.2 运营分析指标

1. **商品分析**
   - 热门商品排行
   - 分类偏好分析
   - 价格敏感度分析

2. **用户分析**
   - 地理分布分析
   - 登录方式偏好
   - 支付方式偏好

3. **技术指标**
   - 应用稳定性 (错误率)
   - 页面性能 (加载时间)
   - 网络质量影响

---

## 8. 注意事项

### 8.1 数据隐私

- 所有个人敏感信息需要脱敏处理
- 遵守GDPR等数据保护法规
- 用户ID可以使用哈希值代替真实ID

### 8.2 数据质量

- 设置数据校验规则，防止异常数据
- 定期检查数据完整性
- 监控数据上报成功率

### 8.3 性能优化

- 使用批量插入提高数据库性能
- 合理设置数据分区和索引
- 考虑使用时序数据库 (如InfluxDB) 处理大量时间序列数据

---

**文档版本**: v1.0  
**最后更新**: 2025-06-08  
**维护人员**: 开发团队  

> 本文档应随着业务需求变化及时更新，确保埋点数据结构与实际需求保持一致。