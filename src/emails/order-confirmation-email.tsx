import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
  Column,
  Row,
  Img,
} from "@react-email/components";
import * as React from "react";

export interface OrderConfirmationEmailProps {
  customerName: string;
  organizationName: string;
  eventName: string;
  orderCode: string;
  currency: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    variant?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    pickupVoucherCode: string;
    isDigital: boolean;
    downloadUrl?: string | null;
  }>;
  eventDate?: string;
  eventVenue?: string;
}

export const OrderConfirmationEmail = ({
  customerName,
  organizationName,
  eventName,
  orderCode,
  currency,
  totalAmount,
  items = [],
  eventDate,
  eventVenue,
}: OrderConfirmationEmailProps) => {
  const formatCurrency = (val: number) => {
    return `${currency === "NGN" ? "₦" : currency} ${val.toLocaleString()}`;
  };

  return (
    <Html>
      <Head />
      <Preview>Order Confirmed: {eventName} ({organizationName})</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Banner */}
          <Section style={headerBanner}>
            <Text style={orgBadge}>{organizationName.toUpperCase()}</Text>
            <Heading style={h1}>Order &amp; Pre-order Confirmed</Heading>
            <Text style={subtitle}>
              Thank you, {customerName}! Your order for <strong>{eventName}</strong> has been received and processed.
            </Text>
          </Section>

          {/* Ministry & Payment Note */}
          <Section style={beneficiaryBox}>
            <Text style={beneficiaryTitle}>
              Official Ministry Resource Receipt
            </Text>
            <Text style={beneficiaryText}>
              Your payment has been received directly by <strong>{organizationName}</strong> via Selah Event Management.
              Order Code: <strong style={{ color: "#161311", fontFamily: "monospace" }}>{orderCode}</strong>
            </Text>
          </Section>

          {/* Order Items */}
          <Section style={itemsSection}>
            <Text style={sectionHeading}>ORDERED ITEMS</Text>
            <Hr style={hr} />

            {items.map((item, idx) => {
              const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
                item.pickupVoucherCode
              )}&size=240&margin=1`;

              return (
                <div key={idx} style={itemCard}>
                  <Row>
                    <Column style={{ width: "70%" }}>
                      <Text style={itemName}>{item.productName}</Text>
                      {item.variant && (
                        <Text style={itemOption}>Option / Size: <strong>{item.variant}</strong></Text>
                      )}
                      <Text style={itemQty}>
                        Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </Text>
                    </Column>
                    <Column style={{ width: "30%", textAlign: "right" }}>
                      <Text style={itemPrice}>{formatCurrency(item.totalPrice)}</Text>
                    </Column>
                  </Row>

                  {/* Pickup voucher or digital download */}
                  {item.isDigital ? (
                    <Section style={digitalBox}>
                      <Text style={voucherTitle}>Digital Resource Access</Text>
                      {item.downloadUrl ? (
                        <Link href={item.downloadUrl} style={button}>
                          Download Digital Resource
                        </Link>
                      ) : (
                        <Text style={pickupNote}>
                          Your digital download link will be active on the event materials page.
                        </Text>
                      )}
                    </Section>
                  ) : (
                    <Section style={voucherBox}>
                      <Row>
                        <Column style={{ width: "80px", textAlign: "center" }}>
                          <Img
                            src={qrUrl}
                            width="72"
                            height="72"
                            alt="Pickup QR Code"
                            style={qrImg}
                          />
                        </Column>
                        <Column style={{ paddingLeft: "14px" }}>
                          <Text style={voucherLabel}>RESOURCE DESK PICKUP VOUCHER</Text>
                          <Text style={voucherCode}>{item.pickupVoucherCode}</Text>
                          <Text style={pickupNote}>
                            Present this voucher or QR code at the <strong>{organizationName}</strong> Resource Desk during the event to claim your item.
                          </Text>
                        </Column>
                      </Row>
                    </Section>
                  )}
                  {idx < items.length - 1 && <Hr style={subHr} />}
                </div>
              );
            })}

            {/* Total Summary */}
            <Hr style={hr} />
            <Row style={{ marginTop: "12px" }}>
              <Column>
                <Text style={totalLabel}>Total Paid:</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={totalValue}>{formatCurrency(totalAmount)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Event Details */}
          {(eventDate || eventVenue) && (
            <Section style={eventInfoBox}>
              <Text style={sectionHeading}>EVENT COLLECTION DETAILS</Text>
              <Hr style={hr} />
              {eventDate && (
                <Text style={detailRow}>
                  <strong>Date:</strong> {eventDate}
                </Text>
              )}
              {eventVenue && (
                <Text style={detailRow}>
                  <strong>Venue:</strong> {eventVenue}
                </Text>
              )}
            </Section>
          )}

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Sent on behalf of <strong>{organizationName}</strong> by Selah Events.
            </Text>
            <Text style={footerText}>
              If you have questions regarding your order, please contact the ministry team at {organizationName} or present your order code <strong>{orderCode}</strong> at the event desk.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

const main = {
  backgroundColor: "#fdf8f4",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "580px",
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  border: "1px solid #e7ded4",
  marginTop: "32px",
  marginBottom: "32px",
};

const headerBanner = {
  marginBottom: "24px",
};

const orgBadge = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1.5px",
  color: "#996b1f",
  margin: "0 0 6px",
};

const h1 = {
  color: "#161311",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  margin: "0 0 10px",
};

const subtitle = {
  color: "#4e4945",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const beneficiaryBox = {
  backgroundColor: "#fbf6ed",
  border: "1px solid #e8d3a6",
  borderRadius: "10px",
  padding: "14px 18px",
  margin: "18px 0 24px",
};

const beneficiaryTitle = {
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  color: "#835914",
  margin: "0 0 4px",
};

const beneficiaryText = {
  fontSize: "13px",
  color: "#4e4945",
  lineHeight: "20px",
  margin: "0",
};

const itemsSection = {
  backgroundColor: "#faf7f4",
  borderRadius: "12px",
  padding: "20px",
  border: "1px solid #ebdcd0",
  marginBottom: "24px",
};

const sectionHeading = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#77716a",
  margin: "0 0 10px",
};

const hr = {
  borderColor: "#ebdcd0",
  margin: "10px 0 16px",
};

const subHr = {
  borderColor: "#f0e6dc",
  margin: "16px 0",
};

const itemCard = {
  margin: "8px 0",
};

const itemName = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#161311",
  margin: "0 0 2px",
};

const itemOption = {
  fontSize: "12px",
  color: "#835914",
  margin: "0 0 4px",
};

const itemQty = {
  fontSize: "12px",
  color: "#77716a",
  margin: "0",
};

const itemPrice = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#161311",
  margin: "0",
};

const voucherBox = {
  backgroundColor: "#ffffff",
  border: "1px dashed #c08a2e",
  borderRadius: "10px",
  padding: "12px 14px",
  marginTop: "12px",
};

const digitalBox = {
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  padding: "12px 14px",
  marginTop: "12px",
  textAlign: "center" as const,
};

const qrImg = {
  borderRadius: "6px",
  border: "1px solid #ebdcd0",
  margin: "0 auto",
};

const voucherLabel = {
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.8px",
  color: "#835914",
  margin: "0 0 2px",
};

const voucherCode = {
  fontSize: "16px",
  fontWeight: "800",
  fontFamily: "monospace",
  color: "#161311",
  letterSpacing: "1px",
  margin: "0 0 4px",
};

const voucherTitle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#161311",
  margin: "0 0 8px",
};

const pickupNote = {
  fontSize: "11px",
  color: "#6b655f",
  lineHeight: "16px",
  margin: "0",
};

const button = {
  backgroundColor: "#0e2a22",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "10px 18px",
  fontSize: "12px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  margin: "4px 0",
};

const totalLabel = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#4e4945",
  margin: "0",
};

const totalValue = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#161311",
  margin: "0",
};

const eventInfoBox = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "16px 20px",
  border: "1px solid #ebdcd0",
  marginBottom: "24px",
};

const detailRow = {
  fontSize: "13px",
  color: "#4e4945",
  lineHeight: "20px",
  margin: "4px 0",
};

const footer = {
  textAlign: "center" as const,
  paddingTop: "12px",
  borderTop: "1px solid #ebdcd0",
};

const footerText = {
  fontSize: "11px",
  color: "#948d85",
  lineHeight: "18px",
  margin: "4px 0",
};
