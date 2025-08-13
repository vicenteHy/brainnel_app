import React, { useState, useEffect, useRef } from 'react';
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
  SafeAreaView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { pickupApi, PickupLocation } from '../../services/local/pickupApi';
import fontSize from '../../utils/fontsizeUtils';
import { useTranslation } from 'react-i18next';
import BackIcon from '../../components/BackIcon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PickUp() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const isChineseLanguage = i18n.language === 'zh' || i18n.language === 'cn';
  
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PickupLocation | null>(null);
  const [nearestPickup, setNearestPickup] = useState<PickupLocation | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 5.3484, // 默认阿比让中心
    longitude: -4.0167,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      let userCoords = null;
      if (status === 'granted') {
        // 获取用户当前位置
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(userCoords);
        
        // 更新地图区域到用户位置
        setRegion({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        Alert.alert(
          t('permission.location.title'),
          t('permission.location.message'),
        );
      }
      
      // 获取自提点列表
      const locations = await pickupApi.getPickupLocations(
        userCoords ? {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        } : undefined
      );
      
      setPickupLocations(locations);
      
      // 找到最近的自提点
      if (userCoords && locations.length > 0) {
        const nearest = pickupApi.getNearestPickupLocation(
          userCoords.latitude,
          userCoords.longitude,
          locations
        );
        setNearestPickup(nearest);
        setSelectedPickup(nearest);
      } else if (locations.length > 0) {
        setSelectedPickup(locations[0]);
      }
      
      // 如果有自提点，调整地图显示所有标记
      if (locations.length > 0) {
        fitMapToMarkers(locations, userCoords);
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
  };

  const fitMapToMarkers = (locations: PickupLocation[], userCoords: any) => {
    if (!mapRef.current) return;
    
    const coordinates = locations.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
    
    if (userCoords) {
      coordinates.push(userCoords);
    }
    
    // 延迟执行以确保地图已加载
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 200,
          left: 50,
        },
        animated: true,
      });
    }, 1000);
  };

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

  const handleSelectPickup = (location: PickupLocation) => {
    setSelectedPickup(location);
    
    // 将地图中心移动到选中的自提点
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  };

  const handleConfirm = () => {
    if (!selectedPickup) {
      Alert.alert(
        isChineseLanguage ? '提示' : 'Info',
        isChineseLanguage ? '请选择一个自提点' : 'Veuillez sélectionner un point de retrait'
      );
      return;
    }
    
    // TODO: 保存选中的自提点并返回
    navigation.goBack();
  };

  const getMarkerColor = (location: PickupLocation) => {
    if (location.id === selectedPickup?.id) return '#FF5100';
    if (location.id === nearestPickup?.id) return '#4CAF50';
    return '#666666';
  };

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
    <SafeAreaView style={styles.container}>
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
        <View style={{ width: 40 }} />
      </View>

      {/* 地图 */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
        >
          {/* 用户位置标记 */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title={isChineseLanguage ? '我的位置' : 'Ma position'}
              pinColor="#4169E1"
            >
              <View style={styles.userMarker}>
                <Ionicons name="person-circle" size={30} color="#4169E1" />
              </View>
            </Marker>
          )}
          
          {/* 自提点标记 */}
          {pickupLocations.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.name}
              description={location.address}
              onPress={() => handleSelectPickup(location)}
              pinColor={getMarkerColor(location)}
            >
              <View style={[
                styles.customMarker,
                { backgroundColor: getMarkerColor(location) }
              ]}>
                <Ionicons name="location" size={24} color="#fff" />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* 地图上的提示 */}
        {nearestPickup && (
          <View style={styles.mapTip}>
            <Ionicons name="information-circle" size={16} color="#4CAF50" />
            <Text style={styles.mapTipText}>
              {isChineseLanguage ? '绿色标记为最近自提点' : 'Le marqueur vert est le plus proche'}
            </Text>
          </View>
        )}
      </View>

      {/* 自提点列表 */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {pickupLocations.map((location) => {
          const isSelected = selectedPickup?.id === location.id;
          const isNearest = nearestPickup?.id === location.id;
          const isOpen = pickupApi.isOpen(location.timetables);
          
          return (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                isSelected && styles.selectedCard,
              ]}
              onPress={() => handleSelectPickup(location)}
            >
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
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: isOpen ? '#4CAF50' : '#FF5722' }
                ]}>
                  <Text style={styles.statusText}>
                    {isOpen ? 
                      (isChineseLanguage ? '营业中' : 'Ouvert') : 
                      (isChineseLanguage ? '已关闭' : 'Fermé')
                    }
                  </Text>
                </View>
                
                {location.timetables.map((time, index) => (
                  <Text key={index} style={styles.timetable}>
                    {pickupApi.formatTimetable(time)}
                  </Text>
                ))}
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
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 底部确认按钮 */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    height: screenHeight * 0.4,
    position: 'relative',
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
  listContainer: {
    flex: 1,
    padding: 15,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
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
    padding: 15,
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
});