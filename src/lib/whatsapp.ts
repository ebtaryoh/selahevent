import twilio from 'twilio';

// Initialize the Twilio client
// We will grab these from the environment variables which you'll get from the Twilio Console
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Usually 'whatsapp:+14155238886' for sandbox

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendWhatsAppTicket(toPhoneNumber: string, eventName: string, ticketId: string, attendeeName: string) {
  if (!client) {
    console.warn("Twilio credentials missing. Skipping WhatsApp ticket delivery.");
    return { success: false, error: "Missing Twilio Credentials" };
  }

  try {
    // Ensure the phone number starts with 'whatsapp:' and has the country code
    let formattedNumber = toPhoneNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      // Assuming Nigeria as default for Selah if country code is missing
      formattedNumber = '+234' + formattedNumber.replace(/^0/, '');
    }
    const to = `whatsapp:${formattedNumber}`;

    const message = await client.messages.create({
      body: `Hello ${attendeeName}! 🎉\n\nYour registration for *${eventName}* is confirmed.\n\nHere is your Ticket ID: ${ticketId}\n\nKeep this ticket safe. We can't wait to see you there!`,
      from: twilioNumber || 'whatsapp:+14155238886', // Sandbox default
      to: to,
    });

    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error("Failed to send WhatsApp message:", error);
    return { success: false, error: error.message };
  }
}
