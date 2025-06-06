import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

type RootStackParamList = {
  MemberIntroduction: undefined;
};

interface VipCardProps {
  user: any;
}

export const VipCard: React.FC<VipCardProps> = ({ user }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const progress = user.next_level_points_threshold > 0 ? Math.min((user.points / user.next_level_points_threshold) * 100, 100) : 0;
  const remaining = user.next_level_points_threshold - user.points;

  return (
    <View style={styles.vipCard}>
      <View style={styles.vipCardTop}>
        <Text style={styles.vipCardTitle}>
          <Text style={styles.vipLevelTag}>VIP {user?.vip_level}</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("MemberIntroduction")}>
          <Text style={styles.vipCardLink}>{t('profile.vip.view_benefits')} {'>'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.vipProgressBarOuter}>
        <View style={[styles.vipProgressBarInner, { width: `${progress}%` }]} />
      </View>
      <View style={styles.vipProgressLabels}>
        <Text style={styles.vipProgressLabel}>VIP{user.vip_level}</Text>
        <Text style={styles.vipProgressPercentage}>{progress.toFixed(0)}%</Text>
        <Text style={styles.vipProgressLabel}>VIP{user.vip_level + 1}</Text>
      </View>
      <Text style={styles.vipBenefits}>
        {t('profile.vip.benefits_summary_prefix')}
        <Text style={styles.vipBenefitsHighlight}>{remaining}</Text>
        {t('profile.vip.benefits_summary_suffix')}
        <Text style={styles.vipBenefitsHighlight}>VIP{user.vip_level + 1}</Text>
      </Text>
    </View>
  );
}; 