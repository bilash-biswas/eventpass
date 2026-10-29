import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSession } from "@/lib/auth/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EventPass — Seamless Event RSVP & Ticketing",
    template: "%s | EventPass",
  },
  description:
    "Discover exclusive tech conferences, masterclasses, and meetups. RSVP instantly with cryptographic QR entry tickets.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col bg-background text-foreground antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg font-medium text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <Navbar user={session.user} />
        <main id="main-content" className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
