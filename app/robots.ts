import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/regimex/site"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  }
}
