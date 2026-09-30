import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import OTPEmail from "@/emails/otp-email";
import EventCreatedEmail from "@/emails/event-created-email";
import TicketEmail from "@/emails/ticket-email";
import * as React from "react";

// Initialize Nodemailer with Gmail credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const SENDER_EMAIL = process.env.GMAIL_USER || "events@selah-app.local";
const SENDER_NAME = "Selah Events";

export async function sendEmailOTP(email: string, code: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not found. Skipping OTP email dispatch.");
    return { error: "Email configuration missing" };
  }

  try {
    const html = await render(React.createElement(OTPEmail, { code }));
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: email,
      subject: "Your Selah Verification Code",
      html: html,
    });
    return { data: info };
  } catch (err) {
    console.error("Exception sending OTP email:", err);
    return { error: err };
  }
}

export async function sendEventCreatedNotification(email: string, eventName: string, eventId: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not found. Skipping event creation email dispatch.");
    return { error: "Email configuration missing" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const eventUrl = `${baseUrl}/dashboard/events/${eventId}`;

  try {
    const html = await render(React.createElement(EventCreatedEmail, { eventName, eventUrl }));
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: email,
      subject: `Event Published: ${eventName}`,
      html: html,
    });
    return { data: info };
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
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not found. Skipping ticket email dispatch.");
    return { error: "Email configuration missing" };
  }

  try {
    const html = await render(React.createElement(TicketEmail, ticketProps));
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: email,
      subject: `Your Ticket: ${ticketProps.eventName}`,
      html: html,
    });
    return { data: info };
  } catch (err) {
    console.error("Exception sending Ticket email:", err);
    return { error: err };
  }
}
