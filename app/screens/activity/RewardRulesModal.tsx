import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RewardRecord {
  id: string;
  type: 'daily' | 'wheel';
  amount: number;
  date: string;
}

interface RewardRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

const RewardRulesModal: React.FC<RewardRulesModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'records'>('records');
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  // 模拟奖励记录数据
  const rewardRecords: RewardRecord[] = [
    { id: '1', type: 'daily', amount: 20, date: '2024-01-15 14:30' },
    { id: '2', type: 'wheel', amount: 50, date: '2024-01-15 14:30' },
    { id: '3', type: 'daily', amount: 20, date: '2024-01-15 14:30' },
    { id: '4', type: 'wheel', amount: 50, date: '2024-01-15 14:30' },
    { id: '5', type: 'daily', amount: 20, date: '2024-01-15 14:30' },
  ];

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const handleClose = () => {
    fadeAnim.value = withTiming(0, { duration: 300 });
    scaleAnim.value = withTiming(0.8, { duration: 300 });
    
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getRecordText = (type: 'daily' | 'wheel') => {
    if (type === 'daily') {
      return 'Gain de connexion quotidienne';
    }
    return 'Gain de la roue';
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* 黑色半透明背景 */}
        <View style={styles.overlay} />
        
        <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.modalContent, contentAnimatedStyle]}>
            {/* 主背景 - 米色背景 */}
            <View style={styles.mainBackground}>
              {/* 圆角矩形背景 */}
              <View style={styles.backgroundShape} />
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Détails</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* 内容容器 */}
              <View style={styles.innerContentContainer}>
                {/* 白色内容背景 */}
                <View style={styles.contentBackground}>
                  {/* Tabs with SVG */}
                  <View style={styles.tabContainer}>
                    <Svg 
                      width="338" 
                      height="49" 
                      viewBox="0 0 338 49" 
                      style={StyleSheet.absoluteFillObject}
                    >
                      {/* 左侧灰色标签 */}
                      <Path
                        d="M 16 0 L 168 0 L 148 49 L 16 49 Q 0 49 0 33 L 0 16 Q 0 0 16 0"
                        fill="#F6F6F6"
                      />
                      {/* 右侧白色标签 */}
                      <Path
                        d="M 148 49 L 168 0 L 322 0 Q 338 0 338 16 L 338 49 L 148 49"
                        fill="#FFFFFF"
                      />
                    </Svg>
                    
                    {/* 左侧标签内容 */}
                    <TouchableOpacity
                      style={styles.leftTabButton}
                      onPress={() => setActiveTab('history')}
                    >
                      <Text style={[
                        styles.tabText,
                        styles.leftTabText,
                        activeTab === 'history' && styles.inactiveTabText
                      ]}>
                        Historique des gains
                      </Text>
                    </TouchableOpacity>
                    
                    {/* 右侧标签内容 */}
                    <TouchableOpacity
                      style={styles.rightTabButton}
                      onPress={() => setActiveTab('records')}
                    >
                      <Text style={[
                        styles.tabText,
                        styles.rightTabText,
                        activeTab === 'records' && styles.activeTabText
                      ]}>
                        Reward Records
                      </Text>
                      {activeTab === 'records' && (
                        <View style={styles.tabUnderline} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Content List */}
                  <ScrollView 
                    style={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* 第一条记录 */}
                    <View style={[styles.recordItem, styles.firstRecordItem]}>
                      <View style={styles.recordLeft}>
                        <Text style={styles.recordTitle}>
                          Gain de connexion quotidienne
                        </Text>
                        <Text style={styles.recordDate}>2024-01-15 14:30</Text>
                      </View>
                      <Text style={styles.recordAmount}>+20 FCFA</Text>
                    </View>
                    <View style={styles.divider} />

                    {/* 第二条记录 */}
                    <View style={styles.recordItem}>
                      <View style={styles.recordLeft}>
                        <Text style={styles.recordTitle}>
                          Gain de la roue
                        </Text>
                        <Text style={styles.recordDate}>2024-01-15 14:30</Text>
                      </View>
                      <Text style={styles.recordAmount}>+50 FCFA</Text>
                    </View>
                    <View style={styles.divider} />

                    {/* 第三条记录 */}
                    <View style={styles.recordItem}>
                      <View style={styles.recordLeft}>
                        <Text style={styles.recordTitle}>
                          Gain de connexion quotidienne
                        </Text>
                        <Text style={styles.recordDate}>2024-01-15 14:30</Text>
                      </View>
                      <Text style={styles.recordAmount}>+20 FCFA</Text>
                    </View>
                    <View style={styles.divider} />

                    {/* 第四条记录 */}
                    <View style={styles.recordItem}>
                      <View style={styles.recordLeft}>
                        <Text style={styles.recordTitle}>
                          Gain de la roue
                        </Text>
                        <Text style={styles.recordDate}>2024-01-15 14:30</Text>
                      </View>
                      <Text style={styles.recordAmount}>+50 FCFA</Text>
                    </View>
                    <View style={styles.divider} />

                    {/* 第五条记录 */}
                    <View style={[styles.recordItem, styles.lastRecordItem]}>
                      <View style={styles.recordLeft}>
                        <Text style={styles.recordTitle}>
                          Gain de connexion quotidienne
                        </Text>
                        <Text style={styles.recordDate}>2024-01-15 14:30</Text>
                      </View>
                      <Text style={styles.recordAmount}>+20 FCFA</Text>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  contentContainer: {
    alignItems: 'center',
  },
  modalContent: {
    width: 370,
    height: 444,
    position: 'relative',
  },
  mainBackground: {
    flex: 1,
    position: 'relative',
  },
  backgroundShape: {
    position: 'absolute',
    width: 370,
    height: 444,
    backgroundColor: '#FFF5DB',
    borderRadius: 20,
    // 添加阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'SF Pro Display',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    width: 20,
    height: 20,
  },
  innerContentContainer: {
    position: 'absolute',
    left: 16,
    top: 53,
    width: 338,
    height: 375,
  },
  contentBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    // 内容背景阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    height: 49,
    position: 'relative',
  },
  leftTabButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 158,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightTabButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 180,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'SF Pro Display',
  },
  leftTabText: {
    fontSize: 12,
    color: '#666666',
  },
  rightTabText: {
    fontSize: 14,
  },
  activeTabText: {
    fontWeight: '500',
    color: '#FF5100',
  },
  inactiveTabText: {
    color: '#666666',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 99,
    height: 2,
    backgroundColor: '#FF5100',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  firstRecordItem: {
    paddingTop: 20,
  },
  lastRecordItem: {
    paddingBottom: 20,
  },
  recordLeft: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'SF Pro Display',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 12,
    color: '#B6B6B6',
    fontFamily: 'SF Pro Display',
  },
  recordAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5100',
    fontFamily: 'SF Pro Display',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 0,
  },
});

export default RewardRulesModal;