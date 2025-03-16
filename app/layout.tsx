import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "github-markdown-css/github-markdown.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"

// Use Inter with more comprehensive subset for better typography
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "GitHub README Generator | Create Professional READMEs in Seconds",
  description:
    "Stop procrastinating on documentation. Generate professional, comprehensive README files for your GitHub repositories in seconds with our AI-powered tool.",
  keywords: ["GitHub", "README", "generator", "documentation", "markdown", "developer tools"],
  authors: [{ name: "Nivando Soares", url: "https://github.com/nivandosoares" }],
  creator: "Nivando Soares",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://readme-generator.vercel.app/",
    title: "GitHub README Generator",
    description: "Create professional READMEs in seconds",
    siteName: "GitHub README Generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub README Generator",
    description: "Create professional READMEs in seconds",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'