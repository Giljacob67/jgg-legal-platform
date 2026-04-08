"use client";

import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof document === "undefined") {
        return () => {};
      }

      const observer = new MutationObserver(() => onStoreChange());
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    },
    () => (typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false),
    () => false,
  );

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
