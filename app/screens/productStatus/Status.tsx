import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { productStatus } from "../../constants/productStatus";
import BackIcon from "../../components/BackIcon";
import MassageIcon from "../../components/MassageIcon";
import { useEffect, useState, useRef } from "react";
import fontSize from "../../utils/fontsizeUtils";
import widthUtils from "../../utils/widthUtils";
import { useTranslation } from "react-i18next";
import {
  ordersApi,
  PaginatedOrderResponse,
  PaginatedOrderRequest,
} from "../../services/api/orders";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useOrderListStore } from "../../store/orderList";
import { getOrderTransLanguage } from "../../utils/languageUtils";
import { inquiriesApi,InquiryResponseDataList } from "../../services/api/inquiries";
// import ImageView from "react-native-image-viewing";

type StatusScreenRouteProp = RouteProp<
  {
    Status: { status: number };
  },
  "Status"
>;

export function Status() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<StatusScreenRouteProp>();
  const { t } = useTranslation();
  const [statusList, setStatusList] = useState(() => {
    const initialList = [...productStatus];
    initialList.unshift({
      text: t("order.status.all"),
      textKey: "order.status.all",
      status: null,
      icon: BackIcon,
    });
    return initialList;
  });
  const [status, setStatus] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const statusScrollViewRef = useRef<ScrollView>(null);
  const statusItemRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const { orders, getAllOrders } = useOrderListStore();
  const [inquiries, setInquiries] = useState<InquiryResponseDataList['items']>([]);

  const getAllOrdersList = async () => {
    setLoading(true);

    if(route.params.status === 8){
      const data = {
        page: page,
        page_size: pageSize,
        status: route.params.status,
      };
      const res =  await inquiriesApi.getInquiries(data.page, data.page_size, 1);
      setInquiries(res.items);
      setLoading(false);
    }else{
      try {
        const data = {
          page: page,
          page_size: pageSize,
          status: route.params.status,
        };
        await getAllOrders(data, page);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
    
  };

  const scrollToStatus = () => {
    const itemIndex = statusList.findIndex(
      (item) => item.status === route.params.status
    );
    console.log(itemIndex);
    statusItemRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (width) {
        statusScrollViewRef.current?.scrollTo({
          x: width * (itemIndex - 1),
          animated: true,
        });
      }
    });
  };
  useEffect(() => {    
    setStatus(route.params.status);
    scrollToStatus();
    setPage(1);
    getAllOrdersList();
  }, []);

  const getStatus = (status: number) => {
    switch(status) {
      case 0: return t("order.status.waiting_payment");
      case 1: return t("order.status.waiting_shipment");
      case 2: return t("order.status.in_transit");
      case 3: return t("order.status.completed");
      case 4: return t("order.status.expired");
      case 5: return t("order.status.cancelled");
      case 6: return t("order.status.refunded");
      case 7: return t("order.status.in_transit");
      case 8: return t("order.status.waiting_quote");
      default: return t("order.status.unknown");
    }
  };

  //   const handleImagePress = (imageUrl: string) => {
  //     setImages([imageUrl]);
  //     setCurrentImageIndex(0);
  //     setImageViewerVisible(true);
  //   };

  const changeStatus = async (status: number) => {
    setLoading(true);
    setPage(1);
    
    if (status === 8) {
      // 调用询价接口
      try {
        const res = await inquiriesApi.getInquiries(1, pageSize, 1);
        setInquiries(res.items);
      } finally {
        setLoading(false);
      }
    } else {
      // 调用订单接口
      const data: PaginatedOrderRequest = {
        page: 1,
        page_size: pageSize,
      };
      if (status) {
        data.status = status;
      }
      if (status === 0) {
        data.status = 0;
      }

      try {
        await getAllOrders(data, 1);
        // 滚动状态列表到选中项
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOrderDetailsPress = (orderId: string) => {
    navigation.navigate("OrderDetails", { orderId, status });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.statusHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.statusTitle}>{t("order.status_title")}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.statusList}>
          <ScrollView
            ref={statusScrollViewRef}
            style={styles.statusListScr}
            horizontal={true}
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
          >
            {statusList.map((item, index) => (
              <TouchableOpacity
                ref={statusItemRef}
                style={[
                  styles.statusItem,
                  status === item.status ? styles.statusItemActive : null,
                ]}
                key={index}
                onPress={() => {
                  setStatus(item.status as number);
                  changeStatus(item.status as number);
                }}
              >
                <Text
                  style={[
                    styles.statusItemText,
                    status === item.status ? styles.statusItemActiveText : null,
                  ]}
                >
                  {t(item.textKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.orderContent}>
          {loading && page === 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f77f3a" />
            </View>
          ) : (
            <ScrollView
              horizontal={false}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={async (event) => {
                const { contentOffset, contentSize, layoutMeasurement } =
                  event.nativeEvent;
                console.log('Scroll values:', {
                  contentOffsetY: contentOffset.y,
                  layoutHeight: layoutMeasurement.height,
                  contentHeight: contentSize.height,
                  sum: contentOffset.y + layoutMeasurement.height
                });
                const isAtBottom =
                  contentOffset.y + layoutMeasurement.height >=
                  contentSize.height - 20;
                                
                if (isAtBottom) {
                  setLoading(true);
                  setPage(page + 1);
                  
                  if (status === 8) {
                    // 询价分页加载
                    try {
                      const res = await inquiriesApi.getInquiries(page + 1, pageSize, 1);
                      setInquiries(prev => [...prev, ...res.items]);
                    } finally {
                      setLoading(false);
                    }
                  } else {
                    // 订单分页加载
                    const data: PaginatedOrderRequest = {
                      page: page,
                      page_size: pageSize,
                      status: status,
                    };
                    getAllOrders(data, page);
                  }
                }
              }}
            >
              {status === 8 ? (
                // 渲染询价数据
                inquiries.map((item, index) => (
                  <View key={index}>
                    <View style={styles.orderItemContainer}>
                      <View style={styles.orderItem}>
                        <View style={styles.orderStatus}>
                          <Text style={styles.orderStatusOrderText}>
                            {item.inquiry_id}
                          </Text>
                          <Text style={styles.orderStatusText}>
                            {getStatus(8)}
                          </Text>
                        </View>
                        <View style={styles.orderProductList}>
                          <View style={styles.orderProductItem}>
                            <TouchableOpacity style={styles.orderProductItemImage}>
                              <Image
                                source={{ uri: item.image_url }}
                                style={styles.orderProductItemImage}
                              />
                            </TouchableOpacity>
                            <View style={styles.orderProductItemInfo}>
                              <Text style={styles.orderProductItemInfoName}>
                                {item.name}
                              </Text>
                              <Text style={styles.orderProductItemInfoPrice}>
                                {t("quantity")}: {item.quantity}
                              </Text>
                              <Text style={styles.orderProductItemInfoPrice}>
                                {t("material")}: {item.material}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.orderProductPrice}>
                          <View style={styles.orderProductPriceItem}>
                            {/* <Text style={styles.orderProductTotalText}>{t("order.status_title")}:</Text>
                            <Text style={styles.orderProductPriceText}>
                              {t("order.status.waiting_quote")}
                            </Text> */}
                          </View>
                          <TouchableOpacity
                            style={styles.orderProductView}
                            onPress={() => {
                              // 处理询价详情点击事件
                              // TODO: 需要创建 InquiryDetails 页面或使用现有页面
                              // navigation.navigate("InquiryDetails");
                              console.log("查看询价详情:", item.inquiry_id);
                              navigation.navigate("InquiryScreen");
                            }}
                          >
                            <Text style={styles.orderProductViewText}>
                              {t("order.view_details")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    {/* 询价分隔线 */}
                    {index < inquiries.length - 1 && (
                      <View style={styles.orderDivider} />
                    )}
                  </View>
                ))
              ) : (
                // 渲染订单数据
                orders?.items.map((item, index) => (
                  <View key={index}>
                    <View style={styles.orderItemContainer}>
                      <View style={styles.orderItem}>
                        <View style={styles.orderStatus}>
                          <Text style={styles.orderStatusOrderText}>
                            {item.order_id}
                          </Text>
                          <Text style={styles.orderStatusText}>
                            {getStatus(item.status)}
                          </Text>
                        </View>
                        <View style={styles.orderProductList}>
                          {item.items.map((item, index) => (
                            <View style={styles.orderProductItem} key={index}>
                              <TouchableOpacity style={styles.orderProductItemImage}>
                                <Image
                                  source={{ uri: item.sku_image }}
                                  style={styles.orderProductItemImage}
                                />
                              </TouchableOpacity>
                              <View style={styles.orderProductItemInfo}>
                                <Text style={styles.orderProductItemInfoName}>
                                  {getOrderTransLanguage(item) || item.product_name_fr}
                                </Text>
                                {item.sku_attributes?.map((attr, index) => (
                                  <Text
                                    style={styles.orderProductItemInfoPrice}
                                    key={index}
                                  >
                                    {attr.attribute_name}:{attr.attribute_value}
                                  </Text>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                        <View style={styles.orderProductPrice}>
                          <View style={styles.orderProductPriceItem}>
                            <Text style={styles.orderProductTotalText}>{t("order.total_price")}:</Text>
                            <Text style={styles.orderProductPriceText}>
                              {item.actual_amount} {item?.currency}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.orderProductView}
                            onPress={() => handleOrderDetailsPress(item.order_id)}
                          >
                            <Text style={styles.orderProductViewText}>
                              {t("order.view_details")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    {/* 订单分隔线 */}
                    {index < orders.items.length - 1 && (
                      <View style={styles.orderDivider} />
                    )}
                  </View>
                ))
              )}
              {loading && page > 1 && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#f77f3a" />
                </View>
              )}
            </ScrollView>
          )}
        </View>
        {/* <ImageView
          images={images.map(uri => ({ uri }))}
          imageIndex={currentImageIndex}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
          swipeToCloseEnabled={true}
          doubleTapToZoomEnabled={true}
        /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#f0f2f5',
  },
  statusHeader: {
    width: "100%",
    backgroundColor: "white",
    padding: 16,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  statusList: {
    width: "100%",
    borderTopWidth: 1,
    borderColor: "#f5f5f5",
  },
  statusListScr: {
    width: "100%",
  },
  statusItem: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  statusItemText: {
    fontSize: fontSize(16),
    textAlign: "center",
  },
  statusItemTextActive: {
    color: "#f77f3a",
    borderBottomWidth: 1,
    borderColor: "#f77f3a",
  },
  statusItemActive: {
    borderBottomWidth: 2,
    borderColor: "#f77f3a",
  },
  statusItemActiveText: {
    color: "#f77f3a",
  },
  orderContent: {
    flex: 1,
    paddingTop: 19,
    paddingHorizontal: 19,
    backgroundColor: '#f0f2f5',
  },
  orderItemContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 10,
  },
  orderItem: {
    width: "100%",
  },
  orderStatus: {
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    borderColor: "#f5f5f5",
    justifyContent: "space-between",
  },
  orderStatusOrderText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    width: "70%",
  },
  orderStatusText: {
    color: "#f77f3a",
    width: "30%",
    textAlign: "right",
  },
  orderProductList: {
    width: "100%",
    padding: 10,
  },
  orderProductItem: {
    flexDirection: "row",
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderColor: "#f5f5f5",
  },
  orderProductItemImage: {
    width: widthUtils(30, 30).width,
    height: widthUtils(30, 30).height,
    marginRight: 10,
    borderRadius: 8,
  },
  orderProductItemInfo: {
    flex: 1,
  },
  orderProductItemInfoName: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  orderProductItemInfoPrice: {
    fontSize: fontSize(14),
    color: "#666",
  },
  orderProductPrice: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderProductView: {
    width: "50%",
    borderRadius: 8,
    alignItems: "flex-end",
  },
  orderProductViewText: {
    color: "#f77f3a",
    fontSize: fontSize(14),
    borderWidth: 1,
    borderColor: "#f77f3a",
    width: "50%",
    borderRadius: 8,
    padding: 5,
    textAlign: "center",
  },
  orderProductPriceText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#f77f3a",
    textAlign: "right",
  },
  orderProductTotalText: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  orderProductPriceItem: {
    flexDirection: "row",
    width: "50%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMoreContainer: {
    paddingVertical: 10,
    alignItems: "center",
  },
  orderDivider: {
    height: 5,
    backgroundColor: "#f0f2f5",
    width: "100%",
  },
  headerPlaceholder: {
    width: 24, // Same width as BackIcon to balance the layout
  },
});
