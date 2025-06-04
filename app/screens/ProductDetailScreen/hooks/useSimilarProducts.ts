import { useState, useEffect, useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { productApi, Similars, similar } from '../../../services/api/productApi';
import useUserStore from '../../../store/user';
import { getSubjectTransLanguage } from '../../../utils/languageUtils';

type ProductDetailRouteParams = {
  offer_id: string;
  searchKeyword?: string;
  price: number;
};

export const useSimilarProducts = () => {
  const userStore = useUserStore();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<Record<string, ProductDetailRouteParams>, string>>();
  
  const [similars, setSimilars] = useState<Similars>();
  const [isSimilarsFlag, setIsSimilarsFlag] = useState(false);

  const getSimilars = () => {
    productApi
      .getSimilarProducts(route.params.offer_id, userStore.user?.user_id, 5)
      .then((res) => {
        setSimilars(res);
        setIsSimilarsFlag(true);
      });
  };

  const handleProductPress = useCallback(
    (item: similar) => {
      InteractionManager.runAfterInteractions(() => {
        navigation.push("ProductDetail", {
          offer_id: item.offer_id,
          price: item.min_price,
        });
      });
    },
    [navigation]
  );

  const handleViewAllRelatedProducts = useCallback((product: any) => {
    if (product?.subject_trans) {
      navigation.navigate("RelatedProductsScreen", {
        product_id: route.params.offer_id,
        product_name: getSubjectTransLanguage(product),
      });
    }
  }, [navigation, route.params.offer_id]);

  const renderSkeletonItems = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => ({ id: `skeleton-${index}`, isSkeleton: true }));
  };

  useEffect(() => {
    getSimilars();
  }, []);

  return {
    similars,
    isSimilarsFlag,
    handleProductPress,
    handleViewAllRelatedProducts,
    renderSkeletonItems,
  };
};