import { View, Text, StyleSheet,TouchableOpacity } from "react-native";
import BackIcon from "../../components/BackIcon";
import DocumentNoteIcon from "../../components/DocumentNoteIcon";
import SettingsIcon from "../../components/SettingsIcon";
import EditIcon from "../../components/ColorfulEditIcon";
import NotificationIcon from "../../components/NotificationIcon";
import ArrowRightIcon from "../../components/DownArrowIcon";
import WalletIcon from "../../components/WalletIcon";
import FolderIcon from "../../components/FolderIcon";
import PackageIcon from "../../components/PackageIcon";
import InTransitIcon from "../../components/InTransit";
import CompletedIcon from "../../components/Completed";
import ExpiredIcon from "../../components/Expired";
import BrowsingHistoryIcon from "../../components/BrowsingHistoryIcon";
import MyFavoriteIcon from "../../components/MyFavoriteIcon";
import CouponsIcon from "../../components/CouponsIcon";
import RecipientManagementIcon from "../../components/RecipientManagementIcon";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type RootStackParamList = {
  SettingList: undefined;
  Home: undefined;
  MyAccount:undefined;
};

export function MyAccount() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <BackIcon size={20} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>My Account</Text>
        </View>
        <View style={styles.right}>
          <Text>Edit</Text>
          <Text>
            <DocumentNoteIcon size={24} color="#707070" />
          </Text>
          <TouchableOpacity onPress={() => {
            navigation.navigate("SettingList");
          }}>
            <SettingsIcon size={24} color="#707070" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.profileContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.profileName}>
              <Text style={styles.profileNameText}>Name</Text>
              <Text style={styles.profileNameText1}>
                <EditIcon size={24} />
              </Text>
            </View>
            <View style={styles.profilePrice}>
              <View style={styles.profilePriceItem}>
                <NotificationIcon size={24} color="#ff8c58" />
                <Text style={styles.profilePriceText}>$100</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.userContainer}>
          <View style={styles.userHeader}>
            <View style={styles.userId}>
              <Text style={styles.userIdText}>User ID</Text>
            </View>
            <View style={styles.userinfo}>
              <View style={styles.userinfoItem}>
                <Text style={styles.userinfoText}>VIP Silver</Text>
              </View>
              <View style={styles.userinfoDetails}>
                <Text style={styles.userinfoDetailsText}>View Details</Text>
                <ArrowRightIcon size={8} color="#FF5100" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.myorderContainer}>
          <View style={styles.myOrderTitle}>
            <View>
              <Text style={styles.myOrderTitleText}>My Order</Text>
            </View>
            <View style={styles.myOrderTitlebox}>
              <Text style={styles.myOrderTitleText1}>View All</Text>
              <ArrowRightIcon size={6} color="#818282" />
            </View>
          </View>

          <View style={styles.myOrderList}>
            <View style={styles.myOrderListHeaderContainer}>
              <View style={styles.myOrderListHeader}>
                <View style={styles.orderIconContainer}>
                  <WalletIcon size={20} />
                  <Text style={styles.myOrderListHeaderItemText}>To Pay</Text>
                </View>
              </View>
              <View style={styles.myOrderListHeader}>
                <View style={styles.orderIconContainer}>
                  <FolderIcon size={20} />
                  <Text style={styles.myOrderListHeaderItemText}>
                    Quotations
                  </Text>
                </View>
              </View>
              <View style={styles.myOrderListHeader}>
                <View style={styles.orderIconContainer}>
                  <PackageIcon size={20} />
                  <Text style={styles.myOrderListHeaderItemText}>To Ship</Text>
                </View>
              </View>
            </View>

            <View style={styles.myOrderListHeaderContainer}>
              <View style={styles.myOrderListHeader}>
                <View style={styles.orderIconContainer}>
                  <InTransitIcon size={20} />
                  <Text style={styles.myOrderListHeaderItemText}>
                    In Transit
                  </Text>
                </View>
              </View>
              <View style={styles.myOrderListHeader}>
                <View style={styles.orderIconContainer}>
                  <CompletedIcon size={20} />
                  <Text style={styles.myOrderListHeaderItemText}>
                    Completed
                  </Text>
                </View>
              </View>
              <View style={styles.myOrderListHeader}>
                <View style={styles.orderIconContainer}>
                  <ExpiredIcon size={20} />
                  <Text style={styles.myOrderListHeaderItemText}>Expired</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.myorderContainer}>
          <View style={styles.myOrderTitle}>
            <View>
              <Text style={styles.myOrderTitleText}>Features</Text>
            </View>
          </View>
          <View style={styles.myOrderList}>
            <View style={styles.myOrderListHeaderContainer}>
              <View style={styles.FeaturesHeader}>
                <View>
                  <BrowsingHistoryIcon size={20}/>
                </View>
                <View style={styles.FeaturesHeaderItem}>
                  <Text style={styles.FeaturesHeaderItemText}>Browsing History</Text>
                </View>
                <View>
                 <ArrowRightIcon size={8} color="#707070"/>
                </View>
              </View>

              <View style={styles.FeaturesHeader}>
                <View>
                  <MyFavoriteIcon size={20} color="#707070"/>
                </View>
                <View style={styles.FeaturesHeaderItem}>
                  <Text style={styles.FeaturesHeaderItemText}>My Favorite</Text>
                </View>
                <View>
                 <ArrowRightIcon size={8} color="#707070"/>
                </View>
              </View>
            </View>

            <View style={styles.myOrderListHeaderContainer}>
              <View style={styles.FeaturesHeader}>
                <View>
                  <CouponsIcon size={20}/>
                </View>
                <View style={styles.FeaturesHeaderItem}>
                  <Text style={styles.FeaturesHeaderItemText}>Coupons</Text>
                </View>
                <View>
                 <ArrowRightIcon size={8} color="#707070"/>
                </View>
              </View>

              <View style={styles.FeaturesHeader}>
                <View>
                  <RecipientManagementIcon size={20}/>
                </View>
                <View style={styles.FeaturesHeaderItem}>
                  <Text style={styles.FeaturesHeaderItemText}>Recipient Management</Text>
                </View>
                <View>
                 <ArrowRightIcon size={8} color="#707070"/>
                </View>
              </View>
            </View>

            
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    width: "100%",
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 15,
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 1,
  },
  content: {
    padding: 10,
    margin: 10,
  },
  profileContainer: {
    width: "100%",
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileName: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  profileNameText1: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginLeft: 10,
  },
  profilePrice: {
    flexDirection: "row",
    alignItems: "center",
  },

  profilePriceItem: {
    width: 70,
    padding: 8,
    backgroundColor: "#fff8f8",
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
  },
  profilePriceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff8c58",
  },
  userContainer: {
    width: "100%",
    backgroundColor: "#fff",
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 10,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userId: {
    alignItems: "center",
  },
  userIdText: {
    fontSize: 14,
    color: "#7c7c7c",
  },
  userinfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userinfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ff6e1e",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 10,
  },
  userinfoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  userinfoDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  userinfoDetailsText: {
    color: "#FF5100",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 5,
  },
  myorderContainer: {
    marginTop: 10,
  },
  myOrderTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  myOrderTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  myOrderTitlebox: {
    flexDirection: "row",
    alignItems: "center",
  },
  myOrderTitleText1: {
    fontSize: 12,
    fontWeight: "600",
    color: "#818282",
    marginRight: 5,
  },
  myOrderList: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  myOrderListHeaderContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  myOrderListHeader: {
    width: "33%",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  orderIconContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  myOrderListHeaderItemText: {
    fontSize: 14,
    color: "#575757",
    textAlign: "center",
    marginTop: 5,
  },
  FeaturesHeader:{
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  FeaturesHeaderItem:{
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  FeaturesHeaderItemText:{
    fontSize: 14,
    color: "#707070",
    fontWeight: "600",
    textAlign: "left",
    marginLeft: 10,
  },
  backButton: {
    zIndex: 1,
  },
});
