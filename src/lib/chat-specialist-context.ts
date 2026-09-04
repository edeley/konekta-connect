import type { User, ProviderProfile } from "./store";
import type { Order } from "./konekta-data";
import type { TechnicalVisit, InPersonCashDeclaration } from "./store";

/**
 * Contexto higienizado do utilizador para o chat e assistente.
 * REGRA CRÍTICA DE PRIVACIDADE:
 * Todas as informações do utilizador são incluídas, EXCETO documentos
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

  // Contexto de Serviços e Pedidos (Sem dados documentais)
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
}): SanitizedUserChatContext {
  const { user, orders, technicalVisits, providerId } = params;

  // Extrair primeiro nome de forma amigável
  const rawName = user?.name?.trim() || "Cliente KONEKTA";
  const firstName = rawName.split(" ")[0] || rawName;

  // Pedidos ativos relevantes (filtrando apenas dados operacionais)
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

  // Visitas técnicas no terreno ativas
  const activeVisits = technicalVisits
    .filter((v) => v.status !== "cancelado")
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
    activeOrders,
    technicalVisits: activeVisits,
    hasCompletedOrders: orders.some((o) => o.status === "concluido"),
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
