"use client";

import { useCallback, useRef, useState } from "react";
import { useCustomersStore } from "@/stores";
import { useRole } from "@/hooks/useRole";
import type { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, FileUp, Loader2 } from "lucide-react";

type ImportResult = {
  created: number;
  skippedDuplicates: number;
  errors: { row: number; message: string }[];
  errorsTruncated?: boolean;
  customers?: Customer[];
};

export function CustomerCsvImportExport() {
  const { can } = useRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState<"import" | "export" | "template" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const setCustomers = useCustomersStore((s) => s.setCustomers);

  const mergeImported = useCallback(
    (imported: Customer[]) => {
      if (imported.length === 0) return;
      const existing = useCustomersStore.getState().customers;
      const ids = new Set(imported.map((c) => c.id));
      setCustomers([...imported, ...existing.filter((c) => !ids.has(c.id))]);
    },
    [setCustomers]
  );

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setMessage(null);
    setBusy("export");
    try {
      const res = await fetch("/api/customers/export", { credentials: "include" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({ kind: "err", text: j.error ?? `Export failed (${res.status})` });
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "customers.csv";
      downloadBlob(blob, filename);
      setMessage({ kind: "ok", text: "Export downloaded." });
    } catch {
      setMessage({ kind: "err", text: "Network error during export." });
    } finally {
      setBusy(null);
    }
  };

  const handleTemplate = async () => {
    setMessage(null);
    setBusy("template");
    try {
      const res = await fetch("/api/customers/import/template", { credentials: "include" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({ kind: "err", text: j.error ?? `Download failed (${res.status})` });
        return;
      }
      const blob = await res.blob();
      downloadBlob(blob, "customers-import-template.csv");
      setMessage({ kind: "ok", text: "Template downloaded." });
    } catch {
      setMessage({ kind: "err", text: "Network error." });
    } finally {
      setBusy(null);
    }
  };

  const uploadFile = async (file: File) => {
    setMessage(null);
    setBusy("import");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/customers/import", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        data?: ImportResult;
      };

      if (!res.ok || json.success === false) {
        setMessage({
          kind: "err",
          text: typeof json.error === "string" ? json.error : `Import failed (${res.status})`,
        });
        return;
      }

      const data = json.data;
      if (!data) {
        setMessage({ kind: "err", text: "Invalid response from server." });
        return;
      }

      const errLines = data.errors
        .slice(0, 8)
        .map((e) => `Row ${e.row}: ${e.message}`)
        .join("\n");
      const extra =
        data.errorsTruncated || data.errors.length > 8
          ? "\n(Additional errors omitted.)"
          : "";
      const summary = `Created ${data.created}. Skipped duplicates: ${data.skippedDuplicates}.${errLines ? `\n${errLines}${extra}` : ""}`;

      mergeImported(data.customers ?? []);
      setMessage({
        kind: data.created === 0 && data.errors.length > 0 ? "err" : "ok",
        text: summary,
      });
    } catch {
      setMessage({ kind: "err", text: "Network error during import." });
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void uploadFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void uploadFile(f);
  };

  if (!can("customers.create")) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-wraptors-border"
          disabled={busy !== null}
          onClick={() => void handleExport()}
        >
          {busy === "export" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-wraptors-muted"
          disabled={busy !== null}
          onClick={() => void handleTemplate()}
        >
          {busy === "template" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Template
        </Button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-lg border border-dashed border-wraptors-border bg-wraptors-surface/40 px-4 py-8 text-center text-sm text-wraptors-muted transition-colors cursor-pointer",
          dragActive && "border-wraptors-gold/60 bg-wraptors-gold/5",
          busy === "import" && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onInputChange}
        />
        {busy === "import" ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-wraptors-gold mb-2" />
        ) : (
          <FileUp className="mx-auto h-8 w-8 text-wraptors-gold/80 mb-2" />
        )}
        <p className="text-white font-medium">Import customers (CSV)</p>
        <p className="mt-1 text-xs">
          Drag and drop a file here, or click to choose a file from your computer.
        </p>
      </div>

      {message && (
        <p
          className={cn(
            "text-sm whitespace-pre-wrap rounded-md px-3 py-2",
            message.kind === "ok"
              ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20"
              : "bg-red-500/10 text-red-200 border border-red-500/20"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
