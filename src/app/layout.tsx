import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/constants/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} Management`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Sistem manajemen operasional Be Nice Coffee untuk point of sales, menu, resep, stok material, customer, pembelian, dan laporan bisnis.",
  keywords: [
    "Be Nice Coffee",
    "coffee shop management",
    "point of sales",
    "inventory",
    "laporan penjualan",
    "manajemen stok",
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: `${APP_NAME} Management`,
    description:
      "Dashboard operasional Be Nice Coffee untuk mengelola transaksi, inventory, menu, customer, dan laporan.",
    siteName: APP_NAME,
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} Management`,
    description:
      "Dashboard operasional Be Nice Coffee untuk point of sales, inventory, dan laporan bisnis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
