import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Image, SafeAreaView, StatusBar, Alert, Clipboard } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import fontSize from '../../utils/fontsizeUtils';
import type { RootStackParamList } from '../../navigation/types';
import { orderApi, type LocalOrderDetail } from '../../services/local/orderApi';

const LocalOrderDetails = () => {
	const navigation = useNavigation<any>();
	const route = useRoute<RouteProp<RootStackParamList, 'LocalOrderDetails'>>();
	const [orderDetail, setOrderDetail] = useState<LocalOrderDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

	const { orderId } = route.params;

	useEffect(() => {
		loadOrderDetail();
	}, [orderId]);

	const loadOrderDetail = async () => {
		try {
			setLoading(true);
			const detail = await orderApi.getOrderDetail(orderId);
			console.log('[LocalOrderDetails] 订单详情:', detail);
			console.log('[LocalOrderDetails] 订单货币:', detail.currency);
			console.log('[LocalOrderDetails] 订单总额:', detail.total_amount);
			setOrderDetail(detail);
		} catch (error) {
			console.error('加载订单详情失败:', error);
		} finally {
			setLoading(false);
		}
	};

	const copyOrderNumber = () => {
		if (orderDetail?.order_no) {
			Clipboard.setString(orderDetail.order_no);
			Alert.alert('Copié', 'Numéro de commande copié');
		}
	};

	const handleContactService = () => {
		// 获取第一个商品的信息用于客服聊天
		const firstItem = orderDetail?.items?.[0];
		if (firstItem) {
			navigation.navigate("ChatScreen", {
				product_id: firstItem.product_id,
				product_image_urls: firstItem.product_images || [firstItem.sku_image],
				subject_trans: firstItem.product_name_fr,
				min_price: firstItem.unit_price,
				offer_id: firstItem.product_id,
			});
		} else {
			// 如果没有商品信息，仍然跳转到聊天页面
			navigation.navigate("ChatScreen", {});
		}
	};

	const getStatusSteps = (currentStatus: number) => {
		const steps = [
			{ id: 0, text: 'À expédier', icon: require('../../../assets/local/pending_b.png'), inactiveIcon: require('../../../assets/local/pending_a.png') },
			{ id: 1, text: 'En transit', icon: require('../../../assets/local/delivering_b.png'), inactiveIcon: require('../../../assets/local/delivering_a.png') },
			{ id: 2, text: 'Terminé', icon: require('../../../assets/local/completed_b.png'), inactiveIcon: require('../../../assets/local/completed_a.png') },
			{ id: 3, text: 'Expiré', icon: require('../../../assets/local/expired_b.png'), inactiveIcon: require('../../../assets/local/expired_a.png') },
		];

		// 根据当前状态激活相应的步骤
		return steps.map(step => ({
			...step,
			active: step.id === currentStatus
		}));
	};

	const formatDate = (dateString: string) => {
		if (!dateString) {
			return '';
		}
		
		try {
			// 如果日期已经是格式化好的字符串（如 "Tuesday, August 26,2025"）
			// 直接返回，因为它已经是可读的格式
			if (dateString.includes(',') && /[A-Za-z]/.test(dateString)) {
				// 修复格式问题：在逗号后添加空格（如果没有的话）
				const fixedDate = dateString.replace(/,(\d)/, ', $1');
				// 转换为法语格式
				const months: { [key: string]: string } = {
					'January': 'janvier',
					'February': 'février',
					'March': 'mars',
					'April': 'avril',
					'May': 'mai',
					'June': 'juin',
					'July': 'juillet',
					'August': 'août',
					'September': 'septembre',
					'October': 'octobre',
					'November': 'novembre',
					'December': 'décembre'
				};
				
				const days: { [key: string]: string } = {
					'Monday': 'Lundi',
					'Tuesday': 'Mardi',
					'Wednesday': 'Mercredi',
					'Thursday': 'Jeudi',
					'Friday': 'Vendredi',
					'Saturday': 'Samedi',
					'Sunday': 'Dimanche'
				};
				
				let result = fixedDate;
				// 替换星期几
				for (const [eng, fr] of Object.entries(days)) {
					result = result.replace(eng, fr);
				}
				// 替换月份
				for (const [eng, fr] of Object.entries(months)) {
					result = result.replace(eng, fr);
				}
				
				return result;
			}
			
			// 如果是 YYYY-MM-DD 格式
			if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
				const date = new Date(dateString + 'T00:00:00');
				if (!isNaN(date.getTime())) {
					const options: Intl.DateTimeFormatOptions = {
						weekday: 'long',
						year: 'numeric', 
						month: 'long',
						day: 'numeric'
					};
					const formattedDate = date.toLocaleDateString('fr-FR', options);
					return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
				}
			}
			
			// 尝试标准解析
			const date = new Date(dateString);
			if (!isNaN(date.getTime())) {
				const options: Intl.DateTimeFormatOptions = {
					weekday: 'long',
					year: 'numeric', 
					month: 'long',
					day: 'numeric'
				};
				const formattedDate = date.toLocaleDateString('fr-FR', options);
				return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
			}
			
			return dateString;
		} catch (error) {
			console.error('日期格式化错误:', error, '原始日期:', dateString);
			return dateString;
		}
	};

	const formatTime = (timeArray: string[]) => {
		if (!timeArray || timeArray.length === 0) return '';
		// 获取第一个和最后一个时间
		const startTime = timeArray[0];
		const endTime = timeArray[timeArray.length - 1];
		// 如果开始和结束时间相同，只显示一个
		if (startTime === endTime) {
			return startTime;
		}
		return `${startTime}-${endTime}`;
	};

	const formatCreateTime = (dateString: string) => {
		if (!dateString) return '';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return dateString;
			}
			// 格式化为 YYYY-MM-DDHH:MM:SS
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			const seconds = String(date.getSeconds()).padStart(2, '0');
			
			return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
		} catch (error) {
			return dateString;
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<Text>Chargement...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!orderDetail) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<Text>Erreur de chargement</Text>
				</View>
			</SafeAreaView>
		);
	}

	const statusSteps = getStatusSteps(orderDetail.order_status);

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#fff" />
			
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
					<Ionicons name="chevron-back" size={24} color="#000" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Détails de la commande</Text>
				<View style={styles.backButton} />
			</View>

			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* 订单状态 */}
				<View style={styles.statusContainer}>
					{statusSteps.map((step, index) => (
						<View key={step.id} style={styles.statusItem}>
							<Image 
								source={step.active ? step.icon : step.inactiveIcon}
								style={styles.statusIcon}
							/>
							<Text style={[styles.statusText, step.active && styles.statusTextActive]}>
								{step.text}
							</Text>
						</View>
					))}
				</View>

				{/* 收货信息 */}
				<View style={styles.section}>
					<View style={styles.addressHeader}>
						<Ionicons name="home" size={20} color="#FF5100" style={styles.locationIcon} />
						<Text style={styles.receiverName}>Livraison à domicile</Text>
					</View>
					
					<View style={styles.deliveryInfoCard}>
						<View style={styles.infoRow}>
							<Ionicons name="person-outline" size={18} color="#666" />
							<Text style={styles.infoLabel}>Destinataire:</Text>
							<Text style={styles.infoValue}>{orderDetail.receiver_name}</Text>
						</View>
						
						<View style={styles.infoRow}>
							<Ionicons name="call-outline" size={18} color="#666" />
							<Text style={styles.infoLabel}>Téléphone:</Text>
							<Text style={styles.infoValue}>{orderDetail.receiver_phone}</Text>
						</View>
						
						<View style={styles.infoRow}>
							<Ionicons name="logo-whatsapp" size={18} color="#25D366" />
							<Text style={styles.infoLabel}>WhatsApp:</Text>
							<Text style={styles.infoValue}>{orderDetail.receiver_phone}</Text>
						</View>
						
						<View style={styles.dividerLine} />
						
						<View style={styles.addressRow}>
							<Ionicons name="location-outline" size={18} color="#666" />
							<View style={{ flex: 1, marginLeft: 8 }}>
								<Text style={styles.addressLabel}>Adresse de livraison:</Text>
								<Text style={styles.addressText}>{orderDetail.receiver_address}</Text>
							</View>
						</View>
					</View>

					<View style={styles.deliveryNoticeBox}>
						<View style={styles.noticeRow}>
							<Ionicons name="time-outline" size={20} color="#FF5100" />
							<Text style={styles.noticeTitle}>Délai de livraison</Text>
						</View>
						<Text style={styles.noticeText}>Nous vous contacterons par WhatsApp ou téléphone pour convenir d'un rendez-vous.</Text>
						<Text style={styles.noticeHighlight}>Livraison dans les 48 heures après confirmation.</Text>
					</View>
					
					<View style={styles.verificationCodeContainer}>
						<Text style={styles.verificationCodeLabel}>Code de vérification: </Text>
						<Text style={styles.verificationCodeText}>{orderDetail.verification_code}</Text>
						<TouchableOpacity onPress={() => {
							if (orderDetail?.verification_code) {
								Clipboard.setString(orderDetail.verification_code);
								Alert.alert('Copié', 'Code de vérification copié');
							}
						}} style={styles.copyButton}>
							<Ionicons name="copy-outline" size={18} color="#666" />
						</TouchableOpacity>
					</View>
				</View>

				{/* 商品信息 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Informations produit ({orderDetail.items.length})</Text>
					
					{orderDetail.items.map((item, index) => (
						<View key={index} style={styles.productCard}>
							<Image 
								source={{ uri: item.sku_image || item.product_images[0] }} 
								style={styles.productImage}
							/>
							<View style={styles.productInfo}>
								<Text style={styles.productName} numberOfLines={2}>
									{item.product_name_fr}
								</Text>
								<Text style={styles.productQuantity}>Quantité:{item.quantity}</Text>
								<View style={styles.priceRow}>
									<Text style={styles.productPrice}>
										{Math.round(item.unit_price)}<Text style={styles.currency}>{orderDetail.currency || 'FCFA'}</Text>
									</Text>
									<Text style={styles.originalPrice}>
										{Math.round(item.unit_price * 1.2)}<Text style={styles.currencySmall}>{orderDetail.currency || 'FCFA'}</Text>
									</Text>
								</View>
							</View>
						</View>
					))}
				</View>

				{/* 价格详情 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Détails des prix</Text>
					
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Total ({orderDetail.items.length} items)</Text>
						<Text style={styles.totalAmount}>
							{Math.round(orderDetail.actual_amount)}<Text style={styles.currencyOrange}>{orderDetail.currency || 'FCFA'}</Text>
						</Text>
					</View>

					<View style={styles.discountBox}>
						<Text style={styles.discountText}>10 % remboursé pour la première commande.</Text>
					</View>
				</View>

				{/* 订单信息 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Informations de commande</Text>
					
					<View style={styles.orderInfoRow}>
						<Text style={styles.orderInfoLabel}>Numéro de commande</Text>
						<View style={styles.orderNumberRow}>
							<Text style={styles.orderNumber}>{orderDetail.order_no}</Text>
							<TouchableOpacity onPress={copyOrderNumber}>
								<Ionicons name="copy-outline" size={16} color="#999" />
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.orderInfoRow}>
						<Text style={styles.orderInfoLabel}>Date de création</Text>
						<Text style={styles.orderInfoValue}>{formatCreateTime(orderDetail.create_time)}</Text>
					</View>
				</View>

				{/* 联系客服 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Problème rencontré</Text>
					
					<View style={styles.contactButtonContainer}>
						<TouchableOpacity style={styles.contactButton} onPress={handleContactService}>
							<Image 
								source={require('../../../assets/local/client.png')} 
								style={styles.clientIcon}
							/>
							<Text style={styles.contactServiceText}>Contacter le service client</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={{ height: 50 }} />
			</ScrollView>

			{/* 待付款状态显示支付按钮 */}
			{orderDetail.order_status === 0 && orderDetail.pay_status === 0 && (
				<View style={styles.payButtonContainer}>
					<TouchableOpacity 
						style={[styles.payButton, isPaymentProcessing && styles.payButtonDisabled]}
						disabled={isPaymentProcessing}
						onPress={async () => {
							if (isPaymentProcessing) return;
							
							try {
								setIsPaymentProcessing(true);
								
								// 如果是mobile money支付，跳转到确认页面
								if (orderDetail.payment_method === 'mobile_money') {
									navigation.navigate('LocalMobileMoneyConfirm' as never, {
										orderId: orderDetail.order_id,
										orderNo: orderDetail.order_no,
										amount: orderDetail.actual_amount,
										currency: orderDetail.currency || 'FCFA'
									} as never);
								} else if (orderDetail.payment_method === 'wave' || 
										   orderDetail.payment_method === 'paypal' || 
										   orderDetail.payment_method === 'bank_card') {
									// Wave, PayPal, Bank Card 支付方式
									console.log('[LocalOrderDetails] Initiating payment for:', orderDetail.payment_method);
									
									// 发起支付
									const payRes = await orderApi.initiatePayment({
										order_id: orderDetail.order_id,
										amount: orderDetail.actual_amount,
										method: orderDetail.payment_method as any,
										currency: orderDetail.currency || 'FCFA',
										extra: {},
									});
									
									console.log('[LocalOrderDetails] Payment response:', payRes);
									
									if (payRes?.payment_url) {
										// 跳转到支付页面
										const paymentId = String(orderDetail.order_id);
										const payUrl = String(payRes.payment_url);
										console.log('[LocalOrderDetails] Navigating to Pay with:', { 
											paymentId, 
											payUrl, 
											method: orderDetail.payment_method,
											is_local: 1 
										});
										
										(navigation as any).navigate('Pay', { 
											order_id: paymentId, 
											payUrl, 
											method: orderDetail.payment_method,
											is_local: 1 
										});
									} else {
										Alert.alert('Erreur', payRes?.msg || 'Échec de l\'initialisation du paiement');
									}
								} else if (orderDetail.payment_method === 'balance') {
									// 余额支付
									console.log('[LocalOrderDetails] Balance payment for order:', orderDetail.order_id);
									
									// 发起余额支付
									const payRes = await orderApi.initiatePayment({
										order_id: orderDetail.order_id,
										amount: orderDetail.actual_amount,
										method: 'balance',
										currency: orderDetail.currency || 'FCFA',
										extra: {},
									});
									
									console.log('[LocalOrderDetails] Balance payment response:', payRes);
									
									if (payRes?.success) {
										// 余额支付成功，跳转到成功页面
										navigation.navigate('LocalPaymentSuccess' as never, {
											paymentMethod: 'Solde de compte',
											amount: orderDetail.actual_amount,
											currency: orderDetail.currency || 'FCFA',
											pickupLocation: orderDetail.receiver_address,
											pickupDate: formatDate(orderDetail.pickup_date),
											pickupTime: formatTime(orderDetail.pickup_time),
											orderId: orderDetail.order_id
										} as never);
									} else {
										Alert.alert('Erreur', payRes?.msg || 'Solde insuffisant ou échec du paiement');
									}
								} else if (orderDetail.payment_method === 'cod') {
									// 货到付款，不需要在线支付
									Alert.alert(
										'Paiement à la livraison', 
										'Cette commande sera payée en espèces lors de la réception.',
										[{ text: 'OK' }]
									);
								} else {
									// 其他未知支付方式
									Alert.alert('Erreur', `Mode de paiement non pris en charge: ${orderDetail.payment_method}`);
								}
							} catch (error) {
								console.error('[LocalOrderDetails] Payment error:', error);
								Alert.alert('Erreur', 'Échec de l\'initialisation du paiement');
							} finally {
								setIsPaymentProcessing(false);
							}
						}}
					>
						<Text style={styles.payButtonText}>
							{isPaymentProcessing ? 'Traitement en cours...' : 'Payer maintenant'}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#E0E0E0',
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: fontSize(18),
		fontWeight: '600',
		color: '#000',
	},
	scrollView: {
		flex: 1,
	},
	statusContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 20,
		paddingHorizontal: 20,
		backgroundColor: '#fff',
	},
	statusItem: {
		alignItems: 'center',
		flex: 1,
	},
	statusIcon: {
		width: 48,
		height: 48,
		marginBottom: 8,
		resizeMode: 'contain',
	},
	statusText: {
		fontSize: fontSize(11),
		color: '#999',
		textAlign: 'center',
	},
	statusTextActive: {
		color: '#FF5100',
		fontWeight: '500',
	},
	section: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderTopWidth: 0.5,
		borderTopColor: '#E0E0E0',
	},
	addressHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	locationIcon: {
		marginRight: 8,
	},
	receiverName: {
		fontSize: fontSize(16),
		fontWeight: '600',
		color: '#000',
	},
	contactInfo: {
		paddingLeft: 28,
		marginBottom: 12,
	},
	contactLabel: {
		fontSize: fontSize(12),
		color: '#999',
	},
	contactNumber: {
		fontSize: fontSize(12),
		color: '#000',
	},
	pickupSection: {
		paddingLeft: 28,
		marginBottom: 12,
	},
	pickupLabel: {
		fontSize: fontSize(12),
		color: '#999',
		marginBottom: 4,
	},
	pickupLocationRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	pickupLocationWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
	},
	pickupAddress: {
		fontSize: fontSize(14),
		color: '#000',
		lineHeight: 20,
		marginBottom: 4,
	},
	navigationButton: {
		alignSelf: 'flex-start',
	},
	navigationLink: {
		fontSize: fontSize(12),
		color: '#FF5100',
		textDecorationLine: 'underline',
	},
	pickupDateSection: {
		paddingLeft: 28,
		marginBottom: 12,
	},
	pickupDateText: {
		fontSize: fontSize(14),
		color: '#000',
		fontWeight: '500',
	},
	pickupTimeSection: {
		paddingLeft: 28,
		marginBottom: 12,
	},
	pickupTimeText: {
		fontSize: fontSize(18),
		color: '#FF5100',
		fontWeight: '600',
	},
	verificationCodeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFEDE5',
		paddingVertical: 12,
		paddingHorizontal: 16,
		marginHorizontal: 28,
		marginTop: 12,
		borderRadius: 8,
	},
	verificationCodeLabel: {
		fontSize: fontSize(14),
		color: '#666',
	},
	verificationCodeText: {
		fontSize: fontSize(16),
		color: '#000',
		fontWeight: '600',
		marginLeft: 4,
		flex: 1,
	},
	copyButton: {
		padding: 4,
	},
	deliveryInfoCard: {
		backgroundColor: '#F8F8F8',
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
		marginTop: 12,
		marginBottom: 12,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		gap: 8,
	},
	infoLabel: {
		fontSize: fontSize(13),
		color: '#666',
		minWidth: 85,
	},
	infoValue: {
		fontSize: fontSize(14),
		color: '#000',
		flex: 1,
		fontWeight: '500',
	},
	dividerLine: {
		height: 1,
		backgroundColor: '#E0E0E0',
		marginVertical: 8,
	},
	addressRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingVertical: 8,
	},
	addressLabel: {
		fontSize: fontSize(13),
		color: '#666',
		marginBottom: 4,
	},
	addressText: {
		fontSize: fontSize(14),
		color: '#000',
		lineHeight: 20,
	},
	deliveryNoticeBox: {
		backgroundColor: '#FFF5E5',
		borderRadius: 8,
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderLeftWidth: 4,
		borderLeftColor: '#FF5100',
	},
	noticeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
	},
	noticeTitle: {
		fontSize: fontSize(15),
		color: '#FF5100',
		fontWeight: '600',
	},
	noticeText: {
		fontSize: fontSize(13),
		color: '#666',
		lineHeight: 20,
		marginBottom: 6,
	},
	noticeHighlight: {
		fontSize: fontSize(14),
		color: '#FF5100',
		fontWeight: '600',
	},
	sectionTitle: {
		fontSize: fontSize(16),
		fontWeight: '600',
		color: '#000',
		marginBottom: 12,
	},
	productCard: {
		flexDirection: 'row',
		backgroundColor: '#F8F8F8',
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
	},
	productImage: {
		width: 80,
		height: 80,
		borderRadius: 8,
		marginRight: 12,
	},
	productInfo: {
		flex: 1,
	},
	productName: {
		fontSize: fontSize(14),
		color: '#000',
		marginBottom: 8,
	},
	productQuantity: {
		fontSize: fontSize(12),
		color: '#666',
		marginBottom: 8,
	},
	priceRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	productPrice: {
		fontSize: fontSize(16),
		color: '#FF5100',
		fontWeight: '600',
		marginRight: 8,
	},
	originalPrice: {
		fontSize: fontSize(12),
		color: '#999',
		textDecorationLine: 'line-through',
	},
	currency: {
		fontSize: fontSize(12),
		fontWeight: '400',
	},
	currencySmall: {
		fontSize: fontSize(10),
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	totalLabel: {
		fontSize: fontSize(14),
		color: '#666',
	},
	totalAmount: {
		fontSize: fontSize(20),
		color: '#FF5100',
		fontWeight: '600',
	},
	currencyOrange: {
		fontSize: fontSize(14),
		color: '#FF5100',
	},
	discountBox: {
		backgroundColor: '#FFF5E5',
		borderWidth: 1,
		borderColor: '#FF5100',
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	discountText: {
		fontSize: fontSize(14),
		color: '#FF5100',
		textAlign: 'center',
	},
	orderInfoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
	},
	orderInfoLabel: {
		fontSize: fontSize(14),
		color: '#666',
	},
	orderNumberRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	orderNumber: {
		fontSize: fontSize(14),
		color: '#000',
		marginRight: 8,
	},
	orderInfoValue: {
		fontSize: fontSize(14),
		color: '#000',
	},
	contactButtonContainer: {
		alignItems: 'center',
	},
	contactButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
	},
	clientIcon: {
		width: 36,
		height: 36,
		marginRight: 8,
		resizeMode: 'contain',
	},
	contactServiceText: {
		fontSize: fontSize(14),
		color: '#2196F3',
		textDecorationLine: 'underline',
	},
	payButtonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#fff',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: '#E0E0E0',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	payButton: {
		backgroundColor: '#FF5100',
		borderRadius: 24,
		paddingVertical: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	payButtonText: {
		color: '#fff',
		fontSize: fontSize(16),
		fontWeight: '600',
	},
	payButtonDisabled: {
		backgroundColor: '#FFB59C',
		opacity: 0.7,
	},
});

export default LocalOrderDetails;