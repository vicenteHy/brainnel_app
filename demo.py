import requests
import csv
import random
import uuid
from datetime import datetime
import json

class EventSimulator:
    def __init__(self, csv_file_path, api_url):
        self.csv_file_path = csv_file_path
        self.api_url = api_url
        self.categories = self.load_categories()

    def load_categories(self):
        """从CSV文件加载分类数据"""
        categories = []
        with open(self.csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                categories.append({
                    'category_id': row['category_id'],
                    'category_name': row['name']
                })
        return categories

    def get_random_category(self):
        """随机获取一个分类"""
        return random.choice(self.categories)

    def generate_timestamp(self):
        """生成当前时间戳"""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def generate_device_info(self):
        """生成设备信息"""
        devices = ["ios", "android", "web"]
        return {
            "user_id": random.randint(1, 999999),
            "device_id": random.choice(devices),
            "version": f"{random.randint(1000000000000, 9999999999999)}-{uuid.uuid4().hex[:8]}",
            "session_id": f"{random.randint(1000000000000, 9999999999999)}-{uuid.uuid4().hex[:8]}"
        }

    def generate_launch_event(self):
        """生成启动事件"""
        return {
            "event_name": "launch",
            "page_name": None,
            "event_properties": [{
                "is_open": random.choice([0, 1]),
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_login_event(self):
        """生成登录事件"""
        login_methods = ["phone", "facebook", "google", "email", "apple"]
        return {
            "event_name": "login",
            "page_name": "login",
            "event_properties": [{
                "is_login": 1,
                "login_method": random.choice(login_methods),
                "user_name": f"{random.randint(1000000000, 9999999999)}",
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_register_event(self):
        """生成注册事件"""
        register_methods = ["phone", "facebook", "google", "email", "apple"]
        return {
            "event_name": "register",
            "page_name": "register",
            "event_properties": [{
                "is_register": 1,
                "user_name": f"{random.randint(1000000000, 9999999999)}",
                "register_method": random.choice(register_methods),
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_search_event(self):
        """生成搜索事件"""
        category = self.get_random_category()
        return {
            "event_name": "search",
            "page_name": "search",
            "event_properties": [{
                "search_keyword": category['category_name'],
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_product_event(self):
        """生成商品事件"""
        category = self.get_random_category()
        currencies = ["FCFA", "USD", "CDF", "CFA", "EUR"]
        return {
            "event_name": "product",
            "page_name": "product",
            "event_properties": [{
                "offer_id": random.randint(100000000000, 999999999999),
                "category_id": int(category['category_id']),
                "price": round(random.uniform(1.0, 1000.0), 2),
                "currency": random.choice(currencies),
                "timestamp": self.generate_timestamp(),
                "product_name": category['category_name'],
                "product_img": f"https://example.com/img/{random.randint(1000, 9999)}.jpg"
            }]
        }

    def generate_category_event(self):
        """生成分类事件"""
        category = self.get_random_category()
        return {
            "event_name": "category",
            "page_name": "category",
            "event_properties": [{
                "category_id": category['category_id'],
                "timestamp": self.generate_timestamp(),
                "category_name": category['category_name'],
                "level": random.randint(1, 3)
            }]
        }

    def generate_product_list_event(self):
        """生成商品列表事件"""
        category = self.get_random_category()
        return {
            "event_name": "productList",
            "page_name": "productList",
            "event_properties": [{
                "category_id": category['category_id'],
                "category_name": category['category_name'],
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_add_to_cart_event(self):
        """生成添加购物车事件"""
        category = self.get_random_category()
        currencies = ["FCFA", "USD", "CDF", "CFA", "EUR"]
        properties = []

        # 随机生成1-3个商品
        for _ in range(random.randint(1, 3)):
            properties.append({
                "offer_id": random.randint(100000000000, 999999999999),
                "category_id": int(category['category_id']),
                "price": round(random.uniform(1.0, 100.0), 2),
                "quantity": random.randint(1, 5),
                "currency": random.choice(currencies),
                "timestamp": self.generate_timestamp(),
                "product_name": category['category_name'],
                "product_img": f"https://example.com/img/{random.randint(1000, 9999)}.jpg"
            })

        return {
            "event_name": "addToCart",
            "page_name": "addToCart",
            "event_properties": properties
        }

    def generate_payment_event(self):
        """生成支付事件"""
        payment_method = ["palpay", "mobile_money", "wave", "bank_card", "balance","Western Union"]
        currencies = ["FCFA", "USD", "CDF", "CFA", "EUR"]
        return {
            "event_name": "payment",
            "page_name": "payment",
            "event_properties": [{
                "payment_method": random.choice(payment_method),
                "online": random.choice([0, 1]),
                "all_price": round(random.uniform(10.0, 1000.0), 2),
                "currency": random.choice(currencies),
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_order_event(self):
        """生成订单事件"""
        return {
            "event_name": "order",
            "page_name": "order",
            "event_properties": [{
                "order_id": f"{random.randint(1000000000, 9999999999)}",
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_checkout_event(self):
        """生成结算事件"""
        currencies = ["FCFA", "USD", "CDF", "CFA", "EUR"]
        return {
            "event_name": "checkout",
            "page_name": "checkout",
            "event_properties": [{
                "is_suc": random.choice([0, 1]),
                "all_price": round(random.uniform(10.0, 1000.0), 2),
                "currency": random.choice(currencies),
                "timestamp": self.generate_timestamp(),
                "shipping_method": random.choice([0, 1]),
                "shipping_price_outside": random.randint(20, 60),
                "shipping_price_within": random.randint(10, 30)
            }]
        }

    def generate_purchase_event(self):
        """生成购买事件"""
        return {
            "event_name": "purchase",
            "page_name": "purchase",
            "event_properties": [{
                "order_id": f"{random.randint(1000000000, 9999999999)}",
                "is_suc": random.choice([0, 1]),
                "timestamp": self.generate_timestamp()
            }]
        }

    def generate_random_events(self, count):
        """生成随机事件列表"""
        event_generators = [
            self.generate_launch_event,
            self.generate_login_event,
            self.generate_register_event,
            self.generate_search_event,
            self.generate_product_event,
            self.generate_category_event,
            self.generate_product_list_event,
            self.generate_add_to_cart_event,
            self.generate_payment_event,
            self.generate_order_event,
            self.generate_checkout_event,
            self.generate_purchase_event
        ]

        events = []
        for _ in range(count):
            generator = random.choice(event_generators)
            events.append(generator())

        return events

    def create_event_data(self):
        """创建完整的事件数据"""
        device_info = self.generate_device_info()
        event_count = random.randint(1, 5)  # 随机1-5个事件
        events = self.generate_random_events(event_count)

        return {
            **device_info,
            "event_list": events
        }

    def send_event(self):
        """发送事件数据到API"""
        event_data = self.create_event_data()

        try:
            headers = {
                'Content-Type': 'application/json'
            }

            response = requests.post(
                self.api_url,
                data=json.dumps(event_data),
                headers=headers,
                timeout=30
            )

            print(f"请求状态码: {response.status_code}")
            print(f"事件数量: {len(event_data['event_list'])}")
            print(f"用户ID: {event_data['user_id']}")
            print(f"设备: {event_data['device_id']}")
            print(f"响应: {response.text}")
            print("-" * 50)

            return response.status_code == 200

        except Exception as e:
            print(f"发送请求失败: {e}")
            return False

def main():
    # 配置
    csv_file = "category_data.csv"
    api_url = "https://mlj1sm5a3a.execute-api.ap-southeast-1.amazonaws.com/event"

    # 创建模拟器
    simulator = EventSimulator(csv_file, api_url)

    # 发送多次请求进行测试
    print("开始发送事件数据...")
    for i in range(10):  # 发送5次请求
        print(f"\n=== 第 {i+1} 次请求 ===")
        success = simulator.send_event()
        if success:
            print("✅ 请求成功")
        else:
            print("❌ 请求失败")

    print("\n测试完成!")

if __name__ == "__main__":
    main()
