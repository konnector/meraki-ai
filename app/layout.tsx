import React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter, Roboto, Poppins } from "next/font/google"
import { Providers } from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
})

const poppins = Poppins({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Meraki.ai - AI-Powered Spreadsheet",
  description: "A modern spreadsheet application with AI capabilities",
  generator: 'v0dev',
  icons: {
    icon: '/sava.png',
    apple: '/sava.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body className={`${inter.variable} ${roboto.variable} ${poppins.variable} font-sans light`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

import './globals.css'