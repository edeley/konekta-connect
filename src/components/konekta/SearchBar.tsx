import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder = "O que precisa hoje?",
  onFocus,
  readOnly,
  className,
  autoFocus,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  readOnly?: boolean;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-soft ring-1 ring-transparent transition focus-within:ring-primary/40",
        className,
      )}
    >
      <Search size={18} className="shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        readOnly={readOnly}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {!!value && (
        <button
          type="button"
          aria-label="Limpar pesquisa"
          onClick={() => onChange?.("")}
          className="press grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
