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
                activeOpacity={1}
              >
                <Text style={styles.cancelText}>{t("productCard.continueShopping")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onNavigateToCart}
                activeOpacity={1}
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
            {/* 检查是否是数量为0的提示，如果是则只显示一个按钮 */}
            {alertMessage.message.includes("quantity is 0") || 
             alertMessage.message.includes("quantité actuelle est 0") ? (
              <View style={[styles.buttonContainer, { justifyContent: "center" }]}>
                <TouchableOpacity
                  style={[styles.confirmButton, { flex: 0, minWidth: 200 }]}
                  onPress={onAlertConfirm}
                  activeOpacity={1}
                >
                  <Text style={styles.confirmText}>
                    {t("productCard.addProducts")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton1}
                  onPress={onAlertCancel}
                  activeOpacity={1}
                >
                  <Text style={styles.cancelText}>{t("productCard.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={onAlertConfirm}
                  activeOpacity={1}
                >
                  <Text style={styles.confirmText}>
                    {t("productCard.confirm")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
                activeOpacity={1}
              >
                <Text style={styles.cancelText}>{t("productCard.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { width: "45%", backgroundColor: "#ff5100" },
                ]}
                onPress={onQuantityInputConfirm}
                activeOpacity={1}
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
    backgroundColor: "#00000066",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    backgroundColor: "white",
    borderRadius: 15,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: "center",
    width: "90%",
    maxWidth: 380,
    minWidth: 300,
  },
  promptText: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "black",
    textAlign: "center",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  cancelButton1: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f2f3f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 15,
  },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF5100",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  cancelText: {
    fontSize: fontSize(15),
    fontWeight: "500",
    color: "#333333",
    textAlign: "center",
  },
  confirmText: {
    fontSize: fontSize(15),
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "center",
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
    color: "#000000",
  },
});

export default ProductCardModals;