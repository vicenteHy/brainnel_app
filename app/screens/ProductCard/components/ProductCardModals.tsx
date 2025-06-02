import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import fontSize from "../../../utils/fontsizeUtils";
import widthUtils from "../../../utils/widthUtils";
import { t } from "../../../i18n";

interface ProductCardModalsProps {
  // 删除确认模态框
  deleteModalVisible: boolean;
  onCancelDelete: () => void;
  onNavigateToCart: () => void;
  
  // 自定义警告模态框
  alertModalVisible: boolean;
  alertMessage: {
    title: string;
    message: string;
  };
  onAlertConfirm: () => void;
  onAlertCancel: () => void;
  
  // 数量输入模态框
  quantityInputVisible: boolean;
  quantityInput: string;
  onQuantityInputChange: (text: string) => void;
  onQuantityInputConfirm: () => void;
  onQuantityInputCancel: () => void;
}

const ProductCardModals: React.FC<ProductCardModalsProps> = ({
  deleteModalVisible,
  onCancelDelete,
  onNavigateToCart,
  alertModalVisible,
  alertMessage,
  onAlertConfirm,
  onAlertCancel,
  quantityInputVisible,
  quantityInput,
  onQuantityInputChange,
  onQuantityInputConfirm,
  onQuantityInputCancel,
}) => {
  return (
    <>
      {/* 删除确认模态框 */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onCancelDelete}
      >
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.promptText}>{t("cart.enter_the_shopping_cart")}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton1}
                onPress={onCancelDelete}
              >
                <Text style={styles.cancelText}>{t("productCard.no")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onNavigateToCart}
              >
                <Text style={styles.confirmText}>
                  {t("productCard.viewCart")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 自定义警告模态框 */}
      <Modal
        visible={alertModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onAlertCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.promptText}>{alertMessage.title}</Text>
            <Text
              style={[
                styles.promptText,
                { fontSize: fontSize(16), marginTop: 10 },
              ]}
            >
              {alertMessage.message}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton1}
                onPress={onAlertCancel}
              >
                <Text style={styles.cancelText}>{t("productCard.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onAlertConfirm}
              >
                <Text style={styles.confirmText}>
                  {t("productCard.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 数量输入弹窗 */}
      <Modal
        visible={quantityInputVisible}
        transparent
        animationType="fade"
        onRequestClose={onQuantityInputCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.promptText}>
              {t("productCard.modifyQuantity")}
            </Text>
            <TextInput
              style={styles.quantityInput}
              value={quantityInput}
              onChangeText={onQuantityInputChange}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton1, { width: "45%" }]}
                onPress={onQuantityInputCancel}
              >
                <Text style={styles.cancelText}>{t("productCard.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { width: "45%", backgroundColor: "#ff5100" },
                ]}
                onPress={onQuantityInputConfirm}
              >
                <Text style={styles.confirmText}>
                  {t("productCard.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 27,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 21,
  },
  promptText: {
    fontSize: fontSize(20),
    fontWeight: "600",
    color: "black",
    fontFamily: "Segoe UI",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  cancelButton1: {
    width: widthUtils(50, 160).width,
    height: widthUtils(50, 160).height,
    borderRadius: 25,
    backgroundColor: "#f2f3f5",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButton: {
    width: widthUtils(50, 160).width,
    height: widthUtils(50, 160).height,
    borderRadius: 25,
    backgroundColor: "#002fa7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 20,
  },
  cancelText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#333333",
    fontFamily: "Source Han Sans CN",
  },
  confirmText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#ffffff",
    fontFamily: "Source Han Sans CN",
  },
  quantityInput: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: fontSize(16),
    textAlign: "center",
    fontFamily: "Segoe UI",
  },
});

export default ProductCardModals;