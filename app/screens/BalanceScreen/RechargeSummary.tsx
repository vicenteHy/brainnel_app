import React from "react";
import { View, Text, StyleSheet } from "react-native";
import fontSize from "../../utils/fontsizeUtils";
import { useTranslation } from "react-i18next";

interface RechargeSummaryProps {
  paymentParams: {
    originalAmount: number;
    amount: number;
    currency: string;
    payment_method: string;
    selectedPriceLabel: string;
  } | null;
}

const RechargeSummary: React.FC<RechargeSummaryProps> = ({ paymentParams }) => {
  const { t } = useTranslation();

  if (!paymentParams) {
    return null;
  }

  return (
    <View style={styles.paymentSummaryCard}>
      <Text style={styles.paymentSummaryTitle}>
        {t("balance.phone_modal.recharge_summary")}
      </Text>

      <View style={styles.paymentSummaryRow}>
        <Text style={styles.paymentSummaryLabel}>
          {t("balance.phone_modal.amount")}
        </Text>
        <Text style={styles.paymentSummaryValue}>
          {paymentParams.selectedPriceLabel || ""}
        </Text>
      </View>

      {paymentParams.payment_method === "wave" && (
        <View style={styles.paymentSummaryRow}>
          <Text style={styles.paymentSummaryLabel}>
            Montant converti:
          </Text>
          <Text style={styles.paymentSummaryValueHighlight}>
            {paymentParams.amount.toFixed(2)} FCFA
          </Text>
        </View>
      )}

      {paymentParams.currency !== "FCFA" &&
        paymentParams.payment_method !== "wave" && (
          <View style={styles.paymentSummaryRow}>
            <Text style={styles.paymentSummaryLabel}>
              {t("balance.phone_modal.converted_amount")}
            </Text>
            <Text style={styles.paymentSummaryValueHighlight}>
              {paymentParams.currency === "USD" ? "$" : "€"}
              {paymentParams.amount.toFixed(2) || "0.00"}
            </Text>
          </View>
        )}

      <View style={styles.paymentSummaryRow}>
        <Text style={styles.paymentSummaryLabel}>
          {t("balance.phone_modal.payment_method")}
        </Text>
        <Text style={styles.paymentSummaryValue}>
          {paymentParams.payment_method === "mobile_money" 
            ? t("balance.phone_modal.mobile_money") || "Mobile Money"
            : paymentParams.payment_method || "Non sélectionné"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentSummaryCard: {
    backgroundColor: "#f5f9ff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    fontSize: fontSize(18),
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  paymentSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentSummaryLabel: {
    fontSize: fontSize(14),
    color: "#666",
  },
  paymentSummaryValue: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "#333",
  },
  paymentSummaryValueHighlight: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#ff5100",
  },
});

export default RechargeSummary;