/**
 * KONEKTA STP - Motor de Modelos de Cobrança & Orçamentação
 *
 * ESPECIFICAÇÃO OFICIAL DO MVP:
 * 1. Preço fixo (FIXED) - Instalar uma tomada (500 Db, Serviço)
 * 2. Por hora (HOURLY) - Limpeza (500 Db/h, min 2h, max 8h)
 * 3. Por dia (DAILY) - Pedreiro / Jardinagem (1.500 Db/dia, 08:00-17:00)
 * 4. Por serviço (PER_SERVICE) - Reparar torneira (800 Db, Diagnóstico + mão de obra)
 * 5. Por unidade (PER_UNIT) - Lavar cadeira (100 Db/unidade, configurável)
 * 6. Por m² (PER_SQUARE_METER) - Pintura de parede (80 Db/m²)
 * 7. Por visita (PER_VISIT) - Diagnóstico técnico / deslocação + diagnóstico (500 Db)
 * 8. Por orçamento (QUOTE) - Reparação complexa, obras, projetos sob medida
 *
 * ARQUITETURA EXTENSÍVEL (Fases 2 e 3):
 * - PER_PROJECT (projeto c/ marcos), PACKAGE (pacotes), RECURRING (recorrente),
 * - HYBRID (híbrido), PER_KG (kg), PER_METER (metro), PER_POINT (ponto), etc.
 */

import { COMMISSION_PCT } from "./escrow";

/** Os 8 Modelos Oficiais Nativos do MVP */
export type MvpBillingModel =
  "fixo" | "hora" | "dia" | "servico" | "unidade" | "m2" | "visita" | "orcamento";

/** Todos os modelos suportados pela arquitetura de dados */
export type BillingModel =
  | MvpBillingModel
  | "meio_periodo"
  | "ponto"
  | "metro"
  | "kg"
  | "quantidade"
  | "projeto"
  | "pacotes"
  | "recorrente"
  | "hibrido";

/** Política de Materiais */
export type MaterialPolicy = "incluido" | "nao_incluido" | "a_combinar";
export type MaterialsMode = "cliente" | "prestador" | "nenhum" | "a_combinar";

/** Política de Deslocação */
export type TravelFeePolicy = "incluida" | "gratuita_km" | "fixo" | "negociada";

export type QuoteExtraItem = {
  id: string;
  name: string;
  price: number;
  selected?: boolean;
};

export type ProjectMilestone = {
  id: string;
  name: string;
  amount: number;
  status: "pendente" | "pago" | "libertado";
  completedAt?: number;
};

export type ServicePackage = {
  id: string;
  name: string;
  price: number;
  description: string;
  included: string[];
};

export type BillingModelMeta = {
  id: BillingModel;
  label: string;
  shortLabel: string;
  unitSuffix: string;
  defaultUnit: string;
  description: string;
  iconName: string;
  examples: string;
  suggestedFor: string[];
  isMvp: boolean;
};

/** Metadados dos Modelos de Cobrança com foco nos 8 nativos do MVP */
export const BILLING_MODELS: Record<BillingModel, BillingModelMeta> = {
  fixo: {
    id: "fixo",
    label: "Preço Fixo",
    shortLabel: "Fixo",
    unitSuffix: "serviço",
    defaultUnit: "serviço",
    description: "Valor único predefinido para a execução do serviço acordado.",
    iconName: "Tag",
    examples: "Instalar tomada (500 Db), Troca de fechadura (400 Db)",
    suggestedFor: ["Serviços rápidos", "Padronizados", "Reparações simples"],
    isMvp: true,
  },
  hora: {
    id: "hora",
    label: "Por Hora",
    shortLabel: "/hora",
    unitSuffix: "h",
    defaultUnit: "hora",
    description: "Cobrança por tempo dedicado com mínimo de horas configurável.",
    iconName: "Clock",
    examples: "Limpeza: 500 Db/hora (mínimo 2h, máx 8h) → 4h = 2.000 Db",
    suggestedFor: ["Limpeza residencial", "Jardinagem", "Informática", "Aulas"],
    isMvp: true,
  },
  dia: {
    id: "dia",
    label: "Por Dia",
    shortLabel: "/dia",
    unitSuffix: "dia",
    defaultUnit: "dia (08:00–17:00)",
    description: "Diária de trabalho completa em STP (08:00 às 17:00).",
    iconName: "Sun",
    examples: "Pedreiro (1.500 Db/dia), Empregada diária (1.000 Db/dia)",
    suggestedFor: ["Pedreiros", "Carpinteiros", "Obras", "Limpeza pesada"],
    isMvp: true,
  },
  servico: {
    id: "servico",
    label: "Por Serviço",
    shortLabel: "/serviço",
    unitSuffix: "serviço",
    defaultUnit: "tarefa específica",
    description: "Preço fixo de uma tarefa delimitada (diagnóstico + mão de obra).",
    iconName: "CheckSquare",
    examples: "Reparar torneira (800 Db), Instalar chuveiro (600 Db)",
    suggestedFor: ["Canalização", "Eletricidade", "Pequenas reparações"],
    isMvp: true,
  },
  unidade: {
    id: "unidade",
    label: "Por Unidade",
    shortLabel: "/un",
    unitSuffix: "un",
    defaultUnit: "unidade / peça",
    description: "Cobrança multiplicada pela quantidade de peças, cadeiras ou itens.",
    iconName: "Boxes",
    examples: "Lavar cadeiras: 100 Db/unidade × 10 = 1.000 Db",
    suggestedFor: ["Lavar cadeiras", "Portas", "Janelas", "Árvores", "Aparelhos"],
    isMvp: true,
  },
  m2: {
    id: "m2",
    label: "Por m²",
    shortLabel: "/m²",
    unitSuffix: "m²",
    defaultUnit: "metro quadrado",
    description: "Cobrança pela área da superfície a trabalhar (estimativa calculada).",
    iconName: "Maximize2",
    examples: "Pintura de parede: 80 Db/m² × 50 m² = 4.000 Db",
    suggestedFor: ["Pintores", "Colocadores de piso/azulejo", "Reboco", "Telhados"],
    isMvp: true,
  },
  visita: {
    id: "visita",
    label: "Por Visita",
    shortLabel: "/visita",
    unitSuffix: "visita",
    defaultUnit: "visita técnica",
    description: "Deslocação + diagnóstico inicial no local (reparação sob novo orçamento).",
    iconName: "Car",
    examples: "Diagnóstico de canalização: 500 Db",
    suggestedFor: ["Eletricistas", "Canalizadores", "Mecânicos", "Técnicos AC"],
    isMvp: true,
  },
  orcamento: {
    id: "orcamento",
    label: "Por Orçamento",
    shortLabel: "Orçamento",
    unitSuffix: "orçamento",
    defaultUnit: "avaliação prévia",
    description: "Preço definido após análise de fotografias, medidas ou visita técnica.",
    iconName: "FileText",
    examples: "Reparação de telhado danificado, remodelações e obras complexas",
    suggestedFor: ["Obras", "Reparações complexas", "Projetos por medida"],
    isMvp: true,
  },
  // Modelos avançados preparados para ativação futura:
  meio_periodo: {
    id: "meio_periodo",
    label: "Meio Período",
    shortLabel: "/turno",
    unitSuffix: "turno",
    defaultUnit: "período (4h)",
    description: "Turno da manhã (08:00-12:00) ou turno da tarde (13:00-17:00).",
    iconName: "Sunset",
    examples: "Manhã: 700 Db · Tarde: 700 Db",
    suggestedFor: ["Limpeza doméstica", "Jardinagem", "Apoio domiciliário"],
    isMvp: false,
  },
  ponto: {
    id: "ponto",
    label: "Por Ponto",
    shortLabel: "/ponto",
    unitSuffix: "ponto",
    defaultUnit: "ponto elétrico",
    description: "Cobrança por ponto de tomada, interruptor ou rede.",
    iconName: "Zap",
    examples: "350 Db/ponto × 8 pontos = 2.800 Db",
    suggestedFor: ["Eletricistas", "Redes"],
    isMvp: false,
  },
  metro: {
    id: "metro",
    label: "Por Metro Linear",
    shortLabel: "/m",
    unitSuffix: "m",
    defaultUnit: "metro linear",
    description: "Cobrança por metro linear de cabo, tubagem ou vedação.",
    iconName: "Ruler",
    examples: "Passagem de cabo: 100 Db/m × 30 m = 3.000 Db",
    suggestedFor: ["Tubagens", "Cabos elétricos", "Cercas"],
    isMvp: false,
  },
  kg: {
    id: "kg",
    label: "Por Peso (kg)",
    shortLabel: "/kg",
    unitSuffix: "kg",
    defaultUnit: "kg",
    description: "Cobrança por peso de carga ou frete.",
    iconName: "Scale",
    examples: "Frete: 20 Db/kg × 100 kg = 2.000 Db",
    suggestedFor: ["Fretes", "Cargas"],
    isMvp: false,
  },
  quantidade: {
    id: "quantidade",
    label: "Por Quantidade Personalizada",
    shortLabel: "/qtd",
    unitSuffix: "un",
    defaultUnit: "item",
    description: "Unidade personalizada definida pelo prestador.",
    iconName: "Layers",
    examples: "300 Db/árvore",
    suggestedFor: ["Agricultura"],
    isMvp: false,
  },
  projeto: {
    id: "projeto",
    label: "Por Projeto c/ Marcos",
    shortLabel: "Projeto",
    unitSuffix: "projeto",
    defaultUnit: "projeto completo",
    description: "Trabalhos faseados com liberação por etapas.",
    iconName: "Milestone",
    examples: "Muro: 50.000 Db (3 fases)",
    suggestedFor: ["Construção civil"],
    isMvp: false,
  },
  pacotes: {
    id: "pacotes",
    label: "Por Pacote",
    shortLabel: "Pacote",
    unitSuffix: "pacote",
    defaultUnit: "pacote",
    description: "Planos Básico / Completo / Premium.",
    iconName: "Package",
    examples: "Limpeza Básica vs Completa",
    suggestedFor: ["Eventos", "Limpeza"],
    isMvp: false,
  },
  recorrente: {
    id: "recorrente",
    label: "Assinatura Recorrente",
    shortLabel: "/mês",
    unitSuffix: "mês",
    defaultUnit: "mensalidade",
    description: "Serviço semanal ou mensal regular.",
    iconName: "Repeat",
    examples: "6.000 Db/mês",
    suggestedFor: ["Escritórios"],
    isMvp: false,
  },
  hibrido: {
    id: "hibrido",
    label: "Híbrido",
    shortLabel: "Híbrido",
    unitSuffix: "total",
    defaultUnit: "composição",
    description: "Composição de mão de obra + material + transporte.",
    iconName: "Layers",
    examples: "2.000 Db MO + 3.000 Db Mat.",
    suggestedFor: ["Obras"],
    isMvp: false,
  },
};

/** Lista oficial dos 8 modelos do MVP */
export const MVP_MODELS_LIST: BillingModelMeta[] = Object.values(BILLING_MODELS).filter(
  (m) => m.isMvp,
);

/** Serviço cadastrado pelo prestador */
export type ProviderCustomService = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  pricingType: BillingModel;
  basePrice: number;
  unit?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  travelFeePolicy?: TravelFeePolicy;
  travelFeeAmount?: number;
  materialPolicy?: MaterialPolicy;
  materialsCost?: number;
  estimatedDuration?: string;
  observations?: string;
  includes?: string[];
  excludes?: string[];
  extras?: QuoteExtraItem[];
  isActive?: boolean;
};

export type QuoteCalculationInput = {
  billingModel: BillingModel;
  unitPrice: number;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  customUnitName?: string;
  displacementFee?: number;
  materialsMode?: MaterialsMode;
  materialsCost?: number;
  materialsDescription?: string;
  extras?: QuoteExtraItem[];
  urgencyFee?: number;
  urgencyReason?: string;
  milestones?: ProjectMilestone[];
  selectedPackagePrice?: number;
  discount?: number;
  feePct?: number;
};

export type QuoteCalculationResult = {
  baseAmount: number;
  effectiveQuantity: number;
  materialsAmount: number;
  displacementAmount: number;
  extrasAmount: number;
  urgencyAmount: number;
  discountAmount: number;
  milestonesTotal: number;
  subtotal: number;
  fee: number;
  feePct: number;
  net: number;
  gross: number;
  unitFormatted: string;
  humanSummary: string;
  isQuote: boolean;
};

/**
 * Motor Central de Preços KONEKTA
 * Recebe: pricing_type + quantidade + preço + extras + deslocação + materiais
 * Devolve: preço final (gross) → comissão KONEKTA (fee) → valor líquido do Prestador (net)
 */
export function calculateQuote(input: QuoteCalculationInput): QuoteCalculationResult {
  const feePct = input.feePct ?? COMMISSION_PCT;
  const modelMeta = BILLING_MODELS[input.billingModel] || BILLING_MODELS.fixo;

  let baseAmount = 0;
  let effectiveQuantity = 1;
  let milestonesTotal = 0;

  // 1. Cálculo da Base conforme o modelo de cobrança
  switch (input.billingModel) {
    case "fixo":
    case "servico":
    case "visita":
      baseAmount = Math.max(0, input.unitPrice || 0);
      effectiveQuantity = 1;
      break;

    case "hora": {
      const minQty = input.minQuantity && input.minQuantity > 0 ? input.minQuantity : 1;
      const rawQty = input.quantity && input.quantity > 0 ? input.quantity : minQty;
      effectiveQuantity = Math.max(rawQty, minQty);
      if (input.maxQuantity && input.maxQuantity > 0 && effectiveQuantity > input.maxQuantity) {
        effectiveQuantity = input.maxQuantity;
      }
      baseAmount = (input.unitPrice || 0) * effectiveQuantity;
      break;
    }

    case "dia":
    case "meio_periodo":
    case "ponto":
    case "m2":
    case "metro":
    case "unidade":
    case "kg":
    case "quantidade": {
      const minQty = input.minQuantity && input.minQuantity > 0 ? input.minQuantity : 1;
      const rawQty = input.quantity && input.quantity > 0 ? input.quantity : minQty;
      effectiveQuantity = Math.max(rawQty, minQty);
      if (input.maxQuantity && input.maxQuantity > 0 && effectiveQuantity > input.maxQuantity) {
        effectiveQuantity = input.maxQuantity;
      }
      baseAmount = (input.unitPrice || 0) * effectiveQuantity;
      break;
    }

    case "projeto":
      if (input.milestones && input.milestones.length > 0) {
        milestonesTotal = input.milestones.reduce((acc, m) => acc + (m.amount || 0), 0);
        baseAmount = milestonesTotal;
      } else {
        baseAmount = Math.max(0, input.unitPrice || 0);
      }
      effectiveQuantity = 1;
      break;

    case "pacotes":
      baseAmount = Math.max(0, input.selectedPackagePrice ?? input.unitPrice ?? 0);
      effectiveQuantity = 1;
      break;

    case "recorrente":
      baseAmount = Math.max(0, input.unitPrice || 0);
      effectiveQuantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
      baseAmount = baseAmount * effectiveQuantity;
      break;

    case "orcamento":
      // Se não houver preço estipulado, é um pedido de orçamento a avaliar
      baseAmount = Math.max(0, input.unitPrice || 0);
      effectiveQuantity = 1;
      break;

    case "hibrido":
    default:
      baseAmount = Math.max(0, input.unitPrice || 0);
      effectiveQuantity = 1;
      break;
  }

  // 2. Componentes adicionais
  const materialsAmount =
    input.materialsMode === "prestador" ? Math.max(0, input.materialsCost || 0) : 0;
  const displacementAmount = Math.max(0, input.displacementFee || 0);
  const extrasAmount = (input.extras || [])
    .filter((e) => e.selected !== false)
    .reduce((acc, e) => acc + (e.price || 0), 0);
  const urgencyAmount = Math.max(0, input.urgencyFee || 0);
  const discountAmount = Math.max(0, input.discount || 0);

  // 3. Valor Total do Serviço Cobrado ao Cliente (Mão de obra + Materiais + Deslocação + Extras + Urgência - Desconto)
  const rawSubtotal =
    baseAmount +
    materialsAmount +
    displacementAmount +
    extrasAmount +
    urgencyAmount -
    discountAmount;
  const gross = Math.max(0, Math.round(rawSubtotal));

  // 4. Cálculo de Taxa KONEKTA (cobrada do prestador) e Valor Líquido na Carteira
  // A taxa da plataforma é retida do valor total do prestador, o cliente paga exatamente o valor do serviço
  const fee = Math.round((gross * feePct) / 100);
  const net = Math.max(0, gross - fee);

  // Formatação da Unidade
  let unitFormatted = modelMeta.unitSuffix;
  if (input.customUnitName && input.customUnitName.trim()) {
    unitFormatted = input.customUnitName.trim();
  } else if (input.billingModel === "hora") {
    unitFormatted = effectiveQuantity === 1 ? "hora" : "horas";
  } else if (input.billingModel === "dia") {
    unitFormatted = effectiveQuantity === 1 ? "dia" : "dias";
  } else if (input.billingModel === "ponto") {
    unitFormatted = effectiveQuantity === 1 ? "ponto" : "pontos";
  } else if (input.billingModel === "unidade") {
    unitFormatted = effectiveQuantity === 1 ? "unidade" : "unidades";
  }

  // Resumo Humano e Claro
  let humanSummary = "";
  if (input.billingModel === "hora") {
    humanSummary = `${effectiveQuantity} ${unitFormatted} × ${formatDb(input.unitPrice)}/h`;
  } else if (input.billingModel === "m2") {
    humanSummary = `${effectiveQuantity} m² × ${formatDb(input.unitPrice)}/m²`;
  } else if (input.billingModel === "dia") {
    humanSummary = `${effectiveQuantity} ${unitFormatted} de trabalho (${formatDb(input.unitPrice)}/dia)`;
  } else if (input.billingModel === "unidade") {
    humanSummary = `${effectiveQuantity} ${unitFormatted} × ${formatDb(input.unitPrice)}/un`;
  } else if (input.billingModel === "visita") {
    humanSummary = `Visita e Diagnóstico Técnico (${formatDb(baseAmount)})`;
  } else if (input.billingModel === "orcamento" && baseAmount === 0) {
    humanSummary = "Sob Orçamento (a avaliar)";
  } else {
    humanSummary = `${modelMeta.label} (${formatDb(baseAmount)})`;
  }

  if (displacementAmount > 0) {
    humanSummary += ` + Deslocação (${formatDb(displacementAmount)})`;
  }
  if (materialsAmount > 0) {
    humanSummary += ` + Materiais (${formatDb(materialsAmount)})`;
  }
  if (extrasAmount > 0) {
    humanSummary += ` + Extras (${formatDb(extrasAmount)})`;
  }
  if (urgencyAmount > 0) {
    humanSummary += ` + Urgência (${formatDb(urgencyAmount)})`;
  }

  const isQuote = input.billingModel === "orcamento" && baseAmount === 0;

  return {
    baseAmount,
    effectiveQuantity,
    materialsAmount,
    displacementAmount,
    extrasAmount,
    urgencyAmount,
    discountAmount,
    milestonesTotal,
    subtotal: net,
    fee,
    feePct,
    net,
    gross,
    unitFormatted,
    humanSummary,
    isQuote,
  };
}

export function formatDb(value: number): string {
  return `${Math.round(value || 0).toLocaleString("pt-PT")} Db`;
}
