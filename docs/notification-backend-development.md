# 通知系统后端开发文档

## 1. 系统架构概述

### 1.1 核心功能
- 通知发送管理（FCM 集成）
- 送达状态追踪
- 打开率统计
- 用户分组管理
- 实时数据分析

### 1.2 技术栈
- 推送服务：Firebase Cloud Messaging (FCM)
- 数据库：PostgreSQL / MongoDB
- 缓存：Redis
- 消息队列：RabbitMQ / Kafka（可选）

## 2. 数据模型设计

### 2.1 通知主表 (notifications)
```sql
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'promotion', 'transaction', 'system'
    priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
    
    -- 目标用户
    target_type VARCHAR(50) NOT NULL, -- 'all_users', 'user_group', 'individual'
    target_ids TEXT[], -- 用户ID数组或分组ID
    
    -- 发送信息
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_by VARCHAR(50),
    
    -- 统计汇总
    total_sent INT DEFAULT 0,
    total_delivered INT DEFAULT 0,
    total_opened INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 2.2 通知发送记录表 (notification_sends)
```sql
CREATE TABLE notification_sends (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    device_token TEXT NOT NULL,
    
    -- FCM 信息
    fcm_message_id VARCHAR(100),
    fcm_status VARCHAR(20), -- 'success', 'failed'
    fcm_error TEXT,
    fcm_sent_at TIMESTAMP,
    
    -- 设备送达状态
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
    delivered_at TIMESTAMP,
    delivery_latency INT, -- 毫秒
    
    -- 打开状态
    is_opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMP,
    open_source VARCHAR(20), -- 'notification_bar', 'in_app'
    time_to_open INT, -- 从送达到打开的时间（秒）
    
    -- 设备信息
    device_platform VARCHAR(20), -- 'ios', 'android'
    device_version VARCHAR(20),
    app_version VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (notification_id) REFERENCES notifications(id),
    UNIQUE KEY unique_notification_user (notification_id, user_id, device_token)
);

CREATE INDEX idx_sends_notification_id ON notification_sends(notification_id);
CREATE INDEX idx_sends_user_id ON notification_sends(user_id);
CREATE INDEX idx_sends_delivery_status ON notification_sends(delivery_status);
```

### 2.3 通知追踪事件表 (notification_events)
```sql
CREATE TABLE notification_events (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'dismissed', 'failed'
    
    -- 事件详情
    fcm_message_id VARCHAR(100),
    device_id VARCHAR(100),
    metadata JSONB, -- 额外信息
    
    -- 时间戳
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 防重复
    UNIQUE KEY unique_event (notification_id, user_id, event_type, device_id)
);

CREATE INDEX idx_events_notification_id ON notification_events(notification_id);
CREATE INDEX idx_events_event_type ON notification_events(event_type);
CREATE INDEX idx_events_event_time ON notification_events(event_time);
```

### 2.4 用户设备表 (user_devices)
```sql
CREATE TABLE user_devices (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    fcm_token TEXT NOT NULL,
    
    platform VARCHAR(20) NOT NULL, -- 'ios', 'android'
    platform_version VARCHAR(20),
    app_version VARCHAR(20),
    
    -- 状态管理
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP,
    token_updated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_device (user_id, device_id)
);

CREATE INDEX idx_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_devices_token ON user_devices(fcm_token);
```

## 3. API 接口设计

### 3.1 发送通知

#### 发送到用户组
```http
POST /api/notifications/send

Request:
{
  "title": "促销通知",
  "body": "限时优惠，立即查看",
  "type": "promotion",
  "priority": "high",
  "target": {
    "type": "user_group",  // 'all_users', 'user_group', 'individual'
    "group_id": "active_users_2024",
    "filters": {
      "country": "GH",
      "last_active_days": 30
    }
  },
  "data": {
    "action": "open_product",
    "product_id": "12345"
  },
  "schedule_time": "2024-01-15T10:00:00Z" // 可选，定时发送
}

Response:
{
  "success": true,
  "notification_id": "notif_123456",
  "stats": {
    "total_users": 1500,
    "sent": 1500,
    "fcm_success": 1450,
    "fcm_failed": 50
  }
}
```

### 3.2 送达确认

#### 批量确认送达
```http
POST /api/notifications/track/delivered

Request:
{
  "events": [
    {
      "notification_id": "notif_123456",
      "fcm_message_id": "0:1234567890",
      "user_id": "user_789",
      "device_id": "device_abc",
      "delivered_at": "2024-01-15T10:00:05Z",
      "device_info": {
        "platform": "android",
        "version": "11",
        "app_version": "1.0.5"
      }
    }
  ]
}

Response:
{
  "success": true,
  "processed": 1,
  "failed": 0
}
```

### 3.3 打开追踪

#### 记录打开事件
```http
POST /api/notifications/track/opened

Request:
{
  "notification_id": "notif_123456",
  "user_id": "user_789",
  "device_id": "device_abc",
  "opened_at": "2024-01-15T10:05:00Z",
  "source": "notification_bar",
  "session_id": "session_xyz"
}

Response:
{
  "success": true,
  "time_to_open": 295 // 秒
}
```

### 3.4 统计查询

#### 获取通知统计
```http
GET /api/notifications/{notification_id}/statistics

Response:
{
  "notification_id": "notif_123456",
  "title": "促销通知",
  "sent_at": "2024-01-15T10:00:00Z",
  "stats": {
    "total_sent": 1500,
    "fcm_success": 1450,
    "fcm_failed": 50,
    "delivered": 1200,
    "delivery_rate": 82.76, // 1200/1450 * 100
    "opened": 360,
    "open_rate": 30.0, // 360/1200 * 100
    "avg_delivery_latency": 5200, // 毫秒
    "avg_time_to_open": 180 // 秒
  },
  "breakdown": {
    "by_platform": {
      "ios": {
        "sent": 800,
        "delivered": 700,
        "opened": 210,
        "delivery_rate": 87.5,
        "open_rate": 30.0
      },
      "android": {
        "sent": 700,
        "delivered": 500,
        "opened": 150,
        "delivery_rate": 71.43,
        "open_rate": 30.0
      }
    },
    "by_hour": [
      {
        "hour": "2024-01-15T10:00:00Z",
        "delivered": 800,
        "opened": 100
      },
      {
        "hour": "2024-01-15T11:00:00Z",
        "delivered": 300,
        "opened": 150
      }
    ]
  }
}
```

#### 获取汇总统计
```http
GET /api/notifications/statistics/summary?start_date=2024-01-01&end_date=2024-01-31

Response:
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "summary": {
    "total_notifications": 45,
    "total_sent": 67500,
    "total_delivered": 55000,
    "total_opened": 16500,
    "avg_delivery_rate": 81.48,
    "avg_open_rate": 30.0
  },
  "by_type": {
    "promotion": {
      "count": 20,
      "sent": 30000,
      "delivery_rate": 80.0,
      "open_rate": 35.0
    },
    "transaction": {
      "count": 15,
      "sent": 22500,
      "delivery_rate": 85.0,
      "open_rate": 28.0
    },
    "system": {
      "count": 10,
      "sent": 15000,
      "delivery_rate": 82.0,
      "open_rate": 25.0
    }
  },
  "trends": {
    "daily": [
      {
        "date": "2024-01-01",
        "sent": 2000,
        "delivered": 1600,
        "opened": 480
      }
      // ... 更多日期
    ]
  }
}
```

## 4. 核心功能实现

### 4.1 FCM 集成服务

```python
# fcm_service.py
import firebase_admin
from firebase_admin import messaging
from typing import List, Dict
import asyncio
from datetime import datetime

class FCMService:
    def __init__(self):
        cred = credentials.Certificate('path/to/serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        
    async def send_notification(self, 
                               tokens: List[str], 
                               title: str, 
                               body: str,
                               data: Dict = None,
                               notification_id: str = None) -> Dict:
        """
        发送 FCM 通知
        """
        # 构建消息
        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data={
                'notification_id': notification_id,
                'timestamp': str(datetime.now().timestamp()),
                **(data or {})
            },
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    click_action='OPEN_ACTIVITY'
                )
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        content_available=True,
                        mutable_content=True
                    )
                )
            )
        )
        
        # 批量发送
        response = messaging.send_multicast(message)
        
        # 处理结果
        results = {
            'success_count': response.success_count,
            'failure_count': response.failure_count,
            'responses': []
        }
        
        for i, resp in enumerate(response.responses):
            if resp.success:
                results['responses'].append({
                    'token': tokens[i],
                    'success': True,
                    'message_id': resp.message_id
                })
            else:
                results['responses'].append({
                    'token': tokens[i],
                    'success': False,
                    'error': str(resp.exception)
                })
                
        return results
```

### 4.2 通知发送服务

```python
# notification_service.py
from typing import List, Dict
import uuid
from datetime import datetime
import asyncio

class NotificationService:
    def __init__(self, db, fcm_service, redis_client):
        self.db = db
        self.fcm = fcm_service
        self.redis = redis_client
        
    async def send_to_group(self, 
                           title: str,
                           body: str,
                           target_type: str,
                           target_ids: List[str] = None,
                           filters: Dict = None) -> str:
        """
        发送通知到用户组
        """
        # 生成通知ID
        notification_id = f"notif_{uuid.uuid4().hex[:12]}"
        
        # 获取目标用户
        users = await self._get_target_users(target_type, target_ids, filters)
        
        # 创建通知记录
        await self.db.execute("""
            INSERT INTO notifications 
            (id, title, body, type, target_type, target_ids, sent_at, total_sent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, notification_id, title, body, 'promotion', 
            target_type, target_ids, datetime.now(), len(users))
        
        # 批量发送
        batch_size = 500  # FCM 限制每批最多 500 个
        for i in range(0, len(users), batch_size):
            batch = users[i:i+batch_size]
            await self._send_batch(notification_id, title, body, batch)
            
        return notification_id
        
    async def _send_batch(self, 
                         notification_id: str,
                         title: str,
                         body: str,
                         users: List[Dict]):
        """
        批量发送通知
        """
        tokens = [u['fcm_token'] for u in users]
        
        # 调用 FCM
        result = await self.fcm.send_notification(
            tokens=tokens,
            title=title,
            body=body,
            notification_id=notification_id
        )
        
        # 记录发送结果
        send_records = []
        for resp in result['responses']:
            user = next(u for u in users if u['fcm_token'] == resp['token'])
            
            send_records.append({
                'notification_id': notification_id,
                'user_id': user['user_id'],
                'device_token': resp['token'],
                'fcm_message_id': resp.get('message_id'),
                'fcm_status': 'success' if resp['success'] else 'failed',
                'fcm_error': resp.get('error'),
                'fcm_sent_at': datetime.now()
            })
            
        # 批量插入发送记录
        await self._bulk_insert_send_records(send_records)
        
    async def _get_target_users(self, 
                               target_type: str,
                               target_ids: List[str] = None,
                               filters: Dict = None) -> List[Dict]:
        """
        获取目标用户列表
        """
        query = """
            SELECT DISTINCT u.id as user_id, d.fcm_token, d.device_id
            FROM users u
            JOIN user_devices d ON u.id = d.user_id
            WHERE d.is_active = true
        """
        
        conditions = []
        params = []
        
        if target_type == 'individual':
            conditions.append(f"u.id = ANY($1)")
            params.append(target_ids)
        elif target_type == 'user_group':
            # 根据分组条件查询
            if filters:
                if 'country' in filters:
                    conditions.append(f"u.country = ${len(params)+1}")
                    params.append(filters['country'])
                if 'last_active_days' in filters:
                    conditions.append(f"u.last_active_at > NOW() - INTERVAL '${len(params)+1} days'")
                    params.append(filters['last_active_days'])
                    
        if conditions:
            query += " AND " + " AND ".join(conditions)
            
        result = await self.db.fetch(query, *params)
        return [dict(r) for r in result]
```

### 4.3 追踪服务

```python
# tracking_service.py
from datetime import datetime
from typing import List, Dict

class TrackingService:
    def __init__(self, db, redis_client):
        self.db = db
        self.redis = redis_client
        
    async def track_delivered_batch(self, events: List[Dict]):
        """
        批量追踪送达事件
        """
        for event in events:
            # 防重复处理
            cache_key = f"delivered:{event['notification_id']}:{event['user_id']}:{event['device_id']}"
            if await self.redis.get(cache_key):
                continue
                
            # 更新送达状态
            await self.db.execute("""
                UPDATE notification_sends
                SET delivery_status = 'delivered',
                    delivered_at = $1,
                    delivery_latency = EXTRACT(EPOCH FROM ($1 - fcm_sent_at)) * 1000,
                    device_platform = $2,
                    device_version = $3,
                    app_version = $4
                WHERE notification_id = $5 
                    AND user_id = $6
                    AND delivery_status = 'pending'
            """, datetime.fromisoformat(event['delivered_at']),
                event['device_info']['platform'],
                event['device_info']['version'],
                event['device_info']['app_version'],
                event['notification_id'],
                event['user_id'])
            
            # 记录事件
            await self.db.execute("""
                INSERT INTO notification_events 
                (notification_id, user_id, event_type, device_id, fcm_message_id, metadata)
                VALUES ($1, $2, 'delivered', $3, $4, $5)
                ON CONFLICT DO NOTHING
            """, event['notification_id'], event['user_id'], 
                event['device_id'], event.get('fcm_message_id'),
                json.dumps(event.get('metadata', {})))
            
            # 更新统计
            await self._update_notification_stats(event['notification_id'], 'delivered')
            
            # 设置缓存防重复
            await self.redis.setex(cache_key, 86400, '1')  # 24小时过期
            
    async def track_opened(self, event: Dict):
        """
        追踪打开事件
        """
        # 计算打开时间
        send_record = await self.db.fetchrow("""
            SELECT delivered_at FROM notification_sends
            WHERE notification_id = $1 AND user_id = $2
        """, event['notification_id'], event['user_id'])
        
        time_to_open = None
        if send_record and send_record['delivered_at']:
            opened_at = datetime.fromisoformat(event['opened_at'])
            time_to_open = int((opened_at - send_record['delivered_at']).total_seconds())
            
        # 更新打开状态
        await self.db.execute("""
            UPDATE notification_sends
            SET is_opened = true,
                opened_at = $1,
                open_source = $2,
                time_to_open = $3
            WHERE notification_id = $4 AND user_id = $5
        """, datetime.fromisoformat(event['opened_at']),
            event.get('source', 'unknown'),
            time_to_open,
            event['notification_id'],
            event['user_id'])
        
        # 记录事件
        await self.db.execute("""
            INSERT INTO notification_events 
            (notification_id, user_id, event_type, device_id)
            VALUES ($1, $2, 'opened', $3)
            ON CONFLICT DO NOTHING
        """, event['notification_id'], event['user_id'], event['device_id'])
        
        # 更新统计
        await self._update_notification_stats(event['notification_id'], 'opened')
        
        return {'success': True, 'time_to_open': time_to_open}
        
    async def _update_notification_stats(self, notification_id: str, event_type: str):
        """
        更新通知统计数据
        """
        if event_type == 'delivered':
            await self.db.execute("""
                UPDATE notifications 
                SET total_delivered = total_delivered + 1
                WHERE id = $1
            """, notification_id)
        elif event_type == 'opened':
            await self.db.execute("""
                UPDATE notifications 
                SET total_opened = total_opened + 1
                WHERE id = $1
            """, notification_id)
```

### 4.4 统计分析服务

```python
# analytics_service.py
from datetime import datetime, timedelta
from typing import Dict

class NotificationAnalytics:
    def __init__(self, db):
        self.db = db
        
    async def get_notification_stats(self, notification_id: str) -> Dict:
        """
        获取单个通知的统计数据
        """
        # 基础统计
        basic_stats = await self.db.fetchrow("""
            SELECT 
                n.*,
                COUNT(DISTINCT ns.user_id) as unique_users,
                COUNT(CASE WHEN ns.fcm_status = 'success' THEN 1 END) as fcm_success,
                COUNT(CASE WHEN ns.fcm_status = 'failed' THEN 1 END) as fcm_failed,
                COUNT(CASE WHEN ns.delivery_status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN ns.is_opened = true THEN 1 END) as opened,
                AVG(ns.delivery_latency) as avg_delivery_latency,
                AVG(ns.time_to_open) as avg_time_to_open
            FROM notifications n
            LEFT JOIN notification_sends ns ON n.id = ns.notification_id
            WHERE n.id = $1
            GROUP BY n.id
        """, notification_id)
        
        # 平台分组统计
        platform_stats = await self.db.fetch("""
            SELECT 
                device_platform,
                COUNT(*) as sent,
                COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN is_opened = true THEN 1 END) as opened
            FROM notification_sends
            WHERE notification_id = $1
            GROUP BY device_platform
        """, notification_id)
        
        # 时间分布统计
        hourly_stats = await self.db.fetch("""
            SELECT 
                DATE_TRUNC('hour', delivered_at) as hour,
                COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN is_opened = true THEN 1 END) as opened
            FROM notification_sends
            WHERE notification_id = $1 AND delivered_at IS NOT NULL
            GROUP BY hour
            ORDER BY hour
        """, notification_id)
        
        # 计算率
        fcm_success = basic_stats['fcm_success']
        delivered = basic_stats['delivered']
        opened = basic_stats['opened']
        
        delivery_rate = (delivered / fcm_success * 100) if fcm_success > 0 else 0
        open_rate = (opened / delivered * 100) if delivered > 0 else 0
        
        return {
            'notification_id': notification_id,
            'title': basic_stats['title'],
            'sent_at': basic_stats['sent_at'].isoformat(),
            'stats': {
                'total_sent': basic_stats['total_sent'],
                'fcm_success': fcm_success,
                'fcm_failed': basic_stats['fcm_failed'],
                'delivered': delivered,
                'delivery_rate': round(delivery_rate, 2),
                'opened': opened,
                'open_rate': round(open_rate, 2),
                'avg_delivery_latency': int(basic_stats['avg_delivery_latency'] or 0),
                'avg_time_to_open': int(basic_stats['avg_time_to_open'] or 0)
            },
            'breakdown': {
                'by_platform': self._format_platform_stats(platform_stats),
                'by_hour': self._format_hourly_stats(hourly_stats)
            }
        }
        
    async def get_summary_stats(self, start_date: str, end_date: str) -> Dict:
        """
        获取时间段内的汇总统计
        """
        # 总体统计
        summary = await self.db.fetchrow("""
            SELECT 
                COUNT(DISTINCT n.id) as total_notifications,
                SUM(n.total_sent) as total_sent,
                SUM(n.total_delivered) as total_delivered,
                SUM(n.total_opened) as total_opened
            FROM notifications n
            WHERE n.created_at BETWEEN $1 AND $2
        """, start_date, end_date)
        
        # 按类型统计
        type_stats = await self.db.fetch("""
            SELECT 
                n.type,
                COUNT(DISTINCT n.id) as count,
                SUM(n.total_sent) as sent,
                AVG(CASE WHEN n.total_sent > 0 
                    THEN n.total_delivered::float / n.total_sent * 100 
                    ELSE 0 END) as avg_delivery_rate,
                AVG(CASE WHEN n.total_delivered > 0 
                    THEN n.total_opened::float / n.total_delivered * 100 
                    ELSE 0 END) as avg_open_rate
            FROM notifications n
            WHERE n.created_at BETWEEN $1 AND $2
            GROUP BY n.type
        """, start_date, end_date)
        
        # 每日趋势
        daily_trends = await self.db.fetch("""
            SELECT 
                DATE(ns.fcm_sent_at) as date,
                COUNT(*) as sent,
                COUNT(CASE WHEN ns.delivery_status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN ns.is_opened = true THEN 1 END) as opened
            FROM notification_sends ns
            JOIN notifications n ON ns.notification_id = n.id
            WHERE n.created_at BETWEEN $1 AND $2
            GROUP BY date
            ORDER BY date
        """, start_date, end_date)
        
        # 计算平均率
        total_sent = summary['total_sent'] or 0
        total_delivered = summary['total_delivered'] or 0
        total_opened = summary['total_opened'] or 0
        
        avg_delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0
        avg_open_rate = (total_opened / total_delivered * 100) if total_delivered > 0 else 0
        
        return {
            'period': {
                'start': start_date,
                'end': end_date
            },
            'summary': {
                'total_notifications': summary['total_notifications'],
                'total_sent': total_sent,
                'total_delivered': total_delivered,
                'total_opened': total_opened,
                'avg_delivery_rate': round(avg_delivery_rate, 2),
                'avg_open_rate': round(avg_open_rate, 2)
            },
            'by_type': self._format_type_stats(type_stats),
            'trends': {
                'daily': self._format_daily_trends(daily_trends)
            }
        }
        
    def _format_platform_stats(self, stats):
        """格式化平台统计数据"""
        result = {}
        for row in stats:
            platform = row['device_platform'] or 'unknown'
            sent = row['sent']
            delivered = row['delivered']
            opened = row['opened']
            
            result[platform] = {
                'sent': sent,
                'delivered': delivered,
                'opened': opened,
                'delivery_rate': round(delivered / sent * 100, 2) if sent > 0 else 0,
                'open_rate': round(opened / delivered * 100, 2) if delivered > 0 else 0
            }
        return result
```

## 5. 性能优化

### 5.1 缓存策略

```python
# cache_service.py
class NotificationCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        
    async def cache_user_tokens(self, user_ids: List[str]):
        """预加载用户 FCM Token 到缓存"""
        pipe = self.redis.pipeline()
        for user_id in user_ids:
            key = f"user_token:{user_id}"
            pipe.get(key)
        cached = await pipe.execute()
        
        # 缓存未命中的
        missing_ids = [uid for uid, cache in zip(user_ids, cached) if not cache]
        if missing_ids:
            tokens = await self._fetch_tokens_from_db(missing_ids)
            pipe = self.redis.pipeline()
            for user_id, token in tokens.items():
                pipe.setex(f"user_token:{user_id}", 3600, token)
            await pipe.execute()
            
    async def cache_stats(self, notification_id: str, stats: Dict):
        """缓存统计数据"""
        key = f"stats:{notification_id}"
        await self.redis.setex(key, 300, json.dumps(stats))  # 5分钟缓存
```

### 5.2 批量处理优化

```python
# batch_processor.py
import asyncio
from typing import List

class BatchProcessor:
    def __init__(self, batch_size=100, flush_interval=5):
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.buffer = []
        self.lock = asyncio.Lock()
        self.flush_task = None
        
    async def add(self, item):
        """添加到批处理队列"""
        async with self.lock:
            self.buffer.append(item)
            
            if len(self.buffer) >= self.batch_size:
                await self._flush()
            elif not self.flush_task:
                self.flush_task = asyncio.create_task(self._auto_flush())
                
    async def _flush(self):
        """刷新缓冲区"""
        if not self.buffer:
            return
            
        batch = self.buffer[:self.batch_size]
        self.buffer = self.buffer[self.batch_size:]
        
        await self._process_batch(batch)
        
    async def _auto_flush(self):
        """定时自动刷新"""
        await asyncio.sleep(self.flush_interval)
        async with self.lock:
            await self._flush()
            self.flush_task = None
            
    async def _process_batch(self, batch: List):
        """处理批量数据 - 子类实现"""
        raise NotImplementedError
```

## 6. 监控与告警

### 6.1 关键指标监控

```python
# monitoring.py
class NotificationMonitor:
    def __init__(self, metrics_client):
        self.metrics = metrics_client
        
    async def record_send_metrics(self, notification_id: str, results: Dict):
        """记录发送指标"""
        # 发送成功率
        self.metrics.gauge('notification.fcm.success_rate', 
                          results['success_count'] / 
                          (results['success_count'] + results['failure_count']))
        
        # 发送延迟
        self.metrics.histogram('notification.send.latency', 
                              results.get('latency_ms', 0))
        
    async def record_delivery_metrics(self, notification_id: str, latency: int):
        """记录送达指标"""
        self.metrics.histogram('notification.delivery.latency', latency)
        self.metrics.increment('notification.delivered.count')
        
    async def check_anomalies(self):
        """检查异常情况"""
        # 检查送达率是否异常低
        recent_stats = await self._get_recent_stats()
        if recent_stats['delivery_rate'] < 70:  # 阈值
            await self._send_alert(f"Low delivery rate: {recent_stats['delivery_rate']}%")
            
        # 检查延迟是否过高
        if recent_stats['avg_latency'] > 10000:  # 10秒
            await self._send_alert(f"High delivery latency: {recent_stats['avg_latency']}ms")
```

### 6.2 日志记录

```python
# logging_config.py
import logging
import json

class NotificationLogger:
    def __init__(self):
        self.logger = logging.getLogger('notification')
        
    def log_send_event(self, notification_id: str, user_count: int, result: Dict):
        """记录发送事件"""
        self.logger.info(json.dumps({
            'event': 'notification_sent',
            'notification_id': notification_id,
            'user_count': user_count,
            'fcm_success': result['success_count'],
            'fcm_failed': result['failure_count'],
            'timestamp': datetime.now().isoformat()
        }))
        
    def log_tracking_event(self, event_type: str, notification_id: str, user_id: str):
        """记录追踪事件"""
        self.logger.info(json.dumps({
            'event': f'notification_{event_type}',
            'notification_id': notification_id,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat()
        }))
```

## 7. 部署建议

### 7.1 环境变量配置

```bash
# .env
# FCM 配置
FCM_PROJECT_ID=your-project-id
FCM_PRIVATE_KEY=your-private-key
FCM_CLIENT_EMAIL=your-client-email

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notification_db
DB_USER=notification_user
DB_PASSWORD=secure_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 监控配置
METRICS_HOST=localhost
METRICS_PORT=8125
```

### 7.2 Docker 部署

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "main:app"]
```

### 7.3 扩展性设计

1. **水平扩展**
   - 使用消息队列（RabbitMQ/Kafka）解耦发送任务
   - 多实例部署，负载均衡

2. **垂直优化**
   - 数据库读写分离
   - 分表分库（按时间/用户分片）

3. **降级策略**
   - 高峰期降低非关键通知优先级
   - 限流保护

## 8. 安全考虑

1. **Token 安全**
   - FCM Token 加密存储
   - 定期清理无效 Token

2. **API 认证**
   - JWT Token 认证
   - API Rate Limiting

3. **数据隐私**
   - 用户数据加密
   - 日志脱敏

## 9. 测试建议

### 9.1 单元测试

```python
# test_notification_service.py
import pytest
from unittest.mock import Mock, patch

@pytest.mark.asyncio
async def test_send_notification():
    # 模拟 FCM 服务
    mock_fcm = Mock()
    mock_fcm.send_notification.return_value = {
        'success_count': 1,
        'failure_count': 0,
        'responses': [{'success': True, 'message_id': 'test_123'}]
    }
    
    service = NotificationService(db=Mock(), fcm_service=mock_fcm, redis_client=Mock())
    
    result = await service.send_to_group(
        title="Test",
        body="Test message",
        target_type="individual",
        target_ids=["user_1"]
    )
    
    assert result.startswith("notif_")
    mock_fcm.send_notification.assert_called_once()
```

### 9.2 压力测试

```bash
# 使用 locust 进行压力测试
locust -f locustfile.py --host=http://localhost:8000 --users=1000 --spawn-rate=10
```

## 10. 常见问题处理

1. **Token 失效处理**
   - 自动更新失效 Token
   - 定期验证 Token 有效性

2. **重试机制**
   - 失败通知进入重试队列
   - 指数退避算法

3. **去重处理**
   - 使用唯一键防止重复发送
   - 事件幂等性设计