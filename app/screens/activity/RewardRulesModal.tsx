import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { getInvitations, InvitationRecord, GameLog, getGameLogs } from '../../services/api/activity';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


interface RewardRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

const RewardRulesModal: React.FC<RewardRulesModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'records'>('records');
  const [invitationRecords, setInvitationRecords] = useState<InvitationRecord[]>([]);
  const [gameRecords, setGameRecords] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
      
      // 根据当前标签加载对应数据
      if (activeTab === 'history') {
        loadGameRecords();
      } else if (activeTab === 'records') {
        loadInvitationRecords();
      }
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (activeTab === 'history') {
        loadGameRecords();
      } else if (activeTab === 'records') {
        loadInvitationRecords();
      }
    }
  }, [activeTab, visible]);

  const loadInvitationRecords = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await getInvitations();
      setInvitationRecords(response.invitations);
      setHasMore(false);
    } catch (error) {
      console.error('加载邀请记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameRecords = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await getGameLogs(1, 100);
      setGameRecords(response.items);
      setHasMore(response.items.length === 100);
    } catch (error) {
      console.error('加载游戏记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

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


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.modalContent, contentAnimatedStyle]}>
            {/* 主背景 - 米色背景 */}
            <View style={styles.backgroundShape}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Détails</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* 内容容器 */}
              <View style={styles.innerContentContainer}>
                <View style={styles.contentWrapper}>
                  {/* Tabs with SVG */}
                  <View style={styles.tabContainer}>
                    <Svg 
                      width="338" 
                      height="49" 
                      viewBox="0 0 338 49" 
                      style={StyleSheet.absoluteFill}
                    >
                      {/* 左侧标签 - 使用更清晰的重叠设计实现切线反转 */}
                      <Path
                        d={activeTab === 'history' ? 
                          "M 15 0 L 170 0 L 155 49 L 15 49 Q 0 49 0 34 L 0 15 Q 0 0 15 0" : 
                          "M 15 0 L 170 0 L 145 49 L 15 49 Q 0 49 0 34 L 0 15 Q 0 0 15 0"
                        }
                        fill={activeTab === 'history' ? '#FFFFFF' : '#F6F6F6'}
                      />
                      {/* 右侧标签 - 使用对称的切线设计 */}
                      <Path
                        d={activeTab === 'records' ? 
                          "M 323 0 L 168 0 L 183 49 L 323 49 Q 338 49 338 34 L 338 15 Q 338 0 323 0" : 
                          "M 323 0 L 168 0 L 193 49 L 323 49 Q 338 49 338 34 L 338 15 Q 338 0 323 0"
                        }
                        fill={activeTab === 'records' ? '#FFFFFF' : '#F6F6F6'}
                      />
                    </Svg>
                    
                    {/* 左侧标签内容 */}
                    <TouchableOpacity
                      style={[styles.leftTabButton, activeTab === 'history' && styles.activeTabButton]}
                      onPress={() => setActiveTab('history')}
                    >
                      <Text style={[
                        styles.tabText,
                        styles.leftTabText,
                        activeTab === 'history' ? styles.activeTabText : styles.inactiveTabText
                      ]}>
                        Historique d'aide
                      </Text>
                      {activeTab === 'history' && (
                        <View style={styles.tabUnderline} />
                      )}
                    </TouchableOpacity>
                    
                    {/* 右侧标签内容 */}
                    <TouchableOpacity
                      style={[styles.rightTabButton, activeTab === 'records' && styles.activeTabButton]}
                      onPress={() => setActiveTab('records')}
                    >
                      <Text style={[
                        styles.tabText,
                        styles.rightTabText,
                        activeTab === 'records' ? styles.activeTabText : styles.inactiveTabText
                      ]}>
Invitations
                      </Text>
                      {activeTab === 'records' && (
                        <View style={styles.tabUnderline} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Content List */}
                  <View style={styles.scrollViewWrapper}>
                    {activeTab === 'history' ? (
                      <ScrollView 
                        style={styles.scrollContent}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        scrollEventThrottle={16}
                        bounces={true}
                        alwaysBounceVertical={Platform.OS === 'ios'}
                        removeClippedSubviews={false}
                      >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#FF5100" />
                        </View>
                      ) : gameRecords.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>Aucun enregistrement</Text>
                        </View>
                      ) : (
                        gameRecords.map((record, index) => (
                          <React.Fragment key={record.log_id}>
                            <View style={[
                              styles.recordItem,
                              index === 0 && styles.firstRecordItem,
                              index === gameRecords.length - 1 && styles.lastRecordItem
                            ]}>
                              <View style={styles.recordLeft}>
                                <Text style={styles.recordTitle}>
                                  Récompense de minage
                                </Text>
                              </View>
                              <View style={styles.recordRight}>
                                <Text style={styles.recordAmount}>
                                  +{record.reward_earned} {record.reward_type === 0 ? 'FCFA' : parseFloat(record.reward_earned) > 1 ? 'Masques' : 'Masque'}
                                </Text>
                                <Text style={[styles.recordDate, styles.recordDateRight]}>
                                  {formatDate(record.play_time)}
                                </Text>
                              </View>
                            </View>
                            {index < gameRecords.length - 1 && <View style={styles.divider} />}
                          </React.Fragment>
                        ))
                      )}
                      </ScrollView>
                    ) : (
                      <ScrollView 
                        style={styles.scrollContent}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        scrollEventThrottle={16}
                        bounces={true}
                        alwaysBounceVertical={Platform.OS === 'ios'}
                        removeClippedSubviews={false}
                      >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#FF5100" />
                        </View>
                      ) : invitationRecords.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>Aucun enregistrement</Text>
                        </View>
                      ) : (
                        invitationRecords.map((record, index) => (
                          <React.Fragment key={record.invitation_id}>
                            <View style={[
                              styles.recordItem,
                              index === 0 && styles.firstRecordItem,
                              index === invitationRecords.length - 1 && styles.lastRecordItem
                            ]}>
                              <View style={styles.recordLeft}>
                                <Text style={styles.recordTitle}>
                                  User {record.invitee.user_id} t'a aidé
                                </Text>
                              </View>
                              <View style={styles.recordRight}>
                                <Text style={styles.recordAmount}>
                                  Partie +1
                                </Text>
                                <Text style={[styles.recordDate, styles.recordDateRight]}>
                                  {formatDate(record.invite_date)}
                                </Text>
                              </View>
                            </View>
                            {index < invitationRecords.length - 1 && <View style={styles.divider} />}
                          </React.Fragment>
                        ))
                      )}
                      </ScrollView>
                    )}
                  </View>
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
    position: 'absolute',
    alignItems: 'center',
  },
  modalContent: {
    width: 370,
    height: 444,
  },
  backgroundShape: {
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
    marginTop: 53,
    marginHorizontal: 16,
    flex: 1,
    marginBottom: 16,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
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
  activeTabButton: {
    zIndex: 1,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 99,
    height: 2,
    backgroundColor: '#FF5100',
  },
  scrollViewWrapper: {
    flex: 1,
    ...Platform.select({
      android: {
        height: 326, // 375 - 49 (tab height)
      },
    }),
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    flexGrow: 1,
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
  recordRight: {
    alignItems: 'flex-end',
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
  recordDateRight: {
    marginTop: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'SF Pro Display',
  },
});

export default RewardRulesModal;