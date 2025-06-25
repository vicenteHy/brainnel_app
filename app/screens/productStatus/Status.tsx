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
  Dimensions,
} from "react-native";
import PagerView from 'react-native-pager-view';
import { useRoute, RouteProp } from "@react-navigation/native";
import { productStatus } from "../../constants/productStatus";
import BackIcon from "../../components/BackIcon";
import MassageIcon from "../../components/MassageIcon";
import { useEffect, useState, useRef, useCallback } from "react";
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
import { getOrderTransLanguage, getAttributeTransLanguage, getAttributeNameTransLanguage } from "../../utils/languageUtils";
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
  const pagerRef = useRef<PagerView>(null);
  
  // 状态标签位置和宽度记录
  const statusWidthsRef = useRef<Map<number | null, number>>(new Map());
  const statusPositionsRef = useRef<Map<number | null, number>>(new Map());
  const isScrollingRef = useRef(false); // 防止重复滚动的标志位
  
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

  // 记录状态标签的位置信息
  const handleStatusLayout = useCallback((statusValue: number | null, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    statusWidthsRef.current.set(statusValue, width);
    statusPositionsRef.current.set(statusValue, x);
  }, []);

  // 精确居中当前选中的状态标签
  const scrollStatusToCenter = useCallback((statusValue: number | null, immediate = false) => {
    if (!statusScrollViewRef.current || isScrollingRef.current) return;
    
    const executeScroll = () => {
      const position = statusPositionsRef.current.get(statusValue);
      const width = statusWidthsRef.current.get(statusValue);
      
      if (position !== undefined && width !== undefined) {
        const screenWidth = Dimensions.get('window').width;
        const containerPadding = 6; // statusListScr的paddingHorizontal
        
        // 计算目标状态标签的中心点位置
        const itemCenterX = position + (width / 2);
        
        // 计算需要滚动的距离，使状态标签居中显示
        const scrollToX = Math.max(0, itemCenterX - (screenWidth / 2) + containerPadding);
        
        isScrollingRef.current = true;
        statusScrollViewRef.current?.scrollTo({
          x: scrollToX,
          animated: !immediate,
        });
        
        // 重置滚动标志位
        setTimeout(() => {
          isScrollingRef.current = false;
        }, immediate ? 0 : 300);
      } else {
        // 如果还没有布局信息，使用简单估算
        const statusIndex = statusList.findIndex(item => item.status === statusValue);
        if (statusIndex !== -1) {
          const estimatedItemWidth = 80;
          const screenWidth = Dimensions.get('window').width;
          const scrollToX = Math.max(0, (statusIndex * estimatedItemWidth) - (screenWidth / 2));
          
          isScrollingRef.current = true;
          statusScrollViewRef.current?.scrollTo({
            x: scrollToX,
            animated: !immediate,
          });
          
          // 重置滚动标志位
          setTimeout(() => {
            isScrollingRef.current = false;
          }, immediate ? 0 : 300);
        }
      }
    };
    
    if (immediate) {
      executeScroll();
    } else {
      // 只在有布局信息时才延迟，否则立即执行
      const hasLayoutInfo = statusPositionsRef.current.has(statusValue);
      if (hasLayoutInfo) {
        executeScroll();
      } else {
        setTimeout(executeScroll, 50);
      }
    }
  }, [statusList]);

  // 获取页面索引
  const getPageIndex = (status: number | null): number => {
    const index = statusList.findIndex(item => item.status === status);
    return index >= 0 ? index : 0;
  };

  // 获取状态从索引
  const getStatusFromIndex = (index: number): number | null => {
    return statusList[index]?.status ?? null;
  };

  // 处理标签点击
  const handleTabPress = (selectedStatus: number | null) => {
    setStatus(selectedStatus);
    const pageIndex = getPageIndex(selectedStatus);
    pagerRef.current?.setPage(pageIndex);
    changeStatus(selectedStatus);
    
    // 自动居中当前状态标签
    requestAnimationFrame(() => {
      scrollStatusToCenter(selectedStatus);
    });
  };

  // 处理页面滑动
  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    const newStatus = getStatusFromIndex(position);
    setStatus(newStatus);
    changeStatus(newStatus);
    
    // 自动居中当前状态标签
    requestAnimationFrame(() => {
      scrollStatusToCenter(newStatus);
    });
  };

  const getAllOrdersList = async () => {
    setLoading(true);

    if(route.params.status === 8){
      const data = {
        page: page,
        page_size: pageSize,
        status: route.params.status,
      };
      const res =  await inquiriesApi.getInquiries(data.page, data.page_size, 1);
      console.log('📋 获取询价数据:', JSON.stringify(res, null, 2));
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
        console.log('📋 获取订单数据完成，状态:', route.params.status, '页码:', page);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
    
  };

  useEffect(() => {    
    setStatus(route.params.status);
    setPage(1);
    getAllOrdersList();
    
    // 滑动到初始页面
    const initialPageIndex = getPageIndex(route.params.status);
    setTimeout(() => {
      pagerRef.current?.setPage(initialPageIndex);
      // 自动居中当前状态标签
      scrollStatusToCenter(route.params.status, true);
    }, 100);
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
      case 8: return t("order.status.waiting_quote");
      default: return t("order.status.unknown");
    }
  };

  //   const handleImagePress = (imageUrl: string) => {
  //     setImages([imageUrl]);
  //     setCurrentImageIndex(0);
  //     setImageViewerVisible(true);
  //   };

  const changeStatus = async (selectedStatus: number | null) => {
    setLoading(true);
    setPage(1);
    
    if (selectedStatus === 8) {
      // 调用询价接口
      try {
        const res = await inquiriesApi.getInquiries(1, pageSize, 1);
        console.log('📋 切换状态-获取询价数据:', JSON.stringify(res, null, 2));
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
      if (selectedStatus) {
        data.status = selectedStatus;
      }
      if (selectedStatus === 0) {
        data.status = 0;
      }

      console.log('📋 切换状态-请求订单数据参数:', JSON.stringify(data, null, 2));
      try {
        await getAllOrders(data, 1);
        console.log('📋 切换状态-获取订单数据完成，状态:', selectedStatus);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOrderDetailsPress = (orderId: string, orderStatus: number) => {
    navigation.navigate("OrderDetails", { orderId, status: orderStatus });
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
                style={styles.statusItem}
                key={index}
                onPress={() => handleTabPress(item.status)}
                onLayout={(event) => handleStatusLayout(item.status, event)}
              >
                <Text
                  style={[
                    styles.statusItemText,
                    status === item.status ? styles.statusItemActiveText : null,
                  ]}
                >
                  {t(item.textKey)}
                </Text>
                {status === item.status && <View style={styles.underline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={getPageIndex(route.params.status)}
          onPageSelected={handlePageSelected}
          orientation="horizontal"
        >
          {statusList.map((statusItem, index) => (
            <View key={index} style={styles.pageContainer}>
              <View style={styles.orderContent}>
                {loading && page === 1 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5100" />
                  </View>
                ) : (
                  <ScrollView
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={async (event) => {
                      // 只在当前活跃页面处理滚动事件
                      if (status !== statusItem.status) return;
                      
                      const { contentOffset, contentSize, layoutMeasurement } =
                        event.nativeEvent;
                      const isAtBottom =
                        contentOffset.y + layoutMeasurement.height >=
                        contentSize.height - 20;
                                      
                      if (isAtBottom) {
                        setLoading(true);
                        setPage(page + 1);
                        
                        if (statusItem.status === 8) {
                          // 询价分页加载
                          try {
                            const res = await inquiriesApi.getInquiries(page + 1, pageSize, 1);
                            console.log('📋 分页加载询价数据:', JSON.stringify(res, null, 2));
                            setInquiries(prev => [...prev, ...res.items]);
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          // 订单分页加载
                          const data: PaginatedOrderRequest = {
                            page: page,
                            page_size: pageSize,
                            status: statusItem.status,
                          };
                          console.log('📋 分页加载订单数据参数:', JSON.stringify(data, null, 2));
                          getAllOrders(data, page);
                        }
                      }
                    }}
                  >
                    {statusItem.status === 8 ? (
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
                                </View>
                                <TouchableOpacity
                                  style={styles.orderProductView}
                                  onPress={() => {
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
                                  {item.order_no}
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
                                          {getAttributeNameTransLanguage(attr)}:{getAttributeTransLanguage(attr)}
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
                                  onPress={() => handleOrderDetailsPress(item.order_id, item.status)}
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
                        <ActivityIndicator size="small" color="#FF5100" />
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          ))}
        </PagerView>
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
    color: "#000000",
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
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    position: "relative",
  },
  statusItemText: {
    fontSize: fontSize(12),
    textAlign: "center",
    color: "#666666",
    fontWeight: "400",
  },
  statusItemActiveText: {
    color: "#000000",
    fontWeight: "700",
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 2,
    backgroundColor: "#000000",
    borderRadius: 1,
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
    color: "#000000",
  },
  orderStatusText: {
    color: "#FF5100",
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
    color: "#000000",
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
    color: "#FF5100",
    fontSize: fontSize(14),
    borderWidth: 1,
    borderColor: "#FF5100",
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
    textAlign: "center",
    minWidth: 80,
  },
  orderProductPriceText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#FF5100",
    textAlign: "right",
  },
  orderProductTotalText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#000000",
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
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
});
