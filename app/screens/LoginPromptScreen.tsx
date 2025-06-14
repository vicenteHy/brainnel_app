import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import BackIcon from '../components/BackIcon';
import fontSize from '../utils/fontsizeUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RouteParams = {
  title?: string;
  message?: string;
  icon?: string;
  type?: 'chat' | 'cart' | 'profile';
};

type LoginPromptScreenProps = {
  title?: string;
  message?: string;
  icon?: string;
  type?: 'chat' | 'cart' | 'profile';
};

export const LoginPromptScreen: React.FC<LoginPromptScreenProps> = React.memo((props) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // Support both props and route.params
  const routeParams = route.params as RouteParams || {};
  const type = props?.type || routeParams.type || 'profile';
  
  // Get translated content based on type
  const getTranslatedContent = React.useCallback(() => {
    switch (type) {
      case 'chat':
        return {
          title: t('loginPrompt.chat.title'),
          message: t('loginPrompt.chat.message'),
          button: t('loginPrompt.chat.button')
        };
      case 'cart':
        return {
          title: t('loginPrompt.cart.title'),
          message: t('loginPrompt.cart.message'),
          button: t('loginPrompt.cart.button')
        };
      case 'profile':
      default:
        return {
          title: t('loginPrompt.profile.title'),
          message: t('loginPrompt.profile.message'),
          button: t('loginPrompt.profile.button')
        };
    }
  }, [type, t]);

  const translatedContent = getTranslatedContent();
  
  const {
    title = props?.title || routeParams.title || translatedContent.title,
    message = props?.message || routeParams.message || translatedContent.message,
    icon = props?.icon || routeParams.icon || '🔒'
  } = { ...routeParams, ...props };

  const handleBack = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleLogin = React.useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: '#fff' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header Navigation with manual safe area */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <BackIcon size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.contentContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#FF5100', '#FF7B54']}
              style={styles.iconBackground}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          
          {/* Description */}
          <Text style={styles.message}>{message}</Text>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>{translatedContent.button}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Bottom safe area */}
      <View style={{ height: insets.bottom }} />
    </View>
  );
});

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: '600' as const,
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: 4,
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconText: {
    fontSize: 40,
    textAlign: 'center' as const,
  },
  title: {
    fontSize: fontSize(24),
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  message: {
    fontSize: fontSize(16),
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#FF5100',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 200,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
};