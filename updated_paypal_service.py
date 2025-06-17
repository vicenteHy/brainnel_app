# 更新现有的PayPal服务 - 使用Orders API v2解决403问题

import paypalrestsdk
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PayPalService:
    
    @staticmethod
    def create_order_v2(amount: float, currency: str, order_id: str, description: str = None) -> Dict[str, Any]:
        """使用Orders API v2创建订单（替代Express Checkout）"""
        try:
            # 使用paypalrestsdk创建Orders API v2订单
            order = paypalrestsdk.Order({
                "intent": "CAPTURE",
                "application_context": {
                    "return_url": "com.brainnel.app://payment-success",
                    "cancel_url": "com.brainnel.app://payment-cancel",
                    "brand_name": "Brainnel App",
                    "locale": "en-US", 
                    "landing_page": "BILLING",
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "PAY_NOW",
                    # 移动端优化 - 关键配置
                    "payment_method": {
                        "payer_selected": "PAYPAL",
                        "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                    }
                },
                "purchase_units": [{
                    "reference_id": order_id,
                    "amount": {
                        "currency_code": currency,
                        "value": str(amount)
                    },
                    "description": description or f"Order {order_id} payment",
                    "custom_id": order_id,
                    "invoice_id": order_id
                }]
            })
            
            if order.create():
                logger.info(f"PayPal Orders API v2订单创建成功: {order.id}")
                
                # 找到approval_url
                approval_url = None
                for link in order.links:
                    if link.rel == "approve":
                        approval_url = link.href
                        break
                
                if approval_url:
                    return {
                        "success": True,
                        "order_id": order.id,  # 这是PayPal的订单ID
                        "approval_url": approval_url,
                        "status": order.status,
                        "message": "PayPal Orders API v2 order created successfully"
                    }
                else:
                    return {
                        "success": False,
                        "message": "No approval URL found in Orders API response"
                    }
            else:
                logger.error(f"PayPal Orders API v2订单创建失败: {order.error}")
                return {
                    "success": False,
                    "message": "Failed to create PayPal Orders API v2 order",
                    "error": order.error
                }
                
        except Exception as e:
            logger.error(f"创建PayPal Orders API v2订单异常: {str(e)}")
            return {
                "success": False,
                "message": f"Exception occurred: {str(e)}"
            }
    
    @staticmethod
    def capture_order_v2(paypal_order_id: str) -> Dict[str, Any]:
        """捕获Orders API v2订单支付"""
        try:
            # 查找订单
            order = paypalrestsdk.Order.find(paypal_order_id)
            
            if not order:
                return {
                    "status": 0,
                    "message": "PayPal order not found"
                }
            
            # 捕获支付
            capture_request = {}
            
            if order.capture(capture_request):
                logger.info(f"PayPal Orders API v2支付捕获成功: {order.id}")
                
                # 检查支付状态
                if order.status == "COMPLETED":
                    # 获取支付详情
                    purchase_unit = order.purchase_units[0]
                    capture = purchase_unit.payments.captures[0]
                    
                    return {
                        "status": 1,
                        "message": "Payment successful",
                        "order_id": purchase_unit.custom_id,  # 原始订单ID
                        "paypal_order_id": order.id,
                        "transaction_id": capture.id,
                        "amount": capture.amount.value,
                        "currency": capture.amount.currency_code,
                        "payer_email": order.payer.email_address if hasattr(order.payer, 'email_address') else None
                    }
                else:
                    return {
                        "status": 0,
                        "message": f"Payment not completed. Status: {order.status}",
                        "order_status": order.status
                    }
            else:
                logger.error(f"PayPal Orders API v2支付捕获失败: {order.error}")
                return {
                    "status": 0,
                    "message": "Payment capture failed",
                    "error": order.error
                }
                
        except Exception as e:
            logger.error(f"捕获PayPal Orders API v2支付异常: {str(e)}")
            return {
                "status": 0,
                "message": f"Exception occurred: {str(e)}"
            }
    
    @staticmethod
    def create_payment_legacy(amount: float, currency: str, order_id: str, description: str = None) -> Dict[str, Any]:
        """保留原有的Express Checkout方法作为备用"""
        try:
            # 你原有的create_payment代码...
            payment_data = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "com.brainnel.app://payment-success",
                    "cancel_url": "com.brainnel.app://payment-cancel"
                },
                "application_context": {
                    "brand_name": "Brainnel App",
                    "user_action": "PAY_NOW",
                    "shipping_preference": "NO_SHIPPING",
                    "payment_method": {
                        "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                    }
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": description or "Order Payment",
                            "sku": order_id,
                            "price": str(amount),
                            "currency": currency,
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": currency,
                        "total": str(amount),
                        "details": {
                            "subtotal": str(amount)
                        }
                    },
                    "description": description or f"Payment for order {order_id}",
                    "custom": order_id,
                    "invoice_number": order_id
                }]
            }
            
            payment = paypalrestsdk.Payment(payment_data)
            
            if payment.create():
                approval_url = None
                for link in payment.links:
                    if link.rel == "approval_url":
                        approval_url = link.href
                        break
                
                if approval_url:
                    return {
                        "success": True,
                        "payment_id": payment.id,
                        "approval_url": approval_url,
                        "message": "PayPal payment created successfully"
                    }
                else:
                    return {
                        "success": False,
                        "message": "No approval URL found"
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to create PayPal payment",
                    "error": payment.error
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Exception occurred: {str(e)}"
            }