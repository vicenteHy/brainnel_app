const payMap = new Map<string, string>();


payMap.set("paypal",  require("../../assets/payimg/image_8786995c.png"));
payMap.set("Orange",  require("../../assets/payimg/image_96b927ad.e32c60b158f84e8ca6f7.png"));
payMap.set("Free Money",  require("../../assets/payimg/freemoney.png"));
payMap.set("MTN",  require("../../assets/payimg/image_7337a807 copy.png"));
payMap.set("Moov",  require("../../assets/payimg/image_1fee7e8b.png"));
payMap.set("wave",  require("../../assets/payimg/image_13d56c9.png"));
payMap.set("MobiCash",require("../../assets/payimg/MobiCash.png"));
payMap.set("mobile_money",require("../../assets/payimg/image_cb840273.png"));
payMap.set("balance",require("../../assets/img/余额 icon.png"));
payMap.set("bank_card",require("../../assets/img/image_4e72f054.png"))
payMap.set("Airtel",require("../../assets/payimg/airtel.png"))


const getPayMap = (key: string) => {
  return payMap.get(key);
};

export default getPayMap;
