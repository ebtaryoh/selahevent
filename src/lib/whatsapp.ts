/**
 * WhatsApp Pass & Ticket Delivery Engine for Selah
 * Supports:
 * 1. Direct Click-to-WhatsApp link generator (zero setup required for ushers/organizers)
 * 2. Termii WhatsApp API / WhatsApp Business Cloud API automated delivery
 */

export interface WhatsAppTicketPayload {
  phone?: string | null;
  eventTitle: string;
  attendeeName: string;
  ticketCode: string;
  ticketTier?: string;
  tableNumber?: string | null;
  seatNumber?: string | null;
  venueName?: string | null;
  eventDate?: string | null;
  passUrl: string;
}

/**
 * Normalizes phone numbers to international WhatsApp format (e.g., 0803... -> 234803...)
 */
export function formatWhatsAppPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  // If Nigerian format starting with 0
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "234" + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Builds a beautifully formatted WhatsApp invitation and ticket text
 */
export function buildWhatsAppTicketMessage(data: WhatsAppTicketPayload): string {
  const tableLine = data.tableNumber
    ? `\n🍽️ *Table:* ${data.tableNumber}${data.seatNumber ? ` (Seat ${data.seatNumber})` : ""}`
    : "";

  const venueLine = data.venueName ? `\n📍 *Venue:* ${data.venueName}` : "";
  const dateLine = data.eventDate ? `\n🗓️ *Date:* ${data.eventDate}` : "";
  const tierLine = data.ticketTier ? `\n🏷️ *Tier:* ${data.ticketTier}` : "";

  return `*SELAH DIGITAL ACCESS PASS* 🎟️

Dear *${data.attendeeName}*,
Here is your official pass for:
*${data.eventTitle}*
${tierLine}${tableLine}${dateLine}${venueLine}

🔑 *Ticket Code:* \`${data.ticketCode}\`

📲 *Open Your Digital QR Badge:*
${data.passUrl}

_Please present the QR code on your badge to the turnstile reader or usher at the entrance for swift access._`;
}

/**
 * Generates an instant Click-to-WhatsApp link
 */
export function generateWhatsAppTicketLink(data: WhatsAppTicketPayload): string {
  const message = buildWhatsAppTicketMessage(data);
  const encoded = encodeURIComponent(message);
  
  if (data.phone && data.phone.trim().length >= 7) {
    const cleanPhone = formatWhatsAppPhoneNumber(data.phone);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

/**
 * Server-side automated dispatch via Termii or WhatsApp Cloud API
 */
export async function sendWhatsAppPass(data: WhatsAppTicketPayload): Promise<{ success: boolean; error?: string; url?: string }> {
  const directUrl = generateWhatsAppTicketLink(data);

  // 1. Meta Official WhatsApp Cloud API (1,000 free conversations per month)
  const metaToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (metaToken && metaPhoneId && data.phone) {
    try {
      const cleanPhone = formatWhatsAppPhoneNumber(data.phone);
      const message = buildWhatsAppTicketMessage(data);

      const res = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${metaToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: true,
            body: message,
          },
        }),
      });

      if (res.ok) {
        return { success: true, url: directUrl };
      }
      const errData = await res.json().catch(() => null);
      console.warn("[whatsapp] Meta Cloud API response error:", errData);
    } catch (err: any) {
      console.warn("[whatsapp] Meta Cloud API automated dispatch failed:", err);
    }
  }

  // 2. If Termii API is configured for WhatsApp Messaging
  const termiiApiKey = process.env.TERMII_API_KEY;
  if (termiiApiKey && data.phone) {
    try {
      const cleanPhone = formatWhatsAppPhoneNumber(data.phone);
      const message = buildWhatsAppTicketMessage(data);

      const res = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanPhone,
          from: "SelahEvents",
          sms: message,
          type: "plain",
          channel: "generic",
          api_key: termiiApiKey,
        }),
      });

      if (res.ok) {
        return { success: true, url: directUrl };
      }
    } catch (err: any) {
      console.warn("[whatsapp] Automated Termii dispatch failed, falling back to direct link:", err);
    }
  }

  // 3. If Twilio WhatsApp is configured
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  if (twilioSid && twilioToken && data.phone) {
    try {
      const twilioModule = await import("twilio");
      const client = twilioModule.default(twilioSid, twilioToken);
      const cleanPhone = formatWhatsAppPhoneNumber(data.phone);
      const message = buildWhatsAppTicketMessage(data);

      await client.messages.create({
        from: twilioFrom ? (twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`) : "whatsapp:+14155238886",
        to: `whatsapp:+${cleanPhone}`,
        body: message,
      });

      return { success: true, url: directUrl };
    } catch (err: any) {
      console.warn("[whatsapp] Automated Twilio dispatch failed, falling back to direct link:", err);
    }
  }

  // Fallback: direct share URL
  return { success: true, url: directUrl };
}

/**
 * Backward compatible helper for automated ticket delivery
 */
export async function sendWhatsAppTicket(
  phone: string,
  eventTitle: string,
  ticketCode: string,
  attendeeName: string
): Promise<{ success: boolean; url?: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://selahevent.vercel.app";
  return sendWhatsAppPass({
    phone,
    eventTitle,
    attendeeName,
    ticketCode,
    passUrl: `${siteUrl}/ticket/${ticketCode}`,
  });
}

