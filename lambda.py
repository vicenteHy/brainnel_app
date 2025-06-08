import json
import boto3
import os
import time
import logging
from botocore.config import Config
from botocore.exceptions import ClientError, BotoCoreError

# 配置日志
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# 环境变量配置
sqs_queue_url = os.environ.get('SQS_QUEUE_URL')
aws_region = os.environ.get('AWS_REGION', 'ap-southeast-1')

# 检查必要的环境变量
if not sqs_queue_url:
    raise ValueError("SQS_QUEUE_URL environment variable is required")

# 配置boto3客户端连接参数
config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'  # 自适应重试
    },
    max_pool_connections=50,  # 连接池大小
    read_timeout=60,
    connect_timeout=60
)

sqs = boto3.client('sqs', region_name=aws_region, config=config)


def get_client_ip(event):
    """从API Gateway事件中获取客户端IP地址"""
    try:
        # 检查X-Forwarded-For头部信息
        headers = event.get('headers', {})
        
        # 优先获取真实IP地址
        for header_name in headers:
            if header_name.lower() == 'x-forwarded-for':
                # X-Forwarded-For可能包含多个IP，第一个是真实IP
                ip_list = headers[header_name].split(',')
                client_ip = ip_list[0].strip()
                if client_ip and client_ip != 'unknown':
                    return client_ip
            elif header_name.lower() == 'x-real-ip':
                client_ip = headers[header_name].strip()
                if client_ip and client_ip != 'unknown':
                    return client_ip
        
        # 如果头部没有找到，使用requestContext中的sourceIp
        request_context = event.get('requestContext', {})
        
        # REST API格式
        if 'identity' in request_context:
            source_ip = request_context['identity'].get('sourceIp')
            if source_ip and source_ip != 'unknown':
                return source_ip
        
        # HTTP API v2.0格式
        if 'http' in request_context:
            source_ip = request_context['http'].get('sourceIp')
            if source_ip and source_ip != 'unknown':
                return source_ip
        
    except Exception as e:
        logger.warning(f"Error extracting client IP: {str(e)}")
    
    # 如果都没有找到返回unknown
    return 'unknown'


def validate_event(event):
    """验证事件数据"""
    if not isinstance(event, dict):
        raise ValueError("Event must be a dictionary")
    
    # 检查是否有body
    if 'body' not in event:
        raise ValueError("Missing request body")
    
    # 检查body是否为空
    body = event.get('body')
    if not body or (isinstance(body, str) and body.strip() == ''):
        raise ValueError("Request body is empty")
    
    return True


def parse_request_body(event):
    """解析请求体"""
    body = event.get('body')
    
    if isinstance(body, str):
        try:
            # 尝试解析JSON body
            parsed_data = json.loads(body)
            return parsed_data
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in request body: {str(e)}")
            # 如果不是JSON格式，将原始字符串保存
            return {'raw_body': body}
    elif isinstance(body, dict):
        # 如果body已经是字典格式，直接返回
        return body
    else:
        # 其他情况下从event中提取相关信息
        return {
            'headers': event.get('headers', {}),
            'queryStringParameters': event.get('queryStringParameters', {}),
            'pathParameters': event.get('pathParameters', {}),
            'httpMethod': event.get('httpMethod', ''),
            'path': event.get('path', '')
        }


def create_success_response(message_id, client_ip, processing_time):
    """创建成功响应"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # 允许所有来源的CORS请求
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps({
            'success': True,
            'message': 'Data queued successfully',
            'messageId': message_id,
            'clientIp': client_ip,
            'processingTime': f"{processing_time:.3f}s"
        })
    }


def create_error_response(status_code, error_message, client_ip=None):
    """创建错误响应"""
    response_body = {
        'success': False,
        'error': error_message
    }
    
    if client_ip:
        response_body['clientIp'] = client_ip
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(response_body)
    }


def lambda_handler(event, context):
    """Lambda处理函数"""
    start_time = time.time()
    client_ip = None
    
    try:
        # 获取请求ID用于日志追踪
        request_id = context.aws_request_id if context else 'unknown'
        
        # 记录请求开始处理
        logger.info(f"Processing request {request_id}")
        
        # OPTIONS请求用于CORS预检
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': ''
            }
        
        # 获取客户端IP地址
        client_ip = get_client_ip(event)
        
        # 验证事件
        validate_event(event)
        
        # 解析请求数据
        message_data = parse_request_body(event)
        
        # 添加IP地址到消息数据中
        message_data.update({
            'ip_address': client_ip
        })
        
        # 将消息转换为JSON字符串
        message_body_str = json.dumps(message_data, ensure_ascii=False)
        
        # 检查消息大小是否超过SQS限制（256KB）
        message_size = len(message_body_str.encode('utf-8'))
        if message_size > 262144:  # 256KB
            logger.warning(f"Message size {message_size} bytes exceeds SQS limit")
            return create_error_response(
                413, 
                "Request payload too large", 
                client_ip
            )
        
        # 发送消息到SQS
        logger.info(f"Sending message to SQS for IP: {client_ip}, size: {message_size} bytes")
        
        response = sqs.send_message(
            QueueUrl=sqs_queue_url,
            MessageBody=message_body_str,
            MessageAttributes={
                'ClientIP': {
                    'StringValue': client_ip,
                    'DataType': 'String'
                },
                'RequestID': {
                    'StringValue': request_id,
                    'DataType': 'String'
                }
            }
        )
        
        processing_time = time.time() - start_time
        
        logger.info(f"Successfully sent message to SQS. Message ID: {response['MessageId']}, "
                   f"Processing time: {processing_time:.3f}s")
        
        return create_success_response(
            response['MessageId'], 
            client_ip, 
            processing_time
        )
        
    except ValueError as e:
        # 验证错误
        processing_time = time.time() - start_time
        logger.warning(f"Validation error: {str(e)}, Processing time: {processing_time:.3f}s")
        return create_error_response(400, str(e), client_ip)
        
    except (ClientError, BotoCoreError) as e:
        # AWS服务错误
        processing_time = time.time() - start_time
        error_code = getattr(e, 'response', {}).get('Error', {}).get('Code', 'Unknown')
        logger.error(f"AWS error ({error_code}): {str(e)}, Processing time: {processing_time:.3f}s")
        return create_error_response(502, "Service temporarily unavailable", client_ip)
        
    except json.JSONEncodeError as e:
        # JSON编码错误
        processing_time = time.time() - start_time
        logger.error(f"JSON encoding error: {str(e)}, Processing time: {processing_time:.3f}s")
        return create_error_response(400, "Invalid data format", client_ip)
        
    except Exception as e:
        # 其他未知错误
        processing_time = time.time() - start_time
        logger.error(f"Unexpected error: {str(e)}, Processing time: {processing_time:.3f}s", 
                    exc_info=True)
        return create_error_response(500, "Internal server error", client_ip)