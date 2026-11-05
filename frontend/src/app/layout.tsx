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
  title: "TemporeFlashcards — Minimal Flashcards App",
  description:
    "Personal & cloud-ready Progressive Web App for flashcards, exact-match typing review, and deck statistics.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TemporeFlashcards",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c2124",
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
      <body className="min-h-screen flex flex-col bg-tf-ink text-tf-text selection:bg-tf-accent selection:text-white">
        <Navbar />
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
          <div className="border-t border-tf-line/70 py-6 text-center text-lg font-bold text-white">
            TemporeFlashcards – {new Date().getFullYear()}
          </div>
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
