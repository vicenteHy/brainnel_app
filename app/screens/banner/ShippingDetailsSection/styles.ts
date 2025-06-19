import { StyleSheet, Platform } from "react-native";
import fontSize from "../../../utils/fontsizeUtils";
import widthUtils from "../../../utils/widthUtils";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#005EE4",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    width: "100%",
    flex: 1,
  },
  backgroundContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#005EE4",
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  timeShippingSection: {
    flexDirection: "column",
  },
  timeAndImageContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 36,
  },
  timeDisplay: {
    minWidth: 42,
    fontSize: fontSize(17),
    fontFamily: "PingFang SC",
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  timeImageContainer: {
    width: 54,
    height: 54,
  },
  shippingCostContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    justifyContent: "center",
  },
  svgContainer: {
    width: 18,
    height: 18,
    position: "absolute",
    left: 0,
  },
  shippingCostLabelTextStyle: {
    fontSize: fontSize(20),
    lineHeight: 22,
    fontFamily: "Microsoft YaHei UI",
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    textTransform: "capitalize",
    width: "100%",
  },
  shippingCalculatorContainer: {
    marginTop: 80,
    paddingTop: 18,
    paddingRight: 20,
    paddingBottom: 28,
    paddingLeft: 20,
    backgroundColor: "white",
    borderRadius: 5,
    justifyContent: "center",
  },
  flexColumnCenteredWithSelect: {
    flexDirection: "column",
    justifyContent: "center",
  },
  primaryButton: {
    width: "100%",
    minHeight: 50,
    marginTop: 34,
    backgroundColor: "#002fa7",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f6ff",
  },
  disabledButton: {
    opacity: 0.6,
  },
});