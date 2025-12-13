import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maynsta",
  description: "Höre und veröffentliche Musik mit Maynsta",
  generator: "maynsta",
icons: {
  icon: [
    {
      url: "/maynsta-logo.png",
      media: "(prefers-color-scheme: light)",
    },
    {
      url: "/maynsta-logo.png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
  apple: "/maynsta-logo.png",
},


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
