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
import { formatPrice } from "../../../utils/priceUtils";

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
            activeOpacity={1}
          >
            <View style={styles.iconContainer24}>
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
            <Text style={styles.highlightedText1}>{formatPrice(totalAmount, currency)}</Text>
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
            activeOpacity={1}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {t("cart.submit")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};