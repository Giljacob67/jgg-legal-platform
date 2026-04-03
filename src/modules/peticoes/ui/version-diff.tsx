"use client";

import { useMemo } from "react";
import DiffMatchPatch from "diff-match-patch";

type VersionDiffProps = {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
};

export function VersionDiff({
  oldText,
  newText,
  oldLabel = "Versão anterior",
  newLabel = "Versão atual",
}: VersionDiffProps) {
  const diffs = useMemo(() => {
    const dmp = new DiffMatchPatch();
    const result = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(result);
    return result;
  }, [oldText, newText]);

  const hasChanges = diffs.some(([op]) => op !== 0);

  if (!hasChanges) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Sem diferenças entre as versões selecionadas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-300" />
          {oldLabel}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" />
          {newLabel}
        </span>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-sm leading-7 font-mono whitespace-pre-wrap">
        {diffs.map(([op, text], index) => {
          if (op === -1) {
            return (
              <span
                key={index}
                className="bg-red-100 text-red-800 line-through decoration-red-400"
              >
                {text}
              </span>
            );
          }
          if (op === 1) {
            return (
              <span
                key={index}
                className="bg-green-100 text-green-800"
              >
                {text}
              </span>
            );
          }
          return <span key={index}>{text}</span>;
        })}
      </div>
    </div>
  );
}
