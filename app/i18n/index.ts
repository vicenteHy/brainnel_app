import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import enTranslation from '../locales/en/translation.json';
import frTranslation from '../locales/fr/translation.json';

// 本地存储的语言键
const LANGUAGE_KEY = '@app_language';
const LANGUAGE_SELECTED_KEY = '@language_selected';

// 获取设备语言
const deviceLanguage = Localization.locale.split('-')[0];

// 默认语言设置为英语，等待用户选择
const initialLanguage = 'en';

// 初始化 i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      fr: {
        translation: frTranslation
      }
    },
    lng: initialLanguage, // 默认使用英语
    fallbackLng: 'en', // 如果找不到翻译，使用英语
    interpolation: {
      escapeValue: false // 不需要转义 HTML
    },
    compatibilityJSON: 'v4' // 兼容 React Native
  });

// 从本地存储加载语言设置
const loadLanguage = async () => {
  try {
    // 首先检查用户是否已经选择过语言
    const languageSelected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
    
    if (languageSelected === 'true') {
      // 如果用户已经选择过语言，加载保存的语言设置
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        // 支持英语和法语
        const validLanguages = ['en', 'fr'];
        const validLanguage = validLanguages.includes(savedLanguage) ? savedLanguage : 'en';
        i18n.changeLanguage(validLanguage);
        console.log('已加载保存的语言:', validLanguage);
      }
    }
    // 如果用户还没有选择过语言，保持默认的英语，等待用户在语言选择界面选择
  } catch (error) {
    console.error('加载语言设置失败:', error);
  }
};

// 保存语言设置到本地存储
const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    console.log('已保存语言设置:', language);
  } catch (error) {
    console.error('保存语言设置失败:', error);
  }
};

// 修改语言切换函数，支持两种语言
export const changeLanguage = async (language: string) => {
  // 支持英语和法语
  const validLanguages = ['en', 'fr'];
  const validLanguage = validLanguages.includes(language) ? language : 'en';
  
  await saveLanguage(validLanguage);
  i18n.changeLanguage(validLanguage);

  console.log("切换语言：" + validLanguage);
};

// 初始化时加载语言设置
loadLanguage();

// 创建全局翻译函数
const t = (key: string, options?: any): string => {
  return i18n.t(key, options) as string;
};

// 导出全局翻译函数
export { t };

export const getCurrentLanguage = () => {
  return i18n.language;
};

export default i18n;

// const resources = {
//   en: {
//     translation: {
//       selectCountry: 'Select your country',
//       subtitle: 'You can change the country & language in your profile settings anytime.',
//       welcomeTitle: 'Welcome!',
//       welcomeMessage: 'Thank you for choosing your country. You can now log in and use the app.',
//       loginNow: 'Log in now',
//       mainAppTitle: 'Welcome to MainApp',
//       mainAppText: 'This is the main application screen.',
//       resetCountry: 'Reset Country Selection',
//       loginTitle: 'Login For brainnel',
//       loginSubtitle: 'Login to start your business',
//       continueWithGoogle: 'Continue with Google',
//       continueWithFacebook: 'Continue with Facebook',
//       continueWithApple: 'Continue with Apple',
//       continueWithInstagram: 'Continue with Instagram',
//       continueWithEmail: 'Continue with Email',
//       continueWithPhone: 'Continue with phone number',
//       orContinueWith: 'Or continue with',
//       instagram: 'Instagram',
//       email: 'Email',
//       phone: 'Phone',
//       forgotPassword: 'Forget your password?',
//       termsText: 'By continuing, you agree to our',
//       termsOfUse: 'Terms of Use',
//       and: 'and',
//       privacyPolicy: 'Privacy Policy',
//       wholesalePrice: 'Wholesale price',
//       fastShipping: 'Fast shipping',
      
//       // Home Screen
//       shipping: 'Shipping',
//       quote: 'Quote',
//       tiktok: 'TikTok',
//       howToBuy: 'How to Buy',
//       all: 'All',
//       electronics: 'Electronics',
//       clothing: 'Clothing',
//       home: 'Home',
//       beauty: 'Beauty',
//       kids: 'Kids',
      
//       // Phone login screen
//       logInOrSignUp: 'Log in or sign up',
//       phoneNumber: 'Phone number',
//       enterPassword: 'Please re-enter your password',
//       passwordIncorrect: 'Password incorrect, please confirm your password.',
//       verificationCodeInfo: 'We will send a verification code on your number to confirm it\'s you.',
//       continue: 'Continue',
//       // Email login screen
//       pleaseEnterEmail: 'Please enter your e-mail address',
//       // Search Result Screen
//       searchProducts: 'Search products',
//       priceRange: 'Price range',
//       minPrice: 'Min price',
//       maxPrice: 'Max price',
//       reset: 'Reset',
//       apply: 'Apply',
//       price: 'Price',
//       lowToHigh: 'Low to high',
//       highToLow: 'High to low',
//       time: 'Time',
//       oldest: 'Oldest',
//       newest: 'Newest',
//       noResults: 'No results found for',
//       tryDifferentKeywords: 'Try using different keywords or check your spelling',
//       loadingMore: 'Loading more...',
//       noMoreData: 'No more data',
//       monthlySales: 'ventes',
//       // Search Screen
//       search: 'Search',
//       searchPlaceholder: 'Search products',
//       cancel: 'Cancel',
//       searchHistory: 'Search History',
//       hotSearch: 'Hot Search',
//       noRecentSearches: 'You have not recent searches',
//       headphones: 'Headphones',
//       computer: 'Computer',
//       tablet: 'Tablet',
//       watch: 'Watch',
//       camera: 'Camera',
//       homeAppliance: 'Home Appliance',
//       food: 'Food',
//       // Popular search terms
//       summerWomenClothes: 'Summer women clothes',
//       plusSizeWomen: 'Plus size women',
//       sexyUnderwear: 'Sexy underwear',
//       homeDecor: 'Home decor',
//       unusualToys: 'Unusual toys',
//       // Product Detail Screen
//       productDetail: 'Product Detail',
//       addToCart: 'Add to Cart',
//       buyNow: 'Buy Now',
//       color: 'Color',
//       size: 'Size',
//       moreFromStore: 'More from this Store',
//       viewAll: 'View All',
//       loadingProductInfo: 'Loading product information...',
//       productNotAvailable: 'Product is not available or has been removed',
//       customerService: 'Customer Service',
//       productDetails: 'Product Details',
//       loadingMoreProducts: 'Loading more products...',
//       noMoreProducts: 'No more products',
//       chatNow: 'Chat Now',
//       popularCategories: 'Popular Categories',
//     },
//   },
//   fr: {
//     translation: {
//       selectCountry: 'Sélectionnez votre pays',
//       subtitle: 'Vous pouvez modifier le pays et la langue dans les paramètres de votre profil à tout moment.',
//       welcomeTitle: 'Bienvenue!',
//       welcomeMessage: 'Merci d\'avoir choisi votre pays. Vous pouvez maintenant vous connecter et utiliser l\'application.',
//       loginNow: 'Se connecter maintenant',
//       mainAppTitle: 'Bienvenue sur MainApp',
//       mainAppText: 'Ceci est l\'écran principal de l\'application.',
//       resetCountry: 'Réinitialiser la sélection du pays',
//       loginTitle: 'Connexion à brainnel',
//       loginSubtitle: 'Connectez-vous pour démarrer votre entreprise',
//       continueWithGoogle: 'Continuer avec Google',
//       continueWithFacebook: 'Continuer avec Facebook',
//       continueWithApple: 'Continuer avec Apple',
//       continueWithInstagram: 'Continuer avec Instagram',
//       continueWithEmail: 'Continuer avec Email',
//       continueWithPhone: 'Continuer avec numéro de téléphone',
//       orContinueWith: 'Ou continuer avec',
//       instagram: 'Instagram',
//       email: 'Email',
//       phone: 'Téléphone',
//       forgotPassword: 'Mot de passe oublié?',
//       termsText: 'En continuant, vous acceptez nos',
//       termsOfUse: 'Conditions d\'utilisation',
//       and: 'et',
//       privacyPolicy: 'Politique de confidentialité',
//       wholesalePrice: 'Prix de gros',
//       fastShipping: 'Livraison rapide',
      
//       // Home Screen
//       shipping: 'Expédition',
//       quote: 'Devis',
//       tiktok: 'TikTok',
//       howToBuy: 'Comment acheter',
//       all: 'Tous',
//       electronics: 'Électronique',
//       clothing: 'Vêtements',
//       home: 'Maison',
//       beauty: 'Beauté',
//       kids: 'Enfants',
      
//       // Phone login screen
//       logInOrSignUp: 'Se connecter ou s\'inscrire',
//       phoneNumber: 'Numéro de téléphone',
//       enterPassword: 'Veuillez saisir à nouveau votre mot de passe',
//       passwordIncorrect: 'Mot de passe incorrect, veuillez confirmer votre mot de passe.',
//       verificationCodeInfo: 'Nous vous enverrons un code de vérification sur votre numéro pour confirmer que c\'est bien vous.',
//       continue: 'Continuer',
//       // Email login screen
//       pleaseEnterEmail: 'Veuillez entrer votre adresse e-mail',
//       // Search Result Screen
//       searchProducts: 'Rechercher des produits',
//       priceRange: 'Gamme de prix',
//       minPrice: 'Prix minimum',
//       maxPrice: 'Prix maximum',
//       reset: 'Réinitialiser',
//       apply: 'Appliquer',
//       price: 'Prix',
//       lowToHigh: 'Bas à élevé',
//       highToLow: 'Élevé à bas',
//       time: 'Temps',
//       oldest: 'Plus ancien',
//       newest: 'Plus récent',
//       noResults: 'Aucun résultat trouvé pour',
//       tryDifferentKeywords: 'Essayez d\'utiliser des mots-clés différents ou vérifiez votre orthographe',
//       loadingMore: 'Chargement...',
//       noMoreData: 'Plus de données',
//       monthlySales: 'Ventes mensuelles',
//       // Search Screen
//       search: 'Rechercher',
//       searchPlaceholder: 'Recherche',
//       cancel: 'Annuler',
//       searchHistory: 'Recherches récentes',
//       hotSearch: 'Populaires en ce moment',
//       noRecentSearches: 'Vous n\'avez pas de recherches récentes',
//       headphones: 'Écouteurs',
//       computer: 'Ordinateur',
//       tablet: 'Tablette',
//       watch: 'Montre',
//       camera: 'Appareil photo',
//       homeAppliance: 'Électroménager',
//       food: 'Alimentation',
//       // Popular search terms
//       summerWomenClothes: 'Vêtements d\'été femmes',
//       plusSizeWomen: 'Grande taille femmes',
//       sexyUnderwear: 'Sous vêtements hot',
//       homeDecor: 'Objet déco salon',
//       unusualToys: 'Jouet insolite',
//       // Product Detail Screen
//       productDetail: 'Détail du Produit',
//       addToCart: 'Ajouter au Panier',
//       buyNow: 'Acheter Maintenant',
//       color: 'Couleur',
//       size: 'Taille',
//       moreFromStore: 'Plus de ce Magasin',
//       viewAll: 'Voir Tout',
//       loadingProductInfo: 'Chargement des informations produit...',
//       productNotAvailable: 'Le produit n\'est pas disponible ou a été supprimé',
//       customerService: 'Service Client',
//       productDetails: 'Détails du Produit',
//       loadingMoreProducts: 'Chargement de plus de produits...',
//       noMoreProducts: 'Plus de produits',
//       chatNow: 'Discuter',
//       popularCategories: 'Catégories populaires',
//     },
//   },
//   zh: {
//     translation: {
//       // Home Screen
//       searchProducts: '搜索商品',
//       shipping: '运输',
//       quote: '报价',
//       tiktok: '抖音',
//       howToBuy: '如何购买',
//       all: '全部',
//       electronics: '电子产品',
//       clothing: '服装',
//       home: '家居',
//       beauty: '美妆',
//       kids: '儿童',
      
//       // Search Result Screen
//       priceRange: '价格范围',
//       minPrice: '最低价',
//       maxPrice: '最高价',
//       reset: '重置',
//       apply: '应用',
//       price: '价格',
//       lowToHigh: '低到高',
//       highToLow: '高到低',
//       time: '时间',
//       oldest: '最早',
//       newest: '最新',
//       noResults: '未找到搜索结果',
//       tryDifferentKeywords: '尝试使用不同的关键词或检查拼写',
//       loadingMore: '正在加载更多...',
//       noMoreData: '没有更多数据了',
//       monthlySales: '月销量',
//       // Search Screen
//       search: '搜索',
//       searchPlaceholder: '搜索商品',
//       cancel: '取消',
//       searchHistory: '历史搜索',
//       hotSearch: '热门搜索',
//       noRecentSearches: '暂无搜索记录',
//       phone: '手机',
//       headphones: '耳机',
//       computer: '电脑',
//       tablet: '平板',
//       watch: '手表',
//       camera: '相机',
//       homeAppliance: '家电',
//       food: '食品',
//       // Popular search terms
//       summerWomenClothes: '女士夏装',
//       plusSizeWomen: '女士大码',
//       sexyUnderwear: '性感内衣',
//       homeDecor: '家居装饰',
//       unusualToys: '奇特玩具',
//       // Product Detail Screen
//       productDetail: '商品详情',
//       addToCart: '加入购物车',
//       buyNow: '立即购买',
//       color: '颜色',
//       size: '尺寸',
//       moreFromStore: '来自此店铺的更多商品',
//       viewAll: '查看全部',
//       loadingProductInfo: '加载商品信息...',
//       productNotAvailable: '商品不存在或已下架',
//       customerService: '客服',
//       productDetails: '产品详情',
//       loadingMoreProducts: '正在加载更多产品...',
//       noMoreProducts: '没有更多产品了',
//       chatNow: '立即聊天',
//       popularCategories: '热门分类',
//     }
//   }
// };

// const getDefaultLanguage = () => {
//   const locale = Localization.locale;
//   const languageCode = locale.split('-')[0]; // Get the language code part
//   return languageCode === 'fr' ? 'fr' : 'en';
// };

// i18n
//   .use(initReactI18next)
//   .init({
//     resources,
//     lng: getDefaultLanguage(),
//     fallbackLng: 'en',
//     interpolation: {
//       escapeValue: false,
//     },
//   });

// export default i18n; 
