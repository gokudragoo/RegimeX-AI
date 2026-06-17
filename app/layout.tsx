import React from "react"
import type { Metadata } from 'next'
import type { Viewport } from "next"
import { Geist, Geist_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { siteUrl } from "@/lib/regimex/site"
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-courier-prime" })
const ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--font-ibm-plex-sans" })
const baseUrl = siteUrl()

export const metadata: Metadata = {
  applicationName: "RegimeX AI",
  title: {
    default: "RegimeX AI - Crypto Market Regime Strategy Skills",
    template: "%s | RegimeX AI",
  },
  description: 'CMC-powered AI strategy skill platform for crypto market regime detection, backtestable strategy specs, risk rules, and BNB Chain proof anchoring.',
  keywords: ['RegimeX AI', 'CoinMarketCap', 'BNB Chain', 'strategy skills', 'crypto market regime', 'AI trading strategy'],
  authors: [{ name: 'RegimeX AI' }],
  creator: "RegimeX AI",
  publisher: "RegimeX AI",
  category: "finance",
  metadataBase: baseUrl,
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: 'RegimeX AI - Crypto Market Regime Strategy Skills',
    description: 'Detect the current market regime, generate a backtestable strategy spec, and anchor the proof on BNB Chain.',
    type: 'website',
    url: baseUrl,
    siteName: 'RegimeX AI',
    locale: "en_US",
    images: [{ url: "/images/footer.png", width: 1200, height: 630, alt: "RegimeX AI market regime proof surface" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RegimeX AI - Crypto Market Regime Strategy Skills',
    description: 'CMC-powered AI strategy intelligence for BNB Hack Track 2.',
    images: ["/images/footer.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f5f4f0",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${courierPrime.variable} ${ibmPlexSans.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
