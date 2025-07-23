import React from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { navigationRef } from '../../navigation/AppNavigator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const modalWidth = screenWidth * 0.85;
const modalHeight = screenHeight * 0.42;

interface TaskCompleteModalProps {
  visible: boolean;
  onClose: () => void;
  taskTitle?: string;
  reward?: string;
  onNavigate?: () => void;
}

const TaskCompleteModal: React.FC<TaskCompleteModalProps> = ({
  visible,
  onClose,
  taskTitle = 'Enregistrer l\'adressede livraison',
  reward = '+30 FCFA',
  onNavigate,
}) => {
  // 尝试使用 useNavigation，如果失败则使用 navigationRef 或 onNavigate
  let navigation: any;
  try {
    navigation = useNavigation<any>();
  } catch (error) {
    // 在 NavigationContainer 外部时会抛出错误
    navigation = null;
  }

  const handleConsult = () => {
    onClose();
    
    if (onNavigate) {
      onNavigate();
    } else if (navigation) {
      navigation.navigate('TaskCenter');
    } else if (navigationRef.isReady()) {
      navigationRef.navigate('TaskCenter' as never);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ImageBackground
            source={require('../../../assets/img/task-complete-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.congratsText}>
              Félicitations ! Vous avez accompli la mission
            </Text>

            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{taskTitle}</Text>
              <Text style={styles.taskReward}>
                et gagné <Text style={styles.rewardAmount}>{reward}</Text> !
              </Text>
            </View>

            <TouchableOpacity style={styles.consultButton} onPress={handleConsult}>
              <Text style={styles.consultButtonText}>Consulter</Text>
            </TouchableOpacity>
          </ImageBackground>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: modalWidth,
    height: modalHeight,
    borderRadius: screenWidth * 0.047, // 20px on 430px screen
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    alignItems: 'center',
    paddingTop: screenHeight * 0.018, // 减小顶部内边距
    paddingHorizontal: screenWidth * 0.047,
    paddingBottom: screenHeight * 0.02, // 减小底部内边距
  },
  closeButton: {
    position: 'absolute',
    top: screenHeight * 0.016, // 15px on 932px screen
    right: screenWidth * 0.035, // 15px on 430px screen
    width: screenWidth * 0.074, // 32px on 430px screen
    height: screenWidth * 0.074,
    borderRadius: screenWidth * 0.037,
    backgroundColor: '#FFFFFFE6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  congratsText: {
    fontSize: screenWidth * 0.037, // 16px on 430px screen
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: screenHeight * 0.18, // 减小顶部间距
    marginBottom: screenHeight * 0.01,
    paddingHorizontal: screenWidth * 0.05,
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.025, // 减小间距
  },
  taskTitle: {
    fontSize: screenWidth * 0.037,
    color: '#FF5722',
    fontWeight: '500',
    marginBottom: screenHeight * 0.0054,
  },
  taskReward: {
    fontSize: screenWidth * 0.037,
    color: '#333',
  },
  rewardAmount: {
    color: '#FF5722',
    fontWeight: '600',
  },
  consultButton: {
    backgroundColor: '#FF5722',
    paddingVertical: screenHeight * 0.016, // 减小垂直内边距
    paddingHorizontal: screenWidth * 0.14, // 60px on 430px screen
    borderRadius: screenWidth * 0.058, // 25px on 430px screen
    marginTop: 'auto',
    marginBottom: screenHeight * 0.03, // 减小底部间距
  },
  consultButtonText: {
    color: '#FFF',
    fontSize: screenWidth * 0.042, // 18px on 430px screen
    fontWeight: '600',
  },
});

export default TaskCompleteModal;