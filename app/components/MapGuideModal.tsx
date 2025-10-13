import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
  Text,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface MapGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MapGuideModal({ visible, onClose }: MapGuideModalProps) {
  const fingerAnim = useRef(new Animated.Value(0)).current;
  const pointScale = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fingerOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      fingerAnim.setValue(0);
      pointScale.setValue(0);
      fingerOpacityAnim.setValue(1);

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(fingerAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(800),
            Animated.parallel([
              Animated.spring(pointScale, {
                toValue: 1,
                tension: 50,
                friction: 6,
                useNativeDriver: true,
              }),
              Animated.timing(fingerOpacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]).start();
    }
  }, [visible, fadeAnim, fingerAnim, pointScale, fingerOpacityAnim]);

  const fingerTranslateY = fingerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 20, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.mapContainer}>
            <Image
              source={require('../../assets/guide/map.png')}
              style={styles.mapImage}
              resizeMode="contain"
            />

            <Animated.View
              style={[
                styles.fingerContainer,
                {
                  opacity: fingerOpacityAnim,
                  transform: [{ translateY: fingerTranslateY }],
                },
              ]}
            >
              <Image
                source={require('../../assets/guide/finger.png')}
                style={styles.fingerImage}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.pointContainer,
                {
                  transform: [{ scale: pointScale }],
                },
              ]}
            >
              <Image
                source={require('../../assets/guide/point.png')}
                style={styles.pointImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>Choisissez votre position sur la carte</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.92,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  fingerContainer: {
    position: 'absolute',
    bottom: '35%',
    right: '30%',
  },
  fingerImage: {
    width: 60,
    height: 60,
  },
  pointContainer: {
    position: 'absolute',
    bottom: '42%',
    right: '38%',
  },
  pointImage: {
    width: 50,
    height: 50,
  },
  tipContainer: {
    marginTop: 24,
    backgroundColor: '#FF5100',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});
