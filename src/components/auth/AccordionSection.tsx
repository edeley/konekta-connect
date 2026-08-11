import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccordionSection({
  icon,
  title,
  summary,
  done,
  optional,
  defaultOpen = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  summary?: string;
  done?: boolean;
  optional?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{title}</span>
            {optional && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Opcional
              </span>
            )}
          </span>
          {summary && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span>}
        </span>
        {done && (
          <span className="grid size-6 place-items-center rounded-full bg-success/15 text-success" aria-label="Secção preenchida">
            <Check size={14} aria-hidden="true" />
          </span>
        )}
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div id={id} className="space-y-4 border-t border-border px-4 pb-5 pt-4">
          {children}
        </div>
      )}
    </section>
  );
}
