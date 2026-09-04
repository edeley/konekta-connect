import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Check,
  Tag,
  Clock,
  Sun,
  CheckSquare,
  Boxes,
  Maximize2,
  Car,
  FileText,
  AlertCircle,
  HelpCircle,
  Info,
  ShieldCheck,
} from "lucide-react";
import {
  type BillingModel,
  type MaterialPolicy,
  type TravelFeePolicy,
  type QuoteExtraItem,
  type ProviderCustomService,
  MVP_MODELS_LIST,
  BILLING_MODELS,
  formatDb,
} from "@/lib/pricing-engine";
import { categories } from "@/lib/konekta-data";
import { store, useStore } from "@/lib/store";
import { validateFormSafety } from "@/lib/escrow";
import { toast } from "sonner";

interface ServiceEditorModalProps {
  open: boolean;
  onClose: () => void;
  serviceToEdit?: ProviderCustomService | null;
  defaultCategory?: string;
}

export function ServiceEditorModal({
  open,
  onClose,
  serviceToEdit,
  defaultCategory = "Eletricista",
}: ServiceEditorModalProps) {
  const user = useStore((s) => s.user);
  const commissionPct = useStore((s) => s.config.commissionPct);

  // Form State
  const [category, setCategory] = useState(defaultCategory);
  const [subcategory, setSubcategory] = useState("");
  const [name, setName] = useState("");
  const [pricingType, setPricingType] = useState<BillingModel>("fixo");
  const [basePrice, setBasePrice] = useState<number | "">(500);
  const [customUnit, setCustomUnit] = useState("unidade");
  const [minimumQuantity, setMinimumQuantity] = useState<number | "">(1);
  const [maximumQuantity, setMaximumQuantity] = useState<number | "">("");

  // Deslocação
  const [travelPolicy, setTravelPolicy] = useState<TravelFeePolicy>("fixo");
  const [travelFeeAmount, setTravelFeeAmount] = useState<number | "">(200);

  // Material
  const [materialPolicy, setMaterialPolicy] = useState<MaterialPolicy>("nao_incluido");

  // Duração e Observações
  const [estimatedDuration, setEstimatedDuration] = useState("1h - 2h");
  const [observations, setObservations] = useState("");

  // Extras Simples
  const [extras, setExtras] = useState<QuoteExtraItem[]>([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState<number | "">("");

  // Populate when editing
  useEffect(() => {
    if (serviceToEdit) {
      setCategory(serviceToEdit.category || defaultCategory);
      setSubcategory(serviceToEdit.subcategory || "");
      setName(serviceToEdit.name || "");
      setPricingType(serviceToEdit.pricingType || "fixo");
      setBasePrice(serviceToEdit.basePrice || 0);
      setCustomUnit(serviceToEdit.unit || "unidade");
      setMinimumQuantity(serviceToEdit.minimumQuantity || 1);
      setMaximumQuantity(serviceToEdit.maximumQuantity || "");
      setTravelPolicy(serviceToEdit.travelFeePolicy || "fixo");
      setTravelFeeAmount(serviceToEdit.travelFeeAmount ?? 200);
      setMaterialPolicy(serviceToEdit.materialPolicy || "nao_incluido");
      setEstimatedDuration(serviceToEdit.estimatedDuration || "1h");
      setObservations(serviceToEdit.observations || "");
      setExtras(serviceToEdit.extras || []);
    } else {
      setName("");
      setPricingType("fixo");
      setBasePrice(500);
      setCustomUnit("unidade");
      setMinimumQuantity(1);
      setMaximumQuantity("");
      setTravelPolicy("fixo");
      setTravelFeeAmount(200);
      setMaterialPolicy("nao_incluido");
      setEstimatedDuration("1h - 2h");
      setObservations("");
      setExtras([]);
    }
  }, [serviceToEdit, defaultCategory, open]);

  if (!open) return null;

  const currentMeta = BILLING_MODELS[pricingType] || BILLING_MODELS.fixo;

  const handleAddExtra = () => {
    if (!newExtraName.trim()) {
      toast.error("Indique o nome do extra");
      return;
    }
    const priceNum = Number(newExtraPrice) || 0;
    if (priceNum <= 0) {
      toast.error("Indique o preço do extra");
      return;
    }
    setExtras((prev) => [
      ...prev,
      {
        id: `ext_${Date.now()}`,
        name: newExtraName.trim(),
        price: priceNum,
        selected: true,
      },
    ]);
    setNewExtraName("");
    setNewExtraPrice("");
  };

  const handleRemoveExtra = (id: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Indique o nome do serviço");
      return;
    }

    const safety = validateFormSafety({
      "Nome do Serviço": name,
      Subcategoria: subcategory,
      "Duração Estimada": estimatedDuration,
      Observações: observations,
      "Unidade Personalizada": customUnit,
    });

    if (!safety.isValid) {
      toast.error(safety.reason || "Conteúdo restrito detectado no formulário.");
      return;
    }

    const priceNum = pricingType === "orcamento" ? 0 : Number(basePrice) || 0;
    if (pricingType !== "orcamento" && priceNum <= 0) {
      toast.error("Defina o valor base do serviço");
      return;
    }

    const serviceData: Omit<ProviderCustomService, "id"> = {
      name: name.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      pricingType,
      basePrice: priceNum,
      unit: pricingType === "unidade" ? customUnit.trim() || "unidade" : currentMeta.unitSuffix,
      minimumQuantity: Number(minimumQuantity) || 1,
      maximumQuantity: maximumQuantity ? Number(maximumQuantity) : undefined,
      travelFeePolicy: travelPolicy,
      travelFeeAmount: travelPolicy === "fixo" ? Number(travelFeeAmount) || 0 : 0,
      materialPolicy,
      estimatedDuration: estimatedDuration.trim() || undefined,
      observations: observations.trim() || undefined,
      extras: extras.length > 0 ? extras : undefined,
      isActive: true,
    };

    if (serviceToEdit) {
      store.updateCustomService(serviceToEdit.id, serviceData);
      toast.success("Serviço atualizado com sucesso!");
    } else {
      store.addCustomService(serviceData);
      toast.success("Serviço publicado no catálogo!");
    }

    onClose();
  };

  // Cálculo da simulação para pré-visualização do prestador
  const numericPrice = Number(basePrice) || 0;
  const netEstimated =
    pricingType === "orcamento" ? 0 : Math.round(numericPrice * (1 - commissionPct / 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-card rounded-2xl border border-emerald-500/30 shadow-2xl flex flex-col">
        {/* Header com Identidade Verde KONEKTA PRO */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Tag size={19} />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {serviceToEdit ? "Editar Serviço" : "Novo Serviço KONEKTA PRO"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure preços, modelo de cobrança, deslocação e materiais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Categoria & Nome */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  1. Categoria do Serviço
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Subcategoria (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Residencial, Comercial"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                2. Nome do Serviço <span className="text-emerald-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Instalação de Tomada, Limpeza Residencial, Pintura de Parede..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition placeholder:font-normal"
              />
            </div>
          </div>

          {/* 2. Os 8 Modelos de Cobrança Nativos do MVP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                3. Como você cobra? (8 Modelos MVP)
              </label>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Modelo selecionado: {currentMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MVP_MODELS_LIST.map((model) => {
                const active = pricingType === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setPricingType(model.id);
                      if (model.id === "hora" && (!minimumQuantity || minimumQuantity < 2)) {
                        setMinimumQuantity(2);
                      }
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      active
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                        : "border-border bg-card/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold">{model.label}</span>
                      {active && (
                        <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {model.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Formulário Dinâmico Específico por Modelo */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={15} />
              <span>Configuração do modelo: {currentMeta.label}</span>
            </div>

            {/* A: PREÇO FIXO / SERVIÇO */}
            {(pricingType === "fixo" || pricingType === "servico") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Preço Fixo (Db)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 500"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-base font-bold text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Valor único para a execução completa.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Duração Estimada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1 hora, 2h30"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  />
                </div>
              </div>
            )}

            {/* B: POR HORA */}
            {pricingType === "hora" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Preço por Hora (Db/h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 500"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-base font-bold text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Mínimo de Horas
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 2"
                    value={minimumQuantity}
                    onChange={(e) =>
                      setMinimumQuantity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Máximo de Horas (opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 8"
                    value={maximumQuantity}
                    onChange={(e) =>
                      setMaximumQuantity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  />
                </div>
              </div>
            )}

            {/* C: POR DIA */}
            {pricingType === "dia" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Preço por Diária (Db/dia)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 1500"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-base font-bold text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Horário Operacional
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="08:00 – 17:00 (Padrão STP)"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-muted/60 text-sm font-medium text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* D: POR UNIDADE */}
            {pricingType === "unidade" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Preço por Unidade (Db)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 100"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-base font-bold text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Nome da Unidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: cadeira, peça, janela, árvore..."
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Quantidade Mínima
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 5"
                    value={minimumQuantity}
                    onChange={(e) =>
                      setMinimumQuantity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  />
                </div>
              </div>
            )}

            {/* E: POR METRO QUADRADO */}
            {pricingType === "m2" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Preço por m² (Db/m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 80"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-base font-bold text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    O cliente introduz a área aproximada e o sistema calcula a estimativa.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Área Mínima (m²)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 10"
                    value={minimumQuantity}
                    onChange={(e) =>
                      setMinimumQuantity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  />
                </div>
              </div>
            )}

            {/* F: POR VISITA */}
            {pricingType === "visita" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Valor da Visita Técnica & Diagnóstico (Db)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 500"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-base font-bold text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground bg-card/60 p-2.5 rounded-xl border border-border">
                  ℹ️ Inclui deslocação e diagnóstico inicial. A reparação ou peças são orçadas
                  posteriormente após a avaliação no local.
                </p>
              </div>
            )}

            {/* G: POR ORÇAMENTO */}
            {pricingType === "orcamento" && (
              <div className="p-3 bg-card/70 rounded-xl border border-border space-y-1">
                <p className="text-xs font-bold text-foreground">Sem Preço Inicial Obrigatório</p>
                <p className="text-xs text-muted-foreground">
                  O cliente envia fotos, morada e descrição do problema. O prestador avalia e envia
                  o orçamento detalhado através do chat protegido.
                </p>
              </div>
            )}
          </div>

          {/* 4. Deslocação e Materiais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deslocação */}
            <div className="p-4 rounded-2xl border border-border bg-card/50 space-y-3">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                4. Deslocação / Transporte
              </label>
              <div className="space-y-1.5">
                {[
                  { id: "fixo", label: "Preço Fixo de Deslocação" },
                  { id: "incluida", label: "Deslocação Já Incluída" },
                  { id: "gratuita_km", label: "Gratuita na Cidade / Raio Central" },
                  { id: "negociada", label: "Negociada através do Pedido" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="travelPolicy"
                      checked={travelPolicy === item.id}
                      onChange={() => setTravelPolicy(item.id as TravelFeePolicy)}
                      className="accent-emerald-600"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              {travelPolicy === "fixo" && (
                <div className="pt-2 border-t border-border">
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Taxa de Deslocação Fixa (Db)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={travelFeeAmount}
                    onChange={(e) =>
                      setTravelFeeAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-sm font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Materiais */}
            <div className="p-4 rounded-2xl border border-border bg-card/50 space-y-3">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                5. Política de Materiais
              </label>
              <div className="space-y-1.5">
                {[
                  { id: "nao_incluido", label: "Material Não Incluído (Cliente fornece)" },
                  { id: "incluido", label: "Material Já Incluído no Preço" },
                  { id: "a_combinar", label: "Material Calculado Posteriormente" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="materialPolicy"
                      checked={materialPolicy === item.id}
                      onChange={() => setMaterialPolicy(item.id as MaterialPolicy)}
                      className="accent-emerald-600"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Extras Simples (Opcionais) */}
          <div className="p-4 rounded-2xl border border-border bg-card/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  6. Extras Opcionais Simples
                </label>
                <p className="text-[11px] text-muted-foreground">
                  O cliente pode adicionar itens complementares durante a contratação
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {extras.length} adicionados
              </span>
            </div>

            {extras.length > 0 && (
              <div className="space-y-2">
                {extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-background border border-border text-xs"
                  >
                    <span className="font-semibold text-foreground">{extra.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatDb(extra.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtra(extra.id)}
                        className="text-muted-foreground hover:text-red-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Ex: Limpeza de vidros, Forno, Ficha extra..."
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs"
              />
              <input
                type="number"
                min="0"
                placeholder="Preço (Db)"
                value={newExtraPrice}
                onChange={(e) =>
                  setNewExtraPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-24 h-9 px-2 rounded-lg border border-border bg-background text-xs font-semibold"
              />
              <button
                type="button"
                onClick={handleAddExtra}
                className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>
          </div>

          {/* 6. Observações & O que o Cliente Vê */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
              7. Observações para o Cliente
            </label>
            <textarea
              rows={2}
              placeholder="Ex: O cliente deve fornecer a tomada e garantir acesso ao quadro elétrico."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Transparência de Custódia KONEKTA */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-foreground">
                  Comissão da Plataforma ({commissionPct}%)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {pricingType !== "orcamento" && numericPrice > 0
                    ? `Num serviço de ${formatDb(numericPrice)}, recebe ${formatDb(netEstimated)} líquidos na sua carteira KONEKTA.`
                    : "A taxa é calculada automaticamente na conclusão do serviço."}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check size={16} />
              {serviceToEdit ? "Guardar Alterações" : "Publicar Serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
