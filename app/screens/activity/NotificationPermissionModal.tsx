import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import notificationService from '../../services/notificationService';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onClose,
  onPermissionGranted,
}) => {
  const navigation = useNavigation();
  const appStateRef = useRef(AppState.currentState);
  
  useEffect(() => {
    if (!visible) return;
    
    const handleAppStateChange = async (nextAppState: string) => {
      // 从后台切换到前台
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // 检查权限是否已经开启
        const hasPermission = await notificationService.requestPermission();
        
        if (hasPermission) {
          // 权限已开启，关闭弹窗
          onClose();
          if (onPermissionGranted) {
            onPermissionGranted();
          }
        }
      }
      
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [visible, onClose, onPermissionGranted]);
  
  const handleEnableNotifications = async () => {
    console.log('[NotificationPermissionModal] handleEnableNotifications 被调用');
    try {
      // 重置权限请求状态，允许再次请求
      await notificationService.resetPermissionState();
      
      // 直接请求系统通知权限
      console.log('[NotificationPermissionModal] 调用 requestPermission...');
      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        // 权限授予成功
        onClose();
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      } else {
        // 权限被拒绝，打开系统设置
        // 不要关闭弹窗，让用户从设置返回后再检查
        await notificationService.openNotificationSettings();
      }
    } catch (error) {
      console.error('请求通知权限失败:', error);
    }
  };

  const handleGiveUp = () => {
    // 关闭弹窗
    onClose();
    // 返回首页
    navigation.navigate('MainTabs' as never, { screen: 'Home' } as never);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}} // 禁止通过返回键关闭
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 顶部图标 */}
          <View style={styles.iconContainer}>
            <Text style={styles.bellEmoji}>🔔</Text>
          </View>

          {/* 标题 */}
          <Text style={styles.title}>Activer les notifications</Text>

          {/* 描述文本 */}
          <Text style={styles.description}>
            Les notifications sont obligatoires pour participer à cette activité et recevoir vos récompenses !
          </Text>

          {/* 特性列表 */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎁</Text>
              <Text style={styles.featureText}>Rappels de bonus quotidiens</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureText}>Alertes de gains disponibles</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Offres exclusives et promotions</Text>
            </View>
          </View>

          {/* 按钮区域 */}
          <View style={styles.buttonContainer}>
            {/* 开启通知按钮 */}
            <TouchableOpacity
              style={styles.enableButton}
              onPress={handleEnableNotifications}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF5100', '#FF7A00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.enableButtonText}>Activer les notifications</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* 放弃游戏按钮 */}
            <TouchableOpacity
              style={styles.giveUpButton}
              onPress={handleGiveUp}
              activeOpacity={0.8}
            >
              <Text style={styles.giveUpButtonText}>Abandonner le jeu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: screenWidth * 0.05,
    paddingHorizontal: screenWidth * 0.06,
    paddingVertical: screenHeight * 0.03,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    backgroundColor: '#FFF5F0',
    borderRadius: screenWidth * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.02,
  },
  bellEmoji: {
    fontSize: screenWidth * 0.12,
  },
  title: {
    fontSize: screenWidth * 0.055,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: screenHeight * 0.015,
    fontFamily: 'System',
  },
  description: {
    fontSize: screenWidth * 0.04,
    color: '#666666',
    textAlign: 'center',
    lineHeight: screenHeight * 0.025,
    marginBottom: screenHeight * 0.025,
    fontFamily: 'System',
  },
  featureList: {
    width: '100%',
    marginBottom: screenHeight * 0.03,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenHeight * 0.015,
  },
  featureIcon: {
    fontSize: screenWidth * 0.05,
    marginRight: screenWidth * 0.03,
  },
  featureText: {
    fontSize: screenWidth * 0.038,
    color: '#444444',
    flex: 1,
    fontFamily: 'System',
  },
  buttonContainer: {
    width: '100%',
  },
  enableButton: {
    width: '100%',
    marginBottom: screenHeight * 0.015,
  },
  gradientButton: {
    paddingVertical: screenHeight * 0.018,
    borderRadius: screenWidth * 0.04,
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: screenWidth * 0.042,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  giveUpButton: {
    paddingVertical: screenHeight * 0.012,
    alignItems: 'center',
  },
  giveUpButtonText: {
    fontSize: screenWidth * 0.038,
    color: '#FF5100',
    fontFamily: 'System',
    textDecorationLine: 'underline',
  },
});

export default NotificationPermissionModal;