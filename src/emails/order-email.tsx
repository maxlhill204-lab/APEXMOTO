import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "react-email";
import { formatPrice, getSiteUrl, siteConfig } from "@/config/site";
import { formatPickupDate, orderStatusLabel } from "@/lib/order-domain";
import type { EmailKind, PublicOrder } from "@/types/order";

const styles = {
  body: { backgroundColor: "#080808", color: "#f5f2e8", fontFamily: "Arial, sans-serif", margin: 0, padding: "28px 12px" },
  card: { backgroundColor: "#121212", border: "1px solid #32302b", borderRadius: "12px", margin: "0 auto", maxWidth: "620px", padding: "32px" },
  accent: { color: "#d9a827", fontSize: "12px", fontWeight: "700", letterSpacing: "2px", margin: "0 0 12px" },
  heading: { color: "#f5f2e8", fontSize: "30px", lineHeight: "1.15", margin: "0 0 18px" },
  text: { color: "#d8d3c7", fontSize: "15px", lineHeight: "1.6" },
  panel: { backgroundColor: "#1c1c1a", borderRadius: "8px", margin: "22px 0", padding: "18px" },
  notice: { backgroundColor: "#d9a827", borderRadius: "8px", color: "#050505", margin: "22px 0", padding: "18px" },
  noticeHeading: { color: "#050505", fontSize: "16px", fontWeight: "700", lineHeight: "1.4", margin: "0 0 8px" },
  noticeText: { color: "#171717", fontSize: "14px", lineHeight: "1.6", margin: 0 },
  line: { color: "#f5f2e8", fontSize: "14px", lineHeight: "1.5", margin: "6px 0" },
  button: { backgroundColor: "#d9a827", borderRadius: "6px", color: "#050505", display: "inline-block", fontSize: "14px", fontWeight: "700", padding: "13px 20px", textDecoration: "none" },
  fine: { color: "#979187", fontSize: "12px", lineHeight: "1.5", marginTop: "28px" },
} as const;

function copyFor(kind: EmailKind, order: PublicOrder) {
  switch (kind) {
    case "OWNER_NEW_ORDER":
      return { preview: `New paid order ${order.orderNumber}`, eyebrow: "NEW PAID ORDER", heading: `${order.orderNumber} needs attention`, intro: "Stripe has confirmed payment and stock has been allocated. Review the fulfilment details below." };
    case "CUSTOMER_CANCELLATION_RECEIVED":
      return { preview: `Cancellation request received for ${order.orderNumber}`, eyebrow: "REQUEST RECEIVED", heading: "We have your cancellation request", intro: "Your order has not been automatically cancelled or refunded. We will review the request and reply by email." };
    case "OWNER_CANCELLATION_REQUEST":
      return { preview: `Cancellation requested for ${order.orderNumber}`, eyebrow: "ACTION REQUIRED", heading: `${order.orderNumber}: cancellation requested`, intro: "A customer has requested cancellation. Review the payment in Stripe and update the order before confirming the outcome." };
    case "CUSTOMER_READY_FOR_PICKUP":
      return { preview: `${order.orderNumber} is ready for pickup`, eyebrow: "READY FOR PICKUP", heading: "Your order is ready", intro: "Your pickup is ready. Please use the confirmed appointment details below and reply before travelling if anything has changed." };
    case "CUSTOMER_SHIPPED":
      return { preview: `${order.orderNumber} has shipped`, eyebrow: "ON THE WAY", heading: "Your order has shipped", intro: "Your order has been marked as shipped. Reply to this email if you need help with delivery." };
    case "CUSTOMER_REFUNDED":
      return { preview: `${order.orderNumber} has been refunded`, eyebrow: "REFUND CONFIRMED", heading: "Your refund has been issued", intro: "The refund has been confirmed in Stripe. Your bank may take additional time to display the funds." };
    default:
      return { preview: `Order ${order.orderNumber} confirmed`, eyebrow: "PAYMENT CONFIRMED", heading: "We have your order", intro: "Thanks for your order. Stripe has confirmed payment and the items below are allocated to you." };
  }
}

export function OrderEmail({ kind, order, accessToken, privatePickupAddress }: { kind: EmailKind; order: PublicOrder; accessToken: string; privatePickupAddress?: string }) {
  const copy = copyFor(kind, order);
  const isOwner = kind.startsWith("OWNER_");
  const isRefund = kind === "CUSTOMER_REFUNDED";
  const pickup = order.fulfilmentMethodId === "pickup";
  const awaitingPickupConfirmation = pickup && kind === "CUSTOMER_ORDER_CONFIRMATION";
  const disclosePrivatePickupAddress = isOwner || kind === "CUSTOMER_READY_FOR_PICKUP";
  return (
    <Html><Head /><Preview>{copy.preview}</Preview><Body style={styles.body}><Container style={styles.card}>
      <Text style={styles.accent}>{siteConfig.businessName} / {copy.eyebrow}</Text>
      <Heading style={styles.heading}>{copy.heading}</Heading>
      <Text style={styles.text}>Hi {isOwner ? "APEX MOTO" : order.customerName},</Text>
      <Text style={styles.text}>{copy.intro}</Text>
      <Section style={styles.panel}>
        <Text style={styles.line}><strong>Order:</strong> {order.orderNumber}</Text>
        <Text style={styles.line}><strong>Status:</strong> {orderStatusLabel(order.status)}</Text>
        {order.items.map((item) => <Text key={`${item.productId}:${item.variantId}`} style={styles.line}>{item.quantity} × {item.productName} — {item.variantLabel} ({formatPrice(item.lineTotal)})</Text>)}
        <Text style={styles.line}><strong>Subtotal:</strong> {formatPrice(order.subtotalAmount)}</Text>
        <Text style={styles.line}><strong>{order.fulfilmentLabel}:</strong> {order.shippingAmount ? formatPrice(order.shippingAmount) : "Free"}</Text>
        {order.discountAmount > 0 ? <Text style={styles.line}><strong>Discount{order.promotionCode ? ` (${order.promotionCode})` : ""}:</strong> −{formatPrice(order.discountAmount)}</Text> : null}
        <Text style={styles.line}><strong>Total paid:</strong> {formatPrice(order.totalAmount)}</Text>
        {isRefund ? <Text style={styles.line}><strong>Refund amount:</strong> {formatPrice(order.totalAmount)}</Text> : null}
        {isRefund ? <Text style={styles.line}><strong>Returned to:</strong> {order.paymentMethodLabel ?? "Your original payment method"}</Text> : null}
        {isRefund && order.refundedAt ? <Text style={styles.line}><strong>Processed:</strong> {new Intl.DateTimeFormat("en-AU", { dateStyle: "long", timeZone: "Australia/Melbourne" }).format(new Date(order.refundedAt))}</Text> : null}
        <Text style={styles.line}><strong>Fulfilment:</strong> {order.fulfilmentLabel}</Text>
        {pickup ? <>
          <Text style={styles.line}><strong>Earliest pickup:</strong> {formatPickupDate(order.pickupDate)}</Text>
          <Text style={styles.line}><strong>Collection:</strong> {order.pickupWindow ?? "By confirmed appointment"}</Text>
          <Text style={styles.line}><strong>Location:</strong> {disclosePrivatePickupAddress && privatePickupAddress ? privatePickupAddress : siteConfig.pickupLocationLabel}</Text>
        </> : null}
        {isOwner ? <><Text style={styles.line}><strong>Customer:</strong> {order.customerName}</Text><Text style={styles.line}><strong>Email:</strong> {order.customerEmail}</Text></> : null}
      </Section>
      {awaitingPickupConfirmation ? <Section style={styles.notice}>
        <Text style={styles.noticeHeading}>Your pickup details will be confirmed within 24 hours.</Text>
        <Text style={styles.noticeText}>We will email you to confirm the exact pickup address and available collection times. If you have not received those details within 24 hours, reply to this email or contact {siteConfig.email}.</Text>
      </Section> : null}
      <Button href={`${getSiteUrl()}/order-status/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(accessToken)}`} style={styles.button}>View order status</Button>
      <Text style={styles.fine}>{awaitingPickupConfirmation ? `Pickup details should arrive within 24 hours. If they do not, reply to this email or contact ${siteConfig.email}.` : `Questions? Reply to this email or contact ${siteConfig.email}. Typical response time is ${siteConfig.supportResponseHoursMin}–${siteConfig.supportResponseHoursMax} hours.`}</Text>
      <Text style={styles.fine}>Ride hard. Pay fair. — {siteConfig.businessName}</Text>
    </Container></Body></Html>
  );
}
