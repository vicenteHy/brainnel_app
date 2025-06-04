import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAttributeTransLanguage } from '../../../utils/languageUtils';
import fontSize from '../../../utils/fontsizeUtils';
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
          {groupList.map((item, index) =>
            item.has_image ? (
              <View key={item.attribute_name_trans}>
                <Text style={styles.attributeLabel}>
                  {item.attribute_name_trans} :{" "}
                  {(() => {
                    const selectedAttribute = item.attributes.find((item: any) => item.has_color);
                    return selectedAttribute ? getAttributeTransLanguage(selectedAttribute) : '';
                  })()}
                </Text>
                <View style={styles.horizontalFlexContainer}>
                  {getDisplayAttributes(item.attributes, item.attribute_name_trans).map((attribute) => (
                    <TouchableOpacity
                      key={attribute.value}
                      onPress={() => handleColorSelect(attribute.value, index)}
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
                  {!expandedGroups[item.attribute_name_trans] &&
                    item.attributes.length > 6 && (
                      <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => toggleExpand(item.attribute_name_trans)}
                      >
                        <Text style={styles.expandButtonText}>
                          +{item.attributes.length - 6}
                        </Text>
                      </TouchableOpacity>
                    )}
                  {expandedGroups[item.attribute_name_trans] && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => toggleExpand(item.attribute_name_trans)}
                    >
                      <Text style={styles.expandButtonText}>{t('collapse')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View key={item.attribute_name_trans}>
                <Text style={styles.attributeLabel}>
                  {item.attribute_name_trans}
                </Text>
                <View style={styles.horizontalFlexContainer}>
                  {getDisplayAttributes(item.attributes, item.attribute_name_trans).map((attribute) => (
                    <TouchableOpacity
                      key={attribute.value}
                      onPress={() => handleSizeSelect(attribute.value, index)}
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
                  {!expandedGroups[item.attribute_name_trans] &&
                    item.attributes.length > 6 && (
                      <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => toggleExpand(item.attribute_name_trans)}
                      >
                        <Text style={styles.expandButtonText}>{t('showMore')}</Text>
                      </TouchableOpacity>
                    )}
                  {expandedGroups[item.attribute_name_trans] && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => toggleExpand(item.attribute_name_trans)}
                    >
                      <Text style={styles.expandButtonText}>{t('collapse')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          )}
        </View>
      </View>
    </View>
  );
};