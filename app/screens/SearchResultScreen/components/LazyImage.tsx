import React, { useState, useCallback } from "react";
import { View, Image, Text } from "react-native";
import IconComponent from "./IconComponent";
import fontSize from "../../../utils/fontsizeUtils";

const LazyImage = React.memo(
  ({
    uri,
    style,
    resizeMode,
  }: {
    uri: string;
    style: any;
    resizeMode: any;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    const onLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);
    
    const onError = useCallback(() => {
      setHasError(true);
      setIsLoaded(true);
    }, []);

    const imagePlaceholderStyle = {
      backgroundColor: '#EAEAEA',
      justifyContent: 'center' as 'center',
      alignItems: 'center' as 'center',
      borderRadius: 8,
    };

    return (
      <View style={[style, { overflow: "hidden" }]}>
        {!isLoaded && !hasError && (
          <View style={[style, imagePlaceholderStyle, { position: 'absolute', zIndex: 1 }]} />
        )}
        
        {hasError && (
          <View
            style={[style, imagePlaceholderStyle, { position: 'absolute', zIndex: 1 }]}
          >
            <IconComponent name="image-outline" size={24} color="#999" />
            <Text style={{ fontSize: fontSize(12), color: "#999", marginTop: 4 }}>
              加载失败
            </Text>
          </View>
        )}
        
        <Image
          source={{ uri }}
          style={[style, { opacity: isLoaded ? 1 : 0 }]}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onError={onError}
        />
      </View>
    );
  }
);

export default LazyImage;