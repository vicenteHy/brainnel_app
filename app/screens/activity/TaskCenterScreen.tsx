import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signIn, getSignInStatus, TaskItem as TaskData } from '../../services/api/activity';
import useActivityStore from '../../store/activityStore';

const { width: screenWidth } = Dimensions.get('window');

interface DayCheckInItemProps {
  day: number;
  amount: number;
  isCompleted: boolean;
  isActive: boolean;
  onPress: () => void;
  currentDay: number;
}

const DayCheckInItem: React.FC<DayCheckInItemProps> = ({ day, amount, isCompleted, isActive, onPress, currentDay }) => {
  const getBackgroundImage = () => {
    // 当天未完成签到
    if (day === currentDay && !isCompleted) {
      return require('../../../assets/img/sign1.png');
    }
    // 当天完成签到
    if (day === currentDay && isCompleted) {
      return require('../../../assets/img/sign2.png');
    }
    // 未来的签到
    if (day > currentDay) {
      return require('../../../assets/img/sign3.png');
    }
    // 过期的签到
    if (day < currentDay) {
      // 过期但已完成签到（灰色有打勾）
      if (isCompleted) {
        return require('../../../assets/img/sign5.png');
      }
      // 过期且未签到（灰色没有打勾）
      return require('../../../assets/img/sign4.png');
    }
    return require('../../../assets/img/sign3.png');
  };

  const getTextColor = () => {
    // 当天（无论是否完成）显示白色
    if (day === currentDay) return '#FFFFFF';
    // 其他情况显示灰色
    return '#B6B6B6';
  };

  const getRewardTextColor = () => {
    // 当天未完成显示橙色
    if (day === currentDay && !isCompleted) return '#FF5100';
    // 当天已完成显示白色
    if (day === currentDay && isCompleted) return '#FFFFFF';
    // 其他情况显示灰色
    return '#B6B6B6';
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.dayItem}>
      <ImageBackground
        source={getBackgroundImage()}
        style={styles.dayItemBg}
        resizeMode="contain"
      >
        <Text style={[styles.dayText, { color: getTextColor() }]}>Jour {day}</Text>
        {/* 分隔线可能不需要了，但先保留以防万一 */}
        {/* <View style={styles.dayDivider}>
          <View style={styles.dayDividerLeft} />
          <View style={styles.dayDividerRight} />
        </View> */}
        <Text style={[styles.dayReward, { color: getRewardTextColor() }]}>+{amount} FCFA</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
};

interface TaskItemProps {
  icon: any;
  title: string;
  description: string;
  reward: number;
  buttonText: string;
  onPress: () => void;
  status?: number; // 0: 待完成, 1: 已完成待领取, 2: 已完成已领取
}

const TaskItem: React.FC<TaskItemProps> = ({
  icon,
  title,
  description,
  reward,
  buttonText,
  onPress,
  status = 0,
}) => {
  const getButtonStyle = () => {
    switch (status) {
      case 0: // 待完成
        return styles.taskButton;
      case 1: // 已完成待领取
        return [styles.taskButton, styles.taskButtonReadyToClaim];
      case 2: // 已完成已领取
        return [styles.taskButton, styles.taskButtonClaimed];
      default:
        return styles.taskButton;
    }
  };

  const getButtonTextStyle = () => {
    switch (status) {
      case 0: // 待完成
        return styles.taskButtonText;
      case 1: // 已完成待领取
        return [styles.taskButtonText, styles.taskButtonTextReadyToClaim];
      case 2: // 已完成已领取
        return [styles.taskButtonText, styles.taskButtonTextClaimed];
      default:
        return styles.taskButtonText;
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 0: // 待完成
        return 'Compléter';
      case 1: // 已完成待领取
        return 'Réclamer';
      case 2: // 已完成已领取
        return 'Réclamé';
      default:
        return buttonText;
    }
  };
  
  return (
    <ImageBackground
      source={icon}
      style={styles.taskItem}
      resizeMode="cover"
    >
      <View style={styles.taskContent}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={onPress}
          disabled={status === 2}
        >
          <Text style={getButtonTextStyle()}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const TaskCenterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [checkInDays, setCheckInDays] = useState([
    { day: 1, completed: false },
    { day: 2, completed: false },
    { day: 3, completed: false },
    { day: 4, completed: false },
    { day: 5, completed: false },
  ]);
  const [currentDay, setCurrentDay] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 使用 activity store
  const { tasks, fetchTasks, getTaskStatus: getTaskStatusFromStore, reportTaskClaimed } = useActivityStore();

  // 加载签到状态
  const loadSignInStatus = async () => {
    try {
      const status = await getSignInStatus();
      console.log('签到状态:', status);
      
      // 更新签到天数
      if (status.sign_ins && status.sign_ins.length > 0) {
        const updatedDays = status.sign_ins.map((item, index) => ({
          day: index + 1,
          completed: item.is_check_in
        }));
        setCheckInDays(updatedDays);
        
        // 计算当前应该签到的天数
        const today = new Date(status.today);
        const firstDay = new Date(status.sign_ins[0].sign_in_date);
        const dayDiff = Math.floor((today.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // 找到今天对应的签到日期
        const todayIndex = status.sign_ins.findIndex(item => item.sign_in_date === status.today);
        if (todayIndex !== -1) {
          // 设置当前天数为今天（无论是否已签到）
          setCurrentDay(todayIndex + 1);
        } else {
          // 如果找不到今天，则设置为第一个未签到的天数
          const nextUncheckedIndex = status.sign_ins.findIndex(item => !item.is_check_in);
          setCurrentDay(nextUncheckedIndex === -1 ? 5 : nextUncheckedIndex + 1);
        }
      }
    } catch (error) {
      console.error('加载签到状态失败:', error);
    }
  };

  // 加载任务列表
  const loadTasks = async () => {
    try {
      await fetchTasks();
    } catch (error) {
      console.error('加载任务列表失败:', error);
    }
  };

  useEffect(() => {
    loadSignInStatus();
    loadTasks();
  }, []);

  const handleCheckIn = async () => {
    // 检查当天是否已签到
    if (checkInDays[currentDay - 1].completed) {
      Alert.alert(t('提示'), t('今日已签到'));
      return;
    }

    if (loading) return;
    
    setLoading(true);
    try {
      // 调用签到API
      await signIn();
      
      // 重新加载签到状态
      await loadSignInStatus();
      
      Alert.alert(t('签到成功'), t(`您已获得 2 FCFA！`));
    } catch (error) {
      console.error('签到失败:', error);
      Alert.alert(t('错误'), t('签到失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = (taskId: number) => {
    switch (taskId) {
      case 1: // 图搜
      case 2: // 文本搜索
        navigation.navigate('SearchResult' as any);
        break;
      case 3: // 加购
        navigation.navigate('Home' as any);
        break;
      case 4: // 添加地址
        navigation.navigate('AddAddress' as any);
        break;
      case 5: // 下单
        navigation.navigate('Home' as any);
        break;
      default:
        Alert.alert(t('提示'), t('功能即将开放'));
    }
  };

  const isSignedInToday = checkInDays[currentDay - 1]?.completed || false;

  // 根据task_id获取任务状态
  const getTaskStatus = (taskId: number): number => {
    return getTaskStatusFromStore(taskId);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 背景 */}
      <Image 
        source={require('../../../assets/img/img_6271.svg')} 
        style={styles.backgroundImage}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 顶部背景 */}
        <ImageBackground
          source={require('../../../assets/img/headerBg.png')}
          style={styles.headerBg}
          resizeMode="cover"
        >
          {/* 导航栏 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Centre des Missions</Text>
            <View style={styles.headerRight}>
              <Text style={styles.rulesText}>Règles</Text>
              <Text style={styles.separator}> ｜ </Text>
              <Text style={styles.detailsText}>Détails</Text>
            </View>
          </View>
        </ImageBackground>

        {/* 每日签到卡片 */}
        <View style={styles.checkInCard}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../../assets/img/iconCalendar.png')}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Connexion quotidienne</Text>
            <Text style={styles.dailyReward}>+2 FCFA par jour</Text>
          </View>

          {/* 签到天数 */}
          <View style={styles.checkInDays}>
            {checkInDays.map((item, index) => (
              <DayCheckInItem
                key={index}
                day={item.day}
                amount={2}
                isCompleted={item.completed}
                isActive={item.day === currentDay && !item.completed}
                onPress={() => {
                  if (item.day === currentDay && !item.completed && !loading) {
                    handleCheckIn();
                  }
                }}
                currentDay={currentDay}
              />
            ))}
          </View>

          {/* 签到进度和按钮 */}
          <View style={styles.checkInFooter}>
            <Text style={styles.checkInProgress}>
              <Text style={styles.checkInProgressHighlight}>{checkInDays.filter(d => d.completed).length}</Text>
              <Text style={styles.checkInProgressText}>/5 complété</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.checkInButton,
                isSignedInToday && styles.checkInButtonCompleted
              ]}
              onPress={handleCheckIn}
              disabled={isSignedInToday || currentDay > 5 || loading}
            >
              <Text style={[
                styles.checkInButtonText,
                isSignedInToday && styles.checkInButtonTextCompleted
              ]}>
                {loading ? 'Chargement...' : (isSignedInToday ? 'Complété' : 'Se connecter')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 高价值任务卡片 */}
        <View style={styles.tasksCard}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../../assets/img/iconTask.png')}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Tâches de grande valeur</Text>
          </View>
          
          {/* 横线分隔 */}
          <View style={styles.divider} />

          <View style={styles.tasksList}>
            <TaskItem
              icon={require('../../../assets/img/searchByImage.png')}
              title="Recherche par image"
              description="Search for products using images to discover what you want"
              reward={20}
              buttonText=""
              status={getTaskStatus(1)}
              onPress={async () => {
                const status = getTaskStatus(1);
                if (status === 1) {
                  // 领取奖励
                  await reportTaskClaimed(1);
                  Alert.alert(t('成功'), t('奖励领取成功'));
                } else if (status === 0) {
                  handleTaskAction(1);
                }
              }}
            />

            <TaskItem
              icon={require('../../../assets/img/searchByText.png')}
              title="Recherche par texte"
              description="Search for any product using keywords"
              reward={20}
              buttonText=""
              status={getTaskStatus(2)}
              onPress={async () => {
                const status = getTaskStatus(2);
                if (status === 1) {
                  // 领取奖励
                  await reportTaskClaimed(2);
                  Alert.alert(t('成功'), t('奖励领取成功'));
                } else if (status === 0) {
                  handleTaskAction(2);
                }
              }}
            />

            <TaskItem
              icon={require('../../../assets/img/addToCart.png')}
              title="Ajouter au panier"
              description="Add any product to your shopping cart"
              reward={50}
              buttonText=""
              status={getTaskStatus(3)}
              onPress={async () => {
                const status = getTaskStatus(3);
                if (status === 1) {
                  // 领取奖励
                  await reportTaskClaimed(3);
                  Alert.alert(t('成功'), t('奖励领取成功'));
                } else if (status === 0) {
                  handleTaskAction(3);
                }
              }}
            />

            <TaskItem
              icon={require('../../../assets/img/deliveryAddress.png')}
              title="Enregistrer l'adresse de livraison"
              description="Fill in and save your delivery address"
              reward={30}
              buttonText=""
              status={getTaskStatus(4)}
              onPress={async () => {
                const status = getTaskStatus(4);
                if (status === 1) {
                  // 领取奖励
                  await reportTaskClaimed(4);
                  Alert.alert(t('成功'), t('奖励领取成功'));
                } else if (status === 0) {
                  handleTaskAction(4);
                }
              }}
            />

            <TaskItem
              icon={require('../../../assets/img/placeOrder.png')}
              title="Passer une commande"
              description="Complete your first order (50,000 FCFA)"
              reward={100}
              buttonText=""
              status={getTaskStatus(5)}
              onPress={async () => {
                const status = getTaskStatus(5);
                if (status === 1) {
                  // 领取奖励
                  await reportTaskClaimed(5);
                  Alert.alert(t('成功'), t('奖励领取成功'));
                } else if (status === 0) {
                  handleTaskAction(5);
                }
              }}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: 980,
    top: 0,
    left: 0,
  },
  content: {
    flex: 1,
  },
  headerBg: {
    width: screenWidth,
    height: 191,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulesText: {
    fontSize: 14,
    color: '#AE8623',
  },
  separator: {
    color: '#AE8623',
    fontSize: 14,
  },
  detailsText: {
    fontSize: 14,
    color: '#AE8623',
  },
  checkInCard: {
    marginHorizontal: 17,
    marginTop: -81,
    backgroundColor: '#FFF5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  dailyReward: {
    fontSize: 14,
    color: '#666',
  },
  checkInDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayItem: {
    alignItems: 'center',
  },
  dayItemBg: {
    width: 65,
    height: 84,
    alignItems: 'center',
    paddingTop: 5,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '400',
  },
  dayDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayDividerLeft: {
    width: 11,
    height: 2,
    backgroundColor: '#FFF',
    marginRight: 15,
  },
  dayDividerRight: {
    width: 11,
    height: 2,
    backgroundColor: '#FFF',
    marginLeft: 15,
  },
  dayReward: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 38,
  },
  checkInFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInProgress: {
    fontSize: 16,
  },
  checkInProgressHighlight: {
    color: '#FF5100',
    fontWeight: '500',
  },
  checkInProgressText: {
    color: '#666',
  },
  checkInButton: {
    width: 104,
    height: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInButtonDisabled: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5100',
  },
  checkInButtonTextDisabled: {
    color: '#999',
  },
  checkInButtonCompleted: {
    width: 104,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInButtonTextCompleted: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  tasksCard: {
    marginHorizontal: 17,
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tasksList: {
    marginTop: -6,
  },
  taskItem: {
    height: 92,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  taskContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 20,
  },
  taskButton: {
    width: 104,
    height: 32,
    backgroundColor: '#FFEDE5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskButtonCompleted: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF5100',
  },
  taskButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5100',
  },
  taskButtonTextCompleted: {
    color: '#FF5100',
  },
  taskButtonLogin: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF5100',
  },
  taskButtonTextLogin: {
    color: '#FF5100',
  },
  divider: {
    height: 1,
    backgroundColor: '#F6F6F6',
    marginBottom: 16,
  },
  taskButtonClaimed: {
    backgroundColor: '#B6B6B6',
    borderColor: '#B6B6B6',
  },
  taskButtonTextClaimed: {
    color: '#FFF',
  },
  taskButtonReadyToClaim: {
    backgroundColor: '#FF5100',
    borderColor: '#FF5100',
  },
  taskButtonTextReadyToClaim: {
    color: '#FFF',
  },
});

export default TaskCenterScreen;