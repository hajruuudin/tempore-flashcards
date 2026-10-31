import type { Metadata, Viewport } from "next";
import { Kumbh_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const kumbhSans = Kumbh_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kumbh-sans",
});

export const metadata: Metadata = {
  title: "KumbhCards — Minimal Flashcards PWA",
  description:
    "Personal & cloud-ready Progressive Web App for flashcards, exact-match typing review, and deck statistics.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KumbhCards",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c2d45",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={kumbhSans.variable}>
      <body className="min-h-screen flex flex-col bg-bone-50 text-silver-900 selection:bg-wine-plum-200 selection:text-wine-plum-900">
        <Navbar />
        {/* Continuous centered block taking ~60% of the webpage screen on desktop, full width on mobile */}
        <main className="mx-auto w-full lg:w-[60%] flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="mx-auto w-full lg:w-[60%] border-t border-bone-200 px-4 py-6 text-center text-xs text-silver-500">
          KumbhCards PWA • Built with Next.js, .NET 8 &amp; MongoDB
        </footer>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
