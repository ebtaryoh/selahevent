import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ThemeProvider } from "@/components/theme-provider";
import { CursorSpotlight } from "@/components/cursor-spotlight";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://selahevent.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Selah — The Christian Event Operating System & Daily Sanctuary",
    template: "%s · Selah",
  },
  description:
    "Plan, publish, register, pay, check in and follow up on every Christian event — and enter the daily digital sanctuary with morning scriptures & community prayer wall.",
  keywords: [
    "church event software",
    "Christian conference registration",
    "event management platform",
    "QR check-in",
    "church retreat planning",
    "daily Christian devotion",
    "prayer wall",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Selah",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Selah",
    title: "Selah — The Christian Event Operating System & Daily Sanctuary",
    description:
      "Run every Christian event from one place, and connect daily with believers in prayer and meditation.",
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
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("selah-theme");var t=s||"dark";document.documentElement.setAttribute("data-theme",t);if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");}else{document.documentElement.classList.add("light");document.documentElement.classList.remove("dark");}}catch(e){}})();`,
          }}
        />
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
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Selah" />
      </head>
      <body>
        <ThemeProvider>
          <CursorSpotlight />
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          {children}
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}


