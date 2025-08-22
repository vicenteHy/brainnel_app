import { StyleSheet, View, Dimensions, TouchableOpacity, Text, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import fontSize from '../../utils/fontsizeUtils';

const { height: screenHeight } = Dimensions.get('window');

const LocalPaymentSuccess = () => {
	const headerHeight = screenHeight * 0.3;
	const navigation = useNavigation();
	const topInset = (Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 44) + 12;
	const barHeight = screenHeight * 0.03;
	const [panelTop, setPanelTop] = useState<number>(headerHeight - (barHeight / 2));
	const barOffset = 6;
	const extraOffset = 105;

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
						<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
							<Ionicons name="chevron-back" size={24} color="#fff" />
						</TouchableOpacity>
						<Text style={styles.headerTitle}>Paiement PayPal</Text>
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

			{/* White Panel */}
			<View style={[styles.contentCard, { top: panelTop + extraOffset }]}> 
				<View style={styles.successBadge}>
					<Ionicons name="checkmark" size={38} color="#FF5100" />
				</View>
				<Text style={styles.successTitle}>Paiement Réussi</Text>
				<Text style={styles.successSubtitle}>Votre commande a été traitée avec succès</Text>

				<Text style={styles.amountText}><Text style={styles.amountNumber}>15.12</Text><Text style={styles.amountCurrency}>USD</Text></Text>

				<View style={styles.sectionDivider} />
				<Text style={styles.sectionTitle}>Informations d'Expédition</Text>
				<Text style={styles.sectionParagraph}>Nous expédierons votre commande dèsque possible. Merci pour votre achat.</Text>

				<View style={styles.sectionDivider} />
				<Text style={styles.sectionTitle}>Conseils Importants:</Text>
				<View style={styles.bullets}>
					<Text style={styles.bulletItem}>• Vous pouvez demander des informations survotre commande via le Chat.</Text>
					<Text style={styles.bulletItem}>• Les mises à jour du statut de votre commande vous seront envoyées immédiatement dans l'application,</Text>
					<Text style={styles.bulletItem}>• Vous pouvez consulter les détails de votre commande dans 'Mes Commandes'.</Text>
				</View>
			</View>

			{/* Bottom actions */}
			<View style={styles.actionsContainer}>
				<TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home' as never)}>
					<Text style={styles.primaryButtonText}>Retour à l'Accueil</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Status' as never)}>
					<Text style={styles.secondaryButtonText}>Voir Mes Commandes</Text>
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
		height: '65%',
		zIndex: 10,
		backgroundColor: '#fff',
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 20,
		borderTopLeftRadius: 0,
		borderTopRightRadius: 0,
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
		alignSelf: 'center',
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
		marginBottom: 12,
	},
	amountText: {
		textAlign: 'center',
		marginBottom: 12,
	},
	amountNumber: {
		fontSize: fontSize(40),
		fontWeight: '700',
		color: '#FF5100',
	},
	amountCurrency: {
		fontSize: fontSize(20),
		fontWeight: '700',
		color: '#FF5100',
		marginLeft: 6,
	},
	sectionDivider: {
		height: 1,
		backgroundColor: '#EFEFEF',
		marginVertical: 12,
	},
	sectionTitle: {
		fontSize: fontSize(15),
		fontWeight: '700',
		color: '#111',
		textAlign: 'center',
		marginBottom: 8,
	},
	sectionParagraph: {
		fontSize: fontSize(13),
		color: '#666',
		textAlign: 'center',
		paddingHorizontal: 8,
	},
	bullets: {
		marginTop: 10,
	},
	bulletItem: {
		fontSize: fontSize(13),
		color: '#555',
		lineHeight: fontSize(18),
		marginBottom: 6,
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
	},
	secondaryButtonText: {
		color: '#FF5100',
		fontWeight: '600',
		fontSize: fontSize(16),
	},
});

export default LocalPaymentSuccess;
