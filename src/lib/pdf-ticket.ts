import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export async function generateTicketPdf(
  registrationCode: string,
  ticketCode: string,
  attendeeName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  ticketName: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 750]);
  const { width, height } = page.getSize();

  // Draw Dark Background (Parchement Deep style)
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.03, 0.03, 0.04), // Very dark gray #08080a
  });

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Selah Branding
  page.drawText("Selah", {
    x: 40,
    y: height - 60,
    size: 24,
    font: fontTimesBold,
    color: rgb(0.886, 0.753, 0.451), // Brass #e2c073
  });

  page.drawText("EVENT TICKET", {
    x: 40,
    y: height - 80,
    size: 10,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Event Details
  page.drawText(eventTitle, {
    x: 40,
    y: height - 160,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
    maxWidth: 320,
    lineHeight: 32,
  });

  page.drawText(eventDate, {
    x: 40,
    y: height - 240,
    size: 12,
    font: fontRegular,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText(eventLocation, {
    x: 40,
    y: height - 260,
    size: 12,
    font: fontRegular,
    color: rgb(0.7, 0.7, 0.7),
    maxWidth: 320,
  });

  // Attendee Info Box
  page.drawRectangle({
    x: 40,
    y: height - 380,
    width: 320,
    height: 80,
    color: rgb(0.1, 0.1, 0.12),
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
  });

  page.drawText("ADMIT ONE", {
    x: 55,
    y: height - 330,
    size: 9,
    font: fontBold,
    color: rgb(0.886, 0.753, 0.451),
  });

  page.drawText(attendeeName, {
    x: 55,
    y: height - 355,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Type: ${ticketName}`, {
    x: 200,
    y: height - 330,
    size: 9,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  page.drawText(`Ref: ${registrationCode}`, {
    x: 200,
    y: height - 350,
    size: 9,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Generate QR Code
  const qrDataUrl = await QRCode.toDataURL(ticketCode, {
    errorCorrectionLevel: "H",
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  // QR Code Box (White background for scanning)
  page.drawRectangle({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    color: rgb(1, 1, 1),
  });

  page.drawImage(qrImage, {
    x: 110,
    y: 110,
    width: 180,
    height: 180,
  });

  page.drawText("Present this QR code at the door", {
    x: 110,
    y: 70,
    size: 12,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
