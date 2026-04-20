"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

export function ThemeToggle() {
  // Começa como null para não renderizar nada até o cliente saber o tema real
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Lê o estado real do DOM após hidratação (padrão correto para evitar hydration mismatch)
    const dark = document.documentElement.classList.contains("dark");
    queueMicrotask(() => setIsDark(dark));
  }, []);

  function toggle() {
    const html = document.documentElement;
    const novaEscuridao = !html.classList.contains("dark");

    if (novaEscuridao) {
      html.classList.add("dark");
      localStorage.setItem("jgg-theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("jgg-theme", "light");
    }

    setIsDark(novaEscuridao);
  }

  // Não renderiza nada no servidor (evita hydration mismatch no ícone)
  if (isDark === null) {
    return (
      <div className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}
