import { useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import {
  PRICING_LABELS,
  SERVICE_TREE,
  categoryById,
  pricingModelsFor,
  type PricingModel,
} from "@/lib/registo-catalog";
import { cn } from "@/lib/utils";

export type SelectedService = {
  categoryId: string;
  categoryName: string;
  subcategory: string;
  service: string;
  /** Serviço/categoria escrito pelo próprio prestador. */
  custom?: boolean;
  pricing?: PricingModel;
  price?: string;
};

const ALL_PRICING = Object.keys(PRICING_LABELS) as PricingModel[];
const CUSTOM = "outro";

function keyOf(s: SelectedService) {
  return `${s.categoryId}::${s.subcategory}::${s.service}`;
}

export function CategorySelector({
  value,
  onChange,
}: {
  value: SelectedService[];
  onChange: (next: SelectedService[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"cat" | "sub" | "serv">("cat");
  const [catId, setCatId] = useState<string | null>(null);
  const [customCat, setCustomCat] = useState("");
  const [sub, setSub] = useState<string | null>(null);
  const [customSub, setCustomSub] = useState("");
  const [customServ, setCustomServ] = useState("");

  const cat = catId && catId !== CUSTOM ? categoryById(catId) : null;
  const catName = cat?.name ?? customCat.trim();
  const subName = sub === CUSTOM ? customSub.trim() : (sub ?? "");

  const grouped = useMemo(() => {
    const map = new Map<string, SelectedService[]>();
    value.forEach((s) => {
      const list = map.get(s.categoryName) ?? [];
      list.push(s);
      map.set(s.categoryName, list);
    });
    return [...map.entries()];
  }, [value]);

  const reset = () => {
    setStep("cat");
    setCatId(null);
    setCustomCat("");
    setSub(null);
    setCustomSub("");
    setCustomServ("");
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const add = (service: string, custom?: boolean) => {
    if (!catName || !service.trim()) return;
    const item: SelectedService = {
      categoryId: cat?.id ?? `custom-${catName.toLowerCase().replace(/\s+/g, "-")}`,
      categoryName: catName,
      subcategory: subName || "Geral",
      service: service.trim(),
      custom,
      pricing: undefined,
      price: "",
    };
    if (value.some((v) => keyOf(v) === keyOf(item))) return;
    onChange([...value, item]);
  };

  const remove = (s: SelectedService) => onChange(value.filter((v) => keyOf(v) !== keyOf(s)));

  const update = (s: SelectedService, patch: Partial<SelectedService>) =>
    onChange(value.map((v) => (keyOf(v) === keyOf(s) ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-3">
      {grouped.map(([name, list]) => (
        <div key={name} className="rounded-2xl border border-border bg-surface p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {name}
          </p>
          <ul className="space-y-2">
            {list.map((s) => {
              const options =
                s.custom || s.categoryId.startsWith("custom-")
                  ? ALL_PRICING
                  : pricingModelsFor([s.categoryId]);
              return (
                <li key={keyOf(s)} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{s.service}</p>
                      <p className="text-[11px] text-muted-foreground">{s.subcategory}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover ${s.service}`}
                      onClick={() => remove(s)}
                      className="press grid size-7 place-items-center rounded-full bg-surface text-destructive"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Modelo de cobrança
                      </label>
                      <select
                        value={s.pricing ?? ""}
                        onChange={(e) =>
                          update(s, { pricing: (e.target.value || undefined) as PricingModel })
                        }
                        className="min-h-11 w-full rounded-lg border border-border bg-card px-2 text-xs font-semibold outline-none focus:border-primary"
                      >
                        <option value="">Escolher…</option>
                        {options.map((p) => (
                          <option key={p} value={p}>
                            {PRICING_LABELS[p]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Preço (Db)
                      </label>
                      <input
                        inputMode="numeric"
                        value={s.price ?? ""}
                        onChange={(e) => update(s, { price: e.target.value.replace(/\D/g, "") })}
                        placeholder="Ex.: 500"
                        className="min-h-11 w-full rounded-lg border border-border bg-card px-2 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-sm font-semibold text-primary"
      >
        <Plus size={16} aria-hidden="true" /> Adicionar categoria de serviço
      </button>

      <BottomSheet
        open={open}
        onClose={close}
        title={
          step === "cat"
            ? "Escolha a categoria"
            : step === "sub"
              ? "Escolha a subcategoria"
              : "Escolha os serviços"
        }
        description={
          step === "cat"
            ? "Se não encontrar a sua área, escolha “Outro” e escreva."
            : `${catName}${subName ? ` · ${subName}` : ""}`
        }
      >
        {step !== "cat" && (
          <button
            type="button"
            onClick={() => setStep(step === "serv" ? "sub" : "cat")}
            className="mb-2 flex items-center gap-1.5 text-xs font-bold text-primary"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Voltar
          </button>
        )}

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {step === "cat" && (
            <>
              {SERVICE_TREE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCatId(c.id);
                    setSub(null);
                    setStep("sub");
                  }}
                  className="press flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left"
                >
                  <span aria-hidden="true" className="text-lg">
                    {c.emoji}
                  </span>
                  <span className="flex-1 text-sm font-semibold">{c.name}</span>
                  {value.some((v) => v.categoryId === c.id) && (
                    <Check size={15} className="text-success" aria-hidden="true" />
                  )}
                </button>
              ))}
              <div className="rounded-xl border border-dashed border-primary/50 bg-accent/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Plus size={14} aria-hidden="true" /> Outro — escreva a sua área
                </p>
                <input
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  placeholder="Ex.: Serralharia"
                  className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={customCat.trim().length < 3}
                  onClick={() => {
                    setCatId(CUSTOM);
                    setSub(null);
                    setStep("sub");
                  }}
                  className="press mt-2 min-h-11 w-full rounded-lg bg-primary text-xs font-bold text-primary-foreground disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === "sub" && (
            <>
              {(cat?.subcategories ?? []).map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setSub(s.name);
                    setStep("serv");
                  }}
                  className="press flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-left text-sm font-semibold"
                >
                  {s.name}
                  <span className="text-[11px] text-muted-foreground">
                    {s.services.length} serviços
                  </span>
                </button>
              ))}
              <div className="rounded-xl border border-dashed border-primary/50 bg-accent/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Plus size={14} aria-hidden="true" /> Outro — escreva a subcategoria
                </p>
                <input
                  value={customSub}
                  onChange={(e) => setCustomSub(e.target.value)}
                  placeholder="Ex.: Portões automáticos"
                  className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={customSub.trim().length < 3}
                  onClick={() => {
                    setSub(CUSTOM);
                    setStep("serv");
                  }}
                  className="press mt-2 min-h-11 w-full rounded-lg bg-primary text-xs font-bold text-primary-foreground disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === "serv" && (
            <>
              <ul className="flex flex-wrap gap-2">
                {(cat?.subcategories.find((x) => x.name === sub)?.services ?? []).map((service) => {
                  const picked = value.some(
                    (v) =>
                      v.categoryName === catName &&
                      v.subcategory === subName &&
                      v.service === service,
                  );
                  return (
                    <li key={service}>
                      <button
                        type="button"
                        aria-pressed={picked}
                        onClick={() =>
                          picked
                            ? onChange(
                                value.filter(
                                  (v) =>
                                    !(
                                      v.categoryName === catName &&
                                      v.subcategory === subName &&
                                      v.service === service
                                    ),
                                ),
                              )
                            : add(service)
                        }
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                          picked
                            ? "border-primary bg-accent text-primary"
                            : "border-border bg-card",
                        )}
                      >
                        {picked && <Check size={12} aria-hidden="true" />} {service}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="rounded-xl border border-dashed border-primary/50 bg-accent/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Plus size={14} aria-hidden="true" /> Outro — escreva o serviço que faz
                </p>
                <input
                  value={customServ}
                  onChange={(e) => setCustomServ(e.target.value)}
                  placeholder="Ex.: Montagem de portão de alumínio"
                  className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={customServ.trim().length < 3}
                  onClick={() => {
                    add(customServ, true);
                    setCustomServ("");
                  }}
                  className="press mt-2 min-h-11 w-full rounded-lg bg-primary text-xs font-bold text-primary-foreground disabled:opacity-40"
                >
                  Adicionar serviço
                </button>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={step === "serv" ? close : close}
          className="press mt-3 min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          Concluir ({value.length})
        </button>
      </BottomSheet>
    </div>
  );
}
