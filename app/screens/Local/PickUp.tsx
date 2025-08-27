import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
// import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import SimpleMapView from '../../components/SimpleMapView';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { pickupApi } from '../../services/local/pickupApi';
import type { PickupLocation } from '../../services/local/pickupApi';
import fontSize from '../../utils/fontsizeUtils';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../navigation/types';
import BackIcon from '../../components/BackIcon';
import { Image } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

export default function PickUp() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { i18n } = useTranslation();
  // const mapRef = useRef<MapView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isChineseLanguage = i18n.language === 'zh' || i18n.language === 'cn';
  
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PickupLocation | null>(null);
  // 地图区域状态暂未使用，移除以避免未使用告警

  // 底部面板动画相关
  const [panelHeight] = useState(new Animated.Value(screenHeight * 0.4));
  const minPanelHeight = screenHeight * 0.4; // 最小高度（折叠状态）
  const maxPanelHeight = screenHeight * 0.8; // 最大高度（展开状态）
  
  // 创建手势响应器
  const lastGestureY = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        lastGestureY.current = 0;
      },
      onPanResponderMove: (_evt, gestureState) => {
        // 计算从上次位置的变化
        const deltaY = gestureState.dy - lastGestureY.current;
        lastGestureY.current = gestureState.dy;
        
        // 获取当前高度并计算新高度
        const currentHeight = (panelHeight as unknown as { _value: number })._value;
        let newHeight = currentHeight - deltaY;
        
        // 限制高度范围
        newHeight = Math.max(minPanelHeight, Math.min(maxPanelHeight, newHeight));
        
        panelHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const velocity = gestureState.vy;
        const currentHeight = (panelHeight as unknown as { _value: number })._value;
        
        // 根据速度和当前位置决定最终状态
        let shouldExpand = false;
        
        if (Math.abs(velocity) > 0.5) {
          // 快速滑动，根据方向决定
          shouldExpand = velocity < 0; // 向上滑动展开
        } else {
          // 慢速滑动，根据位置决定
          const threshold = (minPanelHeight + maxPanelHeight) / 2;
          shouldExpand = currentHeight > threshold;
        }
        
        const toValue = shouldExpand ? maxPanelHeight : minPanelHeight;
        
        Animated.spring(panelHeight, {
          toValue,
          useNativeDriver: false,
          tension: 50,
          friction: 10,
        }).start();
        
        // 展开状态由动画高度隐式表达，无需独立状态
      },
    })
  ).current;

  const fitMapToMarkers = useCallback((_locations: PickupLocation[]) => {
    // 地图功能暂时禁用
  }, []);

  const initializeMap = useCallback(async () => {
    try {
      setLoading(true);
      
      // 模拟用户位置（科特迪瓦坐标）
      const simulatedCoords = {
        latitude: 5.341806,  // 5°20'30.5"N
        longitude: -3.971889, // 3°58'18.8"W
      };
      
      // 请求位置权限
      const { status: _status } = await Location.requestForegroundPermissionsAsync();
      
      const userCoords = simulatedCoords; // 使用模拟位置
      
      setUserLocation(userCoords);
      
      // 获取自提点列表
      const locations = await pickupApi.getPickupLocations(
        userCoords ? {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        } : undefined
      );
      
      setPickupLocations(locations);
      
      // 后端返回的第一个就是最近的自提点
      if (locations.length > 0) {
        const nearest = locations[0]; // 第一个就是最近的
        setSelectedPickup(nearest);
      }
      
      // 如果有自提点，调整地图显示所有标记
      if (locations.length > 0) {
        fitMapToMarkers(locations);
      }
      
    } catch (error) {
      console.error('初始化地图失败:', error);
      Alert.alert(
        isChineseLanguage ? '错误' : 'Erreur',
        isChineseLanguage ? '无法加载自提点信息' : 'Impossible de charger les points de retrait'
      );
    } finally {
      setLoading(false);
    }
  }, [isChineseLanguage, fitMapToMarkers]);

  // 在定义 initializeMap 之后调用，避免使用前定义
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const openGoogleMaps = (location: PickupLocation) => {
    const scheme = Platform.select({
      ios: 'maps://app',
      android: 'geo:0,0',
    });
    
    const url = Platform.select({
      ios: `${scheme}?daddr=${location.latitude},${location.longitude}&dirflg=d`,
      android: `${scheme}?q=${location.latitude},${location.longitude}(${location.name})`,
    });
    
    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // 如果没有安装Google Maps，打开网页版
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  const formatTimetableDisplay = useCallback((time: { start_time: string; end_time: string; day_of_week: string }) => {
    const formatTime = (t: string) => {
      if (!t) return '';
      const parts = t.split(':');
      if (parts.length < 2) return t;
      const hour = parts[0].padStart(2, '0');
      const minute = parts[1].padStart(2, '0');
      return `${hour}:${minute}`;
    };

    const normalizeDay = (d: string) => (d || '').toString().trim().toLowerCase();

  

    const frDayMap: Record<string, string> = {
      monday: 'Lun',
      tuesday: 'Mar',
      wednesday: 'Mer',
      thursday: 'Jeu',
      friday: 'Ven',
      saturday: 'Sam',
      sunday: 'Dim',
      weekday: 'Lun-Ven',
      everyday: 'Tous les jours',
    };

    const dayKey = normalizeDay(time.day_of_week);
    const dayLabel = frDayMap[dayKey] || time.day_of_week;
    const start = formatTime(time.start_time);
    const end = formatTime(time.end_time);

    if (start && end) return `${dayLabel} ${start} - ${end}`;
    if (start || end) return `${dayLabel} ${start || end}`;
    return dayLabel;
  }, []);

  const getTodayLabel = useCallback(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }, []);

  const getDisplayTimetableForToday = useCallback((timetables: { start_time: string; end_time: string; day_of_week: string }[]) => {
    if (!Array.isArray(timetables) || timetables.length === 0) return '';
    const todayKey = getTodayLabel();
    const normalizeDay = (d: string) => (d || '').toString().trim().toLowerCase();
    const isWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(todayKey);
    const todayItem =
      timetables.find(t => normalizeDay(t.day_of_week) === todayKey) ||
      (isWeekday ? timetables.find(t => normalizeDay(t.day_of_week) === 'weekday') : undefined) ||
      timetables.find(t => normalizeDay(t.day_of_week) === 'everyday') ||
      timetables[0];
    return formatTimetableDisplay(todayItem);
  }, [formatTimetableDisplay, getTodayLabel]);

  const handleSelectPickup = (location: PickupLocation) => {
    setSelectedPickup(location);
  };

  const handleConfirm = () => {
    if (!selectedPickup) {
      Alert.alert(
        isChineseLanguage ? '提示' : 'Info',
        isChineseLanguage ? '请选择一个自提点' : 'Veuillez sélectionner un point de retrait'
      );
      return;
    }
    
    // 跳转到支付页面
    navigation.navigate('LocalPayment', { pickup_location_id: selectedPickup.id });
  };

  // 标记颜色逻辑当前未使用，移除以避免未使用告警

  if (loading) {
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackIcon size={fontSize(20)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isChineseLanguage ? '选择自提点' : 'Choisir un point de retrait'}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {/* 地图 - 全屏 */}
      <View style={styles.fullMapContainer}>
        <SimpleMapView
          locations={pickupLocations.map(loc => ({
            id: String(loc.id),
            latitude: loc.latitude,
            longitude: loc.longitude,
            title: loc.name,
            address: loc.address,
          }))}
          userLocation={userLocation || undefined}
          selectedLocationId={selectedPickup?.id?.toString()}
          showsUserLocation={true}
          onMarkerPress={(locationId) => {
            const location = pickupLocations.find(loc => String(loc.id) === locationId);
            if (location) {
              handleSelectPickup(location);
            }
          }}
          onMapReady={() => {}}
        />
      </View>

      {/* 可拖动的底部面板 */}
      <Animated.View 
        style={[
          styles.bottomPanel,
          {
            height: panelHeight,
          }
        ]}
      >
        {/* 拖动手柄 */}
        <View 
          style={styles.dragHandle}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragBar} />
        </View>

        {/* 自提点列表 */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.listContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* 通知条 */}
        <View style={styles.noticeBar}>
          <Image 
            source={require('../../../assets/local/notice.png')} 
            style={styles.noticeIcon}
          />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              {isChineseLanguage ? '重要提醒' : 'Rappel important'}
            </Text>
            <Text style={styles.noticeText}>
              {isChineseLanguage 
                ? '订单将在取货点保留3天。超过期限后，如未取货，订单将自动取消。请合理安排您的时间。'
                : 'La commande sera livrée à deux reprises. Si vous ne la récupérez pas lors de ces deux tentatives, la commande sera annulée.'
              }
            </Text>
          </View>
        </View>

        {pickupLocations.map((location, index) => {
          const isSelected = selectedPickup?.id === location.id;
          const isNearest = index === 0; // 第一个就是最近的
          
          return (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                isSelected && styles.selectedCard,
              ]}
              onPress={() => handleSelectPickup(location)}
            >
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[
                      styles.locationName,
                      isSelected && styles.selectedText,
                    ]}>
                      {location.name}
                    </Text>
                    {isNearest && (
                      <View style={styles.nearestBadge}>
                        <Text style={styles.nearestText}>
                          {isChineseLanguage ? '最近' : 'Plus proche'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#FF5100" />
                  )}
                </View>
                
                <Text style={styles.locationAddress}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  {' '}{location.address}
                </Text>
                
                {location.distance !== null && (
                  <Text style={styles.distance}>
                    <Ionicons name="navigate-outline" size={14} color="#666" />
                    {' '}{pickupApi.formatDistance(location.distance)}
                  </Text>
                )}
                
                <View style={styles.timetableRow}>
                  <View style={[styles.statusBadge, { backgroundColor: '#FFAE11' }]}>
                    <Text style={styles.statusText}>
                      {isChineseLanguage ? '取货时间' : 'Heure de retrait'}
                    </Text>
                  </View>
                  
                  <Text style={styles.timetable}>
                    {getDisplayTimetableForToday(location.timetables)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => openGoogleMaps(location)}
                >
                  <Ionicons name="navigate" size={16} color="#FF5100" />
                  <Text style={styles.navigateText}>
                    {isChineseLanguage ? '导航' : 'Navigation'}
                  </Text>
                </TouchableOpacity>
              </>
            </TouchableOpacity>
          );
        })}
        </ScrollView>

        {/* 底部确认按钮 - 放在面板内部 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              {isChineseLanguage ? '确认选择' : 'Confirmer la sélection'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
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
    zIndex: 5,
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
    letterSpacing: 0.3,
  },
  fullMapContainer: {
    height: screenHeight * 0.5,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    backgroundColor: 'rgba(65, 105, 225, 0.2)',
    borderRadius: 20,
    padding: 5,
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapTip: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapTipText: {
    marginLeft: 5,
    fontSize: fontSize(12),
    color: '#666',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 10,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
  },
  listContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // 为底部按钮和手机底部留出空间
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#FF5100',
    borderWidth: 2,
    backgroundColor: '#FFF8F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationName: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  selectedText: {
    color: '#FF5100',
  },
  nearestBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  nearestText: {
    fontSize: fontSize(10),
    color: '#fff',
    fontWeight: 'bold',
  },
  locationAddress: {
    fontSize: fontSize(14),
    color: '#666',
    marginBottom: 5,
  },
  distance: {
    fontSize: fontSize(13),
    color: '#999',
    marginBottom: 8,
  },
  timetableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 10,
  },
  statusText: {
    fontSize: fontSize(11),
    color: '#fff',
    fontWeight: 'bold',
  },
  timetable: {
    fontSize: fontSize(12),
    color: '#666',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#FFF0E5',
  },
  navigateText: {
    marginLeft: 5,
    fontSize: fontSize(13),
    color: '#FF5100',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 30, // 增加底部间距，适配手机底部
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: fontSize(16),
    color: '#fff',
    fontWeight: 'bold',
  },
  noticeBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(173, 216, 230, 0.3)', // 浅蓝色透明背景
    marginHorizontal: 15,
    marginBottom: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'flex-start',
    borderRadius: 8,
  },
  noticeIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    marginTop: 2,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: fontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: fontSize(12),
    color: '#666',
    lineHeight: fontSize(18),
  },
  collapsedCard: {
    padding: 8,
    marginBottom: 8,
  },
  collapsedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nearestDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
});