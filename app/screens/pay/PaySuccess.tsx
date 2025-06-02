import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import fontSize from "../../utils/fontsizeUtils";

// import { useRoute, RouteProp } from "@react-navigation/native";
// import { RootStackParamList } from "../../navigation/types";
// import { payApi } from "../../services/api/payApi";

type RootStackParamList = {
  MainTabs: { screen: string } | undefined;
  PaymentSuccessScreen: undefined;
};

export const PaymentSuccessScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // const route = useRoute<RouteProp<RootStackParamList, 'PaymentSuccessScreen'>>();
  // const { paymentId, PayerID } = route.params;
  // console.log("paymentId", paymentId);
  // console.log("PayerID", PayerID);

  // useEffect(() => {
  //   if (paymentId && PayerID) {
  //     payApi.paySuccessCallback(paymentId, PayerID).then((res) => {
  //       console.log("res", res);
  //     });
  //   }
  // }, [paymentId, PayerID]);

  // 处理系统返回，返回到首页
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'MainTabs',
            params: { screen: 'Home' }
          }],
        });
        return true; // 阻止默认返回行为
      };

      // 监听硬件返回按钮（Android）
      const backHandler = BackHandler;
      const subscription = backHandler.addEventListener('hardwareBackPress', onBackPress);

      // 监听导航事件（iOS手势返回和导航栏返回按钮）
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // 阻止默认行为
        e.preventDefault();
        
        // 执行自定义返回逻辑
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'MainTabs',
            params: { screen: 'Home' }
          }],
        });
      });

      return () => {
        subscription?.remove();
        unsubscribe();
      };
    }, [navigation])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} >
      <View style={styles.header}>
        <View style={styles.headerSuccess}>
          <View style={styles.headerSuccessImg}></View>
          <View style={styles.headerSuccessText}>
            <Text style={styles.headerSuccessTextTitle}>支付成功</Text>
          </View>
          {/* <View style={styles.headerPriceText}>
            <Text style={styles.headerPriceTextTitle}>73800FCFA</Text>
          </View> */}
        </View>

        <View style={styles.headerSuccessInfo}>
          {/* <View style={styles.headerSuccessInfoItem}>
            <Text style={styles.headerSuccessInfoItemText}>现代电话</Text>
            <Text style={styles.headerSuccessInfoItemText1}>17088752341</Text>
          </View> */}
          {/* <View style={styles.headerSuccessInfoItem1}>
            <Text style={styles.headerSuccessInfoItemText}>地址</Text>
            <Text style={styles.headerSuccessInfoItemText1}>河南省</Text>
          </View> */}
        </View>
        <View style={styles.headerSuccessInfoItem2}>
          <Text>货到仓库后，打电话联系您</Text>
        </View>
        {/* <View style={styles.button}>
          <View style={styles.buttonItem}>
            <Text style={styles.buttonText}>查看订单</Text>
          </View>
          <View style={styles.buttonItem}>
            <Text style={styles.buttonText}>订单详情</Text>
          </View>
        </View> */}
      </View>

      <TouchableOpacity
        style={{ marginTop: 20, alignSelf: 'center', padding: 10, backgroundColor: '#0030a7', borderRadius: 8 }}
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ 
              name: 'MainTabs',
              params: { screen: 'Home' }
            }],
          });
        }}
      >
        <Text style={{ color: 'white', fontSize: fontSize(16) }}>返回首页</Text>
      </TouchableOpacity>

      <View style={styles.recommend}>
        <Text style={styles.footerItemText1}>1234567890</Text>
        <View style={styles.productContainer}>
          <View style={styles.productRow}>
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥199</Text>
            </View>
            
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥299</Text>
            </View>
          </View>
          
          <View style={styles.productRow}>
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥399</Text>
            </View>
            
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥499</Text>
            </View>
          </View>
          
          <View style={styles.productRow}>
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥599</Text>
            </View>
            
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥699</Text>
            </View>
          </View>
          
          <View style={styles.productRow}>
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥799</Text>
            </View>
            
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥899</Text>
            </View>
          </View>
          
          <View style={styles.productRow}>
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥999</Text>
            </View>
            
            <View style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
              </View>
              <Text style={styles.productName}>商品名称</Text>
              <Text style={styles.productPrice}>¥1099</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    padding: 30,
    backgroundColor: "white",
  },
  headerSuccess: {
    width: "100%",
    marginBottom: 5,
  },
  headerSuccessImg: {
    width: 60,
    height: 60,
    alignSelf: "center",
  },
  headerSuccessText: {
    fontSize: fontSize(20),
    color: "#000000",
    alignSelf: "center",
    marginTop: 10,
  },
  headerSuccessTextTitle: {
    fontSize: fontSize(16),
    color: "#000000",
    alignSelf: "center",
  },
  headerPriceText: {
    fontSize: fontSize(20),
    color: "#000000",
    alignSelf: "center",
  },
  headerPriceTextTitle: {
    fontSize: fontSize(20),
    color: "#000000",
    alignSelf: "center",
    marginTop: 10,
  },
  headerSuccessInfo: {
    width: "100%",
    backgroundColor: "#f0f6ff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#dafcff",
    marginTop: 10,
    padding: 10,
  },
  headerSuccessInfoItem: {
    flexDirection: "row",
    fontSize: fontSize(16),
    color: "#0046bf",
    fontWeight: "600",
    alignItems: "center",
  },
  headerSuccessInfoItem1: {
    flexDirection: "row",
    fontSize: fontSize(16),
    color: "#0046bf",
    fontWeight: "600",
    alignItems: "center",
    marginTop: 5,
  },
  headerSuccessInfoItemText: {
    fontSize: fontSize(16),
    color: "#0046bf",
    width: "20%",
    fontWeight: "600",
    alignItems: "center",
  },
  headerSuccessInfoItemText1: {
    fontSize: fontSize(16),
    color: "#0046bf",
    marginLeft: 10,
    fontWeight: "600",
    alignItems: "center",
  },
  headerSuccessInfoItem2: {
    marginTop: 5,
    flexDirection: "row",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 20,
    marginTop: 20,
  },
  buttonItem: {
    width: "40%",
    height: 40,
    backgroundColor: "#0030a7",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: fontSize(16),
    color: "white",
  },
  recommend: {
    padding: 20,
  },
  footerItemText1: {
    fontSize: fontSize(16),
    color: "#000000",
    fontWeight: "600",
    marginBottom: 15,
  },
  productContainer: {
    marginTop: 10,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  productItem: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
  },
  productImageContainer: {
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },
  productImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  productName: {
    fontSize: fontSize(14),
    color: "#333",
    marginTop: 5,
    marginBottom: 5,
  },
  productPrice: {
    fontSize: fontSize(16),
    color: "#E53935",
    fontWeight: "bold",
  },
});
