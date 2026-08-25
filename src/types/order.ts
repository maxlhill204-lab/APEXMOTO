export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLATION_REQUESTED"
  | "CANCELLED"
  | "REFUNDED"
  | "PAYMENT_FAILED"
  | "EXPIRED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

export type EmailKind =
  | "CUSTOMER_ORDER_CONFIRMATION"
  | "OWNER_NEW_ORDER"
  | "CUSTOMER_CANCELLATION_RECEIVED"
  | "OWNER_CANCELLATION_REQUEST"
  | "CUSTOMER_READY_FOR_PICKUP"
  | "CUSTOMER_SHIPPED"
  | "CUSTOMER_REFUNDED";

export type StoreSettings = {
  pickupEnabled: boolean;
  pickupLocationLabel: string;
  pickupAddressDisclosure: string;
  pickupNextAvailableDate: string | null;
  pickupWindow: string;
  pickupSameDayAvailable: boolean;
  pickupAppointmentRequired: boolean;
  supportResponseMinHours: number;
  supportResponseMaxHours: number;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderItemSnapshot = {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  unitAmount: number;
  quantity: number;
  lineTotal: number;
  cartItemKey: string;
};

export type PublicOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  promotionCode: string | null;
  stripePromotionCodeId: string | null;
  paymentMethodLabel: string | null;
  customerName: string;
  customerEmail: string;
  fulfilmentMethodId: string;
  fulfilmentLabel: string;
  pickupDate: string | null;
  pickupWindow: string | null;
  shippingDetails: ShippingAddress | null;
  shippingCarrier: string | null;
  shippingServiceCode: string | null;
  shippingDestinationCountry: string;
  shippingDestinationPostalCode: string;
  shippingAddressReview: boolean;
  shippingParcels: import("@/types/shipping").ShippingParcel[];
  customs: import("@/types/shipping").CustomsSnapshot | null;
  shippingTrackingNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  items: OrderItemSnapshot[];
};

export type AdminOrder = PublicOrder & {
  stripePaymentIntentId: string | null;
  cancellationRequested: boolean;
  emails: { kind: EmailKind; recipient: string; status: string; attempts: number; lastError: string | null }[];
};
