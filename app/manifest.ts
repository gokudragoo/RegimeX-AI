import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/regimex/site"

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = siteUrl()

  return {
    name: "RegimeX AI",
    short_name: "RegimeX",
    description: "CMC-powered crypto market regime strategy skills with BNB Chain proof anchoring.",
    start_url: "/dashboard",
    scope: "/",
    id: baseUrl.toString(),
    display: "standalone",
    background_color: "#f5f4f0",
    theme_color: "#f5f4f0",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
