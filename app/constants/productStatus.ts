import DocumentApprovedIcon from "../components/DocumentApprovedIcon";
import PdfDocumentIcon from "../components/PdfDocumentIcon";
import DocumentClockIcon from "../components/DocumentClockIcon";

interface ProductStatus {
    icon: React.ElementType;
    text: string;
    textKey: string;
    status: number | null;
}
export const productStatus: ProductStatus[] = [
    { icon: DocumentApprovedIcon, text: '询盘', textKey: 'order.status.waiting_quote', status: 8 },
    { icon: PdfDocumentIcon, text: '待支付', textKey: 'order.status.waiting_payment', status: 0 },
    { icon: DocumentClockIcon, text: '待发货', textKey: 'order.status.waiting_shipment', status: 1 },
    { icon: DocumentApprovedIcon, text: '运输中', textKey: 'order.status.in_transit', status: 2 },
    { icon: PdfDocumentIcon, text: '完成', textKey: 'order.status.completed', status: 3 },
    { icon: DocumentClockIcon, text: '已过期', textKey: 'order.status.expired', status: 4 },
    { icon: DocumentClockIcon, text: '已取消', textKey: 'order.status.cancelled', status: 5 },
    { icon: DocumentClockIcon, text: '已退款', textKey: 'order.status.refunded', status: 6 }
  ]