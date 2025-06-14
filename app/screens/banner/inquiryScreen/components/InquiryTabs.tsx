import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import fontSize from '../../../../utils/fontsizeUtils';
import widthUtils from '../../../../utils/widthUtils';

interface InquiryTabsProps {
  activeTab: number;
  onTabChange: (tabId: number) => void;
}

export const InquiryTabs: React.FC<InquiryTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const tabs = [
    { label: t('banner.inquiry.tab_request'), id: 0 },
    { label: t('banner.inquiry.tab_in_progress'), id: 1 },
    { label: t('banner.inquiry.tab_completed'), id: 2 }
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabChange(tab.id)}
          style={[
            styles.tabButton,
            activeTab === tab.id && styles.activeTabButton
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === tab.id && styles.activeTabButtonText
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 20,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    height: 42,
    backgroundColor: "#f0f0f0",
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  activeTabButton: {
    backgroundColor: "#1976D2",
    shadowColor: "#1976D2",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tabButtonText: {
    color: "#666666",
    fontWeight: "500",
    fontSize: fontSize(14),
  },
  activeTabButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});