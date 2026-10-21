import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./orders.css";
import AdminDataProvider from "@/components/dashboard/AdminDataProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Overview · Cupid Clothings",
  description: "Cupid Clothings commerce and customer analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AdminDataProvider>{children}</AdminDataProvider></body>
    </html>
  );
}
