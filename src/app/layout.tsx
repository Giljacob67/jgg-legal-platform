import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

// Fallback: em ambientes offline, next/font/google falha ao buscar fontes.
// Usamos fontes do sistema via variáveis CSS para manter consistência visual.
const fonteStyle = `
  :root {
    --font-merriweather: 'Merriweather', 'Georgia', 'Times New Roman', serif;
    --font-source-sans: 'Source Sans 3', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
  }
`;

export const metadata: Metadata = {
  title: "HUB JGG Group",
  description: "Plataforma jurídica modular com foco em produção de petições.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: fonteStyle }} />
      </head>
      <body className="min-h-screen bg-[var(--color-page)] font-sans text-[var(--color-ink)]">
        {/* Anti-flicker: executa antes da hidratação do React para evitar flash */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            try {
              var t = localStorage.getItem('jgg-theme');
              if (t === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}</Script>
        {children}
      </body>
    </html>
  );
}
