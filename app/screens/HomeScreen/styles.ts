import {
  StyleSheet,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import fontSize from "../../utils/fontsizeUtils";
import widthUtils from "../../utils/widthUtils";

export type StylesType = {
  safeArea: ViewStyle;
  safeAreaContent: ViewStyle;
  container: ViewStyle;
  fixedHeader: ViewStyle;
  scrollableContent: ViewStyle;
  swpImg: ImageStyle;
  searchContainer: ViewStyle;
  searchBar: ViewStyle;
  searchPlaceholder: TextStyle;
  cameraButton: ViewStyle;
  searchButton: ViewStyle;
  category: ViewStyle;
  categoryScrollContainer: ViewStyle;
  categoryScroll: ViewStyle;
  viewAllButton: ViewStyle;
  categoryFadeOverlay: ViewStyle;
  categoryItem: ViewStyle;
  categoryItemActive: ViewStyle;
  categoryText: TextStyle;
  categoryTextActive: TextStyle;
  swiperContainer: ViewStyle;
  swiper: ViewStyle;
  dot: ViewStyle;
  activeDot: ViewStyle;
  slide: ViewStyle;
  slideImage: ImageStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalTitleContainer: ViewStyle;
  modalTitle: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
  modalScrollView: ViewStyle;
  categoryModalItem: ViewStyle;
  categoryModalText: TextStyle;
  selectedCategoryText: TextStyle;
  subcategoryContainer: ViewStyle;
  subcategoryScroll: ViewStyle;
  subcategoryContent: ViewStyle;
  subcategoryGrid: ViewStyle;
  subcategoryPage: ViewStyle;
  subcategoryRow: ViewStyle;
  subcategoryItem: ViewStyle;
  subcategoryImagePlaceholder: ViewStyle;
  subcategoryText: TextStyle;
  productContainer: ViewStyle;
  productCardList: ViewStyle;
  productCardGroup: ViewStyle;
  beautyProductCard1: ViewStyle;
  beautyCardContainer1: ViewStyle;
  vipButtonContainer: ViewStyle;
  vipButton: ViewStyle;
  vipButtonText: TextStyle;
  vipLabelBold: TextStyle;
  beautyProductCard: ViewStyle;
  beautyProductTitle: TextStyle;
  beautyProductInfoRow: ViewStyle;
  flexRowCentered: ViewStyle;
  priceContainer: ViewStyle;
  highlightedText: TextStyle;
  highlightedText1: TextStyle;
  priceContainer1: ViewStyle;
  priceLabel1: TextStyle;
  beautySalesInfo: TextStyle;
  indicatorContainer: ViewStyle;
  indicator: ViewStyle;
  activeIndicator: ViewStyle;
  inactiveIndicator: ViewStyle;
  skeletonContainer: ViewStyle;
  skeletonImage: ViewStyle;
  skeletonTitle: ViewStyle;
  skeletonPrice: ViewStyle;
  skeletonSales: ViewStyle;
  shimmer: ViewStyle;
  imagePlaceholder: ViewStyle;
  productImage: ImageStyle;
  imagePickerOverlay: ViewStyle;
  imagePickerContent: ViewStyle;
  imagePickerOption: ViewStyle;
  imagePickerText: TextStyle;
  imagePickerDivider: ViewStyle;
  imagePickerCancelButton: ViewStyle;
  imagePickerCancelText: TextStyle;
  featureNavContainer: ViewStyle;
  featureNavItem: ViewStyle;
  featureNavIcon: ViewStyle;
  featureNavText: TextStyle;
};

export const styles = StyleSheet.create<StylesType>({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  fixedHeader: {
    backgroundColor: "#fff",
    zIndex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  swpImg: {
    width: "100%",
    height: 180,
  },
  searchContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: "#000",
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: -4,
    fontSize: fontSize(14),
    color: "#a9a9a9",
  },
  cameraButton: {
    padding: 2,
  },
  searchButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    width: 45,
    height: 33,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
    marginRight: -8
  },
  category: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
  },
  categoryScrollContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  categoryScroll: {
    flex: 1,
  },
  viewAllButton: {
    paddingVertical: 8,
    marginRight: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryFadeOverlay: {
    position: "absolute",
    right: 40,
    top: 0,
    bottom: 0,
    width: 30,
    zIndex: 1,
  },
  categoryItem: {
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  categoryText: {
    fontSize: fontSize(12),
    color: "#747474",
    fontFamily: "Alexandria",
    fontWeight: "400",
  },
  categoryTextActive: {
    color: "#000",
    fontWeight: "500",
  },
  swiperContainer: {
    width: "100%",
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  swiper: {
    width: "100%",
  },
  dot: {
    backgroundColor: "#ffffff80",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 20,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  slideImage: {
    width: "100%",
    height: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: fontSize(24),
    color: "#000",
    fontWeight: "300",
  },
  modalScrollView: {
    padding: 16,
  },
  categoryModalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  categoryModalText: {
    fontSize: fontSize(16),
    color: "#666",
    fontFamily: "Segoe UI",
    fontWeight: "700",
  },
  selectedCategoryText: {
    color: "#000",
    fontWeight: "500",
  },
  subcategoryContainer: {
    minHeight: 120,
    backgroundColor: "#fff",
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  subcategoryScroll: {
    flex: 1,
  },
  subcategoryContent: {
    backgroundColor: "#fff",
  },
  subcategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    minWidth: Dimensions.get("window").width,
    height: 220,
  },
  subcategoryPage: {
    width: Dimensions.get("window").width,
    height: 220,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  subcategoryRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    height: 85,
    marginBottom: 5,
  },
  subcategoryItem: {
    alignItems: "center",
    width: (Dimensions.get("window").width - 20) / 5,
    height: 85,
    marginHorizontal: 0,
    paddingBottom: 5,
  },
  subcategoryImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  subcategoryText: {
    fontSize: fontSize(9),
    color: "#333",
    textAlign: "center",
    fontFamily: "Alexandria",
    width: "100%",
    lineHeight: fontSize(11),
    height: 22,
  },
  productContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  productCardList: {
    paddingVertical: 15,
  },
  productCardGroup: {
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 0,
    backgroundColor: "#f5f5f5",
    gap: 8,
  },
  beautyProductCard1: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0,
    shadowRadius: 3,
    elevation: 0,
  },
  beautyCardContainer1: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "100%",
    height: 160,
    backgroundColor: "transparent",
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  vipButtonContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 2,
  },
  vipButton: {
    width: widthUtils(30, 60).width,
    height: widthUtils(30, 60).height,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3b3b3b",
    borderRadius: 10,
    flexDirection: "row",
  },
  vipButtonText: {
    fontStyle: "italic",
    fontWeight: "900",
    fontSize: fontSize(18),
    color: "#f1c355",
  },
  vipLabelBold: {
    fontStyle: "italic",
    fontWeight: "900",
    fontSize: fontSize(18),
    color: "#f1c355",
  },
  beautyProductCard: {
    marginTop: 6,
  },
  beautyProductTitle: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "black",
    lineHeight: 18,
  },
  beautyProductInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexRowCentered: {},
  priceContainer: {
    flexDirection: "row",
  },
  highlightedText: {
    fontWeight: "700",
    fontSize: fontSize(24),
    color: "#FF5100",
    marginLeft: 2,
  },
  highlightedText1: {
    fontWeight: "700",
    fontSize: fontSize(14),
    color: "#FF5100",
  },
  priceContainer1: {},
  priceLabel1: {
    fontSize: fontSize(12),
    fontWeight: "600",
    color: "#9a9a9a",
    textDecorationLine: "line-through",
  },
  beautySalesInfo: {
    marginTop: 6.75,
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#7c7c7c",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  indicator: {
    marginHorizontal: 4,
    borderRadius: 3,
  },
  activeIndicator: {
    width: 14,
    height: 6,
    backgroundColor: "#fff",
  },
  inactiveIndicator: {
    width: 6,
    height: 6,
    backgroundColor: "#ffffff80",
  },
  skeletonContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: "#f5f5f5",
  },
  skeletonImage: {
    width: "100%",
    paddingBottom: "100%",
    borderRadius: 6,
    backgroundColor: "#e1e1e1",
    overflow: "hidden",
    position: "relative",
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
    width: "100%",
    backgroundColor: "#e1e1e1",
    overflow: "hidden",
    position: "relative",
  },
  skeletonPrice: {
    height: 24,
    width: 80,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: "#e1e1e1",
    overflow: "hidden",
    position: "relative",
  },
  skeletonSales: {
    height: 14,
    width: "40%",
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: "#e1e1e1",
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    width: "30%",
    height: "100%",
    backgroundColor: "#ffffff4d",
    position: "absolute",
    top: 0,
    left: 0,
  },
  imagePlaceholder: {
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "flex-end",
  },
  imagePickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  imagePickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  imagePickerText: {
    fontSize: fontSize(16),
    marginLeft: 12,
    color: "#333",
  },
  imagePickerDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 20,
  },
  imagePickerCancelButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  imagePickerCancelText: {
    fontSize: fontSize(16),
    color: "#999",
  },
  featureNavContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  featureNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureNavIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  featureNavText: {
    fontSize: fontSize(11),
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: fontSize(13),
  },
});

export const loginModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0000004d",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bottomSheet: {
    width: "100%",
    height: Dimensions.get("window").height * 0.3,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: fontSize(28),
    color: "#999",
    fontWeight: "bold",
    lineHeight: 28,
  },
  title: {
    fontSize: fontSize(22),
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
    marginTop: 16,
  },
  subtitle: {
    fontSize: fontSize(16),
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: "#FF5100",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 160,
  },
  loginButtonText: {
    color: "white",
    fontSize: fontSize(18),
    fontWeight: "700",
    textAlign: "center",
  },
});
