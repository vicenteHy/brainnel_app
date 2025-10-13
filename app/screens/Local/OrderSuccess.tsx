import { StyleSheet, View, Dimensions, TouchableOpacity, Text, Platform, StatusBar as RNStatusBar, ScrollView } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import fontSize from '../../utils/fontsizeUtils';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const LocalOrderSuccess = () => {
	const headerHeight = screenHeight * 0.3;
	const navigation = useNavigation();
	const route = useRoute<RouteProp<any, any>>();
	const orderId = route.params?.orderId;
	const topInset = (Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 44) + 12;
	const barHeight = screenHeight * 0.03;
	const [panelTop, setPanelTop] = useState<number>(headerHeight - (barHeight / 2));
	const barOffset = 6; // slight downward adjustment
	const extraOffset = 105; // always applied after measurement

	return (
		<View style={styles.container}>
			<StatusBar style="light" translucent backgroundColor="transparent" />
			<View style={[styles.headerWrapper, { height: headerHeight }]}> 
				<LinearGradient
					colors={['#FF8C00', '#FF5100']}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={styles.headerGradient}
				>
					<View style={[styles.headerContent, { paddingTop: topInset }]}>
						<View style={styles.backButton} />
						<Text style={styles.headerTitle}>Commande réussie</Text>
						<View style={styles.backButton} />
					</View>
					<View style={[styles.titleBarContainer, { paddingHorizontal: 20 }]}>
						<View
							style={[styles.titleBar, { height: barHeight }]}
							onLayout={(e) => {
								const { y, height } = e.nativeEvent.layout;
								setPanelTop(y + height / 2 + barOffset);
							}}
						/>
					</View>
				</LinearGradient>
			</View>

			{/* White Panel from the brown bar down */}
			<View style={[styles.contentCard, { top: panelTop + extraOffset }]}>
				<ScrollView 
					style={styles.scrollContent}
					contentContainerStyle={styles.scrollContentContainer}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.successBadge}>
						<Ionicons name="checkmark" size={38} color="#FF5100" />
					</View>
					<Text style={styles.successTitle}>Merci pour votre commande</Text>
					<Text style={styles.successSubtitle}>Votre commande a été enregistrée avec succès.</Text>

				<View style={styles.divider} />
				<View style={styles.sectionHeaderRow}>
					<View style={styles.sectionIcon}>
						<Ionicons name="home-outline" size={18} color="#FF5100" />
					</View>
					<Text style={styles.sectionHeaderText}>Livraison à domicile</Text>
				</View>

				<View style={styles.sectionBody}>
					<View style={styles.subSection}>
						<Text style={styles.sectionLabel}>Mode de livraison</Text>
						<View style={styles.deliveryInfoBox}>
							<Ionicons name="location" size={20} color="#FF5100" style={{ marginRight: 8 }} />
							<Text style={styles.deliveryText}>Livraison à l'adresse que vous avez choisie</Text>
						</View>
					</View>

					<View style={styles.divider} />

					<View style={styles.subSection}>
						<Text style={styles.sectionLabel}>Prochaine étape</Text>
						<View style={styles.stepBox}>
							<View style={styles.stepRow}>
								<Ionicons name="call-outline" size={18} color="#4CAF50" />
								<Text style={styles.stepText}>Nous vous contacterons par WhatsApp ou téléphone</Text>
							</View>
							<View style={styles.stepRow}>
								<Ionicons name="calendar-outline" size={18} color="#4CAF50" />
								<Text style={styles.stepText}>Pour convenir d'un rendez-vous de livraison</Text>
							</View>
						</View>
					</View>

					<View style={styles.divider} />

					<View style={styles.subSection}>
						<Text style={styles.sectionLabel}>Délai de livraison</Text>
						<Text style={styles.timeValue}>48 heures</Text>
						<Text style={styles.deliveryNote}>Après confirmation du rendez-vous</Text>
					</View>
				</View>

					<View style={styles.tipBox}>
						<Ionicons name="information-circle" size={20} color="#FF5100" style={{ marginRight: 6 }} />
						<Text style={styles.tipText}>Assurez-vous d'être disponible pour recevoir notre appel et planifier la livraison.</Text>
					</View>
					
					{/* Spacer for bottom buttons */}
					<View style={{ height: 140 }} />
				</ScrollView>
			</View>

			{/* Bottom fixed actions */}
			<View style={styles.actionsContainer}>
				<TouchableOpacity style={styles.primaryButton} onPress={() => {
					if (orderId) {
						navigation.navigate('LocalOrderDetails' as never, { orderId } as never);
					} else {
						navigation.navigate('Status' as never);
					}
				}}>
					<Text style={styles.primaryButtonText}>Voir la commande</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Home' as never)}>
					<Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F6F6F6',
		position: 'relative',
	},
	headerWrapper: {
		width: '100%',
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
		overflow: 'hidden',
	},
	headerGradient: {
		flex: 1,
		width: '100%',
	},
	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '700',
	},
	titleBarContainer: {
		width: '100%',
	},
	titleBar: {
		width: '100%',
		backgroundColor: '#B93B00',
		borderRadius: 13,
	},
	contentCard: {
		position: 'absolute',
		width: '85%',
		maxHeight: '65%',
		zIndex: 10,
		backgroundColor: '#fff',
		borderTopLeftRadius: 0,
		borderTopRightRadius: 0,
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
		alignSelf: 'center',
		overflow: 'hidden',
	},
	scrollContent: {
		flex: 1,
	},
	scrollContentContainer: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 20,
	},
	successBadge: {
		alignSelf: 'center',
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: '#FFE8DD',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 30,
		marginBottom: 12,
	},  
	successTitle: {
		fontSize: fontSize(18),
		fontWeight: '600',
		textAlign: 'center',
		color: '#FF5100',
		marginBottom: 6,
	},
	successSubtitle: {
		fontSize: fontSize(13),
		textAlign: 'center',
		color: '#666',
		marginBottom: 16,
	},
	infoCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: '#F0F0F0',
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	infoLabel: {
		fontSize: 14,
		color: '#444',
	},
	infoValue: {
		fontSize: 14,
		color: '#111',
		fontWeight: '600',
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	sectionIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#FFE8DD',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 6,
        marginTop: 6,
	},
	sectionHeaderText: {
		fontSize: fontSize(16),
		fontWeight: '600',
		color: '#111',
        paddingTop: 5,
	},
	subSection: {
		paddingBottom: 10,
	},
	sectionLabel: {
		fontSize: fontSize(13),
		color: '#666',
		marginBottom: 6,
	},
	sectionBody: {
		paddingLeft: 35,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	locationValue: {
		flexShrink: 1,
		fontSize: fontSize(16),
		fontWeight: '400',
		color: '#111',
		marginRight: 8,
	},
	navigationText: {
		color: '#FF5100',
		fontWeight: '500',
		textDecorationLine: 'underline',
		textTransform: 'uppercase',
		fontSize: fontSize(14),
	},
	sectionValue: {
		fontSize: fontSize(16),
		color: '#111',
		fontWeight: '400',
	},
	timeValue: {
		fontSize: fontSize(22),
		fontWeight: '400',
		color: '#FF5100',
	},
	tipBox: {
		marginTop: 12,
		backgroundColor: '#FFF5DB',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
	},
	tipText: {
		color: '#FF5100',
		fontSize: fontSize(13),
		fontWeight: '600',
		flex: 1,
	},
	deliveryInfoBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF0E5',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
	},
	deliveryText: {
		fontSize: fontSize(14),
		color: '#333',
		flex: 1,
	},
	stepBox: {
		backgroundColor: '#F5F9F5',
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderRadius: 8,
		gap: 10,
	},
	stepRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	stepText: {
		fontSize: fontSize(13),
		color: '#333',
		flex: 1,
	},
	deliveryNote: {
		fontSize: fontSize(13),
		color: '#666',
		marginTop: 4,
	},
	divider: {
		height: 1,
		backgroundColor: '#EFEFEF',
        marginVertical: 5,
	},
	actionsContainer: {
		position: 'absolute',
		left: 20,
		right: 20,
		bottom: 24,
		gap: 12,
	},
	primaryButton: {
		backgroundColor: '#FF5100',
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
	},
	primaryButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: fontSize(16),
	},
	secondaryButton: {
		backgroundColor: '#FFEDE5',
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		borderWidth: 1,
		borderColor: '#FF5100',
        marginBottom: 10,
	},
	secondaryButtonText: {
		color: '#FF5100',
		fontWeight: '600',
		fontSize: fontSize(16),
	},
});

export default LocalOrderSuccess;
