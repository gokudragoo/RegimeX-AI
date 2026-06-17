import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/regimex/site"

const routes = [
  "",
  "/dashboard",
  "/market-intelligence",
  "/strategy-center",
  "/backtesting-lab",
  "/ai-reasoning",
  "/strategy-comparison",
  "/skill-spec",
  "/proof",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl()
  const now = new Date()

  return routes.map((route) => ({
    url: new URL(route || "/", baseUrl).toString(),
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "daily",
    priority: route === "" ? 1 : 0.8,
  }))
}
