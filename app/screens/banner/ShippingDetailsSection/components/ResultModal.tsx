import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import fontSize from "../../../../utils/fontsizeUtils";
import { useTranslation } from "react-i18next";

interface ResultModalProps {
  visible: boolean;
  onClose: () => void;
  shippingFee: number | null;
  shippingCurrency: string;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  visible,
  onClose,
  shippingFee,
  shippingCurrency,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.resultModalContainer}>
        <View style={styles.resultModalContent}>
          <Text style={styles.resultTitle}>
            {t("banner.shipping.calculation_result")}
          </Text>
          <Text style={styles.resultText}>
            {t("banner.shipping.estimated_fee")}: {shippingFee !== null ? shippingFee.toFixed(2) : "0.00"}{" "}
            {shippingCurrency}
          </Text>
          <TouchableOpacity
            style={styles.resultCloseButton}
            onPress={onClose}
          >
            <Text style={styles.resultCloseButtonText}>
              {t("banner.shipping.confirm")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  resultModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1c284e",
    marginBottom: 15,
  },
  resultText: {
    fontSize: fontSize(16),
    color: "#1c284e",
    marginBottom: 20,
  },
  resultCloseButton: {
    backgroundColor: "#005EE4",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  resultCloseButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
});