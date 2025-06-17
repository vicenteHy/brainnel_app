# PayPal Orders API v2 实现 - 解决WebView 403问题

import requests
import json
import base64
from typing import Dict, Any

class PayPalOrdersAPI:
    def __init__(self, client_id: str, client_secret: str, sandbox: bool = True):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = "https://api.sandbox.paypal.com" if sandbox else "https://api.paypal.com"
        self.access_token = None
    
    def get_access_token(self) -> str:
        """获取PayPal访问令牌"""
        url = f"{self.base_url}/v1/oauth2/token"
        
        # 基本认证
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Authorization': f'Basic {encoded_credentials}'
        }
        
        data = 'grant_type=client_credentials'
        
        response = requests.post(url, headers=headers, data=data)
        
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data['access_token']
            return self.access_token
        else:
            raise Exception(f"Failed to get access token: {response.text}")
    
    def create_order(self, amount: str, currency: str, order_id: str, return_url: str, cancel_url: str) -> Dict[str, Any]:
        """创建PayPal订单 - 使用Orders API v2"""
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.base_url}/v2/checkout/orders"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.access_token}',
            'PayPal-Request-Id': order_id,  # 防重复请求
            'Prefer': 'return=representation'
        }
        
        # Orders API v2 支持更好的移动端集成
        order_data = {
            "intent": "CAPTURE",
            "application_context": {
                "return_url": return_url,
                "cancel_url": cancel_url,
                "brand_name": "Brainnel App",
                "locale": "en-US",
                "landing_page": "BILLING",
                "shipping_preference": "NO_SHIPPING",
                "user_action": "PAY_NOW",
                # 关键：移动端优化配置
                "payment_method": {
                    "payer_selected": "PAYPAL",
                    "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                }
            },
            "purchase_units": [{
                "reference_id": order_id,
                "amount": {
                    "currency_code": currency,
                    "value": amount
                },
                "description": f"Order {order_id} payment",
                "custom_id": order_id,
                "invoice_id": order_id
            }]
        }
        
        response = requests.post(url, headers=headers, json=order_data)
        
        if response.status_code in [200, 201]:
            order_response = response.json()
            
            # 提取approve链接
            approve_url = None
            for link in order_response.get('links', []):
                if link['rel'] == 'approve':
                    approve_url = link['href']
                    break
            
            return {
                "success": True,
                "order_id": order_response['id'],
                "status": order_response['status'],
                "approve_url": approve_url,
                "order_data": order_response
            }
        else:
            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code
            }
    
    def capture_order(self, order_id: str) -> Dict[str, Any]:
        """捕获PayPal订单支付"""
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.base_url}/v2/checkout/orders/{order_id}/capture"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.access_token}',
            'Prefer': 'return=representation'
        }
        
        response = requests.post(url, headers=headers, json={})
        
        if response.status_code in [200, 201]:
            capture_response = response.json()
            
            # 检查支付状态
            status = capture_response.get('status')
            if status == 'COMPLETED':
                # 获取支付详情
                purchase_unit = capture_response['purchase_units'][0]
                capture = purchase_unit['payments']['captures'][0]
                
                return {
                    "status": 1,
                    "message": "Payment successful",
                    "order_id": purchase_unit.get('custom_id'),
                    "transaction_id": capture['id'],
                    "amount": capture['amount']['value'],
                    "currency": capture['amount']['currency_code'],
                    "payer_email": capture_response.get('payer', {}).get('email_address'),
                    "capture_data": capture_response
                }
            else:
                return {
                    "status": 0,
                    "message": f"Payment not completed. Status: {status}",
                    "capture_data": capture_response
                }
        else:
            return {
                "status": 0,
                "message": "Failed to capture payment",
                "error": response.text
            }


# FastAPI路由实现
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/payment", tags=["payment"])

# 初始化PayPal API
paypal_api = PayPalOrdersAPI(
    client_id="你的PayPal客户端ID",
    client_secret="你的PayPal客户端密钥",
    sandbox=True  # 生产环境设为False
)

class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "USD"
    order_id: str
    description: str = None

class CaptureOrderRequest(BaseModel):
    order_id: str  # PayPal订单ID

@router.post("/create-paypal-order-v2")
async def create_paypal_order_v2(request: CreateOrderRequest):
    """使用PayPal Orders API v2创建订单"""
    try:
        result = paypal_api.create_order(
            amount=str(request.amount),
            currency=request.currency,
            order_id=request.order_id,
            return_url="com.brainnel.app://payment-success",
            cancel_url="com.brainnel.app://payment-cancel"
        )
        
        if result["success"]:
            return {
                "success": True,
                "paypal_order_id": result["order_id"],
                "approve_url": result["approve_url"],
                "status": result["status"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/capture-paypal-order")
async def capture_paypal_order(request: CaptureOrderRequest):
    """捕获PayPal订单支付"""
    try:
        result = paypal_api.capture_order(request.order_id)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))