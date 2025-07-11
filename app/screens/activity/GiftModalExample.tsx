import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import GiftModal from './GiftModal';

const GiftModalExample: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenGift = () => {
    setModalVisible(false);
    // 这里添加打开礼品的逻辑
    Alert.alert(
      '恭喜！',
      '您已成功打开礼品盒！',
      [
        { text: '确定', onPress: () => console.log('礼品已打开') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>显示礼品弹窗</Text>
      </TouchableOpacity>

      <GiftModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOpen={handleOpenGift}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GiftModalExample;