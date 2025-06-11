import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { privacyApi, PrivacyPolicyResponse } from '../../services/api/privacyApi';
import BackIcon from '../../components/BackIcon';
import fontSize from '../../utils/fontsizeUtils';

interface PrivacyPolicyData {
  remark: string;
  info_en: string; // 英文内容
  info_fr?: string; // 法文内容
  sort: number;
  status: number;
  pid: number;
}

export const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(false);

  useEffect(() => {
    loadPrivacyPolicy();
  }, [i18n.language]); // 当语言改变时重新加载内容

  // 根据当前语言获取对应的内容
  const getContentByLanguage = (data: PrivacyPolicyData): string => {
    const currentLanguage = i18n.language;
    console.log('当前语言:', currentLanguage);
    console.log('可用的内容字段:', {
      info_en: !!data.info_en,
      info_fr: !!data.info_fr
    });
    
    if (currentLanguage === 'fr' && data.info_fr) {
      console.log('使用法语内容');
      return data.info_fr;
    } else {
      console.log('使用默认英语内容');
      // 默认返回英文内容
      return data.info_en;
    }
  };

  // 清理HTML内容中的多余字符
  const cleanHtmlContent = (content: string): string => {
    // 移除开头的引号和其他不需要的字符
    return content
      .replace(/^["'\s]+/, '') // 移除开头的引号和空白字符
      .replace(/["'\s]+$/, '') // 移除结尾的引号和空白字符
      .trim();
  };

  // 将HTML内容包装在完整的HTML文档中
  const wrapContentInHTML = (content: string): string => {
    const cleanedContent = cleanHtmlContent(content);
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta charset="UTF-8">
          <style>
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
              font-size: 16px;
              line-height: 1.5; 
              color: #1c1c1e;
              margin: 0;
              padding: 16px 20px 40px 20px;
              background-color: #ffffff;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            h1, h2, h3, h4, h5, h6 { 
              color: #1c1c1e;
              font-weight: 600;
              margin-top: 28px;
              margin-bottom: 12px;
              line-height: 1.3;
            }
            h1 {
              font-size: 24px;
              margin-top: 0;
            }
            h2 {
              font-size: 20px;
            }
            h3 {
              font-size: 18px;
            }
            p { 
              margin-bottom: 16px; 
              text-align: left;
              font-size: 16px;
              line-height: 1.5;
            }
            ol, ul {
              padding-left: 16px;
              margin: 16px 0;
            }
            li {
              margin-bottom: 8px;
              line-height: 1.5;
              padding-left: 4px;
            }
            strong, b {
              font-weight: 600;
              color: #1c1c1e;
            }
            a {
              color: #007AFF;
              text-decoration: none;
            }
            a:active {
              color: #0051D5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e5e5e7;
            }
            table td, table th {
              padding: 12px 16px;
              text-align: left;
              border-bottom: 1px solid #e5e5e7;
            }
            table th {
              background-color: #f2f2f7;
              font-weight: 600;
              color: #1c1c1e;
            }
            table tr:last-child td {
              border-bottom: none;
            }
            blockquote {
              margin: 16px 0;
              padding: 16px 20px;
              background-color: #f2f2f7;
              border-left: 4px solid #007AFF;
              border-radius: 0 8px 8px 0;
            }
            code {
              background-color: #f2f2f7;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
              font-size: 14px;
            }
            .section {
              margin-bottom: 24px;
            }
            .divider {
              height: 1px;
              background-color: #e5e5e7;
              margin: 32px 0;
              border: none;
            }
          </style>
        </head>
        <body>
          ${cleanedContent}
        </body>
      </html>
    `;
  };

  const loadPrivacyPolicy = async () => {
    try {
      setLoading(true);
      setError(false);
      
      console.log('开始加载隐私政策...');
      const response = await privacyApi.getPrivacyPolicy();
      console.log('API响应:', response);
      
      if (response && typeof response === 'object') {
        // response直接包含需要的数据结构
        const data = response as PrivacyPolicyData;
        console.log('使用response作为数据源');
        
        if (data && (data.info_en || data.info_fr)) {
          console.log('找到有效数据，开始处理内容');
          console.log('数据结构:', {
            hasInfoEn: !!data.info_en,
            hasInfoFr: !!data.info_fr
          });
          const content = getContentByLanguage(data);
          console.log('选择的语言内容长度:', content.length);
          const wrappedContent = wrapContentInHTML(content);
          setHtmlContent(wrappedContent);
          console.log('HTML内容设置完成');
        } else {
          console.log('响应数据结构:', Object.keys(response));
          console.log('完整响应:', JSON.stringify(response, null, 2));
          // 尝试直接使用响应作为内容
          if (typeof response === 'string') {
            setHtmlContent(wrapContentInHTML(response));
          } else {
            throw new Error('隐私政策内容格式错误: 未找到有效的内容字段');
          }
        }
      } else if (typeof response === 'string') {
        console.log('响应是字符串，直接使用');
        setHtmlContent(wrapContentInHTML(response));
      } else {
        throw new Error('无法获取隐私政策内容: 响应格式不正确');
      }
    } catch (error) {
      console.error('加载隐私政策失败:', error);
      setError(true);
      setHtmlContent(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 20px; 
                line-height: 1.6; 
                color: #333;
                text-align: center;
              }
              .error { color: #ff6b6b; }
              .retry-text { margin-top: 20px; color: #666; }
              .debug { 
                background: #f5f5f5; 
                padding: 10px; 
                margin: 10px 0; 
                text-align: left; 
                font-size: 12px;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>加载失败</h2>
              <p>无法加载隐私条款内容，请检查网络连接后重试。</p>
              <div class="retry-text">
                错误信息: ${error instanceof Error ? error.message : '未知错误'}
              </div>
              <div class="debug">
                <strong>调试信息:</strong><br>
                时间: ${new Date().toLocaleString()}<br>
                错误类型: ${error instanceof Error ? error.constructor.name : typeof error}
              </div>
            </div>
          </body>
        </html>
      `);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadPrivacyPolicy();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.privacy_policy')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 内容区域 */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5100" />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : (
          <>
            <WebView
              source={{ html: htmlContent }}
              style={styles.webview}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              scalesPageToFit={true}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
              bounces={false}
              scrollEnabled={true}
              allowsBackForwardNavigationGestures={false}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView加载错误:', nativeEvent);
                setWebViewLoading(false);
                setError(true);
              }}
            />
            
            {webViewLoading && (
              <View style={styles.webViewLoadingContainer}>
                <ActivityIndicator size="small" color="#FF5100" />
              </View>
            )}
            
            {error && (
              <View style={styles.errorContainer}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>重新加载</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  backButton: {
    width: fontSize(24),
    height: fontSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: fontSize(24),
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: fontSize(16),
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FF5100',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  webViewLoadingContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
}); 