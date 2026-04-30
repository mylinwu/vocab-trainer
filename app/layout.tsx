import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { GlobalLoadingProvider } from "@/components/GlobalLoading";
import VocabDevToolsProvider from "@/components/VocabDevToolsProvider";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vocab Trainer",
  description: "专注、纯粹的单词学习工具",
};

export const maxDuration = 60;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <GlobalLoadingProvider>
          <VocabDevToolsProvider />
          {children}
        </GlobalLoadingProvider>
      </body>
    </html>
  );
}
