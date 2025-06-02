import DocumentApprovedIcon from "../components/DocumentApprovedIcon";
import PdfDocumentIcon from "../components/PdfDocumentIcon";
import DocumentClockIcon from "../components/DocumentClockIcon";
import { ImageSourcePropType } from "react-native";

interface ProductStatus {
    icon: React.ElementType;
    text: string;
    textKey: string;
    status: number | null;
    img?: ImageSourcePropType;
}
export const productStatus: ProductStatus[] = [
    { icon: DocumentApprovedIcon, text: '询盘', textKey: 'order.status.waiting_quote', status: 8,img:require("../../assets/home/11.png") },
    { icon: PdfDocumentIcon, text: '待支付', textKey: 'order.status.waiting_payment', status: 0,img:require("../../assets/home/1.png") },
    { icon: DocumentClockIcon, text: '待发货', textKey: 'order.status.waiting_shipment', status: 1,img:require("../../assets/home/2.png") },
    { icon: DocumentApprovedIcon, text: '运输中', textKey: 'order.status.in_transit', status: 2,img:require("../../assets/home/10.png") },
    { icon: PdfDocumentIcon, text: '完成', textKey: 'order.status.completed', status: 3,img:require("../../assets/home/9.png") },
    { icon: DocumentClockIcon, text: '已过期', textKey: 'order.status.expired', status: 4,img:require("../../assets/home/7.png") },
    { icon: DocumentClockIcon, text: '已取消', textKey: 'order.status.cancelled', status: 5,img:require("../../assets/home/8.png") },
    { icon: DocumentClockIcon, text: '已退款', textKey: 'order.status.refunded', status: 6,img:require("../../assets/home/6.png") }
  ]