import type { OrderStatus } from "./konekta-data";
import type { Tone } from "@/components/konekta/kit";

/* Etapa 3 — Estados globais da aplicação (cor, ícone, mensagem, ações) */

export type StateMeta = {
  label: string;
  tone: Tone;
  message: string;
  actions: string[];
};

export const orderStateMeta: Record<OrderStatus, StateMeta> = {
  pendente: {
    label: "Enviado",
    tone: "warning",
    message: "À espera que o prestador aceite o pedido.",
    actions: ["Cancelar", "Mensagem"],
  },
  aceite: {
    label: "Aceite",
    tone: "primary",
    message: "O prestador aceitou o seu pedido.",
    actions: ["Ver detalhes", "Mensagem", "Cancelar"],
  },
  "a-caminho": {
    label: "A caminho",
    tone: "primary",
    message: "O prestador está a caminho da sua morada.",
    actions: ["Acompanhar", "Mensagem"],
  },
  "em-execucao": {
    label: "Em execução",
    tone: "primary",
    message: "O serviço está a ser executado.",
    actions: ["Mensagem"],
  },
  concluido: {
    label: "Aguardando confirmação",
    tone: "success",
    message: "Confirme a conclusão para libertar o pagamento.",
    actions: ["Confirmar", "Avaliar"],
  },
  avaliado: {
    label: "Concluído",
    tone: "success",
    message: "Serviço concluído e avaliado. Obrigado!",
    actions: ["Repetir pedido"],
  },
};

export type PaymentState =
  | "pendente"
  | "autorizado"
  | "retido"
  | "processamento"
  | "libertado"
  | "reembolsado"
  | "falhado";

export const paymentStateMeta: Record<PaymentState, { label: string; tone: Tone }> = {
  pendente: { label: "Pendente", tone: "warning" },
  autorizado: { label: "Autorizado", tone: "primary" },
  retido: { label: "Retido pela KONEKTA", tone: "primary" },
  processamento: { label: "Em processamento", tone: "neutral" },
  libertado: { label: "Libertado", tone: "success" },
  reembolsado: { label: "Reembolsado", tone: "neutral" },
  falhado: { label: "Falhado", tone: "error" },
};

export type WalletState =
  | "sem_saldo"
  | "disponivel"
  | "pendente"
  | "levantamento_solicitado"
  | "levantamento_aprovado"
  | "levantamento_concluido";

export const walletStateMeta: Record<WalletState, { label: string; tone: Tone }> = {
  sem_saldo: { label: "Sem saldo", tone: "neutral" },
  disponivel: { label: "Saldo disponível", tone: "success" },
  pendente: { label: "Saldo pendente", tone: "warning" },
  levantamento_solicitado: { label: "Levantamento solicitado", tone: "warning" },
  levantamento_aprovado: { label: "Levantamento aprovado", tone: "primary" },
  levantamento_concluido: { label: "Levantamento concluído", tone: "success" },
};

export type DocumentState =
  | "nao_enviado"
  | "enviado"
  | "em_analise"
  | "verificado"
  | "rejeitado"
  | "expirado";

export const documentStateMeta: Record<DocumentState, { label: string; tone: Tone }> = {
  nao_enviado: { label: "Não enviado", tone: "neutral" },
  enviado: { label: "Enviado", tone: "primary" },
  em_analise: { label: "Em análise", tone: "warning" },
  verificado: { label: "Verificado", tone: "success" },
  rejeitado: { label: "Rejeitado", tone: "error" },
  expirado: { label: "Expirado", tone: "warning" },
};

export const accountStateMeta = {
  ativa: { label: "Conta ativa", tone: "success" as Tone },
  em_analise: { label: "Conta em análise", tone: "warning" as Tone },
  bloqueada: { label: "Conta bloqueada", tone: "error" as Tone },
  suspensa: { label: "Conta suspensa", tone: "error" as Tone },
};
