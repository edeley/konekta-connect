import { useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { SERVICE_TREE, categoryById } from "@/lib/registo-catalog";
import { cn } from "@/lib/utils";

export type SelectedService = { categoryId: string; subcategory: string; service: string };

export function CategorySelector({
  value,
  onChange,
}: {
  value: SelectedService[];
  onChange: (next: SelectedService[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const isPicked = (s: SelectedService) =>
    value.some((v) => v.categoryId === s.categoryId && v.service === s.service);

  const toggle = (s: SelectedService) => {
    onChange(
      isPicked(s)
        ? value.filter((v) => !(v.categoryId === s.categoryId && v.service === s.service))
        : [...value, s],
    );
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((s) => (
            <li key={`${s.categoryId}-${s.service}`}>
              <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-primary">
                {categoryById(s.categoryId)?.emoji} {s.service}
                <button
                  type="button"
                  aria-label={`Remover ${s.service}`}
                  onClick={() => toggle(s)}
                  className="text-primary/70"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-sm font-semibold text-primary"
      >
        <Plus size={16} aria-hidden="true" /> Adicionar categoria
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Escolha o que sabe fazer"
        description="Categoria → subcategoria → serviço. Pode escolher vários."
      >
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {SERVICE_TREE.map((cat) => {
            const count = value.filter((v) => v.categoryId === cat.id).length;
            const isOpen = expanded === cat.id;
            return (
              <div key={cat.id} className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <span aria-hidden="true" className="text-lg">
                    {cat.emoji}
                  </span>
                  <span className="flex-1 text-sm font-semibold">{cat.name}</span>
                  {count > 0 && (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                      {count}
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-border px-3 py-3">
                    {cat.subcategories.map((sub) => (
                      <div key={sub.name}>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          {sub.name}
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {sub.services.map((service) => {
                            const item = { categoryId: cat.id, subcategory: sub.name, service };
                            const picked = isPicked(item);
                            return (
                              <li key={service}>
                                <button
                                  type="button"
                                  aria-pressed={picked}
                                  onClick={() => toggle(item)}
                                  className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                                    picked
                                      ? "border-primary bg-accent text-primary"
                                      : "border-border bg-card text-foreground",
                                  )}
                                >
                                  {picked && <Check size={12} aria-hidden="true" />} {service}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="press mt-3 min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          Confirmar ({value.length})
        </button>
      </BottomSheet>
    </div>
  );
}
