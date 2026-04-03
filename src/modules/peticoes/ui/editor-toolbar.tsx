"use client";

import type { Editor } from "@tiptap/react";

type ToolbarAction = {
  label: string;
  icon: string;
  action: () => void;
  isActive?: boolean;
};

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const actions: ToolbarAction[] = [
    {
      label: "Negrito",
      icon: "B",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "Itálico",
      icon: "I",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "Sublinhado",
      icon: "U",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      label: "Tachado",
      icon: "S",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    {
      label: "Destaque",
      icon: "H",
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive("highlight"),
    },
  ];

  const headings: ToolbarAction[] = [
    {
      label: "Título 1",
      icon: "H1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "Título 2",
      icon: "H2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Título 3",
      icon: "H3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
  ];

  const lists: ToolbarAction[] = [
    {
      label: "Lista",
      icon: "•",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "Lista numerada",
      icon: "1.",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "Citação",
      icon: "❝",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
  ];

  const alignment: ToolbarAction[] = [
    {
      label: "Esquerda",
      icon: "⫷",
      action: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
    },
    {
      label: "Centro",
      icon: "⫿",
      action: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
    },
    {
      label: "Justificar",
      icon: "☰",
      action: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editor.isActive({ textAlign: "justify" }),
    },
  ];

  function renderGroup(group: ToolbarAction[]) {
    return group.map((item) => (
      <button
        key={item.label}
        type="button"
        onClick={item.action}
        title={item.label}
        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-bold transition-colors ${
          item.isActive
            ? "bg-[var(--color-accent)] text-white"
            : "text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
        }`}
      >
        {item.icon}
      </button>
    ));
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-1.5">
      {renderGroup(actions)}
      <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />
      {renderGroup(headings)}
      <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />
      {renderGroup(lists)}
      <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />
      {renderGroup(alignment)}
    </div>
  );
}
