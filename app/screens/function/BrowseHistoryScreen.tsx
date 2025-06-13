import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import widthUtils from "../../utils/widthUtils";
import { useBrowseHistoryStore, BrowseHistoryItem } from "../../store/browseHistory";
import { useTranslation } from "react-i18next";
import Ionicons from '@expo/vector-icons/Ionicons';
import { ConfirmModal } from "../../components/ConfirmModal";


export function BrowseHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'date'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { 
    items, 
    loading, 
    loadHistory, 
    removeBrowseItem, 
    clearHistory, 
    getHistoryByDate 
  } = useBrowseHistoryStore();

  useEffect(() => {
    loadHistory();
  }, []);



  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      setViewMode('date');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDeleteItem = (productId: string) => {
    setItemToDelete(productId);
    setShowDeleteModal(true);
  };

  const handleClearAll = () => {
    setShowClearAllModal(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      removeBrowseItem(itemToDelete);
      setItemToDelete(null);
    }
    setShowDeleteModal(false);
  };

  const confirmClearAll = () => {
    clearHistory();
    setShowClearAllModal(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('common.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('common.yesterday');
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const displayItems = viewMode === 'all' ? items : getHistoryByDate(date);

  const renderItem = ({ item }: { item: BrowseHistoryItem }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => navigation.navigate('ProductDetail', { offer_id: item.product_id, price: item.price })}
    >
      <Image source={{ uri: item.product_image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={2}>{item.product_name}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.product_id)}
          >
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.price}>{item.currency} {item.price.toFixed(2)}</Text>
          <Text style={styles.time}>
            {formatDate(item.browse_time)} {formatTime(item.browse_time)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );




  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackIcon size={fontSize(22)} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('history.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, viewMode === 'all' && styles.filterButtonActive]}
              onPress={() => setViewMode('all')}
            >
              <Text style={[styles.filterButtonText, viewMode === 'all' && styles.filterButtonTextActive]}>
                {t('common.all')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, viewMode === 'date' && styles.filterButtonActive]}
              onPress={() => setShow(true)}
            >
              <Text style={[styles.filterButtonText, viewMode === 'date' && styles.filterButtonTextActive]}>
                {viewMode === 'date' ? date.toLocaleDateString('zh-CN') : t('history.filter_by_date')}
              </Text>
            </TouchableOpacity>
          </View>
          {items.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Text style={styles.clearButtonText}>{t('history.clear_all')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChange}
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5100" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={displayItems}
            keyExtractor={(item) => `${item.product_id}_${item.browse_time}`}
            contentContainerStyle={styles.list}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#FF5100']}
                tintColor={'#FF5100'}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={64} color="#ccc" />
                <Text style={styles.empty}>
                  {viewMode === 'date' 
                    ? t('history.no_records_for_date')
                    : t('history.no_records')
                  }
                </Text>
                <Text style={styles.emptySubtext}>
                  {t('history.start_browsing')}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Delete Item Modal */}
        <ConfirmModal
          visible={showDeleteModal}
          title={t('common.delete')}
          message={t('history.confirm_delete')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          onConfirm={confirmDeleteItem}
          onCancel={() => setShowDeleteModal(false)}
          isDestructive={true}
        />

        {/* Clear All Modal */}
        <ConfirmModal
          visible={showClearAllModal}
          title={t('history.clear_all')}
          message={t('history.confirm_clear_all')}
          confirmText={t('history.clear_all')}
          cancelText={t('common.cancel')}
          onConfirm={confirmClearAll}
          onCancel={() => setShowClearAllModal(false)}
          isDestructive={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: widthUtils(24,24).width,
  },
  title: {
    fontSize: fontSize(20),
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    color: '#333',
  },
  placeholder: {
    width: widthUtils(24,24).width,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 2,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    marginHorizontal: 2,
  },
  filterButtonActive: {
    backgroundColor: '#FF5100',
  },
  filterButtonText: {
    fontSize: fontSize(14),
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: fontSize(14),
    color: '#FF5100',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: fontSize(16),
    color: '#666',
    marginTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  image: {
    width: widthUtils(70,70).width,
    height: widthUtils(70,70).height,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  price: {
    fontSize: fontSize(16),
    fontWeight: "bold",
    color: "#FF5100",
  },
  time: {
    fontSize: fontSize(12),
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  empty: {
    textAlign: "center",
    color: "#999",
    fontSize: fontSize(16),
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#ccc",
    fontSize: fontSize(14),
    marginTop: 8,
  },
});
