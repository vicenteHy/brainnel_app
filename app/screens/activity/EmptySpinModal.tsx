import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EmptySpinModalProps {
  visible: boolean;
  onClose: () => void;
}

const EmptySpinModal: React.FC<EmptySpinModalProps> = ({ visible, onClose }) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
    } else {
      fadeAnim.value = 0;
      scaleAnim.value = 0.8;
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

  const handleOkPress = () => {
    fadeAnim.value = withTiming(0, { duration: 200 }, () => {
      'worklet';
      runOnJS(onClose)();
    });
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={() => {}}
        />
        
        <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.imageContainer, contentAnimatedStyle]}>
            <Image
              source={require('../../assets/emptySpinModal/modal_bg.png')}
              style={styles.modalImage}
              resizeMode="contain"
            />
            
            <TouchableOpacity
              style={styles.okButton}
              onPress={handleOkPress}
              activeOpacity={0.8}
            />
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
    backgroundColor: '#00000099',
  },
  contentContainer: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  modalImage: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9 * 1.5,
    maxWidth: 430,
    maxHeight: 645,
  },
  okButton: {
    position: 'absolute',
    bottom: 25,
    left: '20%',
    right: '20%',
    height: 55,
    backgroundColor: 'transparent',
  },
});

export default EmptySpinModal;