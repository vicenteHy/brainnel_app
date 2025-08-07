import React from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  ImageBackground, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar,
  Text
} from 'react-native';
import { size } from '../../utils/size';
import fontSize from '../../utils/fontsizeUtils';

interface WinningModalProps {
  visible: boolean;
  prizeType: 'free' | 'halfPrice' | 'coin' | null;
  onClose: () => void;
}

const WinningModal: React.FC<WinningModalProps> = ({ visible, prizeType, onClose }) => {
  if (!prizeType) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" translucent barStyle="light-content" />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <ImageBackground
                source={require('../../../assets/activity_2/winning_popup.png')}
                style={styles.backgroundImage}
                resizeMode="contain"
              >
                
                {/* 奖品图片展示区域 */}
                <View style={styles.prizeContainer}>
                  <ImageBackground
                    source={
                      prizeType === 'free' 
                        ? require('../../../assets/activity_2/free_product_with_frame.png')
                        : prizeType === 'halfPrice'
                        ? require('../../../assets/activity_2/half_price_with_frame.png')
                        : require('../../../assets/activity_2/coin.png')
                    }
                    style={styles.prizeImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.prizeText}>
                    {prizeType === 'free' 
                      ? "Vous avez gagné un article gratuit au choix. Allez le choisir dans notre sélection !"
                      : prizeType === 'halfPrice'
                      ? "Vous avez gagné 50% de réduction sur l'article de votre choix. Allez le choisir dans notre sélection!"
                      : "Vous avez gagné 1000 FCFA ! Le montant a été crédité directement DANS votre portefeuille."}
                  </Text>
                </View>
                
                {/* 按钮区域 - 左右两个按钮 */}
                <View style={styles.buttonsContainer}>
                  {/* 左边关闭按钮 */}
                  <TouchableOpacity 
                    style={styles.leftButton}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={require('../../../assets/activity_2/close.png')}
                      style={styles.buttonImage}
                      resizeMode="contain"
                    >
                      <Text style={styles.leftButtonText}>PLUS TARD</Text>
                    </ImageBackground>
                  </TouchableOpacity>
                  
                  {/* 右边接受按钮 */}
                  <TouchableOpacity 
                    style={styles.rightButton}
                    onPress={() => {
                      // 这里可以添加领取奖品的逻辑
                      console.log('领取奖品:', prizeType);
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={require('../../../assets/activity_2/action.png')}
                      style={styles.buttonImage}
                      resizeMode="contain"
                    >
                      <Text style={styles.buttonText}>ACCEPTER</Text>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: size.w(342),
    height: size.h(450),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    width: size.w(342),
    height: size.h(450),
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeContainer: {
    position: 'absolute',
    top: size.h(130),
    width: size.w(280),
    height: size.h(180),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  prizeImage: {
    width: size.w(80),
    height: size.h(80),
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: size.h(30),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: size.w(280),
    zIndex: 3,
  },
  leftButton: {
    width: size.w(130),
    height: size.h(50),
    marginRight: size.w(10),
  },
  rightButton: {
    width: size.w(130),
    height: size.h(50),
    marginLeft: size.w(10),
  },
  buttonImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeText: {
    marginTop: size.h(10),
    paddingHorizontal: size.w(10),
    fontSize: fontSize(15),
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
    width: size.w(260),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSize(14),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: size.h(5),
  },
  leftButtonText: {
    color: '#000000',
    fontSize: fontSize(14),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: size.h(5),
  },
});

export default WinningModal;