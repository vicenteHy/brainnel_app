import React, { useState, useCallback, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from "@expo/vector-icons/Ionicons";
import { getOptimizedImageUrl, imageConfig } from '../../../utils/imageConfig';

interface OptimizedImageProps {
  uri: string;
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  blurhash?: string;
  priority?: 'low' | 'normal' | 'high';
}

export const OptimizedImage = React.memo(({
  uri,
  style,
  resizeMode = 'cover',
  blurhash,
  priority = 'normal'
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const onLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const onError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  // 优化图片URL
  const optimizedUri = useMemo(() => {
    if (!uri) return uri;
    const width = style.width || 200;
    const height = style.height || 200;
    return getOptimizedImageUrl(uri, { 
      width: width * 2, // 2x for retina
      height: height * 2,
      quality: 0.8,
      format: 'webp'
    });
  }, [uri, style.width, style.height]);

  // 对于小图片，使用更小的缓存大小
  const cachePolicy = style.width < 100 ? 'memory' : 'disk';

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      
      {hasError ? (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <Ionicons name="image-outline" size={24} color="#999" />
        </View>
      ) : (
        <Image
          source={{ uri: optimizedUri }}
          style={style}
          contentFit={resizeMode}
          transition={200}
          onLoadEnd={onLoadEnd}
          onError={onError}
          cachePolicy={cachePolicy}
          priority={priority}
          placeholder={blurhash}
          recyclingKey={uri}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});