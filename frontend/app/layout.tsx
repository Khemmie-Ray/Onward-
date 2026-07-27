import type { Metadata } from "next";
import { Bricolage_Grotesque, Sora } from "next/font/google";
import "./globals.css";
import Providers from "@/contexts/Providers";
import { Toaster } from "sonner";

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
  other: {
    "talentapp:project_verification":
      "8fd7803b77a854f4cabb8744cfa08d668520a571b5501608cdc82835e62bd0c413947dcf8fdf6c9e6548f9e873875269edf4e9ee2dbfdd2bb7b0f87820cf19bb",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${sora.variable}`}>
      <body className="bg-canvas text-fg mx-auto w-full max-w-387.5">
        <Providers>
          <Toaster richColors position="top-center" />
          <div>
          {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
