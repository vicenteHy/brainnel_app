import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import fontSize from '../utils/fontsizeUtils';
import { useTranslation } from 'react-i18next';

export interface RecipientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp: string;
  addressDescription: string;
}

interface AddressDescriptionModalProps {
  visible: boolean;
  onConfirm: (recipientInfo: RecipientInfo) => void;
  onCancel: () => void;
  districtName?: string;
}

export default function AddressDescriptionModal({
  visible,
  onConfirm,
  onCancel,
  districtName,
}: AddressDescriptionModalProps) {
  const { i18n } = useTranslation();
  const isChineseLanguage = i18n.language === 'zh' || i18n.language === 'cn';
  
  // 表单状态
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [addressDescription, setAddressDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};
    
    // 验证全名
    if (!fullName.trim()) {
      newErrors.fullName = isChineseLanguage ? '请输入姓名' : 'Veuillez entrer le nom complet';
    }
    
    // 验证电话
    if (!phone.trim()) {
      newErrors.phone = 'Veuillez entrer le numéro de téléphone';
    } else if (phone.length !== 8 && phone.length !== 10) {
      newErrors.phone = 'Le numéro doit contenir 8 ou 10 chiffres';
    }
    
    // 验证WhatsApp
    if (!whatsapp.trim()) {
      newErrors.whatsapp = 'Veuillez entrer le numéro WhatsApp';
    } else if (whatsapp.length !== 8 && whatsapp.length !== 10) {
      newErrors.whatsapp = 'Le numéro doit contenir 8 ou 10 chiffres';
    }
    
    // 验证地址描述
    if (!addressDescription.trim()) {
      newErrors.addressDescription = isChineseLanguage ? '请输入地址描述' : 'Veuillez entrer une description';
    } else if (addressDescription.trim().length < 5) {
      newErrors.addressDescription = isChineseLanguage ? '地址描述至少需要5个字符' : 'Au moins 5 caractères';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 所有验证通过，返回数据
    onConfirm({
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      addressDescription: addressDescription.trim(),
    });
    
    // 清空表单
    resetForm();
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setWhatsapp('');
    setAddressDescription('');
    setErrors({});
  };
  
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContent}>
          {/* 头部 */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={28} color="#FF5100" />
            </View>
            <Text style={styles.title}>
              {isChineseLanguage ? '收货人信息' : 'Informations du destinataire'}
            </Text>
            {districtName && (
              <Text style={styles.subtitle}>
                {isChineseLanguage ? `大区: ${districtName}` : `District: ${districtName}`}
              </Text>
            )}
          </View>

          {/* 表单区域 */}
          <ScrollView 
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 全名 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>*{isChineseLanguage ? '姓名' : 'Nom complet'}</Text>
              <TextInput
                style={[styles.input, errors.fullName ? styles.inputError : null]}
                placeholder={isChineseLanguage ? '请输入完整姓名' : 'Entrez votre nom complet'}
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors({...errors, fullName: ''});
                }}
              />
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            {/* 电话号码 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>*{isChineseLanguage ? '电话' : 'Téléphone'}</Text>
              <View style={styles.phoneContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇨🇮 +225</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, errors.phone ? styles.inputError : null]}
                  placeholder={isChineseLanguage ? '请输入电话号码' : 'Entrez votre numéro'}
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/[^0-9]/g, ''));
                    if (errors.phone) setErrors({...errors, phone: ''});
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            {/* WhatsApp */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>*WhatsApp</Text>
              <View style={styles.phoneContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇨🇮 +225</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, errors.whatsapp ? styles.inputError : null]}
                  placeholder={isChineseLanguage ? '请输入WhatsApp号码' : 'Entrez votre WhatsApp'}
                  placeholderTextColor="#999"
                  value={whatsapp}
                  onChangeText={(text) => {
                    setWhatsapp(text.replace(/[^0-9]/g, ''));
                    if (errors.whatsapp) setErrors({...errors, whatsapp: ''});
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {errors.whatsapp ? <Text style={styles.errorText}>{errors.whatsapp}</Text> : null}
            </View>

            {/* 地址描述 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>*{isChineseLanguage ? '详细地址描述' : 'Description de l\'adresse'}</Text>
              <TextInput
                style={[styles.textArea, errors.addressDescription ? styles.inputError : null]}
                placeholder={
                  isChineseLanguage
                    ? '例如：靠近大学，红色建筑旁边，二楼'
                    : 'Ex: Près de l\'université, à côté du bâtiment rouge'
                }
                placeholderTextColor="#999"
                value={addressDescription}
                onChangeText={(text) => {
                  setAddressDescription(text);
                  if (errors.addressDescription) setErrors({...errors, addressDescription: ''});
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.charCount}>{addressDescription.length}/200</Text>
              {errors.addressDescription ? <Text style={styles.errorText}>{errors.addressDescription}</Text> : null}
            </View>
          </ScrollView>

          {/* 按钮 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>
                {isChineseLanguage ? '取消' : 'Annuler'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {isChineseLanguage ? '确认' : 'Confirmer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '90%',
  },
  formScroll: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: fontSize(20),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSize(14),
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: fontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: fontSize(14),
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: fontSize(14),
    color: '#333',
    minHeight: 100,
    backgroundColor: '#fafafa',
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCode: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: fontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: fontSize(14),
    color: '#333',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  charCount: {
    fontSize: fontSize(12),
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: fontSize(12),
    color: '#FF3B30',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#FF5100',
  },
  confirmButtonText: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
});
