import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import fontSize from "../../../utils/fontsizeUtils";
import CircleOutlineIcon from "../../../components/CircleOutlineIcon";
import OrangeCircleIcon from "../../../components/OrangeCircleIcon";
import {
  getSubjectTransLanguage,
  getAttributeTransLanguage,
} from "../../../utils/languageUtils";
import { GetCartList } from "../../../services/api/cart";
import { styles } from "../styles";
import { t } from "../../../i18n";

interface CartItemProps {
  item: GetCartList;
  index1: number;
  user_id: string | null;
  vip_discount: number;
  editingItem: {
    cartId: number;
    cartItemId: number;
    currentQuantity: number;
  } | null;
  quantityInput: string;
  onToggleSelection: (cartItemId: string, index1: number, index: number | null) => void;
  onDeleteSku: (cartId: number, cartItemId: number, cartId1: number) => void;
  onNavigateToProduct: (offerId: string, subject: string, price: number) => void;
  onDecreaseQuantity: (
    cartId: number,
    cartItemId: number,
    currentQuantity: number,
    minOrderQuantity: number
  ) => void;
  onIncreaseQuantity: (
    cartId: number,
    cartItemId: number,
    currentQuantity: number
  ) => void;
  onQuantityPress: (
    cartId: number,
    cartItemId: number,
    currentQuantity: number
  ) => void;
  onQuantityInputChange: (text: string) => void;
  onQuantityInputConfirm: () => void;
  onQuantityInputBlur: () => void;
  calculateProductGroupTotalQuantity: (cartId: number) => number;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  index1,
  user_id,
  vip_discount,
  editingItem,
  quantityInput,
  onToggleSelection,
  onDeleteSku,
  onNavigateToProduct,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onQuantityPress,
  onQuantityInputChange,
  onQuantityInputConfirm,
  onQuantityInputBlur,
  calculateProductGroupTotalQuantity,
}) => {
  return (
    <View key={item.cart_id}>
      <View style={styles.productCardListing}>
        <View style={styles.productCardContainer5}>
          <View style={styles.svgContainer1}>
            <TouchableOpacity
              onPress={() =>
                onToggleSelection(String(item.cart_id), index1, null)
              }
              disabled={!user_id}
            >
              <View style={[styles.iconContainer]}>
                {item.selected === 1 ? (
                  <OrangeCircleIcon size={fontSize(24)} />
                ) : (
                  <CircleOutlineIcon size={fontSize(24)} />
                )}
              </View>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: item.product_image }}
            style={styles.imageThumbnail}
          />
          <View style={styles.productInfoContainer2}>
            <Text
              style={styles.casualTextSnippet}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {getSubjectTransLanguage(item) || item.subject}
            </Text>
            <Text style={styles.productDetailsTextStyle1}>
              {t("cart.min_order")}:{" "}
              {calculateProductGroupTotalQuantity(item.cart_id)}/
              {item.min_order_quantity}
              {t("cart.pieces")}
            </Text>
          </View>
        </View>
        {item.skus.map((sku, index) => {
          return (
            <Swipeable
              key={sku.cart_item_id}
              enabled={!!user_id}
              renderRightActions={() => (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ff5217",
                    justifyContent: "center",
                    alignItems: "center",
                    width: 80,
                  }}
                  onPress={() =>
                    onDeleteSku(
                      item.cart_id,
                      sku.cart_item_id,
                      item.cart_id
                    )
                  }
                  disabled={!user_id}
                >
                  <Text
                    style={{ color: "white", fontWeight: "bold" }}
                  >
                    {t("cart.delete")}
                  </Text>
                </TouchableOpacity>
              )}
            >
              <TouchableOpacity
                onPress={() => {
                  if (user_id) {
                    onNavigateToProduct(item.offer_id, item.subject, sku.price);
                  }
                }}
                style={[
                  styles.productCardContainer5,
                  styles.productCardContainer4,
                ]}
              >
                <View style={styles.svgContainer1}>
                  <TouchableOpacity
                    onPress={() =>
                      user_id &&
                      onToggleSelection(
                        String(sku.cart_item_id),
                        index1,
                        index
                      )
                    }
                    disabled={!user_id}
                  >
                    <View style={[styles.iconContainer]}>
                      {sku.selected === 1 ? (
                        <OrangeCircleIcon size={fontSize(24)} />
                      ) : (
                        <CircleOutlineIcon size={fontSize(24)} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
                <Image
                  source={{
                    uri: sku.attributes[0]?.sku_image_url
                      ? sku.attributes[0]?.sku_image_url
                      : item.product_image,
                  }}
                  style={styles.productImageDisplayStyle}
                />
                <View style={styles.productCardWidget1}>
                  {/* SKU attributes at the top */}
                  {sku.attributes[0]?.value && (
                    <View style={styles.longLifeRougeStyle}>
                      <Text
                        style={styles.longLifeTextSnippet}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {getAttributeTransLanguage(sku.attributes[0]) ||
                          sku.attributes[0].attribute_name_trans}{" "}
                        {sku.attributes[1] ? "/" : ""}{" "}
                        {sku.attributes[1]
                          ? getAttributeTransLanguage(sku.attributes[1]) ||
                            sku.attributes[1].attribute_name_trans
                          : ""}
                      </Text>
                    </View>
                  )}

                  {/* Price section - discount and actual price close together */}
                  <View style={styles.priceSection}>
                    <View style={styles.priceColumnContainer}>
                      {/* Discount price */}
                      <View style={styles.productInfoContainer1}>
                        <View style={styles.priceInfoContainer1}>
                          <Text style={styles.discountPriceLabel}>
                            {sku.original_price} {sku.currency}
                          </Text>
                        </View>
                        <View style={styles.vipContainer}>
                          <Image
                            source={require("../../../../assets/img/zkVIP1.png")}
                            style={styles.VipImg}
                          />
                          <Text style={styles.discountPercentageTextStyle}>
                            -{((1 - vip_discount) * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>

                      {/* Actual price - right below discount price */}
                      <View style={styles.productInfoContainer4}>
                        <Text style={styles.productCodeLabel}>
                          {sku.price}
                        </Text>
                        <Text style={styles.productDetailsTextStyle}>
                          {sku.currency}
                        </Text>
                      </View>
                    </View>

                    {/* Quantity controls on the right */}
                    <View style={styles.orderQuantityContainer}>
                      <TouchableOpacity
                        style={[
                          styles.svgContainer4,
                          { borderRightWidth: 0 },
                        ]}
                        onPress={() =>
                          user_id &&
                          onDecreaseQuantity(
                            item.cart_id,
                            sku.cart_item_id,
                            sku.quantity,
                            item.min_order_quantity
                          )
                        }
                        disabled={!user_id}
                      >
                        <Text
                          style={{
                            fontSize: fontSize(18),
                            color: "#333",
                            fontWeight: "500",
                          }}
                        >
                          -
                        </Text>
                      </TouchableOpacity>
                      {editingItem &&
                      editingItem.cartId === item.cart_id &&
                      editingItem.cartItemId === sku.cart_item_id ? (
                        <TextInput
                          style={[
                            styles.quantityLabelContainer,
                            styles.quantityInputInline,
                          ]}
                          value={quantityInput}
                          onChangeText={onQuantityInputChange}
                          keyboardType="number-pad"
                          maxLength={3}
                          autoFocus
                          onBlur={onQuantityInputBlur}
                          onSubmitEditing={onQuantityInputConfirm}
                        />
                      ) : (
                        <TouchableOpacity
                          style={styles.quantityLabelContainer}
                          onPress={() =>
                            user_id &&
                            onQuantityPress(
                              item.cart_id,
                              sku.cart_item_id,
                              sku.quantity
                            )
                          }
                          disabled={!user_id}
                        >
                          <Text style={styles.quantityText}>
                            {sku.quantity}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.svgContainer4,
                          { borderLeftWidth: 0, marginLeft: 0 },
                        ]}
                        onPress={() =>
                          user_id &&
                          onIncreaseQuantity(
                            item.cart_id,
                            sku.cart_item_id,
                            sku.quantity
                          )
                        }
                        disabled={!user_id}
                      >
                        <Text
                          style={{
                            fontSize: fontSize(18),
                            color: "#333",
                            fontWeight: "500",
                          }}
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        })}
      </View>
    </View>
  );
};