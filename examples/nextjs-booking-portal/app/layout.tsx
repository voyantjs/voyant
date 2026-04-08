import type { Metadata } from "next"
import type { ReactNode } from "react"

import { isMockMode } from "../lib/voyant-client"

import "./globals.css"

export const metadata: Metadata = {
  title: "Voyant Booking Portal — Next.js example",
  description:
    "Reference Next.js booking portal that consumes the Voyant /v1/public/* API surface.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const mock = isMockMode()
  return (
    <html lang="en">
      <body>
        {mock ? (
          <div className="mock-banner">
            Running against mock data — set <code>USE_MOCK_DATA=0</code> and{" "}
            <code>VOYANT_API_URL</code> to connect to a live Voyant backend.
          </div>
        ) : null}
        <header className="site-header">
          <div className="container">
            <a href="/" className="brand">
              Voyage & Co.
            </a>
            <nav>
              <a href="/">Tours</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </header>
        <main>
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  )
}
