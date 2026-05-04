import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";

import { TrpcProvider } from "@/lib/trpc/client";

import "./globals.css";

const outfitSans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Career-Ops Web Dashboard",
  description: "Filesystem-backed dashboard for the existing Career-Ops tracker and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfitSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
