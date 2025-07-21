import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose }) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const handleClose = () => {
    fadeAnim.value = withTiming(0, { duration: 300 });
    scaleAnim.value = withTiming(0.8, { duration: 300 });
    
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* 黑色半透明背景 */}
        <View style={styles.overlay} />
        
        <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.modalContent, contentAnimatedStyle]}>
            {/* 主背景 - 米色背景 */}
            <View style={styles.mainBackground}>
              {/* 圆角矩形背景 */}
              <View style={styles.backgroundShape} />
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Règles</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* 内容容器 */}
              <View style={styles.innerContentContainer}>
                {/* 白色内容背景 */}
                <View style={styles.contentBackground}>
                  <ScrollView 
                    style={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* I. Comment jouer ? */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>I. Comment jouer ?</Text>
                      
                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Bonus de Démarrage</Text>
                        <Text style={styles.bulletPoint}>• Tournez la roue sur la page d'accueil pour gagner jusqu'à 4 000 FCFA.</Text>
                        <Text style={styles.bulletPoint}>• Ouvrez votre coffret cadeau de bienvenue pour recevoir jusqu'à 500 FCFA supplémentaires.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Jeu de Forage</Text>
                        <Text style={styles.bulletPoint}>• Cliquez sur le bouton "Forer" pour jouer et tenter de gagner du cash à chaque essai.</Text>
                        <Text style={styles.bulletPoint}>• Chaque utilisateur dispose de 2 essais gratuits au départ.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Obtenir plus d'essais</Text>
                        <Text style={styles.bulletPoint}>• Après vos essais gratuits, invitez des amis pour continuer à jouer.</Text>
                        <Text style={styles.bulletPoint}>• Partagez votre lien d'invitation. Votre ami doit télécharger et s'inscrire via votre lien pour que l'aide soit validée.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Fonctionnement de l'aide</Text>
                        <Text style={styles.bulletPoint}>• L'aide d'un ami vous donne soit un essai de jeu, soit des "points de chance" pour augmenter vos gains.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Missions de l'App</Text>
                        <Text style={styles.bulletPoint}>• Accomplissez les missions du "Centre de Tâches" pour gagner encore plus de cash.</Text>
                      </View>
                    </View>

                    {/* II. Récompenses et Retrait */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>II. Récompenses et Retrait</Text>
                      
                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Condition de Retrait</Text>
                        <Text style={styles.bulletPoint}>• Le retrait n'est possible que lorsque votre solde atteint exactement 5 000 FCFA.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Moyens de Retrait</Text>
                        <Text style={styles.bulletPoint}>• <Text style={styles.highlight}>Portefeuille App</Text> : Instantané et sans frais. (Recommandé)</Text>
                        <Text style={styles.bulletPoint}>• <Text style={styles.highlight}>Compte Wave</Text> :</Text>
                        <Text style={styles.indentedBullet}>  - Pays : Côte d'Ivoire, Burkina Faso, Sénégal, Mali.</Text>
                        <Text style={[styles.indentedBullet, styles.warning]}>  - Attention : Des frais de 40% s'appliquent sur les retraits par Wave.</Text>
                      </View>
                    </View>

                    {/* III. Mentions Importantes */}
                    <View style={[styles.section, styles.lastSection]}>
                      <Text style={styles.sectionTitle}>III. Mentions Importantes</Text>
                      
                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Triche Interdite</Text>
                        <Text style={styles.bulletPoint}>• Toute forme de triche (multi-comptes, etc.) entraînera l'annulation immédiate de votre participation.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Limites et Durée</Text>
                        <Text style={styles.bulletPoint}>• Les récompenses sont limitées : premier arrivé, premier servi. La fin de l'activité sera annoncée.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Informations Correctes</Text>
                        <Text style={styles.bulletPoint}>• Assurez-vous que vos informations de retrait sont exactes. Nous ne sommes pas responsables des erreurs de votre part.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Modification des Règles</Text>
                        <Text style={styles.bulletPoint}>• La plateforme se réserve le droit d'ajuster les règles pour le bon déroulement de l'activité.</Text>
                      </View>

                      <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Droit d'Interprétation</Text>
                        <Text style={styles.bulletPoint}>• Dans les limites de la loi, la plateforme a le droit d'interprétation finale de ces règles.</Text>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  contentContainer: {
    alignItems: 'center',
  },
  modalContent: {
    width: 370,
    height: 600,
    position: 'relative',
  },
  mainBackground: {
    flex: 1,
    position: 'relative',
  },
  backgroundShape: {
    position: 'absolute',
    width: 370,
    height: 600,
    backgroundColor: '#FFF5DB',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    width: 20,
    height: 20,
  },
  innerContentContainer: {
    position: 'absolute',
    left: 16,
    top: 53,
    width: 338,
    height: 531,
  },
  contentBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 25,
  },
  lastSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5100',
    marginBottom: 15,
  },
  subsection: {
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 5,
  },
  indentedBullet: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 5,
    marginLeft: 15,
  },
  highlight: {
    fontWeight: '500',
    color: '#333333',
  },
  warning: {
    color: '#FF5100',
    fontWeight: '500',
  },
});

export default RulesModal;