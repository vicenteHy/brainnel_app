import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import WithdrawalSuccessModal from './WithdrawalSuccessModal';
import WaveWithdrawalModal from './WaveWithdrawalModal';
import WavePendingModal from './WavePendingModal';
import { initiateWithdrawal } from '../../services/api/activity';
const { width: screenWidth } = Dimensions.get('window');

const WithdrawalScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<'brainnel' | 'wave' | null>('brainnel');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [showWavePendingModal, setShowWavePendingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '3000 FCFA',
    transactionFee: '2000 FCFA',
    phoneNumber: ''
  });

  // 处理提现请求
  const handleWithdrawal = async (withdrawalAccount: string) => {
    console.log('=== handleWithdrawal 被调用了 ===', withdrawalAccount);
    setIsLoading(true);
    try {
      const response = await initiateWithdrawal({
        amount: 5000, // 固定金额
        withdrawal_method: selectedMethod === 'brainnel' ? 'balance' : 'wave',
        withdrawal_account: withdrawalAccount,
      });

      console.log('提现响应:', response);

      // 根据不同的状态处理
      switch (response.status) {
        case 'paid':
          // 已支付，显示成功弹窗
          setShowSuccessModal(true);
          break;
        case 'pending':
          // 对于Wave提现，显示pending弹窗
          if (selectedMethod === 'wave') {
            console.log('=== 准备显示 WavePendingModal ===');
            setWithdrawalData(prev => ({
              ...prev,
              phoneNumber: '+' + withdrawalAccount
            }));
            setShowWavePendingModal(true);
          } else {
            Alert.alert(
              t('提现处理中'),
              t('您的提现申请正在处理中，请稍后查看状态。'),
              [{ text: t('确定'), onPress: () => navigation.goBack() }]
            );
          }
          break;
        case 'approved':
          Alert.alert(
            t('提现已批准'),
            t('您的提现申请已批准，正在处理付款。'),
            [{ text: t('确定'), onPress: () => navigation.goBack() }]
          );
          break;
        case 'rejected':
          Alert.alert(
            t('提现失败'),
            t('您的提现申请被拒绝，请联系客服了解详情。'),
            [{ text: t('确定') }]
          );
          break;
        default:
          Alert.alert(t('错误'), t('未知的提现状态'));
      }
    } catch (error) {
      console.error('提现失败:', error);
      Alert.alert(
        t('提现失败'),
        t('提现请求失败，请稍后重试。'),
        [{ text: t('确定') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5DB" />
      

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 头部背景 */}
        <ImageBackground
          source={require('../../../assets/img/withdrawal/headerBg.png')}
          style={styles.headerBg}
          resizeMode="cover"
        >
          {/* 导航栏 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Options de retrait</Text>
            <View style={styles.headerRight}>
              <Text style={styles.rulesText}>Règles</Text>
              <Text style={styles.separator}> ｜ </Text>
              <Text style={styles.detailsText}>Détails</Text>
            </View>
          </View>

          {/* 余额卡片 */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceAmount}>5,000 FCFA</Text>
            <Text style={styles.availableText}>Disponible pour le retrait</Text>
          </View>
        </ImageBackground>

        {/* 主体内容 */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Choisissez votre méthode de retrait</Text>

          {/* Brainnel 钱包选项 - 第一个选项 */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'brainnel' && styles.methodCardSelected]}
            onPress={() => setSelectedMethod('brainnel')}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../../assets/img/withdrawal/waveMoney.png')}
              style={styles.waveImage}
              resizeMode="stretch"
            />
          </TouchableOpacity>

          {/* Wave Money 选项 - 第二个选项 */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'wave' && styles.methodCardSelected]}
            onPress={() => setSelectedMethod('wave')}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../../assets/img/withdrawal/brainnelWallet.png')}
              style={styles.brainnelImage}
              resizeMode="stretch"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.confirmButton, (!selectedMethod || isLoading) && styles.confirmButtonDisabled]}
          disabled={!selectedMethod || isLoading}
          onPress={() => {
            // 处理提现确认
            if (selectedMethod === 'brainnel') {
              // balance支付，直接调用API
              handleWithdrawal('string');
            } else if (selectedMethod === 'wave') {
              // Wave支付，先显示输入电话号码的弹窗
              setShowWaveModal(true);
            }
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmer le retrait</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 提现成功弹窗 */}
      <WithdrawalSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onViewBalance={() => {
          setShowSuccessModal(false);
          // 导航到个人中心页面
          navigation.navigate('Profile' as any);
        }}
      />
      
      {/* Wave提现弹窗 */}
      <WaveWithdrawalModal
        visible={showWaveModal}
        onClose={() => setShowWaveModal(false)}
        onConfirm={(phoneNumber) => {
          console.log('=== WaveWithdrawalModal onConfirm 被调用 ===', phoneNumber);
          // 保存电话号码到状态
          const cleanPhoneNumber = phoneNumber.replace('+', '');
          setWithdrawalData(prev => ({
            ...prev,
            phoneNumber: phoneNumber
          }));
          
          // 关闭Wave输入弹窗
          setShowWaveModal(false);
          
          // 调用handleWithdrawal发起支付请求
          handleWithdrawal(cleanPhoneNumber);
        }}
      />

      {/* Wave Pending弹窗 */}
      <WavePendingModal
        visible={showWavePendingModal}
        onClose={() => {
          setShowWavePendingModal(false);
          // 跳转到首页
          navigation.navigate('MainTabs', { screen: 'Home' });
        }}
        amount={withdrawalData.amount}
        transactionFee={withdrawalData.transactionFee}
        phoneNumber={withdrawalData.phoneNumber}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5DB',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  headerBg: {
    width: screenWidth,
    height: 191,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulesText: {
    fontSize: 14,
    color: '#AE8623',
  },
  separator: {
    color: '#AE8623',
    fontSize: 14,
  },
  detailsText: {
    fontSize: 14,
    color: '#AE8623',
  },
  balanceCard: {
    alignItems: 'center',
    marginTop: 16,
  },
  balanceAmount: {
    fontSize: 33,
    fontWeight: '600',
    color: '#FF5100',
    marginTop: 10,
  },
  availableText: {
    fontSize: 14,
    color: '#550C21',
    marginTop: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 20,
  },
  methodCard: {
    marginBottom: 11,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  methodCardSelected: {
    borderWidth: 2,
    borderColor: '#FF5100',
  },
  methodCardBg: {
    width: '100%',
    height: 180,
  },
  methodImage: {
    width: '100%',
    height: 180,
  },
  brainnelImage: {
    width: '100%',
    height: 180,
  },
  waveImage: {
    width: '100%',
    height: 216,
  },
  methodContent: {
    padding: 20,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFEDE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waveIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waveIcon: {
    width: 24,
    height: 24,
  },
  waveIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  thumbIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbEmoji: {
    fontSize: 20,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  methodFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 12,
  },
  methodInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  methodInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  methodInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  methodInfoValueFree: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5100',
  },
  methodInfoValueFee: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5100',
  },
  methodDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  waveNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    lineHeight: 16,
  },
  bottomContainer: {
    paddingHorizontal: 38,
    paddingBottom: 34,
    paddingTop: 24,
    backgroundColor: '#FFF5DB',
  },
  confirmButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5100',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFF',
  },
});

export default WithdrawalScreen;