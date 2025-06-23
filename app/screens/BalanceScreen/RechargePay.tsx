import React from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { PaymentFlow } from "../pay/common/PaymentFlow";

type RechargePayScreenRouteProp = RouteProp<
  {
    RechargePay: { payUrl: string; method: string; recharge_id: string };
  },
  "RechargePay"
>;

export const RechargePay = () => {
  const route = useRoute<RechargePayScreenRouteProp>();
  const { payUrl, method, recharge_id } = route.params;

  return (
    <PaymentFlow
      paymentType="recharge"
      paymentId={recharge_id}
      payUrl={payUrl}
      method={method as "wave" | "mobile_money" | "paypal" | "bank_card"}
    />
  );
};