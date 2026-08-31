import { useState, useMemo } from "react";
import {
  X,
  Calculator,
  Plus,
  Trash2,
  Clock,
  Tag,
  Sun,
  Sunset,
  Zap,
  Maximize2,
  Ruler,
  Boxes,
  Layers,
  Car,
  Milestone,
  CheckSquare,
  ShieldCheck,
  Flame,
  AlertCircle,
  Package,
  Repeat,
  DollarSign,
} from "lucide-react";
import {
  BILLING_MODELS,
  calculateQuote,
  type BillingModel,
  type MaterialsMode,
  type QuoteExtraItem,
  type ProjectMilestone,
  formatDb,
} from "@/lib/pricing-engine";
import { useStore } from "@/lib/store";
import { validateFormSafety } from "@/lib/escrow";

interface QuoteComposerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    net: number;
    description: string;
    billingModel: BillingModel;
    unitPrice: number;
    unitLabel?: string;
    quantity?: number;
    minQuantity?: number;
    displacementFee?: number;
    materialsMode?: MaterialsMode;
    materialsCost?: number;
    materialsDescription?: string;
    extras?: QuoteExtraItem[];
    urgencyFee?: number;
    urgencyReason?: string;
    milestones?: ProjectMilestone[];
    packageName?: string;
    recurrence?: "semanal" | "quinzenal" | "mensal";
    warranty?: string;
    estimatedDuration?: string;
  }) => void;
  initialServiceTitle?: string;
}

export function QuoteComposer({
  open,
  onClose,
  onSubmit,
  initialServiceTitle = "",
}: QuoteComposerProps) {
  const feePct = useStore((s) => s.config.commissionPct);

  // Estados principais do formulário
  const [description, setDescription] = useState(initialServiceTitle || "");
  const [billingModel, setBillingModel] = useState<BillingModel>("fixo");
  const [unitPrice, setUnitPrice] = useState<string>("500");
  const [quantity, setQuantity] = useState<string>("1");
  const [minQuantity, setMinQuantity] = useState<string>("1");
  const [customUnitName, setCustomUnitName] = useState<string>("");

  // Deslocação & Visita
  const [hasDisplacement, setHasDisplacement] = useState(false);
  const [displacementFee, setDisplacementFee] = useState<string>("150");

  // Materiais
  const [materialsMode, setMaterialsMode] = useState<MaterialsMode>("cliente");
  const [materialsCost, setMaterialsCost] = useState<string>("0");
  const [materialsDescription, setMaterialsDescription] = useState<string>("");

  // Extras & Adicionais
  const [extras, setExtras] = useState<QuoteExtraItem[]>([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  // Urgência
  const [hasUrgency, setHasUrgency] = useState(false);
  const [urgencyFee, setUrgencyFee] = useState<string>("200");
  const [urgencyReason, setUrgencyReason] = useState<string>("Atendimento Rápido / Noturno");

  // Marcos de Projeto
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([
    { id: "m1", name: "Fase 1: Início & Preparação", amount: 1500, status: "pendente" },
    { id: "m2", name: "Fase 2: Execução Principal", amount: 2500, status: "pendente" },
    { id: "m3", name: "Fase 3: Acabamentos & Entrega", amount: 1000, status: "pendente" },
  ]);

  // Pacotes
  const [packageName, setPackageName] = useState<string>("Pacote Completo");

  // Recorrência
  const [recurrence, setRecurrence] = useState<"semanal" | "quinzenal" | "mensal">("semanal");

  // Garantia e Prazo
  const [warranty, setWarranty] = useState<string>("30 dias de garantia");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("2h - 4h");

  // Seletor de visualização avançada vs rápida
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cálculo reativo usando o motor KONEKTA
  const calculation = useMemo(() => {
    return calculateQuote({
      billingModel,
      unitPrice: Number(unitPrice) || 0,
      quantity: Number(quantity) || 1,
      minQuantity: Number(minQuantity) || 1,
      customUnitName,
      displacementFee: hasDisplacement ? Number(displacementFee) || 0 : 0,
      materialsMode,
      materialsCost: Number(materialsCost) || 0,
      materialsDescription,
      extras,
      urgencyFee: hasUrgency ? Number(urgencyFee) || 0 : 0,
      urgencyReason,
      milestones: billingModel === "projeto" ? milestones : undefined,
      feePct,
    });
  }, [
    billingModel,
    unitPrice,
    quantity,
    minQuantity,
    customUnitName,
    hasDisplacement,
    displacementFee,
    materialsMode,
    materialsCost,
    materialsDescription,
    extras,
    hasUrgency,
    urgencyFee,
    urgencyReason,
    milestones,
    feePct,
  ]);

  const formSafety = useMemo(() => {
    return validateFormSafety({
      "Descrição do Serviço": description,
      "Descrição dos Materiais": materialsDescription,
      Garantia: warranty,
      "Duração Estimada": estimatedDuration,
      "Motivo de Urgência": urgencyReason,
      "Nome do Pacote": packageName,
    });
  }, [description, materialsDescription, warranty, estimatedDuration, urgencyReason, packageName]);

  const isValid = calculation.net > 0 && description.trim().length >= 3 && formSafety.isValid;

  function handleAddExtra() {
    if (!newExtraName.trim() || Number(newExtraPrice) <= 0) return;
    setExtras((prev) => [
      ...prev,
      {
        id: `ext_${Date.now()}`,
        name: newExtraName.trim(),
        price: Number(newExtraPrice),
        selected: true,
      },
    ]);
    setNewExtraName("");
    setNewExtraPrice("");
  }

  function handleRemoveExtra(id: string) {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  }

  function handleToggleExtra(id: string) {
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e)));
  }

  function handleAddMilestone() {
    setMilestones((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        name: `Etapa ${prev.length + 1}`,
        amount: 1000,
        status: "pendente",
      },
    ]);
  }

  function handleUpdateMilestone(index: number, field: "name" | "amount", value: string) {
    setMilestones((prev) =>
      prev.map((m, i) =>
        i === index
          ? {
              ...m,
              [field]: field === "amount" ? Number(value) || 0 : value,
            }
          : m,
      ),
    );
  }

  function handleRemoveMilestone(index: number) {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!isValid) return;

    onSubmit({
      net: calculation.net,
      description: description.trim(),
      billingModel,
      unitPrice: Number(unitPrice) || 0,
      unitLabel: calculation.unitFormatted,
      quantity: calculation.effectiveQuantity,
      minQuantity: Number(minQuantity) || 1,
      displacementFee: hasDisplacement ? Number(displacementFee) || 0 : 0,
      materialsMode,
      materialsCost: Number(materialsCost) || 0,
      materialsDescription,
      extras: extras.filter((e) => e.selected),
      urgencyFee: hasUrgency ? Number(urgencyFee) || 0 : 0,
      urgencyReason: hasUrgency ? urgencyReason : undefined,
      milestones: billingModel === "projeto" ? milestones : undefined,
      packageName: billingModel === "pacotes" ? packageName : undefined,
      recurrence: billingModel === "recorrente" ? recurrence : undefined,
      warranty: warranty.trim() || undefined,
      estimatedDuration: estimatedDuration.trim() || undefined,
    });

    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Criar proposta de orçamento"
    >
      <div
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-[28px] sm:rounded-[28px] bg-card shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-foreground">Proposta de Orçamento</h2>
            <p className="text-xs text-muted-foreground">
              Defina o modelo de cobrança adequado ao seu serviço
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulário com Scroll Suave */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* 1. Descrição do Trabalho */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Título / Descrição do Serviço
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
              placeholder="Ex: Instalação de quadro elétrico e 8 tomadas"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {!formSafety.isValid && (
              <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2 animate-fadeIn">
                <span className="text-xs shrink-0">🛡️</span>
                <div>
                  <p className="font-bold">Conteúdo Não Permitido no {formSafety.field}</p>
                  <p className="text-[11px] opacity-90">{formSafety.reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Seleção do Modelo de Cobrança */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">Modelo de Cobrança</label>
              <span className="text-[11px] font-bold text-primary">
                {BILLING_MODELS[billingModel]?.label}
              </span>
            </div>

            {/* Grid de Modelos Principais */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(
                [
                  "fixo",
                  "hora",
                  "dia",
                  "ponto",
                  "m2",
                  "metro",
                  "unidade",
                  "servico",
                  "meio_periodo",
                  "projeto",
                  "hibrido",
                  "visita",
                ] as BillingModel[]
              ).map((mKey) => {
                const meta = BILLING_MODELS[mKey];
                const active = billingModel === mKey;
                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => {
                      setBillingModel(mKey);
                      if (mKey === "hora") setUnitPrice("500");
                      if (mKey === "dia") setUnitPrice("1500");
                      if (mKey === "ponto") setUnitPrice("350");
                      if (mKey === "m2") setUnitPrice("80");
                      if (mKey === "metro") setUnitPrice("100");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                      active
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                        : "bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xs font-semibold truncate leading-tight">
                      {meta.shortLabel}
                    </span>
                    <span className="text-[10px] opacity-75 truncate">{meta.unitSuffix}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
              💡 <strong>Exemplo:</strong> {BILLING_MODELS[billingModel]?.examples}
            </p>
          </div>

          {/* 3. Valores & Quantidades baseados no modelo */}
          {billingModel !== "projeto" ? (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-surface border border-border">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {billingModel === "fixo"
                    ? "Valor da Mão de Obra (Db)"
                    : `Preço por ${BILLING_MODELS[billingModel]?.unitSuffix} (Db)`}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    Db
                  </span>
                </div>
              </div>

              {billingModel !== "fixo" && billingModel !== "visita" && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Quantidade ({BILLING_MODELS[billingModel]?.unitSuffix})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Gestor de Marcos de Pagamento para Projetos */
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Etapas / Marcos de Pagamento
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    O cliente paga por etapas concluídas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition"
                >
                  <Plus size={13} /> Adicionar Etapa
                </button>
              </div>

              <div className="space-y-2">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border"
                  >
                    <span className="size-6 rounded-full bg-muted grid place-items-center text-xs font-bold text-muted-foreground shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleUpdateMilestone(idx, "name", e.target.value)}
                      placeholder="Nome da etapa"
                      className="flex-1 px-2 py-1 text-xs rounded bg-surface border border-border font-medium"
                    />
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        min={0}
                        value={m.amount}
                        onChange={(e) => handleUpdateMilestone(idx, "amount", e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-surface border border-border font-bold text-right pr-6"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        Db
                      </span>
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        aria-label="Remover etapa"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Mão de Obra vs Materiais */}
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
            <label className="block text-xs font-semibold text-foreground">
              Fornecimento de Materiais
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMaterialsMode("cliente")}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                  materialsMode === "cliente"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                Cliente Fornece
              </button>
              <button
                type="button"
                onClick={() => setMaterialsMode("prestador")}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                  materialsMode === "prestador"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                Prestador Fornece
              </button>
            </div>

            {materialsMode === "prestador" && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Custo Estimado dos Materiais
                    </span>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min={0}
                        value={materialsCost}
                        onChange={(e) => setMaterialsCost(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 rounded-xl bg-card border border-border font-bold text-sm pr-9"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        Db
                      </span>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={materialsDescription}
                  onChange={(e) => setMaterialsDescription(e.target.value)}
                  placeholder="Discriminação (ex: 2 latas tinta branca, 1 rolo, lixas)"
                  className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-xs"
                />
              </div>
            )}
          </div>

          {/* 5. Deslocação e Urgência */}
          <div className="space-y-3">
            {/* Toggle Deslocação */}
            <div className="p-3.5 rounded-2xl bg-surface border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Car size={18} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Taxa de Deslocação</p>
                  <p className="text-[11px] text-muted-foreground">
                    Transporte até à localização do cliente
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasDisplacement && (
                  <div className="relative w-20">
                    <input
                      type="number"
                      value={displacementFee}
                      onChange={(e) => setDisplacementFee(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg bg-card border border-border font-bold text-right pr-6"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      Db
                    </span>
                  </div>
                )}
                <input
                  type="checkbox"
                  checked={hasDisplacement}
                  onChange={(e) => setHasDisplacement(e.target.checked)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Toggle Urgência */}
            <div className="p-3.5 rounded-2xl bg-surface border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Flame size={18} className="text-warning shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Acréscimo de Urgência</p>
                  <p className="text-[11px] text-muted-foreground">
                    Atendimento imediato, noturno ou feriados
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasUrgency && (
                  <div className="relative w-20">
                    <input
                      type="number"
                      value={urgencyFee}
                      onChange={(e) => setUrgencyFee(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg bg-card border border-border font-bold text-right pr-6"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      Db
                    </span>
                  </div>
                )}
                <input
                  type="checkbox"
                  checked={hasUrgency}
                  onChange={(e) => setHasUrgency(e.target.checked)}
                  className="size-4 rounded accent-warning cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 6. Adicionais & Extras Opcionais */}
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Extras & Adicionais Opcionais
              </label>
              <span className="text-[11px] text-muted-foreground">{extras.length} cadastrados</span>
            </div>

            {extras.length > 0 && (
              <div className="space-y-2">
                {extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-card border border-border text-xs"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={extra.selected}
                        onChange={() => handleToggleExtra(extra.id)}
                        className="size-3.5 rounded accent-primary"
                      />
                      <span
                        className={
                          extra.selected
                            ? "font-bold text-foreground"
                            : "text-muted-foreground line-through"
                        }
                      >
                        {extra.name}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatDb(extra.price)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtra(extra.id)}
                        className="text-destructive hover:opacity-80"
                        aria-label="Remover extra"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Ex: Aplicação de verniz protetor"
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-card border border-border font-medium"
              />
              <div className="relative w-24 shrink-0">
                <input
                  type="number"
                  placeholder="Preço"
                  value={newExtraPrice}
                  onChange={(e) => setNewExtraPrice(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl bg-card border border-border font-bold text-right pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  Db
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddExtra}
                className="p-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition"
                aria-label="Adicionar item extra"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* 7. Garantia e Prazo de Execução */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Garantia Oferecida
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="Ex: 30 dias de garantia"
                className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Tempo Estimado
              </label>
              <input
                type="text"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="Ex: 2 horas / 1 dia"
                className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-medium"
              />
            </div>
          </div>

          {/* 8. Resumo Financeiro da Proposta */}
          <div className="rounded-2xl bg-muted/40 border border-border p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Valor Total da Proposta:</span>
              <span className="font-bold text-foreground">{formatDb(calculation.gross)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Taxa de Intermediação ({calculation.feePct}%):</span>
              <span className="font-semibold text-muted-foreground">
                -{formatDb(calculation.fee)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="font-bold text-foreground">Líquido a Receber na Carteira:</span>
              <span className="text-sm font-black text-emerald-800 dark:text-emerald-400">
                {formatDb(calculation.net)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer com Botão de Envio */}
        <div className="p-4 border-t border-border bg-card flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 py-3 px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/95 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            Enviar Proposta Oficial ({formatDb(calculation.gross)})
          </button>
        </div>
      </div>
    </div>
  );
}
