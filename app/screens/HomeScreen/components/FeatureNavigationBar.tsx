import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { styles } from "../styles";

export const FeatureNavigationBar = React.memo(() => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useTranslation();

  const handleInternationalShipping = useCallback(() => {
    navigation.navigate("InternationalShipping");
  }, [navigation]);

  const handleTikTokSection = useCallback(() => {
    navigation.navigate("TikTokScreen");
  }, [navigation]);

  const handleGetQuote = useCallback(() => {
    navigation.navigate("GetQuote");
  }, [navigation]);

  return (
    <View style={styles.featureNavContainer}>
      <TouchableOpacity
        style={styles.featureNavItem}
        onPress={handleInternationalShipping}
        activeOpacity={0.7}
      >
        <View style={styles.featureNavIcon}>
          <Image
            source={require("../../../../assets/home/Frame (4).png")}
            style={{ width: 24, height: 24 }}
          />
        </View>
        <Text style={styles.featureNavText}>
          {t(
            "featureNav.internationalShipping",
            "Frais d'expédition\nInternational",
          )}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.featureNavItem}
        onPress={handleTikTokSection}
        activeOpacity={0.7}
      >
        <View style={styles.featureNavIcon}>
          <Image
            source={require("../../../../assets/home/Frame (5).png")}
            style={{ width: 24, height: 24 }}
          />
        </View>
        <Text style={styles.featureNavText}>
          {t("featureNav.tiktokSection", "Section TikTok")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.featureNavItem}
        onPress={handleGetQuote}
        activeOpacity={0.7}
      >
        <View style={styles.featureNavIcon}>
          <Image
            source={require("../../../../assets/home/Frame (6).png")}
            style={{ width: 24, height: 24 }}
          />
        </View>
        <Text style={styles.featureNavText}>
          {t("featureNav.getQuote", "Obtenir un devis")}
        </Text>
      </TouchableOpacity>
    </View>
  );
});