import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import SimpleMapView from '../../components/SimpleMapView';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { districtApi, type District } from '../../services/local/districtApi';
import fontSize from '../../utils/fontsizeUtils';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../navigation/types';
import BackIcon from '../../components/BackIcon';
import AddressDescriptionModal, { type RecipientInfo } from '../../components/AddressDescriptionModal';
import MapGuideModal from '../../components/MapGuideModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 大区中心坐标（阿比让各大区的大致中心位置）
const DISTRICT_CENTERS: Record<string, { latitude: number; longitude: number; zoom?: number }> = {
  'Cocody': { latitude: 5.3599, longitude: -3.9916, zoom: 13 },
  'Marcory': { latitude: 5.2859, longitude: -3.9899, zoom: 13 },
  'Yopougon': { latitude: 5.3364, longitude: -4.0839, zoom: 13 },
  'Koumassi': { latitude: 5.2922, longitude: -3.9519, zoom: 13 },
  'Bingerville': { latitude: 5.3555, longitude: -3.8989, zoom: 13 },
};

// 默认阿比让中心
const DEFAULT_CENTER = { latitude: 5.345, longitude: -4.024 };

export default function PickUp() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { i18n } = useTranslation();
  const isChineseLanguage = i18n.language === 'zh' || i18n.language === 'cn';
  
  // 流程步骤：1=选大区, 2=地图标点, 3=填地址（通过modal）
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // 大区数据
  const [districts, setDistricts] = useState<(District & { cityName: string })[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<(District & { cityName: string }) | null>(null);
  
  // 地图相关
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [customMarker, setCustomMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>(DEFAULT_CENTER);
  
  // 地址描述modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // 引导动画
  const [showGuideModal, setShowGuideModal] = useState(false);

  // 加载大区列表
  useEffect(() => {
    loadDistricts();
    requestLocationPermission();
  }, []);

  const loadDistricts = async () => {
    try {
      setLoading(true);
      const allDistricts = await districtApi.getAllDistricts();
      setDistricts(allDistricts);
    } catch (error) {
      console.error('加载大区列表失败:', error);
      Alert.alert(
        isChineseLanguage ? '错误' : 'Erreur',
        isChineseLanguage ? '无法加载大区列表' : 'Impossible de charger la liste des districts'
      );
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('获取位置权限失败:', error);
    }
  };

  // 选择大区
  const handleSelectDistrict = async (district: District & { cityName: string }) => {
    setSelectedDistrict(district);
    
    // 设置地图中心为该大区的中心坐标
    const center = DISTRICT_CENTERS[district.name] || DEFAULT_CENTER;
    setMapCenter(center);
    
    // 进入第二步：地图标点
    setStep(2);
    
    // 每次都显示引导动画
    setTimeout(() => {
      setShowGuideModal(true);
    }, 500);
  };
  
  // 关闭引导
  const handleCloseGuide = () => {
    setShowGuideModal(false);
  };

  // 处理地图点击
  const handleMapClick = (latitude: number, longitude: number) => {
    console.log('地图点击:', latitude, longitude);
    setCustomMarker({ latitude, longitude });
  };

  // 确认标点，进入填写地址描述
  const handleConfirmMarker = () => {
    if (!customMarker) {
      Alert.alert(
        isChineseLanguage ? '提示' : 'Info',
        isChineseLanguage ? '请在地图上点击选择取货位置' : 'Veuillez cliquer sur la carte pour choisir un emplacement'
      );
      return;
    }
    
    setShowAddressModal(true);
  };

  // 确认地址描述，导航到支付页面
  const handleConfirmAddress = (recipientInfo: RecipientInfo) => {
    if (!selectedDistrict || !customMarker) return;
    
    setShowAddressModal(false);
    
    console.log('收件人信息:', recipientInfo);
    
    // 添加国家代码225（不带+号）
    const phoneWithCode = `225${recipientInfo.phone}`;
    const whatsappWithCode = `225${recipientInfo.whatsapp}`;
    
    console.log('处理后的电话:', { phone: phoneWithCode, whatsapp: whatsappWithCode });
    
    // 导航到支付页面，传递自定义取货点信息
    navigation.navigate('LocalPayment', {
      district_id: selectedDistrict.id,
      full_name: recipientInfo.fullName,
      phone: phoneWithCode,
      whatsapp: whatsappWithCode,
      address_description: recipientInfo.addressDescription,
      latitude: customMarker.latitude,
      longitude: customMarker.longitude,
    });
  };

  // 返回上一步
  const handleGoBack = () => {
    if (step === 2) {
      setStep(1);
      setCustomMarker(null);
    } else {
      navigation.goBack();
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
        </View>
        <Text style={styles.stepLabel}>
          {isChineseLanguage ? '选大区' : 'District'}
        </Text>
      </View>
      <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
        </View>
        <Text style={styles.stepLabel}>
          {isChineseLanguage ? '标记位置' : 'Marquer'}
        </Text>
      </View>
      <View style={[styles.stepLine, false && styles.stepLineActive]} />
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, false && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, false && styles.stepNumberActive]}>3</Text>
        </View>
        <Text style={styles.stepLabel}>
          {isChineseLanguage ? '填地址' : 'Adresse'}
        </Text>
      </View>
    </View>
  );

  // Step 1: 选择大区
  const renderDistrictSelection = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {renderStepIndicator()}
      
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={24} color="#FF5100" />
        <Text style={styles.sectionTitle}>
          {isChineseLanguage ? '选择您的大区' : 'Choisissez votre district'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5100" />
        </View>
      ) : (
        <View style={styles.districtList}>
          {districts.map((district) => (
            <TouchableOpacity
              key={district.id}
              style={styles.districtCard}
              onPress={() => handleSelectDistrict(district)}
            >
              <View style={styles.districtIcon}>
                <Ionicons name="business-outline" size={24} color="#FF5100" />
              </View>
              <View style={styles.districtInfo}>
                <Text style={styles.districtName}>{district.name}</Text>
                <Text style={styles.districtCity}>{district.cityName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // Step 2: 地图标点
  const renderMapMarking = () => (
    <View style={styles.container}>
      {renderStepIndicator()}
      
      {/* 简化引导提示 */}
      <View style={styles.guideContainer}>
        <Image
          source={require('../../../assets/guide/point.png')}
          style={styles.guideIcon}
          resizeMode="contain"
        />
        <Text style={styles.guideText}>
          {isChineseLanguage
            ? '点击地图标记取货位置'
            : 'Cliquez sur la carte pour marquer'}
        </Text>
        {selectedDistrict && (
          <View style={styles.districtBadge}>
            <Text style={styles.districtBadgeText}>{selectedDistrict.name}</Text>
          </View>
        )}
      </View>

      {/* 地图 */}
      <View style={styles.mapContainer}>
        <SimpleMapView
          locations={[]}
          userLocation={mapCenter}
          showsUserLocation={false}
          enableMapClick={true}
          onMapClick={handleMapClick}
          customMarker={customMarker || undefined}
          onMapReady={() => console.log('地图已就绪')}
        />
      </View>

      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        {customMarker && (
          <View style={styles.markerInfo}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.markerInfoText}>
              {isChineseLanguage ? '已标记位置' : 'Position marquée'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.confirmButton, !customMarker && styles.confirmButtonDisabled]}
          onPress={handleConfirmMarker}
          disabled={!customMarker}
        >
          <Text style={styles.confirmButtonText}>
            {isChineseLanguage ? '下一步：填写地址' : 'Suivant: Adresse'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && districts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5100" />
        <Text style={styles.loadingText}>
          {isChineseLanguage ? '加载中...' : 'Chargement...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />
      
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <BackIcon size={fontSize(20)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isChineseLanguage ? '设置取货点' : 'Point de retrait'}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {/* 内容区域 */}
      {step === 1 ? renderDistrictSelection() : renderMapMarking()}

      {/* 地址描述Modal */}
      <AddressDescriptionModal
        visible={showAddressModal}
        districtName={selectedDistrict?.name}
        onConfirm={handleConfirmAddress}
        onCancel={() => setShowAddressModal(false)}
      />
      
      {/* 引导动画Modal */}
      <MapGuideModal
        visible={showGuideModal}
        onClose={handleCloseGuide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : Constants.statusBarHeight,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: fontSize(14),
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  
  // 步骤指示器
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#FF5100',
  },
  stepNumber: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: fontSize(11),
    color: '#666',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: '#FF5100',
  },

  // 大区选择
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  districtList: {
    gap: 12,
  },
  districtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  districtIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  districtInfo: {
    flex: 1,
  },
  districtName: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  districtCity: {
    fontSize: fontSize(13),
    color: '#666',
  },

  // 地图标点 - 简化引导提示
  guideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5100',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  guideIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  guideText: {
    fontSize: fontSize(14),
    color: '#fff',
    fontWeight: '700',
    flex: 1,
  },
  districtBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  districtBadgeText: {
    fontSize: fontSize(11),
    color: '#FF5100',
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  markerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  markerInfoText: {
    fontSize: fontSize(14),
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  confirmButton: {
    backgroundColor: '#FF5100',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    fontSize: fontSize(16),
    color: '#fff',
    fontWeight: '600',
  },
});
