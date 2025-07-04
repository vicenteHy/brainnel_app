import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  StyleSheet
} from 'react-native';
import { useTranslation } from 'react-i18next';
import fontSize from '../../utils/fontsizeUtils';

interface InsuranceExplainProps {
  visible: boolean;
  onClose: () => void;
}

export const InsuranceExplain: React.FC<InsuranceExplainProps> = ({
  visible,
  onClose
}) => {
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // 计算弹窗尺寸：90%宽度，60%高度
  const modalWidth = screenWidth * 0.9;
  const modalHeight = screenHeight * 0.6;

  const scenarios = [
    {
      leftIcon: require('../../../assets/insurance/left_1.png'),
      leftText: t('shipping_insurance.modal.scenarios.lost_by_carrier')
    },
    {
      leftIcon: require('../../../assets/insurance/left_2.png'),
      leftText: t('shipping_insurance.modal.scenarios.received_wrong_item')
    },
    {
      leftIcon: require('../../../assets/insurance/left_3.png'),
      leftText: t('shipping_insurance.modal.scenarios.damaged_in_transit')
    },
    {
      leftIcon: require('../../../assets/insurance/left_4.png'),
      leftText: t('shipping_insurance.modal.scenarios.received_wrong_item_2')
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer,
          {
            width: modalWidth,
            height: modalHeight
          }
        ]}>
          {/* 标题栏 */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('shipping_insurance.modal.title')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={1}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* 分割线 */}
          <View style={styles.separator} />

          <View style={styles.content}>
            {/* 对比部分 - 贴纸层叠设计 */}
            <View style={styles.comparisonContainer}>
              {/* 底部灰色矩形 + 白色矩形组合 */}
              <View style={styles.bottomCard}>
                {/* 白色矩形覆盖在灰色矩形上 */}
                <View style={styles.topCard}>
                  {/* 左侧：Without Protection */}
                  <View style={styles.leftSection}>
                    <Text style={styles.columnTitle}>
                      {t('shipping_insurance.modal.without_protection')}
                    </Text>
                    {scenarios.map((scenario, index) => (
                      <View key={index} style={styles.scenarioItem}>
                        <Image source={scenario.leftIcon} style={styles.scenarioIcon} />
                        <Text style={styles.scenarioText}>{scenario.leftText}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* 独立的右侧黄色贴纸 */}
              <View style={styles.rightCard}>
                <Text style={[styles.columnTitle, styles.rightColumnTitle]}>
                  {t('shipping_insurance.modal.with_protection')}
                </Text>
                {scenarios.map((_, index) => (
                  <View key={index} style={styles.protectionItem}>
                    <Image 
                      source={require('../../../assets/insurance/right.png')} 
                      style={styles.scenarioIcon} 
                    />
                    <Text style={styles.refundText}>
                      {t('shipping_insurance.modal.we_will_refund')}
                    </Text>
                  </View>
                ))}
                {/* 大拇指背景图片 */}
                <Image 
                  source={require('../../../assets/insurance/thumb.png')} 
                  style={styles.thumbBackground} 
                />
              </View>
            </View>

            {/* How it works 部分 */}
            <ScrollView 
              style={styles.howItWorksContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.howItWorksTitle}>
                {t('shipping_insurance.modal.how_it_works')}
              </Text>
              
              <View style={styles.workItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.workText}>
                  {t('shipping_insurance.modal.service_fee')}
                </Text>
              </View>
              
              <View style={styles.workItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.workText}>
                  {t('shipping_insurance.modal.file_claim')}
                </Text>
              </View>
              
              <View style={styles.workItem}>
                <Text style={[styles.bullet, styles.importantBullet]}>•</Text>
                <View style={styles.importantHangingContainer}>
                  <Text style={styles.importantLabel}>
                    {t('shipping_insurance.modal.important_label')}{' '}
                  </Text>
                  <Text style={styles.importantText}>
                    {t('shipping_insurance.modal.important_text')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.workItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.workText}>
                  {t('shipping_insurance.modal.refunds_wallet')}
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* 底部按钮 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.shopButton} onPress={onClose} activeOpacity={1}>
              <Text style={styles.shopButtonText}>
                {t('shipping_insurance.modal.shop_now')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    overflow: 'visible',

  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F6F6F6',
    marginHorizontal: -16,
    marginBottom: 10,
    },
  title: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    paddingRight: 0, // 为了平衡关闭按钮
  },
  closeButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: fontSize(18),
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  comparisonContainer: {
    marginBottom: 24,
    position: 'relative',
    overflow: 'visible',
    paddingRight: 20,
  },
  bottomCard: {
    backgroundColor: '#F6F6F6',
    borderColor: '#ECECEC',
    borderWidth: 1,
    borderRadius: 16,
    top: 10,
    height: 180,
    position: 'relative',
    shadowColor: '#000000',
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  }, 
  topCard: {
    position: 'absolute',
    left: 8,
    top: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  rightCard: {
    position: 'absolute',
    right: 0,
    top: 5,
    paddingLeft: 10,
    width: '52%',
    height: 190,
    backgroundColor: '#FFF5DB',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    zIndex: 10,
    // iOS 阴影
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    // Android 阴影
    elevation: 3,
  },
  leftSection: {
    flex: 1,
    paddingRight: 10,
  },
  thumbBackground: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    width: 100,
    height: 100,
    zIndex: 10,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'left',
    paddingLeft: 10,
  },
  rightColumnTitle: {
    top: 8,
    textAlign: 'left',
    paddingLeft: 10,
    marginBottom: 20,
    color: '#FF5100',
  },
  scenarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 0,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 2,
    paddingLeft: 10,
  },
  scenarioIcon: {
    width: 21,
    height: 21,
    marginRight: 4,
  },
  scenarioText: {
    fontSize: fontSize(11),
    fontWeight: '400',
    color: '#374151',
    flex: 1,
  },
  refundText: {
    fontSize: fontSize(11),
    color: '#FF5100',
    fontWeight: '700',
    flex: 1,
  },
  howItWorksContainer: {
    paddingTop: 10,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  workItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: fontSize(18),
    color: '#FF5100',
    marginRight: 2,
    lineHeight: 20,
  },
  importantBullet: {
    color: '#FF5100',
  },
  workText: {
    fontSize: fontSize(12),
    color: '#666666',
    flex: 1,
    lineHeight: 20,
  },
  importantLabel: {
    color: '#FF5100',
    fontWeight: '600',
  },
  importantText: {
    color: '#000000',
    fontWeight: '400',
    fontSize: fontSize(12),
    lineHeight: 20,
    flex: 1,
  },
  importantHangingContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
 
  shopButton: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopButtonText: {
    color: 'white',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
});