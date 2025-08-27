import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import fontSize from '../../utils/fontsizeUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { launchImageLibrary, launchCamera, MediaType, ImagePickerResponse, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { documentApi } from '../../services/local/documentApi';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';

const { height: screenHeight } = Dimensions.get('window');

const Verify = ({ navigation }: any) => {
  const route = useRoute<RouteProp<RootStackParamList, 'Verify'>>();
  const orderId = route.params?.orderId;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleTakePhoto = () => {
    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      maxHeight: 1000,
      maxWidth: 1000,
      quality: 0.8,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled camera picker');
        return;
      }
      
      if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Erreur', 'Échec de la prise de photo, veuillez réessayer');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage(asset.uri || null);
        setSelectedImageBase64(asset.base64 || null);
      }
    });
  };

  const handleSelectFromAlbum = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      maxHeight: 1000,
      maxWidth: 1000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Erreur', 'Échec de la sélection de l\'image, veuillez réessayer');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage(asset.uri || null);
        setSelectedImageBase64(asset.base64 || null);
      }
    });
  };

  const handleSubmitAuthentication = async () => {
    if (!selectedImage || !selectedImageBase64) {
      Alert.alert('Avis', 'Veuillez d\'abord sélectionner ou prendre une photo de votre pièce d\'identité');
      return;
    }

    try {
      setIsUploading(true);

      const response = await documentApi.uploadDocument({
        image_base64: selectedImageBase64,
      });

      if (response.success) {
        // 验证成功后跳转到支付成功页面，传递完整参数
        const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        
        navigation.navigate('OrderSuccess', {
          orderId: orderId
        });
      } else {
        Alert.alert('Échec du téléchargement', response.message || 'Échec du téléchargement, veuillez réessayer');
      }
    } catch (error) {
      console.error('Échec du téléchargement:', error);
      Alert.alert('Échec du téléchargement', 'Erreur réseau ou serveur, veuillez réessayer plus tard');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#FF8C00" />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 头部背景图片 */}
        <View style={styles.headerImageContainer}>
          <Image 
            source={require('../../../assets/local/verifyBG.png')}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Vérification d'identité</Text>
        </View>

        {/* 内容区域 */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Télécharger une photo de pièce</Text>
          
          {/* ID 卡片示意图或选中的图片 */}
          <View style={styles.idCardContainer}>
            {selectedImage ? (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => {
                    setSelectedImage(null);
                    setSelectedImageBase64(null);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#FF5100" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.idCard}>
                {/* 模拟身份证样式 */}
                <View style={styles.idCardContent}>
                  <View style={styles.idCardLines}>
                    <View style={[styles.idCardLine, { width: '80%' }]} />
                    <View style={[styles.idCardLine, { width: '60%' }]} />
                    <View style={[styles.idCardLine, { width: '70%' }]} />
                    <View style={[styles.idCardLine, { width: '50%' }]} />
                  </View>
                  <View style={styles.idCardPhoto}>
                    <Ionicons name="person" size={40} color="#666" />
                  </View>
                </View>
              </View>
            )}
          </View>
          
          <Text style={styles.cardDescription}>Page d'identité ou de passeport</Text>
          
          {/* 操作按钮 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
              <Text style={styles.primaryButtonText}>Prendre photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSelectFromAlbum}>
              <Text style={styles.secondaryButtonText}>Album photo</Text>
            </TouchableOpacity>
          </View>
          
          {/* 拍摄要求 */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Exigences de prise de vue:</Text>
            
            <View style={styles.requirementItem}>
              <View style={styles.requirementBullet} />
              <Text style={styles.requirementText}>
                Téléchargez le recto de la carte d'identité ou la page
                d'information du passeport.
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <View style={styles.requirementBullet} />
              <Text style={styles.requirementText}>
                Assurez-vous que les informations sont claires, bien
                éclairées, sans obstructions ni reflets.
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <View style={styles.requirementBullet} />
              <Text style={styles.requirementText}>
                Le document doit être entier dans le cadre, sans coins
                coupés.
              </Text>
            </View>
          </View>
          
          {/* 提交按钮 */}
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              selectedImage && !isUploading ? styles.submitButtonActive : styles.submitButtonDisabled
            ]} 
            onPress={handleSubmitAuthentication}
            disabled={!selectedImage || isUploading}
          >
            {isUploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.submitButtonText}>Téléchargement...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Soumettre l'authentification</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  headerImageContainer: {
    position: 'relative',
    height: screenHeight * 0.34,
    marginTop: Platform.OS === 'ios' ? -20 : -10,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : (RNStatusBar.currentHeight || 0) + 20,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 75 : (RNStatusBar.currentHeight || 0) + 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: fontSize(20),
    fontWeight: 'bold',
    color: 'white',
    zIndex: 5,
  },
  content: {
    padding: 15,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: fontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  idCardContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  idCard: {
    width: 280,
    height: 180,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  idCardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  idCardLines: {
    flex: 1,
    justifyContent: 'space-around',
    paddingRight: 20,
  },
  idCardLine: {
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  idCardPhoto: {
    width: 60,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDescription: {
    fontSize: fontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  requirementsContainer: {
    marginBottom: 10,
  },
  requirementsTitle: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  requirementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    marginTop: 7,
    marginRight: 12,
  },
  requirementText: {
    flex: 1,
    fontSize: fontSize(14),
    color: '#666',
    lineHeight: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: 280,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF5100',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonActive: {
    backgroundColor: '#FF5100',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
});

export default Verify;