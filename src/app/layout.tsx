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

// Anti-flicker script: reads localStorage and sets theme class before first paint.
// Dark is the default — only removes .dark if user explicitly chose light.
const themeScript = `(function(){
  try {
    var t = localStorage.getItem('jgg-theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`dark ${fonteSerif.variable} ${fonteSans.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-[var(--color-page)] font-sans text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
