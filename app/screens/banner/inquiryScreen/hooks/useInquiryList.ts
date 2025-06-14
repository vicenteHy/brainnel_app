import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { inquiriesApi } from '../../../../services/api/inquiries';

export const useInquiryList = (activeTab: number) => {
  const { t } = useTranslation();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [completedInquiries, setCompletedInquiries] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: {link: boolean, remark: boolean}}>({});

  const toggleExpanded = (inquiryId: string, type: 'link' | 'remark') => {
    setExpandedItems(prev => ({
      ...prev,
      [inquiryId]: {
        ...prev[inquiryId],
        [type]: !prev[inquiryId]?.[type]
      }
    }));
  };

  const fetchInquiries = async (pageNum = 1, refresh = false) => {
    try {
      if (!hasMore && !refresh) return;
      
      setLoading(true);
      // 根据activeTab传递正确的status参数
      const status = activeTab === 1 ? 1 : 2;
      const response = await inquiriesApi.getInquiries(pageNum, 10, status);
      console.log("Inquiries fetched:", response);
      
      // 不需要再次过滤，因为API已经返回了正确状态的数据
      const inquiryData = response.items;
          
      if (inquiryData && inquiryData.length >= 0) {
        if (refresh) {
          if (activeTab === 1) {
            setInquiries(inquiryData);
          } else {
            setCompletedInquiries(inquiryData);
          }
        } else {
          if (activeTab === 1) {
            setInquiries(prev => [...prev, ...inquiryData]);
          } else {
            setCompletedInquiries(prev => [...prev, ...inquiryData]);
          }
        }
        
        setHasMore(inquiryData.length > 0);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      Alert.alert(t('banner.inquiry.error'), t('banner.inquiry.fetch_failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    fetchInquiries(page + 1);
  };

  const handleScroll = (event: any) => {
    if ((activeTab !== 1 && activeTab !== 2) || loading || !hasMore) return;
    
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= 
        contentSize.height - paddingToBottom) {
      handleLoadMore();
    }
  };

  useEffect(() => {
    if (activeTab === 1 || activeTab === 2) {
      fetchInquiries(1, true);
    }
  }, [activeTab]);

  return {
    inquiries: activeTab === 1 ? inquiries : completedInquiries,
    loading,
    hasMore,
    expandedItems,
    toggleExpanded,
    handleScroll,
  };
};