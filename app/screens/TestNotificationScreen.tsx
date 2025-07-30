import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import notificationService from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TestNotificationScreen = () => {
  const [fcmToken, setFcmToken] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<string>('未检查');
  const [topic, setTopic] = useState<string>('test_topic');

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    // 检查权限状态
    const hasPermission = await notificationService.requestPermission();
    setPermissionStatus(hasPermission ? '已授权' : '未授权');

    // 获取 FCM Token
    const token = await notificationService.getToken();
    if (token) {
      setFcmToken(token);
    }
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('成功', 'Token 已复制到剪贴板');
    }
  };

  const testLocalNotification = () => {
    Alert.alert(
      '测试通知',
      '这是一个本地测试通知',
      [{ text: '确定' }]
    );
  };

  const subscribeToTopic = async () => {
    if (topic) {
      await notificationService.subscribeToTopic(topic);
      Alert.alert('成功', `已订阅主题: ${topic}`);
    }
  };

  const unsubscribeFromTopic = async () => {
    if (topic) {
      await notificationService.unsubscribeFromTopic(topic);
      Alert.alert('成功', `已取消订阅主题: ${topic}`);
    }
  };

  const sendTestNotification = () => {
    Alert.alert(
      '发送测试通知',
      '请使用以下方式测试:\n\n1. 使用 Firebase Console 发送\n2. 使用 Postman 调用 FCM API\n3. 使用服务器端发送',
      [{ text: '确定' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>通知权限状态</Text>
        <Text style={styles.status}>{permissionStatus}</Text>
        <Button title="请求权限" onPress={initializeNotifications} />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>FCM Token</Text>
        <Text style={styles.token} numberOfLines={4}>
          {fcmToken || '正在获取...'}
        </Text>
        <Button title="复制 Token" onPress={copyTokenToClipboard} />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>主题订阅</Text>
        <TextInput
          style={styles.input}
          value={topic}
          onChangeText={setTopic}
          placeholder="输入主题名称"
        />
        <View style={styles.buttonRow}>
          <Button title="订阅" onPress={subscribeToTopic} />
          <Button title="取消订阅" onPress={unsubscribeFromTopic} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>测试功能</Text>
        <Button title="测试本地通知" onPress={testLocalNotification} />
        <View style={{ height: 10 }} />
        <Button title="发送测试推送" onPress={sendTestNotification} />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>测试步骤</Text>
        <Text style={styles.instructions}>
          1. 确保权限状态为"已授权"{'\n'}
          2. 复制 FCM Token{'\n'}
          3. 使用 Firebase Console 发送测试消息{'\n'}
          4. 或使用以下 curl 命令测试:{'\n\n'}
          
          curl -X POST https://fcm.googleapis.com/fcm/send \{'\n'}
          -H "Authorization: key=YOUR_SERVER_KEY" \{'\n'}
          -H "Content-Type: application/json" \{'\n'}
          -d '{JSON.stringify({
            to: 'YOUR_FCM_TOKEN',
            notification: {
              title: '测试通知',
              body: '这是一条测试消息'
            }
          }, null, 2)}'
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  token: {
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});

export default TestNotificationScreen;