const payMap = new Map<string, string>();


payMap.set("paypal",  require("../../assets/payimg/pay_paypal.png"));
payMap.set("Orange",  require("../../assets/payimg/pay_orange.png"));
payMap.set("Free Money",  require("../../assets/payimg/pay_free_money.png"));
payMap.set("MTN",  require("../../assets/payimg/pay_mtn.png"));
payMap.set("Moov",  require("../../assets/payimg/pay_moov.png"));
payMap.set("wave",  require("../../assets/payimg/pay_wave.png"));
payMap.set("MobiCash",require("../../assets/payimg/pay_mobicash.png"));
payMap.set("mobile_money",require("../../assets/payimg/pay_mobile_money.png"));
payMap.set("balance",require("../../assets/img/余额 icon.png"));
payMap.set("bank_card",require("../../assets/payimg/pay_bank_card.png"))
payMap.set("Airtel",require("../../assets/payimg/pay_airtel.png"))
payMap.set("visa", require("../../assets/payimg/pay_visa.png"))
payMap.set("amex", require("../../assets/payimg/pay_amex.png"))
payMap.set("mastercard", require("../../assets/payimg/pay_card.png"))


const getPayMap = (key: string) => {
  return payMap.get(key);
};

export default getPayMap;
