import type { User, ProviderProfile, Transaction } from "./store";
import type { Order } from "./konekta-data";
import type { TechnicalVisit, InPersonCashDeclaration } from "./store";
import type { ServiceRequest } from "./requests";

/**
 * Contexto higienizado do utilizador para o chat e assistente Konekta Connect.
 * REGRA CRÍTICA DE PRIVACIDADE:
 * Todas as informações operacionais são incluídas, EXCETO documentos
 * (sem BI, NIF, passaporte, fotos de documentos ou chaves de segurança).
 */
export interface SanitizedUserChatContext {
  // Identificação e Contacto Básico
  userId?: string;
  name: string;
  firstName: string;
  phone: string;
  email?: string;
  role: "cliente" | "prestador" | "admin" | "ambos";

  // Localização em São Tomé e Príncipe
  district: string;
  city: string;
  address?: string;

  // Contexto Financeiro Atual da Aplicação (STN Dobras)
  financialState: {
    walletBalance: number;
    currency: string;
    escrowInCustody: number; // Montante protegido em custódia na app
    totalSpentSTN: number; // Total investido em serviços concluídos
    providerBalance?: number;
    providerPendingBalance?: number;
    providerWithdrawnBalance?: number;
    providerDebt?: number; // Dívida de comissões pendentes (limite 300 STN)
    isProviderBlockedForDebt?: boolean;
    recentTransactions: {
      id: string;
      kind: "in" | "out";
      label: string;
      amount: number;
      dateFormatted: string;
    }[];
  };

  // Pedidos e Serviços em Curso
  activeOrders: {
    id: string;
    serviceTitle: string;
    status: string;
    scheduledFor: string;
    district: string;
    address?: string;
    total: number;
    notes?: string;
  }[];

  // Histórico Completo de Pedidos Concluídos e Cancelados
  history: {
    completedOrdersCount: number;
    completedOrders: {
      id: string;
      serviceTitle: string;
      total: number;
      district: string;
      providerName?: string;
      date?: string;
    }[];
    cancelledOrdersCount: number;
    pastTechnicalVisits: {
      id: string;
      serviceTitle: string;
      status: string;
      scheduledDate: string;
      diagnosticNotes?: string;
      declaredAmount?: number;
    }[];
    openRequests: {
      id: string;
      title: string;
      district: string;
      urgency?: string;
      proposalsCount: number;
    }[];
  };

  // Visitas Técnicas no Terreno
  technicalVisits: {
    id: string;
    serviceTitle: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    district: string;
    address?: string;
    diagnosticNotes?: string;
    declaredAmount?: number;
  }[];

  // Perfil Profissional (se prestador ou ambos)
  providerProfile?: {
    category?: string;
    experienceYears?: number;
    rating?: number;
    completedJobs?: number;
    services?: { name: string; price: number }[];
    bio?: string;
    coverageDistricts?: string[];
  };

  // Estatísticas de confiança não sensíveis
  hasCompletedOrders: boolean;
  memberSinceFormatted: string;

  // Interação específica com este prestador (se aplicável)
  providerSpecificHistory?: {
    hasActiveOrderWithThisProvider: boolean;
    activeOrderTitle?: string;
    hasActiveVisitWithThisProvider: boolean;
    activeVisitStatus?: string;
    visitDate?: string;
  };
}

/**
 * Filtra e higieniza estritamente os dados do utilizador,
 * garantindo que nenhum documento ou dado sensível seja exposto ao chat.
 */
export function buildSanitizedUserContext(params: {
  user: User | null;
  orders: Order[];
  technicalVisits: TechnicalVisit[];
  providerId?: string;
  balance?: number;
  providerBalance?: number;
  providerPendingBalance?: number;
  providerWithdrawnBalance?: number;
  providerDebt?: number;
  isProviderBlockedForDebt?: boolean;
  transactions?: Transaction[];
  providerTransactions?: Transaction[];
  providerProfile?: ProviderProfile | null;
  requests?: ServiceRequest[];
}): SanitizedUserChatContext {
  const {
    user,
    orders,
    technicalVisits,
    providerId,
    balance = 0,
    providerBalance,
    providerPendingBalance,
    providerWithdrawnBalance,
    providerDebt,
    isProviderBlockedForDebt,
    transactions = [],
    providerTransactions = [],
    providerProfile,
    requests = [],
  } = params;

  // Extrair primeiro nome de forma amigável
  const rawName = user?.name?.trim() || "Cliente KONEKTA";
  const firstName = rawName.split(" ")[0] || rawName;

  // Pedidos ativos em curso
  const activeOrders = orders
    .filter((o) => !["concluido", "cancelado"].includes(o.status))
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      serviceTitle: o.service,
      status: o.status,
      scheduledFor: o.scheduledFor,
      district: o.district || "São Tomé",
      address: o.address,
      total: o.total,
      notes: o.notes ? o.notes.slice(0, 150) : undefined,
    }));

  // Pedidos concluídos no histórico
  const completedOrdersList = orders
    .filter((o) => o.status === "concluido")
    .map((o) => ({
      id: o.id,
      serviceTitle: o.service,
      total: o.total,
      district: o.district || "São Tomé",
      providerName: o.provider,
      date: o.scheduledFor,
    }));

  const cancelledOrdersList = orders.filter((o) => o.status === "cancelado");

  const totalSpentSTN = completedOrdersList.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Escrow atualmente bloqueado em pedidos ativos do cliente
  const escrowInCustody = activeOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Visitas técnicas ativas
  const activeVisits = technicalVisits
    .filter((v) => v.status !== "cancelado" && v.status !== "concluido")
    .slice(0, 3)
    .map((v) => ({
      id: v.id,
      serviceTitle: v.serviceTitle,
      status: v.status,
      scheduledDate: v.scheduledDate,
      scheduledTime: v.scheduledTime,
      district: v.district,
      address: v.address,
      diagnosticNotes: v.diagnosticReport ? v.diagnosticReport.slice(0, 150) : undefined,
      declaredAmount: v.declaredAmountByProvider,
    }));

  // Histórico de visitas passadas
  const pastVisits = technicalVisits
    .filter((v) => v.status === "concluido" || v.status === "cancelado")
    .slice(0, 5)
    .map((v) => ({
      id: v.id,
      serviceTitle: v.serviceTitle,
      status: v.status,
      scheduledDate: v.scheduledDate,
      diagnosticNotes: v.diagnosticReport ? v.diagnosticReport.slice(0, 150) : undefined,
      declaredAmount: v.declaredAmountByProvider,
    }));

  // Pedidos abertos de cotação / propostas
  const openRequestsList = requests
    .filter((r) => r.status === "aberto")
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      title: r.title,
      district: r.district,
      urgency: r.urgency,
      proposalsCount: r.proposalsCount || (r.proposals ? r.proposals.length : 0),
    }));

  // Transações recentes consolidadas
  const allTx = [...transactions, ...providerTransactions]
    .sort((a, b) => b.at - a.at)
    .slice(0, 6)
    .map((tx) => ({
      id: tx.id,
      kind: tx.kind,
      label: tx.label,
      amount: tx.amount,
      dateFormatted: new Date(tx.at).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
      }),
    }));

  // Relação específica com o prestador com quem o utilizador está a falar
  let providerSpecificHistory: SanitizedUserChatContext["providerSpecificHistory"];
  if (providerId) {
    const orderWithProvider = orders.find(
      (o) => o.providerId === providerId && !["concluido", "cancelado"].includes(o.status),
    );
    const visitWithProvider = technicalVisits.find(
      (v) => v.providerId === providerId && v.status !== "cancelado",
    );

    providerSpecificHistory = {
      hasActiveOrderWithThisProvider: Boolean(orderWithProvider),
      activeOrderTitle: orderWithProvider?.service,
      hasActiveVisitWithThisProvider: Boolean(visitWithProvider),
      activeVisitStatus: visitWithProvider?.status,
      visitDate: visitWithProvider
        ? `${visitWithProvider.scheduledDate} às ${visitWithProvider.scheduledTime}`
        : undefined,
    };
  }

  // Data de adesão formatada
  const memberDate = user?.createdAt ? new Date(user.createdAt) : new Date();
  const memberSinceFormatted = memberDate.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });

  return {
    userId: user?.id,
    name: rawName,
    firstName,
    phone: user?.phone || "+239 9900000",
    email: user?.email,
    role: user?.role || "cliente",
    district: user?.district || "Água Grande",
    city: user?.city || "São Tomé",
    address: user?.address || "São Tomé e Príncipe",
    financialState: {
      walletBalance: typeof balance === "number" ? balance : (user?.walletBalance ?? 0),
      currency: "STN",
      escrowInCustody,
      totalSpentSTN,
      providerBalance,
      providerPendingBalance,
      providerWithdrawnBalance,
      providerDebt,
      isProviderBlockedForDebt,
      recentTransactions: allTx,
    },
    activeOrders,
    history: {
      completedOrdersCount: completedOrdersList.length,
      completedOrders: completedOrdersList.slice(0, 5),
      cancelledOrdersCount: cancelledOrdersList.length,
      pastTechnicalVisits: pastVisits,
      openRequests: openRequestsList,
    },
    technicalVisits: activeVisits,
    providerProfile: providerProfile
      ? {
          category: providerProfile.category,
          experienceYears: providerProfile.yearsExperience || providerProfile.experienceYears,
          rating: user?.rating || 5.0,
          completedJobs: user?.completedJobs || completedOrdersList.length,
          services: providerProfile.services,
          bio: providerProfile.bio,
          coverageDistricts: providerProfile.coverageDistricts,
        }
      : undefined,
    hasCompletedOrders: completedOrdersList.length > 0,
    memberSinceFormatted,
    providerSpecificHistory,
  };
}

/**
 * Validador de segurança adicional:
 * Remove categoricamente qualquer chave de documento ou identificação fiscal/civil.
 */
export function stripAnyDocumentFields<T extends object>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const forbiddenKeys = [
    "documents",
    "idNumber",
    "nif",
    "bi",
    "bilhete",
    "passaporte",
    "passport",
    "selfie",
    "selfieOk",
    "documentPhoto",
    "docFront",
    "docBack",
    "pin",
    "password",
    "hash",
  ];

  const cleaned = { ...data } as Record<string, unknown>;
  for (const key of Object.keys(cleaned)) {
    if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk))) {
      delete cleaned[key];
    }
  }
  return cleaned as T;
}
