import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import IconComponent from "../../../components/IconComponent";
import { modalStyles } from "../styles";
import { t } from "../../../i18n";

interface CartModalsProps {
  deleteModalVisible: boolean;
  minQuantityModalVisible: boolean;
  minQuantityMessage: string;
  quantityInputModalVisible: boolean;
  quantityInput: string;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onCloseMinQuantityModal: () => void;
  onQuantityInputChange: (text: string) => void;
  onQuantityInputConfirm: () => void;
  onQuantityInputCancel: () => void;
  user_id: string | null;
}

export const CartModals: React.FC<CartModalsProps> = ({
  deleteModalVisible,
  minQuantityModalVisible,
  minQuantityMessage,
  quantityInputModalVisible,
  quantityInput,
  onConfirmDelete,
  onCancelDelete,
  onCloseMinQuantityModal,
  onQuantityInputChange,
  onQuantityInputConfirm,
  onQuantityInputCancel,
  user_id,
}) => {
  return (
    <>
      {/* Delete confirmation modal */}
      <Modal
        visible={deleteModalVisible && !!user_id}
        transparent
        animationType="fade"
        onRequestClose={onCancelDelete}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.popup}>
            <Text style={modalStyles.promptText}>{t("cart.delete_item")}</Text>
            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity
                style={modalStyles.cancelButton1}
                onPress={onCancelDelete}
                activeOpacity={1}
              >
                <Text style={modalStyles.cancelText}>{t("cart.no")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.confirmButton}
                onPress={onConfirmDelete}
                activeOpacity={1}
              >
                <Text style={modalStyles.confirmText}>{t("cart.yes")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Minimum quantity notification modal */}
      <Modal
        visible={minQuantityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseMinQuantityModal}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.popup, modalStyles.minQuantityPopup]}>
            <View style={modalStyles.warningIconContainer}>
              <IconComponent name="exclamation" size={28} color="#FF5100" />
            </View>
            <Text style={[modalStyles.promptText, modalStyles.minQuantityText]}>
              {minQuantityMessage}
            </Text>
            <TouchableOpacity
              style={[modalStyles.confirmButton, modalStyles.minQuantityButton]}
              onPress={onCloseMinQuantityModal}
              activeOpacity={1}
            >
              <Text style={[modalStyles.confirmText, modalStyles.minQuantityButtonText]}>
                {t("cart.confirm")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quantity input modal */}
      <Modal
        visible={quantityInputModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onQuantityInputCancel}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.quantityInputPopup}>
            <Text style={modalStyles.quantityInputTitle}>
              {t("cart.modify_quantity")}
            </Text>
            <TextInput
              style={modalStyles.quantityInputField}
              value={quantityInput}
              onChangeText={onQuantityInputChange}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={modalStyles.quantityInputButtonContainer}>
              <TouchableOpacity
                style={modalStyles.quantityInputCancelButton}
                onPress={onQuantityInputCancel}
                activeOpacity={1}
              >
                <Text style={modalStyles.quantityInputCancelText}>
                  {t("cart.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.quantityInputConfirmButton}
                onPress={onQuantityInputConfirm}
                activeOpacity={1}
              >
                <Text style={modalStyles.quantityInputConfirmText}>
                  {t("cart.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};