import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getMapConfig } from '../config/maps';

interface MapLocation {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

interface SimpleMapViewProps {
  locations: MapLocation[];
  userLocation?: { latitude: number; longitude: number };
  selectedLocationId?: string;
  onMarkerPress?: (locationId: string) => void;
  showsUserLocation?: boolean;
  onMapReady?: () => void;
}

export default function SimpleMapView({ 
  locations = [], 
  userLocation: initialUserLocation,
  selectedLocationId,
  onMarkerPress,
  showsUserLocation = true,
  onMapReady
}: SimpleMapViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(initialUserLocation || null);
  const [mapReady, setMapReady] = useState(false);
  const [mapHtml, setMapHtml] = useState<string>('');

  // 获取用户位置
  useEffect(() => {
    if (showsUserLocation && !initialUserLocation) {
      // 使用模拟位置（科特迪瓦坐标）
      const simulatedLocation = {
        latitude: 5.341806,  // 5°20'30.5"N
        longitude: -3.971889, // 3°58'18.8"W
      };
      setUserLocation(simulatedLocation);
      
      // 注释掉真实位置获取
      // (async () => {
      //   try {
      //     const { status } = await Location.requestForegroundPermissionsAsync();
      //     if (status !== 'granted') {
      //       Alert.alert('提示', '需要位置权限才能显示您的位置');
      //       return;
      //     }
      //
      //     const location = await Location.getCurrentPositionAsync({});
      //     setUserLocation({
      //       latitude: location.coords.latitude,
      //       longitude: location.coords.longitude,
      //     });
      //   } catch (error) {
      //     console.error('获取位置失败:', error);
      //   }
      // })();
    }
  }, [showsUserLocation, initialUserLocation]);

  // 生成地图 HTML - 只在组件挂载时生成一次
  useEffect(() => {
    const generateMapHTML = () => {
    // 获取地图配置
    const mapConfig = getMapConfig();
    
    if (!mapConfig.isConfigured) {
      console.error('Google Maps API key is not configured. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file');
      return `
        <html>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
            <div style="text-align: center; color: #666;">
              <p>地图配置错误</p>
              <p style="font-size: 12px;">请配置 Google Maps API 密钥</p>
            </div>
          </body>
        </html>
      `;
    }
    
    const apiKey = mapConfig.apiKey;
    
    // 默认中心点（科特迪瓦阿比让）
    const defaultCenter = { latitude: 5.345, longitude: -4.024 };
    const center = userLocation || (locations.length > 0 ? locations[0] : defaultCenter);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .marker-info {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-width: 150px;
          }
          .marker-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
            color: #333;
          }
          .marker-address {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map;
          let markers = [];
          let userMarker = null;
          let infoWindow = null;

          // 聚焦到指定位置
          function focusOnLocation(lat, lng) {
            map.panTo({ lat: lat, lng: lng });
            map.setZoom(16); // 放大到更近的视图
          }
          
          // 更新选中的标记（提前定义为全局函数）
          function updateSelectedMarker(selectedId) {
            const pickupPoints = ${JSON.stringify(locations)};
            console.log('updateSelectedMarker called with:', selectedId);
            
            if (!markers || markers.length === 0) {
              console.log('Markers not ready yet');
              return;
            }
            
            // 转换 ID 为数字（如果需要）
            const selectedIdNum = selectedId ? (parseInt(selectedId) || selectedId) : null;
            
            // 更新所有标记的样式
            markers.forEach((marker, index) => {
              const point = pickupPoints[index];
              // 比较时考虑类型转换
              const isSelected = selectedIdNum && (point.id == selectedIdNum || point.id === selectedId);
              const isNearest = index === 0;
              
              console.log('Updating marker', index, 'isSelected:', isSelected);
              
              // 更新图标颜色 - 蓝色为默认，橙色为选中
              const svgMarker = {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: isSelected ? '#FF5100' : '#4169E1', // 蓝色默认，橙色选中
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: isSelected ? 2 : 1.5,
                anchor: new google.maps.Point(12, 24),
                labelOrigin: new google.maps.Point(12, 10)
              };
              
              marker.setIcon(svgMarker);
              
              // 清除所有动画
              marker.setAnimation(null);
              
              // 如果是选中的，聚焦到该位置
              if (isSelected) {
                console.log('Focusing on location:', point.latitude, point.longitude);
                
                // 延迟一下再添加动画和聚焦
                setTimeout(function() {
                  marker.setAnimation(google.maps.Animation.BOUNCE);
                  focusOnLocation(point.latitude, point.longitude);
                  
                  // 自动打开信息窗口
                  const content = '<div class="marker-info">' +
                    '<div class="marker-title">' + (point.title || '取货点 ' + (index + 1)) + '</div>' +
                    (point.address ? '<div class="marker-address">' + point.address + '</div>' : '') +
                    '</div>';
                  infoWindow.setContent(content);
                  infoWindow.open(map, marker);
                }, 100);
              }
            });
          }

          function initMap() {
            // 初始化地图
            map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${center.latitude}, lng: ${center.longitude} },
              zoom: 13,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: true,
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
              }
            });

            infoWindow = new google.maps.InfoWindow();

            // 添加取货点标记
            const pickupPoints = ${JSON.stringify(locations)};
            const selectedId = '${selectedLocationId || ''}';
            
            // 定义自定义覆盖物类
            function CustomMarker(position, map, title, isSelected) {
              this.position = position;
              this.title = title;
              this.isSelected = isSelected;
              this.setMap(map);
            }
            
            CustomMarker.prototype = new google.maps.OverlayView();
            
            CustomMarker.prototype.onAdd = function() {
              const div = document.createElement('div');
              div.style.position = 'absolute';
              div.style.cursor = 'pointer';
              div.innerHTML = \`
                <div style="
                  display: flex;
                  align-items: center;
                  background-color: \${this.isSelected ? '#FF5100' : '#FFAE11'};
                  border-radius: 20px;
                  padding: 8px 14px;
                  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                  white-space: nowrap;
                  position: relative;
                  transform: translate(-50%, -100%);
                  margin-bottom: 8px;
                ">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF5100" stroke="white" stroke-width="1.5" style="margin-right: 6px;">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span style="
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  ">\${this.title}</span>
                  <div style="
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid \${this.isSelected ? '#FF5100' : '#FFAE11'};
                  "></div>
                </div>
              \`;
              
              this.div = div;
              
              // 添加点击事件
              const self = this;
              div.addEventListener('click', function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'markerPress',
                    markerId: self.markerId
                  }));
                }
              });
              
              const panes = this.getPanes();
              panes.overlayMouseTarget.appendChild(div);
            };
            
            CustomMarker.prototype.draw = function() {
              const overlayProjection = this.getProjection();
              const position = overlayProjection.fromLatLngToDivPixel(this.position);
              
              if (this.div) {
                this.div.style.left = position.x + 'px';
                this.div.style.top = position.y + 'px';
              }
            };
            
            CustomMarker.prototype.onRemove = function() {
              if (this.div) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
              }
            };
            
            // 创建取货点标记
            pickupPoints.forEach((point, index) => {
              const isSelected = selectedId && (point.id == selectedId || String(point.id) === selectedId);
              
              const customMarker = new CustomMarker(
                new google.maps.LatLng(point.latitude, point.longitude),
                map,
                point.title || '取货点 ' + (index + 1),
                isSelected
              );
              customMarker.markerId = point.id;
              
              markers.push(customMarker);
            });

            // 添加用户位置标记
            ${userLocation ? `
              // 用户位置的自定义图标（绿色圆形）
              const userIcon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4CAF50', // 绿色表示用户位置
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 8
              };
              
              // 用户位置外圈（模拟定位精度范围）
              const accuracyCircle = new google.maps.Circle({
                map: map,
                center: { lat: ${userLocation.latitude}, lng: ${userLocation.longitude} },
                radius: 100, // 100米精度范围
                fillColor: '#4CAF50', // 绿色
                fillOpacity: 0.15,
                strokeColor: '#4CAF50',
                strokeOpacity: 0.3,
                strokeWeight: 1
              });
              
              userMarker = new google.maps.Marker({
                position: { lat: ${userLocation.latitude}, lng: ${userLocation.longitude} },
                map: map,
                title: '我的位置',
                icon: userIcon,
                zIndex: 999
              });

              // 调整地图视野以包含所有点
              if (pickupPoints.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                bounds.extend({ lat: ${userLocation.latitude}, lng: ${userLocation.longitude} });
                pickupPoints.forEach(point => {
                  bounds.extend({ lat: point.latitude, lng: point.longitude });
                });
                map.fitBounds(bounds);
                // 添加一些内边距
                const padding = { top: 50, right: 50, bottom: 50, left: 50 };
                map.fitBounds(bounds, padding);
              }
            ` : `
              // 如果有多个取货点，调整视野以显示所有点
              if (pickupPoints.length > 1) {
                const bounds = new google.maps.LatLngBounds();
                pickupPoints.forEach(point => {
                  bounds.extend({ lat: point.latitude, lng: point.longitude });
                });
                map.fitBounds(bounds);
                const padding = { top: 50, right: 50, bottom: 50, left: 50 };
                map.fitBounds(bounds, padding);
              }
            `}

            // 定义 updateSelectedMarker 函数
            window.updateSelectedMarker = updateSelectedMarker;
            
            // 通知地图加载完成
            setTimeout(() => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
              }
            }, 500);
          }

          // 更新用户位置
          function updateUserLocation(lat, lng) {
            if (userMarker) {
              userMarker.setPosition({ lat: lat, lng: lng });
            } else {
              const userIcon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4CAF50', // 绿色表示用户位置
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 8
              };
              
              userMarker = new google.maps.Marker({
                position: { lat: lat, lng: lng },
                map: map,
                title: '我的位置',
                icon: userIcon,
                zIndex: 999
              });
            }
          }

          // 错误处理
          window.addEventListener('error', function(e) {
            console.error('地图加载错误:', e);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                message: e.message || '地图加载失败'
              }));
            }
          });
          
          // Google Maps API 错误处理
          window.gm_authFailure = function() {
            console.error('Google Maps 认证失败');
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                message: 'Google Maps API 认证失败，请检查 API 密钥'
              }));
            }
          };
        </script>
        <script async defer
          src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap"
          onerror="if(window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Google Maps 脚本加载失败' })); }">
        </script>
      </body>
      </html>
    `;
    };
    
    const html = generateMapHTML();
    setMapHtml(html);
  }, []); // 空依赖，只在组件挂载时执行一次

  // 处理 WebView 消息
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapReady') {
        setLoading(false);
        setMapReady(true);
        onMapReady?.();
      } else if (data.type === 'markerPress' && onMarkerPress) {
        onMarkerPress(data.markerId);
      } else if (data.type === 'error') {
        console.error('地图错误:', data.message);
        Alert.alert('地图加载错误', data.message);
        setLoading(false);
      }
    } catch (error) {
      console.error('处理地图消息失败:', error);
    }
  };

  // 更新用户位置
  useEffect(() => {
    if (userLocation && webViewRef.current && !loading) {
      webViewRef.current.injectJavaScript(`
        if (typeof updateUserLocation === 'function') {
          updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
        }
        true;
      `);
    }
  }, [userLocation, loading]);

  // 监听选中位置的变化 - 只更新标记颜色，不聚焦
  useEffect(() => {
    if (webViewRef.current && mapReady) {
      const selectedIndex = selectedLocationId ? locations.findIndex(loc => loc.id === selectedLocationId) : -1;
      
      // 更新所有标记的颜色
      const jsCode = `
        (function() {
          try {
            if (typeof markers !== 'undefined' && markers && markers.length > 0) {
              const selectedId = '${selectedLocationId || ''}';
              
              // 更新所有标记的颜色
              markers.forEach((marker) => {
                if (marker && marker.div) {
                  // 使用 markerId 来判断是否选中
                  const isSelected = selectedId && (marker.markerId == selectedId || String(marker.markerId) === selectedId);
                  const bgColor = isSelected ? '#FF5100' : '#FFAE11';
                  
                  console.log('Updating marker', marker.markerId, 'selected:', isSelected, 'selectedId:', selectedId);
                  
                  // 更新背景颜色
                  const container = marker.div.querySelector('div');
                  if (container) {
                    container.style.backgroundColor = bgColor;
                    
                    // 更新三角形颜色
                    const triangle = container.querySelector('div[style*="border-top"]');
                    if (triangle) {
                      triangle.style.borderTopColor = bgColor;
                    }
                  }
                }
              });
              
              return 'Markers updated for selectedId: ' + selectedId;
            }
            return 'Markers not ready';
          } catch(e) {
            console.error('Error updating markers:', e);
            return 'Error: ' + e.message;
          }
        })();
      `;
      
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [selectedLocationId, mapReady, locations]);

  return (
    <View style={styles.container}>
      {mapHtml ? (
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          scrollEnabled={false}
          bounces={false}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView 加载错误:', nativeEvent);
          }}
        />
      ) : null}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5100" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
  },
});