import React from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { PaymentFlow } from "./common/PaymentFlow";

type PayScreenRouteProp = RouteProp<
  {
    Pay: { payUrl: string; method: string; order_id: string; is_local?: number };
  },
  "Pay"
>;

export const Pay = () => {
  const route = useRoute<PayScreenRouteProp>();
  const { payUrl, method, order_id, is_local } = route.params;

  return (
    <PaymentFlow
      paymentType="order"
      paymentId={order_id}
      payUrl={payUrl}
      method={method as "wave" | "mobile_money" | "paypal" | "bank_card"}
      is_local={is_local}
    />
  );
};