import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { InquiryItem } from './InquiryItem';
import fontSize from '../../../../utils/fontsizeUtils';

interface InquiryListProps {
  inquiries: any[];
  loading: boolean;
  hasMore: boolean;
  isCompleted?: boolean;
  expandedItems: {[key: string]: {link: boolean, remark: boolean}};
  onToggleExpanded: (inquiryId: string, type: 'link' | 'remark') => void;
  onScroll: (event: any) => void;
}

export const InquiryList: React.FC<InquiryListProps> = ({
  inquiries,
  loading,
  hasMore,
  isCompleted = false,
  expandedItems,
  onToggleExpanded,
  onScroll
}) => {
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {inquiries.length > 0 ? (
        <>
          {inquiries.map((inquiry, index) => (
            <InquiryItem
              key={inquiry.id || index}
              inquiry={inquiry}
              isCompleted={isCompleted}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
          
          {/* 底部加载更多 */}
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('banner.inquiry.loading')}</Text>
            </View>
          )}
          {!hasMore && inquiries.length > 0 && (
            <Text style={styles.noMoreText}>{t('banner.inquiry.no_more_data')}</Text>
          )}
        </>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('banner.inquiry.loading')}</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isCompleted 
              ? t('banner.inquiry.no_completed') 
              : t('banner.inquiry.no_in_progress')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#888",
    fontSize: fontSize(14),
  },
  noMoreText: {
    textAlign: "center",
    color: "#888",
    fontSize: fontSize(14),
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginTop: 50,
    minHeight: 200,
  },
  emptyText: {
    color: "#999999",
    fontSize: fontSize(15),
    textAlign: "center",
  },
});