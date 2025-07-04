import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import fontSize from "../../../utils/fontsizeUtils";
import CircleOutlineIcon from "../../../components/CircleOutlineIcon";
import OrangeCircleIcon from "../../../components/OrangeCircleIcon";
import { styles } from "../styles";
import { t } from "../../../i18n";

interface CartBottomProps {
  user_id: string | null;
  allSelected: boolean;
  totalAmount: number;
  currency: string;
  loading: boolean;
  onSelectAll: () => void;
  onSubmitOrder: () => void;
}

export const CartBottom: React.FC<CartBottomProps> = ({
  user_id,
  allSelected,
  totalAmount,
  currency,
  loading,
  onSelectAll,
  onSubmitOrder,
}) => {
  return (
    <View style={styles.fixedBottomContainer}>
      <View style={styles.flexboxContainerWithButton}>
        <View style={styles.productInfoContainer}>
          <TouchableOpacity
            onPress={user_id ? onSelectAll : undefined}
            disabled={!user_id}
          >
            <View style={styles.svgContainer1}>
              {allSelected ? (
                <OrangeCircleIcon size={fontSize(24)} />
              ) : (
                <CircleOutlineIcon size={fontSize(24)} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.bottomSelectAllText}>{t("cart.all")}</Text>
        </View>

        <View style={styles.productInfoContainer}>
          <View style={styles.productInfoContainer}>
            <Text style={styles.highlightedText1}>{totalAmount}</Text>
            <Text style={styles.priceLabel}>{currency}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.submitButtonStyle,
              !user_id && styles.disabledButton,
              loading && styles.disabledButton,
            ]}
            onPress={user_id && !loading ? onSubmitOrder : undefined}
            disabled={!user_id || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                style={{
                  color: "white",
                  fontSize: fontSize(18),
                  fontWeight: "700",
                }}
              >
                {t("cart.submit")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};