import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hidrantes",
  description: "Gerenciamento de hidrantes de incêndio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hidrantes",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#54c0eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}>
        {children}
        <ServiceWorkerRegistration />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
