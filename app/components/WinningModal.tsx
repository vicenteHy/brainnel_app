import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface WinningModalProps {
  visible: boolean;
  onClose: () => void;
  amount?: string;
  onContinue?: () => void;
}

const { width, height } = Dimensions.get('window');

export default function WinningModal({ visible, onClose, amount = '4,000 FCFA', onContinue }: WinningModalProps) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const handleContinue = () => {
    onClose();
    if (onContinue) {
      onContinue();
    }
    navigation.navigate('MiningGameScreen');
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.modalContent}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeIcon}>
              <Text style={styles.closeText}>×</Text>
            </View>
          </TouchableOpacity>

          {/* Header with wood texture */}
          <View style={styles.header}>
            <View style={styles.woodTexture}>
              <Text style={styles.headerText}>Tourne la roue et gagne du</Text>
              <Text style={styles.headerText}>cash gratuit !</Text>
              <Text style={styles.subHeaderText}>Clique et Gagne du Cash !</Text>
            </View>
          </View>

          {/* Main content */}
          <View style={styles.mainContent}>
            {/* Rays background */}
            <View style={styles.raysContainer}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.ray,
                    { transform: [{ rotate: `${i * 30}deg` }] },
                  ]}
                />
              ))}
            </View>

            {/* Euro coin */}
            <View style={styles.coinContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FFD700']}
                style={styles.coin}
              >
                <Text style={styles.euroSymbol}>€</Text>
              </LinearGradient>
            </View>

            {/* Amount banner */}
            <View style={styles.amountBanner}>
              <LinearGradient
                colors={['#FF6B6B', '#FF4757']}
                style={styles.bannerGradient}
              >
                <Text style={styles.amountText}>{amount}</Text>
              </LinearGradient>
            </View>

            {/* Success message */}
            <View style={styles.successMessage}>
              <Text style={styles.successText}>INCROYABLE ! Vous êtes le plus</Text>
              <Text style={styles.successText}>chanceux aujourd'hui !</Text>
            </View>

            {/* Continue button */}
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <LinearGradient
                colors={['#FF7F50', '#FF6347']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Continuer mon parcours</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Decorative palm trees */}
          <View style={styles.palmLeft} />
          <View style={styles.palmRight} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 380,
    backgroundColor: '#1E3A4C',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
  },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#8B6914',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#6B4F10',
  },
  woodTexture: {
    backgroundColor: '#D2B48C',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#A0826D',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C28',
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#B22222',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '600',
  },
  mainContent: {
    padding: 20,
    alignItems: 'center',
  },
  raysContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: 60,
  },
  ray: {
    position: 'absolute',
    width: 2,
    height: 100,
    backgroundColor: '#FFD700',
    opacity: 0.3,
    left: '50%',
    marginLeft: -1,
    transformOrigin: 'center bottom',
  },
  coinContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  coin: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  euroSymbol: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  amountBanner: {
    marginVertical: 20,
  },
  bannerGradient: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  successMessage: {
    marginVertical: 20,
  },
  successText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  continueButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#FF6347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  palmLeft: {
    position: 'absolute',
    left: -20,
    bottom: 100,
    width: 60,
    height: 100,
    backgroundColor: '#228B22',
    opacity: 0.3,
    borderRadius: 30,
    transform: [{ rotate: '-15deg' }],
  },
  palmRight: {
    position: 'absolute',
    right: -20,
    bottom: 100,
    width: 60,
    height: 100,
    backgroundColor: '#228B22',
    opacity: 0.3,
    borderRadius: 30,
    transform: [{ rotate: '15deg' }],
  },
});