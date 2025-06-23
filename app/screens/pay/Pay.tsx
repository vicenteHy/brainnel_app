import React from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { PaymentFlow } from "./common/PaymentFlow";

type PayScreenRouteProp = RouteProp<
  {
    Pay: { payUrl: string; method: string; order_id: string };
  },
  "Pay"
>;

export const Pay = () => {
  const route = useRoute<PayScreenRouteProp>();
  const { payUrl, method, order_id } = route.params;

  return (
    <PaymentFlow
      paymentType="order"
      paymentId={order_id}
      payUrl={payUrl}
      method={method as "wave" | "mobile_money" | "paypal" | "bank_card"}
    />
  );
};