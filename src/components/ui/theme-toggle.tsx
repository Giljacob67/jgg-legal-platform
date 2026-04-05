"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true); // default: dark

  // Sync with actual DOM state after hydration
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("jgg-theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("jgg-theme", "dark");
      setIsDark(true);
    }
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-base transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
