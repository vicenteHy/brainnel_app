import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { CountryList } from "../../../../constants/countries";
import fontSize from "../../../../utils/fontsizeUtils";
import { useTranslation } from "react-i18next";

interface CountryModalProps {
  visible: boolean;
  onClose: () => void;
  countries: CountryList[];
  selectedCountry: CountryList | null;
  onSelectCountry: (country: CountryList) => void;
}

export const CountryModal: React.FC<CountryModalProps> = ({
  visible,
  onClose,
  countries,
  selectedCountry,
  onSelectCountry,
}) => {
  const { t } = useTranslation();

  const renderCountryItem = ({ item }: { item: CountryList }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => onSelectCountry(item)}
    >
      <Text style={styles.countryItemText}>{item.name}</Text>
      {selectedCountry?.country === item.country && (
        <Text style={styles.checkIcon}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("banner.shipping.select_country_modal_title")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseButton}>
                {t("banner.shipping.close")}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={countries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.country.toString()}
            style={styles.countryList}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1c284e",
  },
  modalCloseButton: {
    fontSize: fontSize(16),
    color: "#005EE4",
  },
  countryList: {
    paddingHorizontal: 16,
  },
  countryItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countryItemText: {
    fontSize: fontSize(16),
    color: "#1c284e",
  },
  checkIcon: {
    fontSize: fontSize(20),
    color: "#005EE4",
    fontWeight: "bold",
  },
});