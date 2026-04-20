import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
};

export function DataTable<T>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
        <thead className="bg-[var(--color-surface-alt)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]",
                  column.className,
                )}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)]">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="transition hover:bg-[var(--color-surface-alt)]/65">
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4 align-top text-[var(--color-ink)]">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
