/**
 * KONEKTA STP — Máquina de Estados do Pedido & Esquema de Dados (Escrow & Commission)
 *
 * Mapeia rigorosamente o ciclo de vida:
 * DRAFT -> PENDING_MATCH -> AWAITING_PAYMENT -> HELD_IN_ESCROW -> IN_TRANSIT ->
 * IN_PROGRESS -> PENDING_PIN_VERIFICATION -> COMPLETED | DISPUTED | CANCELED
 */

export type OrderState =
  | "DRAFT"
  | "PENDING_MATCH"
  | "AWAITING_PAYMENT"
  | "HELD_IN_ESCROW"
  | "IN_TRANSIT"
  | "IN_PROGRESS"
  | "PENDING_PIN_VERIFICATION"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELED"
  | "aguardando_visita"
  | "orcamento_presencial_solicitado"
  | "confirmacao_cliente"
  | "divergencia_preco"
  | "visita_paga_e_aprovada"
  | "em_moderacao";

export type TechnicalVisitState =
  | "pendente"
  | "aguardando_visita"
  | "orcamento_presencial_solicitado"
  | "confirmacao_cliente"
  | "divergencia_preco"
  | "visita_paga_e_aprovada"
  | "em_moderacao"
  | "a_caminho"
  | "concluido"
  | "cancelado";

export interface OrderStateConfig {
  code: OrderState;
  labelPt: string;
  badgeTone: "neutral" | "primary" | "warning" | "success" | "error";
  clientDescription: string;
  providerDescription: string;
  allowedTransitions: OrderState[];
}

export const ORDER_STATE_CONFIGS: Record<OrderState, OrderStateConfig> = {
  DRAFT: {
    code: "DRAFT",
    labelPt: "Rascunho",
    badgeTone: "neutral",
    clientDescription: "Diagnóstico em preenchimento pelo cliente.",
    providerDescription: "Invisível para prestadores.",
    allowedTransitions: ["PENDING_MATCH", "AWAITING_PAYMENT", "CANCELED"],
  },
  PENDING_MATCH: {
    code: "PENDING_MATCH",
    labelPt: "Aguardando Propostas",
    badgeTone: "warning",
    clientDescription:
      "Pedido publicado no mercado KONEKTA. Aguardando propostas de técnicos qualificados.",
    providerDescription:
      "Novo chamado na sua área! Analise os detalhes e envie a sua proposta orçamentária.",
    allowedTransitions: ["AWAITING_PAYMENT", "CANCELED"],
  },
  AWAITING_PAYMENT: {
    code: "AWAITING_PAYMENT",
    labelPt: "Aguardando Pagamento",
    badgeTone: "warning",
    clientDescription:
      "Prestador selecionado. Autorize a retenção em custódia para confirmar o agendamento.",
    providerDescription:
      "Proposta aceite! Aguardando o cliente autorizar a retenção do pagamento em custódia.",
    allowedTransitions: ["HELD_IN_ESCROW", "CANCELED"],
  },
  HELD_IN_ESCROW: {
    code: "HELD_IN_ESCROW",
    labelPt: "Retido em Custódia",
    badgeTone: "primary",
    clientDescription:
      "Pagamento seguro retido na KONEKTA. Serviço confirmado. Guarde o seu PIN de conclusão.",
    providerDescription:
      "Pagamento 100% garantido em custódia! Inicie a deslocação para o local combinado.",
    allowedTransitions: ["IN_TRANSIT", "DISPUTED", "CANCELED"],
  },
  IN_TRANSIT: {
    code: "IN_TRANSIT",
    labelPt: "A Caminho",
    badgeTone: "primary",
    clientDescription: "O profissional está em deslocação para o seu endereço.",
    providerDescription:
      "A caminho do local do cliente. Ao chegar, confirme a sua chegada (Check-in GPS).",
    allowedTransitions: ["IN_PROGRESS", "DISPUTED", "CANCELED"],
  },
  IN_PROGRESS: {
    code: "IN_PROGRESS",
    labelPt: "Em Execução",
    badgeTone: "primary",
    clientDescription: "O profissional chegou ao local e o trabalho está a decorrer.",
    providerDescription:
      "Serviço em execução no local. Ao finalizar, clique em Concluir para solicitar o PIN.",
    allowedTransitions: ["PENDING_PIN_VERIFICATION", "DISPUTED"],
  },
  PENDING_PIN_VERIFICATION: {
    code: "PENDING_PIN_VERIFICATION",
    labelPt: "Aguardando Validação PIN",
    badgeTone: "warning",
    clientDescription:
      "Trabalho finalizado pelo prestador! Verifique o resultado e forneça o seu PIN de 4 dígitos.",
    providerDescription:
      "Trabalho finalizado! Peça o código PIN de 4 dígitos ao cliente para libertar os seus ganhos.",
    allowedTransitions: ["COMPLETED", "DISPUTED"],
  },
  COMPLETED: {
    code: "COMPLETED",
    labelPt: "Concluído",
    badgeTone: "success",
    clientDescription: "PIN validado com sucesso! Pagamento liquidado e garantia KONEKTA ativada.",
    providerDescription:
      "PIN validado! O valor líquido foi creditado imediatamente na sua carteira KONEKTA.",
    allowedTransitions: [],
  },
  DISPUTED: {
    code: "DISPUTED",
    labelPt: "Em Disputa / Mediação",
    badgeTone: "error",
    clientDescription:
      "Disputa aberta. A retenção em custódia foi congelada até análise da equipa de suporte.",
    providerDescription:
      "Chamado em mediação pelo suporte KONEKTA. A liquidação está suspensa temporariamente.",
    allowedTransitions: ["COMPLETED", "CANCELED"],
  },
  CANCELED: {
    code: "CANCELED",
    labelPt: "Cancelado",
    badgeTone: "neutral",
    clientDescription:
      "Pedido cancelado. Eventuais valores retidos foram estornados para a sua carteira.",
    providerDescription: "Pedido cancelado.",
    allowedTransitions: [],
  },
  aguardando_visita: {
    code: "aguardando_visita",
    labelPt: "Aguardando Visita",
    badgeTone: "primary",
    clientDescription:
      "Visita técnica confirmada. O valor da deslocação está retido e o técnico tem acesso à morada.",
    providerDescription:
      "Visita autorizada pelo cliente! Desloque-se ao local para avaliar o serviço presencialmente.",
    allowedTransitions: ["orcamento_presencial_solicitado", "CANCELED"],
  },
  orcamento_presencial_solicitado: {
    code: "orcamento_presencial_solicitado",
    labelPt: "Orçamento Presencial Declarado",
    badgeTone: "warning",
    clientDescription:
      "O técnico avaliou o local e declarou o valor combinado. Por favor confirme se está correto.",
    providerDescription:
      "Declaração de valor presencial enviada ao cliente. Aguardando confirmação mútua.",
    allowedTransitions: ["confirmacao_cliente", "visita_paga_e_aprovada", "divergencia_preco"],
  },
  confirmacao_cliente: {
    code: "confirmacao_cliente",
    labelPt: "Confirmação do Cliente",
    badgeTone: "warning",
    clientDescription: "Confirme se o valor declarado pelo técnico corresponde ao combinado.",
    providerDescription: "Aguardando validação do cliente no ecrã.",
    allowedTransitions: ["visita_paga_e_aprovada", "divergencia_preco"],
  },
  divergencia_preco: {
    code: "divergencia_preco",
    labelPt: "Divergência de Preço",
    badgeTone: "warning",
    clientDescription:
      "O valor informado difere do declarado pelo prestador. A validação algorítmica foi acionada.",
    providerDescription:
      "O cliente indicou um valor diferente. O sistema KONEKTA está a processar a verificação de preço médio.",
    allowedTransitions: ["visita_paga_e_aprovada", "em_moderacao"],
  },
  visita_paga_e_aprovada: {
    code: "visita_paga_e_aprovada",
    labelPt: "Visita Aprovada & Em Custódia",
    badgeTone: "success",
    clientDescription:
      "Orçamento validado com sucesso! O valor está protegido em custódia e o serviço pode iniciar.",
    providerDescription:
      "Valor validado e garantido em custódia! Pode iniciar a execução do serviço.",
    allowedTransitions: ["IN_PROGRESS", "COMPLETED", "DISPUTED"],
  },
  em_moderacao: {
    code: "em_moderacao",
    labelPt: "Em Moderação Antifraude",
    badgeTone: "error",
    clientDescription:
      "Divergência elevada de valores. O pedido está sob revisão da equipa de suporte KONEKTA.",
    providerDescription:
      "Pedido congelado para auditoria da equipa KONEKTA. Entraremos em contacto brevemente.",
    allowedTransitions: ["visita_paga_e_aprovada", "CANCELED"],
  },
};

/** Valida se uma transição de estado é permitida */
export function canTransitionOrder(fromState: OrderState, toState: OrderState): boolean {
  if (fromState === toState) return true;
  const config = ORDER_STATE_CONFIGS[fromState];
  if (!config) return false;
  return config.allowedTransitions.includes(toState);
}

/** Calcula divisão financeira com comissão da plataforma KONEKTA (ex: 15%) */
export function calculateSplit(
  totalAmount: number,
  commissionPercent = 15,
): {
  totalCollected: number;
  platformCommission: number;
  commissionPercent: number;
  netProviderCredited: number;
} {
  const safeTotal = Math.max(0, totalAmount);
  const commission = Math.round((safeTotal * commissionPercent) / 100);
  const net = safeTotal - commission;
  return {
    totalCollected: safeTotal,
    platformCommission: commission,
    commissionPercent,
    netProviderCredited: net,
  };
}

/** Mapeamento de compatibilidade entre estados legados em português e OrderState oficial */
export function mapLegacyStatusToOrderState(legacy: string): OrderState {
  switch (legacy) {
    case "pendente":
      return "PENDING_MATCH";
    case "aceite":
      return "HELD_IN_ESCROW";
    case "a-caminho":
      return "IN_TRANSIT";
    case "em-execucao":
      return "IN_PROGRESS";
    case "aguardando-codigo":
      return "PENDING_PIN_VERIFICATION";
    case "concluido":
    case "avaliado":
      return "COMPLETED";
    case "disputa":
    case "disputed":
      return "DISPUTED";
    case "cancelado":
    case "canceled":
      return "CANCELED";
    case "DRAFT":
    case "PENDING_MATCH":
    case "AWAITING_PAYMENT":
    case "HELD_IN_ESCROW":
    case "IN_TRANSIT":
    case "IN_PROGRESS":
    case "PENDING_PIN_VERIFICATION":
    case "COMPLETED":
    case "DISPUTED":
    case "CANCELED":
      return legacy as OrderState;
    default:
      return "PENDING_MATCH";
  }
}

/**
 * Esquema DDL SQL para PostgreSQL / Supabase
 */
export const POSTGRES_SCHEMA_DDL = `
-- 1. Tabela Principal de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  provider_id VARCHAR(64),
  category_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  pin_code VARCHAR(8),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  provider_net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  service_title TEXT NOT NULL,
  district VARCHAR(64) NOT NULL,
  address TEXT,
  gps_latitude NUMERIC(10, 6),
  gps_longitude NUMERIC(10, 6),
  scheduled_for TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Histórico Auditável de Transições de Estado
CREATE TABLE IF NOT EXISTS order_events (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(32),
  new_status VARCHAR(32) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  notes TEXT,
  gps_latitude NUMERIC(10, 6),
  gps_longitude NUMERIC(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Retenções Financeiras em Custódia (Escrow Holds)
CREATE TABLE IF NOT EXISTS escrow_holds (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id VARCHAR(64) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'HELD', -- HELD, RELEASED, REFUNDED, DISPUTED
  payment_gateway_ref VARCHAR(128),
  held_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE
);

-- 4. Carteiras Digitais (Wallets)
CREATE TABLE IF NOT EXISTS wallets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  pending_escrow_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(8) NOT NULL DEFAULT 'STN',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Transações e Movimentações Financeiras
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id VARCHAR(64) PRIMARY KEY,
  wallet_id VARCHAR(64) NOT NULL REFERENCES wallets(id),
  order_id VARCHAR(64) REFERENCES orders(id),
  user_id VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL, -- ESCROW_HOLD, ESCROW_RELEASE, PLATFORM_FEE, DEPOSIT, WITHDRAWAL, REFUND
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Disputas e Mediação de Conflitos
CREATE TABLE IF NOT EXISTS disputes (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
  opened_by_user_id VARCHAR(64) NOT NULL,
  reason VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  evidence_photos TEXT[],
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- OPEN, UNDER_REVIEW, RESOLVED_CLIENT, RESOLVED_PROVIDER
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
`;
