import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { InfillBackground } from "@/src/components/InfillBackground";
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
  title: "3D 创作工坊 - 耗材库存管理",
  description: "管理你的 3D 打印耗材库存，记录每一次创作灵感，计算打印成本。",
  keywords: ["3D打印", "耗材管理", "库存管理", "3D Printing", "Filament Manager"],
  authors: [{ name: "3D 创作工坊" }],
  openGraph: {
    title: "3D 创作工坊 - 智能耗材库存管理",
    description: "让每一次打印都有迹可循。精准追踪耗材剩余量，自动计算成本，记录你的创作灵感。",
    type: "website",
    locale: "zh_CN",
    siteName: "3D 创作工坊",
  },
  twitter: {
    card: "summary_large_image",
    title: "3D 创作工坊 - 耗材库存管理",
    description: "管理你的 3D 打印耗材库存，记录每一次创作灵感",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <InfillBackground />
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
            className: "font-sans",
          }}
        />
      </body>
    </html>
  );
}
