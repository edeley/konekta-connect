/**
 * Motor de Preço Médio e Algoritmo Antifraude para Visitas Técnicas no Terreno
 * Mercado de São Tomé e Príncipe (STP)
 */

export interface CategoryBenchmark {
  categorySlug: string;
  categoryName: string;
  name?: string;
  minPrice: number;
  avgPrice: number;
  averagePrice?: number;
  maxPrice: number;
  typicalVisitFee: number;
  description: string;
}

export const STP_PRICE_BENCHMARKS: Record<string, CategoryBenchmark> = {
  encanamento: {
    categorySlug: "encanamento",
    categoryName: "Canalização & Encanamento",
    minPrice: 150,
    avgPrice: 450,
    maxPrice: 1200,
    typicalVisitFee: 150,
    description: "Reparações de fugas, montagem de tanques, eletrobombas e desentupimentos.",
  },
  canalizador: {
    categorySlug: "canalizador",
    categoryName: "Canalização & Águas",
    minPrice: 150,
    avgPrice: 450,
    maxPrice: 1200,
    typicalVisitFee: 150,
    description: "Reparações de canalização e bombas em São Tomé.",
  },
  eletricista: {
    categorySlug: "eletricista",
    categoryName: "Eletricidade & Quadros",
    minPrice: 200,
    avgPrice: 550,
    maxPrice: 1600,
    typicalVisitFee: 150,
    description: "Troca de disjuntores, inversores solares, quedas de fase e fiação.",
  },
  "ar-condicionado": {
    categorySlug: "ar-condicionado",
    categoryName: "Climatização & AC",
    minPrice: 300,
    avgPrice: 750,
    maxPrice: 2200,
    typicalVisitFee: 200,
    description: "Cargas de gás R410A, limpeza química e instalação de split.",
  },
  pintor: {
    categorySlug: "pintor",
    categoryName: "Pintura & Tratamento de Salitre",
    minPrice: 400,
    avgPrice: 1100,
    maxPrice: 3500,
    typicalVisitFee: 150,
    description: "Tratamento de humidade, impermeabilização e pintura geral.",
  },
  limpeza: {
    categorySlug: "limpeza",
    categoryName: "Limpeza Residencial & Pós-Obra",
    minPrice: 250,
    avgPrice: 600,
    maxPrice: 1500,
    typicalVisitFee: 100,
    description: "Faxinas profundas, higienização e limpeza de vidros.",
  },
  mecanico: {
    categorySlug: "mecanico",
    categoryName: "Mecânica Auto & Socorro",
    minPrice: 250,
    avgPrice: 700,
    maxPrice: 2500,
    typicalVisitFee: 200,
    description: "Diagnóstico no local, troca de bateria, arranque e travões.",
  },
  pedreiro: {
    categorySlug: "pedreiro",
    categoryName: "Construção & Alvenaria",
    minPrice: 500,
    avgPrice: 1400,
    maxPrice: 4500,
    typicalVisitFee: 150,
    description: "Pequenas reformas, assentamento de tijolo, reboco e pisos.",
  },
  carpinteiro: {
    categorySlug: "carpinteiro",
    categoryName: "Carpintaria & Marcenaria",
    minPrice: 300,
    avgPrice: 850,
    maxPrice: 2800,
    typicalVisitFee: 150,
    description: "Reparação de portas, armários, fechaduras e coberturas.",
  },
};

export function getCategoryBenchmark(categorySlugOrName?: string): CategoryBenchmark {
  if (!categorySlugOrName) return STP_PRICE_BENCHMARKS.encanamento;
  const key = categorySlugOrName.toLowerCase().trim();
  for (const [k, v] of Object.entries(STP_PRICE_BENCHMARKS)) {
    if (k === key || v.categorySlug === key || v.categoryName.toLowerCase().includes(key)) {
      return v;
    }
  }
  return {
    categorySlug: "geral",
    categoryName: "Serviços Gerais",
    minPrice: 150,
    avgPrice: 500,
    maxPrice: 2000,
    typicalVisitFee: 150,
    description: "Valores médios para serviços técnicos em STP.",
  };
}

export type DivergenceTier =
  "tier_1_auto" | "tier_2_market" | "tier_2_benchmark" | "tier_3_moderation";

export interface AlgorithmicValidationResult {
  tier: DivergenceTier;
  variationPct: number; // 0 a 100+
  divergencePercent: number;
  differenceAmount: number;
  adoptedAmount: number;
  benchmark: CategoryBenchmark;
  isWithinMarketAverage: boolean;
  statusText: string;
  actionSummary: string;
  recommendation: "auto_approve_client" | "auto_approve_market_aligned" | "freeze_for_admin";
  messageForProvider: string;
  messageForClient: string;
  message?: string;
}

/**
 * Avalia a divergência entre a declaração do prestador e a confirmação do cliente.
 *
 * Regra:
 * - Variação = |Valor_Prestador - Valor_Cliente| / Valor_Cliente
 * - Tier 1 (Variação <= 15%): Aceitação direta do valor do cliente.
 * - Tier 2 (15% < Variação <= 40%): Verificação da média de mercado (±30% da média histórica).
 *   Se cliente dentro da margem -> assume valor do cliente. Caso contrário -> moderação.
 * - Tier 3 (Variação > 40% ou valores anómalos): Congelamento imediato e envio para Painel de Moderação.
 */
export function evaluatePriceDivergence(params: {
  providerAmount?: number;
  declaredByProvider?: number;
  clientAmount?: number;
  confirmedByClient?: number;
  benchmarkAverage?: number;
  category?: string;
  categorySlugOrName?: string;
}): AlgorithmicValidationResult {
  const providerAmount = params.providerAmount ?? params.declaredByProvider ?? 0;
  const clientAmount = params.clientAmount ?? params.confirmedByClient ?? 0;
  const categorySlugOrName = params.categorySlugOrName ?? params.category;
  const benchmark = getCategoryBenchmark(categorySlugOrName);
  benchmark.averagePrice = benchmark.avgPrice;

  const safeClientAmount = Math.max(1, clientAmount);
  const diff = Math.abs(providerAmount - clientAmount);
  const variation = (diff / safeClientAmount) * 100;
  const variationPct = Math.round(variation * 10) / 10;

  // Limites de mercado: média ±30%
  const marketLowerBound = benchmark.avgPrice * 0.7;
  const marketUpperBound = benchmark.avgPrice * 1.3;
  const isClientWithinMarket = clientAmount >= marketLowerBound && clientAmount <= marketUpperBound;

  // TIER 1: Variação Pequena (<= 15%)
  if (variationPct <= 15) {
    return {
      tier: "tier_1_auto",
      variationPct,
      divergencePercent: variationPct,
      differenceAmount: diff,
      adoptedAmount: clientAmount,
      benchmark,
      isWithinMarketAverage: true,
      statusText: "Ajuste Direto Automático (≤ 15% de variação)",
      actionSummary: `O valor do cliente (${clientAmount} STN) foi assumido automaticamente pela plataforma.`,
      recommendation: "auto_approve_client",
      messageForProvider: `Ajustámos o orçamento para ${clientAmount} STN com base na validação final do cliente (divergência de ${variationPct}% dentro da margem de tolerância).`,
      messageForClient: `O seu valor informado de ${clientAmount} STN foi aceite e o orçamento foi atualizado com sucesso.`,
    };
  }

  // TIER 2: Variação Moderada (15% < Variação <= 40%)
  if (variationPct <= 40) {
    if (isClientWithinMarket) {
      return {
        tier: "tier_2_market",
        variationPct,
        divergencePercent: variationPct,
        differenceAmount: diff,
        adoptedAmount: clientAmount,
        benchmark,
        isWithinMarketAverage: true,
        statusText: "Validado por Média Histórica de Mercado",
        actionSummary: `Divergência de ${variationPct}%. O valor do cliente (${clientAmount} STN) coincide com a média de mercado para ${benchmark.categoryName} (${benchmark.avgPrice} STN).`,
        recommendation: "auto_approve_market_aligned",
        messageForProvider: `O valor foi alinhado para ${clientAmount} STN conforme a tabela de média de mercado da KONEKTA para ${benchmark.categoryName}.`,
        messageForClient: `O seu valor de ${clientAmount} STN foi validado através da nossa verificação de preços médios de mercado.`,
      };
    } else {
      return {
        tier: "tier_3_moderation",
        variationPct,
        divergencePercent: variationPct,
        differenceAmount: diff,
        adoptedAmount: clientAmount,
        benchmark,
        isWithinMarketAverage: false,
        statusText: "Fora da Faixa de Mercado — Encaminhado para Auditoria",
        actionSummary: `Divergência de ${variationPct}% e o valor informado foge da média de mercado (${benchmark.avgPrice} STN ±30%).`,
        recommendation: "freeze_for_admin",
        messageForProvider: `O orçamento entrou em revisão da equipa de moderação KONEKTA devido à diferença de valores declarados.`,
        messageForClient: `Este orçamento está sob revisão da equipa de suporte KONEKTA para garantir a máxima transparência e segurança.`,
      };
    }
  }

  // TIER 3: Variação Grave (> 40%) ou Alerta de Fraude
  return {
    tier: "tier_3_moderation",
    variationPct,
    divergencePercent: variationPct,
    differenceAmount: diff,
    adoptedAmount: clientAmount,
    benchmark,
    isWithinMarketAverage: isClientWithinMarket,
    statusText: "Divergência Elevada (> 40%) — Congelamento em Moderação",
    actionSummary: `Divergência crítica de ${variationPct}% entre prestador (${providerAmount} STN) e cliente (${clientAmount} STN). Alerta de evasão/fraude acionado.`,
    recommendation: "freeze_for_admin",
    messageForProvider: `Este orçamento foi retido e congelado para análise da nossa equipa de mediação. Entraremos em contacto brevemente.`,
    messageForClient: `Identificámos uma divergência de valores. O pagamento está protegido em custódia enquanto a equipa de suporte analisa o caso.`,
  };
}

/**
 * Calcula o abatimento da taxa de visita técnica no serviço final
 */
export function calculateFinalServiceCharge(params: {
  serviceGrossAmount?: number;
  totalServiceAmount?: number;
  visitFeePaid?: number;
  visitFeePaidInEscrow?: number;
  deductVisitFee?: boolean;
}): {
  serviceGrossAmount: number;
  visitFeeDeducted: number;
  visitFeeDeduction: number;
  finalComplementToPay: number;
  complementToPay: number;
} {
  const serviceGrossAmount = params.serviceGrossAmount ?? params.totalServiceAmount ?? 0;
  const visitFeePaid = params.visitFeePaid ?? params.visitFeePaidInEscrow ?? 0;
  const deductVisitFee = params.deductVisitFee ?? true;
  const visitFeeDeducted = deductVisitFee ? Math.min(visitFeePaid, serviceGrossAmount) : 0;
  const finalComplementToPay = Math.max(0, serviceGrossAmount - visitFeeDeducted);

  return {
    serviceGrossAmount,
    visitFeeDeducted,
    visitFeeDeduction: visitFeeDeducted,
    finalComplementToPay,
    complementToPay: finalComplementToPay,
  };
}
