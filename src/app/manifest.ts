import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Selah · Christian Events & Daily Sanctuary",
    short_name: "Selah",
    description:
      "A daily digital sanctuary and gathering operating system for believers worldwide. Daily scripture meditation, prayer wall, and turnstile passes.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080a",
    theme_color: "#08080a",
    orientation: "portrait",
    categories: ["lifestyle", "social", "events"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Daily Sanctuary & Prayers",
        short_name: "Sanctuary",
        description: "60-second scripture pause and community prayer wall",
        url: "/sanctuary",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Find My Passes",
        short_name: "My Passes",
        description: "Instant self-service turnstile gate pass lookup",
        url: "/find-pass",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
