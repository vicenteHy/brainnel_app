import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAttributeTransLanguage, getAttributeNameTransLanguage } from '../../../utils/languageUtils';
import { styles } from '../styles';

interface ProductAttributesProps {
  groupList: any[];
  expandedGroups: { [key: string]: boolean };
  toggleExpand: (attributeName: string) => void;
  handleSizeSelect: (size: string, index: number) => void;
  handleColorSelect: (colorId: string, index: number) => void;
  getDisplayAttributes: (attributes: any[], attributeName: string) => any[];
}

export const ProductAttributes: React.FC<ProductAttributesProps> = ({
  groupList,
  expandedGroups,
  toggleExpand,
  handleSizeSelect,
  handleColorSelect,
  getDisplayAttributes,
}) => {
  const { t } = useTranslation();
  
  
  return (
    <View style={styles.productDetailsContainer}>
      <View style={styles.productAttributesWrapper}>
        <View style={styles.attributesContainer}>
          {groupList.map((item, index) => {
            
            
            return item.has_image ? (
              <View key={getAttributeNameTransLanguage(item)}>
                <Text style={styles.attributeLabel}>
                  {getAttributeNameTransLanguage(item)} :{" "}
                  {(() => {
                    const selectedAttribute = item.attributes.find((item: any) => item.has_color);
                    return selectedAttribute ? getAttributeTransLanguage(selectedAttribute) : '';
                  })()}
                </Text>
                <View style={styles.horizontalFlexContainer}>
                  {getDisplayAttributes(item.attributes, getAttributeNameTransLanguage(item)).map((attribute) => (
                    <TouchableOpacity
                      key={attribute.value}
                      onPress={() => handleColorSelect(attribute.value, index)}
                      activeOpacity={1}
                      style={[
                        styles.colorImageContainer,
                        attribute.has_color && styles.selectedColorImageContainer,
                      ]}
                    >
                      <Image
                        source={{ uri: attribute.sku_image_url }}
                        style={styles.imageContainer}
                      />
                    </TouchableOpacity>
                  ))}
                  {!expandedGroups[getAttributeNameTransLanguage(item)] &&
                    item.attributes.length > 6 && (
                      <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => toggleExpand(getAttributeNameTransLanguage(item))}
                        activeOpacity={1}
                      >
                        <Text style={styles.expandButtonText}>
                          +{item.attributes.length - 6}
                        </Text>
                      </TouchableOpacity>
                    )}
                  {expandedGroups[getAttributeNameTransLanguage(item)] && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => toggleExpand(getAttributeNameTransLanguage(item))}
                      activeOpacity={1}
                    >
                      <Text style={styles.expandButtonText}>{t('collapse')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View key={getAttributeNameTransLanguage(item)}>
                <Text style={styles.attributeLabel}>
                  {getAttributeNameTransLanguage(item)}
                </Text>
                <View style={styles.horizontalFlexContainer}>
                  {getDisplayAttributes(item.attributes, getAttributeNameTransLanguage(item)).map((attribute) => (
                    <TouchableOpacity
                      key={attribute.value}
                      onPress={() => handleSizeSelect(attribute.value, index)}
                      activeOpacity={1}
                      style={[
                        styles.sizeButton,
                        attribute.has_color && styles.selectedSizeButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeButtonText,
                          attribute.has_color && styles.selectedSizeText,
                        ]}
                      >
                        {getAttributeTransLanguage(attribute) || attribute.value_trans}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {!expandedGroups[getAttributeNameTransLanguage(item)] &&
                    item.attributes.length > 6 && (
                      <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => toggleExpand(getAttributeNameTransLanguage(item))}
                        activeOpacity={1}
                      >
                        <Text style={styles.expandButtonText}>{t('showMore')}</Text>
                      </TouchableOpacity>
                    )}
                  {expandedGroups[getAttributeNameTransLanguage(item)] && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => toggleExpand(getAttributeNameTransLanguage(item))}
                      activeOpacity={1}
                    >
                      <Text style={styles.expandButtonText}>{t('collapse')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};