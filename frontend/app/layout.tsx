import type { Metadata } from "next";
import { Bricolage_Grotesque, Sora } from "next/font/google";
import "./globals.css";
import Providers from "@/contexts/Providers";
import { headers } from "next/headers";
import { Toaster } from 'sonner';

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Onward — Learn the loop. Earn the g$.",
  description:
    "A loop, not a course. Bite-sized lessons and daily challenges that pay you in g$ as you learn the GoodDollar ecosystem from the inside out.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie"); 

  return (
    <html lang="en" className={`${bricolage.variable} ${sora.variable}`}>
      <body className="bg-canvas text-fg mx-auto w-full">
        <Providers cookies={cookies}>
          <Toaster richColors position="top-center" />
          {children}</Providers></body>
    </html>
  );
}
