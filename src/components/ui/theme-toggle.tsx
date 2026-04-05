"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // Começa como null para não renderizar nada até o cliente saber o tema real
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Lê o estado real do DOM após hidratação
    setIsDark(document.documentElement.classList.contains("dark"));
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
      <div className="h-9 w-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-base transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
