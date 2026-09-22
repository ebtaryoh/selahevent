import { Resend } from "resend";
import OTPEmail from "@/emails/otp-email";
import EventCreatedEmail from "@/emails/event-created-email";
import TicketEmail from "@/emails/ticket-email";

// Initialize Resend with the API key from environment variables
// Provide a dummy fallback so it doesn't throw during build or dev if missing
const resend = new Resend(process.env.RESEND_API_KEY || "missing-key");

const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || "Selah <onboarding@resend.dev>";

export async function sendEmailOTP(email: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not found. Skipping OTP email dispatch.");
    return { error: "Email configuration missing" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "Your Selah Verification Code",
      react: OTPEmail({ code }),
    });

    if (error) {
      console.error("Resend Error sending OTP:", error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error("Exception sending OTP email:", err);
    return { error: err };
  }
}

export async function sendEventCreatedNotification(email: string, eventName: string, eventId: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not found. Skipping event creation email dispatch.");
    return { error: "Email configuration missing" };
  }

  // Create absolute URL based on the environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const eventUrl = `${baseUrl}/dashboard/events/${eventId}`;

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: `Event Published: ${eventName}`,
      react: EventCreatedEmail({ eventName, eventUrl }),
    });

    if (error) {
      console.error("Resend Error sending Event Created:", error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error("Exception sending Event Created email:", err);
    return { error: err };
  }
}

export async function sendTicketConfirmation(
  email: string,
  ticketProps: {
    attendeeName: string;
    eventName: string;
    ticketName: string;
    ticketCode: string;
    startsAt: string;
    venueName: string;
  }
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not found. Skipping ticket email dispatch.");
    return { error: "Email configuration missing" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: `Your Ticket: ${ticketProps.eventName}`,
      react: TicketEmail(ticketProps),
    });

    if (error) {
      console.error("Resend Error sending Ticket:", error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error("Exception sending Ticket email:", err);
    return { error: err };
  }
}
