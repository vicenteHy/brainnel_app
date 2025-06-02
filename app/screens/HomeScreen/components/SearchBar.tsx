import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, InteractionManager } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "../styles";

type IconProps = {
  name: string;
  size: number;
  color: string;
};

const IconComponent = React.memo(({ name, size, color }: IconProps) => {
  const Icon = Ionicons as any;
  return <Icon name={name} size={size} color={color} />;
});

interface SearchBarProps {
  onCameraPress: () => void;
}

export const SearchBar = React.memo(
  ({ onCameraPress }: SearchBarProps) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { t } = useTranslation();

    const navigateToSearch = useCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate("Search");
      });
    }, [navigation]);

    return (
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={navigateToSearch}
        >
          <Text style={styles.searchPlaceholder}>
            {t("homePage.searchPlaceholder")}
          </Text>
          <TouchableOpacity style={styles.cameraButton} onPress={onCameraPress}>
            <IconComponent name="camera-outline" size={30} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={navigateToSearch}
          >
            <IconComponent name="search-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.onCameraPress === nextProps.onCameraPress;
  },
);