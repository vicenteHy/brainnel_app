import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WaveWithdrawalModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (phoneNumber: string) => void;
}

const WaveWithdrawalModal: React.FC<WaveWithdrawalModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryList, setShowCountryList] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: "Côte d'Ivoire",
    code: '+225',
    flag: require('../../../assets/img/withdrawal/wave/ct.png')
  });

  const countries = [
    {
      name: "Côte d'Ivoire",
      code: '+225',
      flag: require('../../../assets/img/withdrawal/wave/ct.png')
    },
    {
      name: 'Burkina Faso',
      code: '+226',
      flag: require('../../../assets/img/withdrawal/wave/bk.png')
    },
    {
      name: 'Sénégal',
      code: '+221',
      flag: require('../../../assets/img/withdrawal/wave/senegal.png')
    },
    {
      name: 'Mali',
      code: '+223',
      flag: require('../../../assets/img/withdrawal/wave/mali.png')
    }
  ];

  const handleConfirm = () => {
    if (phoneNumber.trim()) {
      const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;
      onConfirm(fullPhoneNumber);
    }
  };

  const selectCountry = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryList(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="#00000099" barStyle="light-content" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContainer}>
          <Image
            source={require('../../../assets/img/withdrawal/wave/modalBg.png')}
            style={styles.modalBackground}
            resizeMode="cover"
          />
          
          {/* 关闭按钮 - 完全透明 */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          />
          
          {/* 占位空间 - 让内容正确布局 */}
          <View style={styles.headerSpace} />
          
          {/* 国家/地区选择 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Pays/Région:</Text>
            <TouchableOpacity 
              style={styles.countrySelector}
              onPress={() => setShowCountryList(true)}
            >
              <Image
                source={selectedCountry.flag}
                style={styles.flagIcon}
              />
              <Text style={styles.countryText}>{selectedCountry.name} ({selectedCountry.code})</Text>
              <Ionicons name="chevron-down" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          
          {/* 电话号码输入 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Numéro de téléphone:</Text>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="e.g.01234567"
                placeholderTextColor="#999999"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>
          
          {/* 按钮组 */}
          <View style={styles.buttonGroup}>
            {/* 确认按钮 */}
            <TouchableOpacity 
              style={[styles.confirmButton, !phoneNumber.trim() && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!phoneNumber.trim()}
            >
              <Text style={styles.confirmButtonText}>Confirmer le retrait</Text>
            </TouchableOpacity>
            
            {/* 取消按钮 */}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* 国家选择Modal */}
      <Modal
        visible={showCountryList}
        transparent={true}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={() => setShowCountryList(false)}>
          <View style={styles.countryModalOverlay}>
            <View style={styles.countryModalContent}>
              <View style={styles.countryModalHeader}>
                <Text style={styles.countryModalTitle}>Sélectionner le pays</Text>
                <TouchableOpacity onPress={() => setShowCountryList(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.countryList}>
                {countries.map((country, index) => (
                  <TouchableOpacity
                    key={country.code}
                    style={[
                      styles.countryItem,
                      selectedCountry.code === country.code && styles.countryItemSelected,
                      index === countries.length - 1 && styles.countryItemLast
                    ]}
                    onPress={() => selectCountry(country)}
                  >
                    <Image
                      source={country.flag}
                      style={styles.flagIcon}
                    />
                    <Text style={[
                      styles.countryItemText,
                      selectedCountry.code === country.code && styles.countryItemTextSelected
                    ]}>{country.name} ({country.code})</Text>
                    {selectedCountry.code === country.code && (
                      <Ionicons name="checkmark" size={20} color="#FF5100" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#00000099',
  },
  modalContainer: {
    width: 370,
    height: 532,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalBackground: {
    position: 'absolute',
    width: 370,
    height: 532,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerSpace: {
    height: 120, // 为标题和副标题留出空间
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    color: '#550C21',
    marginBottom: 12,
    marginLeft: 4,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#FFFFFFE6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  flagIcon: {
    width: 34,
    height: 23,
    marginRight: 12,
    borderRadius: 4,
  },
  countryText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  phoneInputContainer: {
    height: 50,
    backgroundColor: '#FFFFFFE6',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  phoneInput: {
    fontSize: 16,
    color: '#000',
  },
  buttonGroup: {
    marginTop: 40,
  },
  confirmButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF5100',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FF5100',
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  countryModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.6,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  countryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  countryList: {
    // 移除左右padding
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20, // 将padding移到每个item上
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryItemLast: {
    borderBottomWidth: 0,
  },
  countryItemSelected: {
    backgroundColor: '#FFF5F0',
  },
  countryItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  countryItemTextSelected: {
    color: '#FF5100',
    fontWeight: '500',
  },
});

export default WaveWithdrawalModal;