import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import BackIcon from '../../../components/BackIcon';
import CameraIcon from '../../../components/CameraIcon';
import ShoppingCartIcon from '../../../components/ShoppingCartIcon';
import fontSize from '../../../utils/fontsizeUtils';
import { styles } from '../styles';

interface ProductHeaderProps {
  onBackPress: () => void;
  onSearchPress: () => void;
  onCameraPress: () => void;
  onCartPress: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  onBackPress,
  onSearchPress,
  onCameraPress,
  onCartPress,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.headerBox}>
      <TouchableOpacity style={styles.backIcon} onPress={onBackPress} activeOpacity={1}>
        <BackIcon size={fontSize(20)} />
      </TouchableOpacity>

      <View style={styles.search}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onSearchPress}
          activeOpacity={1}
        >
          <Text style={styles.searchText}>{t("search")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCameraPress}
          style={{ marginLeft: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={1}
        >
          <CameraIcon size={20} color="#747474" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cartIcon} onPress={onCartPress} activeOpacity={1}>
        <ShoppingCartIcon size={fontSize(20)} />
      </TouchableOpacity>
    </View>
  );
};