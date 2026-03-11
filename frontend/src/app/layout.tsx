import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const font = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Business Data Analyst",
  description: "AI-powered data analysis platform for businesses",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${font.variable} font-sans bg-dark-600 text-dark-50 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
