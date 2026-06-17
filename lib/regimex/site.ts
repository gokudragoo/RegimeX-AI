export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const vercelDeployment = process.env.VERCEL_URL?.trim()
  const raw = configured || vercelProduction || vercelDeployment || "https://regimex.ai"
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`

  return new URL(withProtocol)
}
