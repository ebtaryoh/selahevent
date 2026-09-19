import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://selah.events"
  ),
  title: {
    default: "Selah — The Christian Event Operating System",
    template: "%s · Selah",
  },
  description:
    "Plan, publish, register, pay, check in and follow up on every Christian event — then reuse the whole setup next time. Built for churches, conferences, retreats and ministries.",
  keywords: [
    "church event software",
    "Christian conference registration",
    "event management platform",
    "QR check-in",
    "church retreat planning",
  ],
  openGraph: {
    type: "website",
    siteName: "Selah",
    title: "Selah — The Christian Event Operating System",
    description:
      "Run every Christian event from one place. Beautiful event pages, registrations, payments, teams, check-in and a setup you can reuse.",
    images: [
      {
        url: "/images/hero-auditorium.jpg",
        width: 1536,
        height: 1024,
        alt: "A Christian leadership gathering in a warmly lit auditorium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Selah — The Christian Event Operating System",
    description:
      "Run every Christian event from one place — then reuse the entire setup next time.",
    images: ["/images/hero-auditorium.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0e2a22",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Manrope:wght@300..800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
