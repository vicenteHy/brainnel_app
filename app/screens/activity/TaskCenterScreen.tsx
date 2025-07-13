import React, { useState } from 'react';
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

const { width: screenWidth } = Dimensions.get('window');

interface DayCheckInItemProps {
  day: number;
  amount: number;
  isCompleted: boolean;
  isActive: boolean;
  onPress: () => void;
}

const DayCheckInItem: React.FC<DayCheckInItemProps> = ({ day, amount, isCompleted, isActive, onPress }) => {
  const getBackgroundImage = () => {
    if (isCompleted) return require('../../../assets/img/dayBgCompleted.png');
    if (isActive) return require('../../../assets/img/dayBgActive.png');
    return require('../../../assets/img/dayBgGray.png');
  };

  const getTextColor = () => {
    if (isCompleted) return '#B6B6B6';
    if (isActive) return '#FFFFFF';
    return '#B6B6B6';
  };

  const getRewardTextColor = () => {
    if (isCompleted) return '#B6B6B6';
    if (isActive) return '#FF5100';
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
        <View style={styles.dayDivider}>
          <View style={styles.dayDividerLeft} />
          <View style={styles.dayDividerRight} />
        </View>
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
  isCompleted?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  icon,
  title,
  description,
  reward,
  buttonText,
  onPress,
  isCompleted = false,
}) => {
  const isLoginButton = buttonText === "Se connecter";
  
  return (
    <ImageBackground
      source={icon}
      style={styles.taskItem}
      resizeMode="cover"
    >
      <View style={styles.taskContent}>
        <TouchableOpacity
          style={[
            styles.taskButton,
            isLoginButton && styles.taskButtonLogin,
            isCompleted && styles.taskButtonCompleted
          ]}
          onPress={onPress}
        >
          <Text style={[
            styles.taskButtonText,
            isLoginButton && styles.taskButtonTextLogin,
            isCompleted && styles.taskButtonTextCompleted
          ]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const TaskCenterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [checkInDays, setCheckInDays] = useState([
    { day: 1, completed: true },
    { day: 2, completed: true },
    { day: 3, completed: true },
    { day: 4, completed: false },
    { day: 5, completed: false },
  ]);
  const [currentDay, setCurrentDay] = useState(3);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleCheckIn = () => {
    if (currentDay >= 5) {
      Alert.alert(t('提示'), t('已完成所有签到'));
      return;
    }

    const nextDay = currentDay + 1;
    const newCheckInDays = [...checkInDays];
    newCheckInDays[nextDay - 1].completed = true;
    setCheckInDays(newCheckInDays);
    setCurrentDay(nextDay);

    Alert.alert(t('签到成功'), t(`您已获得 2 FCFA！`));
  };

  const handleTaskAction = (taskName: string) => {
    Alert.alert(t('提示'), t(`${taskName} 功能即将开放`));
  };

  const isSignedInToday = checkInDays[currentDay - 1]?.completed || false;

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
                isActive={item.day === currentDay + 1 && !item.completed}
                onPress={() => {}}
              />
            ))}
          </View>

          {/* 签到进度和按钮 */}
          <View style={styles.checkInFooter}>
            <Text style={styles.checkInProgress}>
              <Text style={styles.checkInProgressHighlight}>{currentDay}</Text>
              <Text style={styles.checkInProgressText}>/5 complété</Text>
            </Text>
            <TouchableOpacity
              style={styles.checkInButtonCompleted}
              onPress={handleCheckIn}
              disabled={true}
            >
              <Text style={styles.checkInButtonTextCompleted}>
                Complété
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

          <View style={styles.tasksList}>
            <TaskItem
              icon={require('../../../assets/img/searchByImage.png')}
              title="Recherche par image"
              description="Search for products using images to discover what you want"
              reward={20}
              buttonText={isLoggedIn ? "Compléter" : "Se connecter"}
              onPress={() => {
                if (!isLoggedIn) {
                  Alert.alert(t('提示'), t('请先登录'));
                } else {
                  handleTaskAction('Recherche par image');
                }
              }}
              isCompleted={false}
            />

            <TaskItem
              icon={require('../../../assets/img/searchByText.png')}
              title="Recherche par texte"
              description="Search for any product using keywords"
              reward={20}
              buttonText="Compléter"
              onPress={() => handleTaskAction('Recherche par texte')}
              isCompleted={false}
            />

            <TaskItem
              icon={require('../../../assets/img/addToCart.png')}
              title="Ajouter au panier"
              description="Add any product to your shopping cart"
              reward={50}
              buttonText="Compléter"
              onPress={() => handleTaskAction('Ajouter au panier')}
              isCompleted={false}
            />

            <TaskItem
              icon={require('../../../assets/img/deliveryAddress.png')}
              title="Enregistrer l'adresse de livraison"
              description="Fill in and save your delivery address"
              reward={30}
              buttonText="Compléter"
              onPress={() => handleTaskAction('Enregistrer l\'adresse')}
              isCompleted={false}
            />

            <TaskItem
              icon={require('../../../assets/img/placeOrder.png')}
              title="Passer une commande"
              description="Complete your first order (50,000 FCFA)"
              reward={100}
              buttonText="Compléter"
              onPress={() => handleTaskAction('Passer une commande')}
              isCompleted={false}
            />
          </View>
        </View>

        {/* 底部大奖励卡片 */}
        <Image
          source={require('../../../assets/img/rewardBgLarge.png')}
          style={styles.rewardCard}
          resizeMode="contain"
        />
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
    backgroundColor: '#FF5100',
    borderRadius: 16,
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
    color: '#FFF',
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
  rewardCard: {
    width: screenWidth - 34,
    height: 107,
    marginHorizontal: 17,
    marginTop: 16,
    marginBottom: 30,
  },
});

export default TaskCenterScreen;