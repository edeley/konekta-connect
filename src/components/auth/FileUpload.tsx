import { useEffect, useState } from "react";
import { FileImage, FileText, Loader2, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateFile } from "@/lib/auth-schemas";

export type FileUploadProps = {
  label: string;
  hint?: string;
  accept: readonly string[];
  maxSize: number;
  multiple?: boolean;
  maxFiles?: number;
  required?: boolean;
  secure?: boolean;
  circle?: boolean;
  onChange: (files: File[]) => void;
};

type Item = { file: File; url: string };

export function FileUpload({
  label,
  hint,
  accept,
  maxSize,
  multiple = false,
  maxFiles = 5,
  required,
  secure,
  circle,
  onChange,
}: FileUploadProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.url)), [items]);

  const accepted = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const incoming: Item[] = [];
    for (const file of Array.from(files)) {
      const err = validateFile(file, { accept, maxSize });
      if (err) {
        setError(err);
        setBusy(false);
        return;
      }
      incoming.push({ file, url: URL.createObjectURL(file) });
    }
    const next = multiple ? [...items, ...incoming].slice(0, maxFiles) : incoming.slice(0, 1);
    setItems(next);
    onChange(next.map((i) => i.file));
    setBusy(false);
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    URL.revokeObjectURL(items[index].url);
    setItems(next);
    onChange(next.map((i) => i.file));
  };

  const inputId = `upload-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accepted(e.dataTransfer.files);
        }}
        className={cn(
          "press flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed bg-card p-5 text-center transition-colors",
          circle ? "mx-auto size-30 rounded-full" : "rounded-2xl",
          dragging ? "border-primary bg-accent" : error ? "border-destructive" : "border-border",
        )}
      >
        {busy ? (
          <Loader2 className="animate-spin text-primary" size={22} aria-hidden="true" />
        ) : circle && items[0] ? (
          <img
            src={items[0].url}
            alt="Pré-visualização da foto de perfil"
            className="size-30 rounded-full object-cover"
          />
        ) : (
          <>
            {circle ? (
              <FileImage size={22} className="text-muted-foreground" aria-hidden="true" />
            ) : (
              <UploadCloud size={22} className="text-primary" aria-hidden="true" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {hint ?? "Clique ou arraste o ficheiro"}
            </span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          className="sr-only"
          multiple={multiple}
          accept={accept.join(",")}
          onChange={(e) => accepted(e.target.files)}
        />
      </label>

      {!circle && items.length > 0 && (
        <ul className={cn("grid gap-2", multiple ? "grid-cols-3" : "grid-cols-1")}>
          {items.map((item, i) => (
            <li
              key={item.url}
              className="relative overflow-hidden rounded-xl border border-border bg-card"
            >
              {item.file.type.startsWith("image/") ? (
                <img
                  src={item.url}
                  alt={`Pré-visualização ${i + 1}`}
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 pr-10">
                  <FileText size={18} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 truncate text-xs font-semibold">{item.file.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remover ficheiro ${i + 1}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-card/90 text-destructive shadow-soft"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {circle && items[0] && (
        <button
          type="button"
          onClick={() => remove(0)}
          className="mx-auto block text-xs font-semibold text-destructive"
        >
          Remover foto
        </button>
      )}

      {secure && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck size={12} aria-hidden="true" /> Documento seguro e privado — nunca guardado
          no dispositivo.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
