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

const { width: screenWidth } = Dimensions.get('window');
const modalWidth = screenWidth * 0.85;

interface TaskCompleteModalProps {
  visible: boolean;
  onClose: () => void;
  taskTitle?: string;
  reward?: string;
}

const TaskCompleteModal: React.FC<TaskCompleteModalProps> = ({
  visible,
  onClose,
  taskTitle = 'Enregistrer l\'adressede livraison',
  reward = '+30 FCFA',
}) => {
  const navigation = useNavigation<any>();

  const handleConsult = () => {
    onClose();
    navigation.navigate('TaskCenter');
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: modalWidth,
    height: modalWidth * 1.1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  congratsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 140,
    marginBottom: 10,
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  taskTitle: {
    fontSize: 16,
    color: '#FF5722',
    fontWeight: '500',
    marginBottom: 5,
  },
  taskReward: {
    fontSize: 16,
    color: '#333',
  },
  rewardAmount: {
    color: '#FF5722',
    fontWeight: '600',
  },
  consultButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginTop: 'auto',
  },
  consultButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TaskCompleteModal;