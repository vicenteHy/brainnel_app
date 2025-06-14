import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Linking,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import fontSize from "../../utils/fontsizeUtils";

export const OfflinePayment = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleWhatsAppContact = () => {
    const phoneNumber = "8613777407165";
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      // 如果无法打开WhatsApp，尝试使用系统默认方式
      Linking.openURL(`tel:+${phoneNumber}`);
    });
  };

  const copyToClipboard = (text: string) => {
    // 显示提示信息，用户可以手动复制
    Alert.alert(
      t("offline_payment.copy_info") || "Copy Information",
      `${text}\n\n${t("offline_payment.manual_copy") || "Please copy this information manually"}`,
      [
        { text: t("offline_payment.ok") || "OK", style: "default" }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("offline_payment.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SEPA 支付系统 */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={24} color="#007efa" />
            <Text style={styles.cardTitle}>{t("offline_payment.sepa_title")}</Text>
          </View>
          
          <Text style={styles.cardSubtitle}>{t("offline_payment.sepa_subtitle")}</Text>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.beneficiary_name")}:</Text>
              <Text style={styles.value}>Brainstorm (Group) Holding Limited</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.account_number")}:</Text>
              <TouchableOpacity onPress={() => copyToClipboard("IE67CHAS93090301115654")}>
                <Text style={[styles.value, styles.copyableText]}>IE67CHAS93090301115654</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.swift_code")}:</Text>
              <TouchableOpacity onPress={() => copyToClipboard("CHASIE4L")}>
                <Text style={[styles.value, styles.copyableText]}>CHASIE4L</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.bank_name")}:</Text>
              <Text style={styles.value}>J.P. MORGAN BANK LUXEMBOURG S.A., DUBLIN BRANCH</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.address")}:</Text>
              <Text style={styles.value}>200 Capital Dock 79 Sir John Rogersons Quay Dublin 2 D02 RK57</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.country")}:</Text>
              <Text style={styles.value}>IE</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.accepted_currency")}:</Text>
              <Text style={[styles.value, styles.currency]}>EUR</Text>
            </View>
          </View>
          
          <View style={styles.feeSection}>
            <Text style={styles.feeText}>{t("offline_payment.processing_fee")}: 0%</Text>
          </View>
        </View>

        {/* Global 支付系统 */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe-outline" size={24} color="#007efa" />
            <Text style={styles.cardTitle}>{t("offline_payment.global_title")}</Text>
          </View>
          
          <Text style={styles.cardSubtitle}>{t("offline_payment.global_subtitle")}</Text>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.beneficiary_name")}:</Text>
              <Text style={styles.value}>Brainstorm (Group) Holding Limited</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.currencies")}:</Text>
              <Text style={[styles.value, styles.currency]}>EUR, USD, HKD, GBP, CNH, CAD, SGD, JPY, AUD, NZD</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.account_number")}:</Text>
              <TouchableOpacity onPress={() => copyToClipboard("63003662130")}>
                <Text style={[styles.value, styles.copyableText]}>63003662130</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.swift_code")}:</Text>
              <TouchableOpacity onPress={() => copyToClipboard("CHASHKHH")}>
                <Text style={[styles.value, styles.copyableText]}>CHASHKHH</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.bank_code")}:</Text>
              <TouchableOpacity onPress={() => copyToClipboard("007")}>
                <Text style={[styles.value, styles.copyableText]}>007</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.branch_code")}:</Text>
              <TouchableOpacity onPress={() => copyToClipboard("863")}>
                <Text style={[styles.value, styles.copyableText]}>863</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.bank_name")}:</Text>
              <Text style={styles.value}>JPMorgan Chase Bank N.A., Hong Kong Branch</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("offline_payment.bank_address")}:</Text>
              <Text style={styles.value}>18/F, 20/F, 22-29/F, CHATER HOUSE, 8 CONNAUGHT ROAD CENTRAL, HONG KONG</Text>
            </View>
          </View>
          
          <View style={styles.feeSection}>
            <Text style={styles.feeText}>{t("offline_payment.processing_fee")}: 0%</Text>
          </View>
        </View>

        {/* 联系方式 */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Ionicons name="help-circle-outline" size={24} color="#007efa" />
            <Text style={styles.contactTitle}>{t("offline_payment.need_help")}</Text>
          </View>
          
          <Text style={styles.contactMessage}>{t("offline_payment.contact_message")}</Text>
          
          <TouchableOpacity 
            style={styles.whatsappButton}
            onPress={handleWhatsAppContact}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.whatsappText}>{t("offline_payment.contact_whatsapp")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1e293b",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  paymentCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: fontSize(14),
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 4,
  },
  value: {
    fontSize: fontSize(14),
    color: "#1e293b",
    lineHeight: 20,
  },
  copyableText: {
    color: "#007efa",
    textDecorationLine: "underline",
  },
  currency: {
    fontWeight: "600",
    color: "#059669",
  },
  feeSection: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  feeText: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#059669",
  },
  contactCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  contactMessage: {
    fontSize: fontSize(14),
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#25D366",
  },
  whatsappText: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#25D366",
    marginLeft: 8,
  },
});