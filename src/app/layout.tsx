import type { Metadata } from "next";
import { Merriweather, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const fonteSerif = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const fonteSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HUB JGG Group",
  description: "Plataforma jurídica modular com foco em produção de petições.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fonteSerif.variable} ${fonteSans.variable}`}>
      <body className="min-h-screen bg-[var(--color-page)] font-sans text-[var(--color-ink)]">{children}</body>
    </html>
  );
}
