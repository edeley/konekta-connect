import { useSyncExternalStore } from "react";
import {
  BLOCK_NOTICE,
  analyzeBlockedContent,
  containsBlockedContent,
  quoteFromNet,
} from "./escrow";
import { realtimeAudio, realtimeBus } from "./realtime";
import {
  type BillingModel,
  type MaterialsMode,
  type QuoteExtraItem,
  type ProjectMilestone,
  type ProviderCustomService,
  calculateQuote,
} from "./pricing-engine";

import {
  orders as seedOrders,
  providers as catalogProviders,
  type Order,
  type OrderStatus,
} from "./konekta-data";
import { seedRequests, type Proposal, type RequestUrgency, type ServiceRequest } from "./requests";

// Simple localStorage-backed store with pub/sub. No backend required for the MVP.

export type UserRole = "cliente" | "prestador" | "admin";

export type User = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  birthDate?: string;
  gender?: string;
  district?: string;
  city?: string;
  address?: string;
  createdAt: number;
};

export type PortfolioItem = {
  id: string;
  title: string;
  image: string;
  description?: string;
  category?: string;
  date?: string;
};

export type ProviderProfile = {
  category: string;
  subcategory?: string;
  yearsExperience: number;
  bio: string;
  services: { name: string; price: number }[];
  customServices?: ProviderCustomService[];
  portfolio?: PortfolioItem[];
  district: string;
  city: string;
  radiusKm: number;
  documents: { idNumber?: string; nif?: string; selfieOk: boolean };
  bankAccount?: string;
  status: "em_analise" | "aprovado" | "rejeitado";
  submittedAt: number;
};

export type ProviderReview = {
  id: string;
  orderId?: string;
  providerId: string;
  clientName: string;
  clientAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  tags?: string[];
  recommended?: boolean;
  serviceName?: string;
  district?: string;
  createdAt: number;
  photos?: string[];
  reply?: {
    text: string;
    at: number;
  };
};

export const seedReviews: ProviderReview[] = [
  {
    id: "rev-1",
    orderId: "KNK-1021",
    providerId: "dercio-costa",
    clientName: "Ana Paula Silva",
    rating: 5,
    comment:
      "Excelente profissional! Detetou a fuga de água na casa de banho em 10 minutos e reparou tudo sem partir azulejos desnecessários. Muito pontual, educado e deixou o chão limpo.",
    tags: ["Pontualidade", "Trabalho Limpo", "Rigor Técnico"],
    recommended: true,
    serviceName: "Reparação de fuga e canalização",
    district: "Água Grande",
    createdAt: Date.now() - 2 * 86400_000,
    reply: {
      text: "Muito obrigado D. Ana! Foi um enorme prazer ajudar. Qualquer necessidade estou à disposição!",
      at: Date.now() - 86400_000,
    },
  },
  {
    id: "rev-2",
    providerId: "edmilson-varela",
    clientName: "Carlos Manuel Sousa",
    rating: 5,
    comment:
      "Instalação do novo quadro elétrico ficou impecável. Montou disjuntores de proteção e explicou detalhadamente o funcionamento de cada circuito. Recomendo com toda a confiança em São Tomé.",
    tags: ["Profissionalismo", "Preço Justo", "Excelente Comunicação"],
    recommended: true,
    serviceName: "Instalação de Quadro Elétrico",
    district: "Mé-Zóchi",
    createdAt: Date.now() - 4 * 86400_000,
  },
  {
    id: "rev-3",
    providerId: "edmilson-varela",
    clientName: "Marta Fernandes",
    rating: 5,
    comment:
      "Pontual, educado e muito rigoroso na montagem dos focos de LED da sala. Trouxe ferramentas próprias e limpou o pó após furar o teto falso.",
    tags: ["Pontualidade", "Trabalho Limpo"],
    recommended: true,
    serviceName: "Iluminação & Focos LED",
    district: "Água Grande",
    createdAt: Date.now() - 8 * 86400_000,
  },
  {
    id: "rev-4",
    providerId: "maria-santos",
    clientName: "Dra. Teresa Barros",
    rating: 5,
    comment:
      "A Maria e a sua equipa fizeram uma limpeza profunda antes da mudança da nossa família. A cozinha, vidros e armários ficaram reluzentes. Super recomendada!",
    tags: ["Trabalho Limpo", "Rápido e Eficiente", "Educada"],
    recommended: true,
    serviceName: "Limpeza Profunda Residencial",
    district: "Lobata",
    createdAt: Date.now() - 6 * 86400_000,
  },
  {
    id: "rev-5",
    providerId: "joao-pedro",
    clientName: "Eng. Alberto Ramos",
    rating: 5,
    comment:
      "Pintura dos quartos e sala com tinta anti-humidade de alta durabilidade. Acabamento perfeito nas esquinas e rodapés. Excelente relação qualidade e preço.",
    tags: ["Rigor Técnico", "Preço Justo", "Pontualidade"],
    recommended: true,
    serviceName: "Pintura de Interior",
    district: "Cantagalo",
    createdAt: Date.now() - 12 * 86400_000,
  },
  {
    id: "rev-6",
    providerId: "dercio-costa",
    clientName: "Manuel Trindade",
    rating: 5,
    comment:
      "Substituição de torneiras e instalação da bomba de água para aumentar a pressão. Trabalho rápido, com garantia e muito profissional.",
    tags: ["Rápido e Eficiente", "Rigor Técnico", "Preço Justo"],
    recommended: true,
    serviceName: "Instalação de Bomba de Água",
    district: "Água Grande",
    createdAt: Date.now() - 15 * 86400_000,
  },
];

export type QuoteStatus = "pendente" | "pago" | "concluido" | "recusado";

export type Quote = {
  id: string;
  providerId: string;
  description: string;
  net: number;
  fee: number;
  gross: number;
  feePct: number;
  status: QuoteStatus;
  createdAt: number;
  paidAt?: number;
  completedAt?: number;

  // Campos estruturados de Modelo de Cobrança KONEKTA STP
  billingModel?: BillingModel;
  unitPrice?: number;
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
  includedItems?: string[];
  excludedItems?: string[];
  warranty?: string;
  estimatedDuration?: string;
};

export type QuoteRequestData = {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  district: string;
  address?: string;
  referencePoint?: string;
  urgency: RequestUrgency;
  schedule: string;
  photos: string[];
  createdAt: number;
  status: "enviado" | "respondido" | "fechado";
};

export type InPersonCashDeclaration = {
  id: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  visitId?: string;
  orderId?: string;
  serviceTitle: string;
  declaredAmount: number; // Valor em STN cobrado presencialmente
  commissionPct: number; // Ex: 10%
  commissionAmount: number; // Valor da comissão da app em STN
  status:
    "aguardando_confirmacao" | "confirmado_pelo_cliente" | "ajustado_pelo_cliente" | "recusado";
  actualAmountPaid?: number; // Se o cliente corrigiu o valor
  clientNotes?: string;
  declaredAt: number;
  confirmedAt?: number;
};

export type CompanyTechnician = {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  avatar?: string;
  active: boolean;
  assignedOrdersCount: number;
  totalEarnings: number;
  rating: number;
};

export type CompanyProfile = {
  companyName: string;
  legalName?: string;
  nif: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  district: string;
  address?: string;
  technicians: CompanyTechnician[];
  commissionPlan: "comissao" | "plano_mensal";
};

export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  at: number;
  status?: "sent" | "delivered" | "read";
  kind?: "text" | "quote" | "quote_request" | "system" | "in_person_confirmation" | "photo";
  photos?: string[];
  quote?: Quote;
  quoteRequest?: QuoteRequestData;
  inPersonDeclaration?: InPersonCashDeclaration;
};

export type AssistantMessage = {
  id: string;
  from: "me" | "ai";
  text: string;
  at: number;
};

export type Transaction = {
  id: string;
  kind: "in" | "out";
  label: string;
  amount: number;
  at: number;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  tone: "info" | "success" | "warning" | "error";
  link?: string;
};

export type FeatureFlags = {
  carteira: boolean;
  chat: boolean;
  assistente: boolean;
  promocoes: boolean;
  avaliacoes: boolean;
  registoPrestadores: boolean;
  pagamentoDinheiro: boolean;
  notificacoes: boolean;
  modoManutencao: boolean;
};

export type Settings = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  theme?: "light" | "dark";
  language: "pt" | "en";
  biometrics: boolean;
};

export type PlatformConfig = {
  commissionPct: number;
  minTopUp: number;
  currency: string;
  officialWhatsapp: string;
  officialEmail: string;
  clientWhatsappGroup: string;
  providerWhatsappGroup: string;
  companyMonthlyPlanFee: number;
  companyCommissionPct: number;
  technicalVisitFee: number;
  technicalVisitGuarantee: string;
  debtBlockLimit: number; // Limite de 500 STN de dívida para suspensão
};

export type TechnicalVisit = {
  id: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  serviceTitle: string;
  district: string;
  address?: string;
  scheduledDate: string;
  scheduledTime: string;
  visitFee: number; // Valor em custódia (ex: 150 Db)
  status: "pendente" | "aceite" | "a_caminho" | "concluido" | "cancelado";
  diagnosticReport?: string;
  proposedQuote?: number;
  createdAt: number;
  declaredCashAmount?: number;
  cashConfirmedByClient?: boolean;
};

export type CompanyMonetization = {
  model: "comissao" | "plano_mensal";
  planActive: boolean;
  planExpiresAt?: number;
  monthlyFee: number;
};

export type ProfileKind = "cliente" | "prestador";

export type Profiles = { cliente: boolean; prestador: boolean };

type State = {
  user: User | null;
  profiles: Profiles;
  providerProfile: ProviderProfile | null;
  orders: Order[];
  reviews: ProviderReview[];
  requests: ServiceRequest[];
  technicalVisits: TechnicalVisit[];
  companyMonetization: CompanyMonetization;
  companyProfile: CompanyProfile | null;
  inPersonDeclarations: InPersonCashDeclaration[];
  messages: Record<string, Message[]>;
  assistantMessages: AssistantMessage[];
  balance: number;
  transactions: Transaction[];
  providerBalance: number;
  providerDebt: number; // Dívida acumulada de comissões por liquidar
  isProviderBlockedForDebt: boolean; // Bloqueado se dívida >= 500 STN
  providerTransactions: Transaction[];
  favorites: string[];
  notifications: AppNotification[];
  flags: FeatureFlags;
  settings: Settings;
  config: PlatformConfig;
  onboarded: boolean;
};

const KEY = "konekta:v5";

const defaultFlags: FeatureFlags = {
  carteira: true,
  chat: true,
  assistente: true,
  promocoes: true,
  avaliacoes: true,
  registoPrestadores: true,
  pagamentoDinheiro: true,
  notificacoes: true,
  modoManutencao: false,
};

const defaultSettings: Settings = {
  pushNotifications: true,
  emailNotifications: false,
  darkMode: false,
  language: "pt",
  biometrics: false,
};

export const seedTechnicalVisits: TechnicalVisit[] = [
  {
    id: "VIS-901",
    providerId: "edmilson-varela",
    providerName: "Edmilson Varela",
    clientId: "usr-client",
    clientName: "Manuel Trindade",
    serviceTitle: "Inspeção e diagnóstico de quadro elétrico trifásico",
    district: "Água Grande",
    address: "Avenida 12 de Julho, perto da Praça Central",
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "14:30",
    visitFee: 150,
    status: "a_caminho",
    createdAt: Date.now() - 3600_000,
  },
];

export const seedCompanyProfile: CompanyProfile = {
  companyName: "KONEKTA Obras & Serviços Lda",
  legalName: "KONEKTA Obras & Serviços São Tomé Lda",
  nif: "500892147",
  phone: "+239 9944747",
  email: "contato@konekta-stp.com",
  bankName: "BISTP (Banco Internacional de S. Tomé e Príncipe)",
  bankAccount: "ST53.0001.0000.1234.5678.9012.3",
  district: "Água Grande",
  address: "Avenida 12 de Julho, Edifício KONEKTA, São Tomé",
  commissionPlan: "comissao",
  technicians: [
    {
      id: "tech-1",
      name: "Dércio Costa",
      phone: "+239 9912345",
      specialty: "Canalizador & Fugas de Água",
      active: true,
      assignedOrdersCount: 24,
      totalEarnings: 18400,
      rating: 4.9,
    },
    {
      id: "tech-2",
      name: "Edmilson Varela",
      phone: "+239 9845678",
      specialty: "Eletricista & Quadros Elétricos",
      active: true,
      assignedOrdersCount: 31,
      totalEarnings: 26800,
      rating: 5.0,
    },
    {
      id: "tech-3",
      name: "João Pedro Neves",
      phone: "+239 9967890",
      specialty: "Pintor & Revestimentos",
      active: true,
      assignedOrdersCount: 15,
      totalEarnings: 12200,
      rating: 4.8,
    },
    {
      id: "tech-4",
      name: "Maria Santos",
      phone: "+239 9934567",
      specialty: "Supervisora de Limpezas Profundas",
      active: true,
      assignedOrdersCount: 42,
      totalEarnings: 31500,
      rating: 4.9,
    },
  ],
};

const defaultState: State = {
  user: null,
  profiles: { cliente: true, prestador: false },
  providerProfile: null,
  providerBalance: 0,
  providerDebt: 0,
  isProviderBlockedForDebt: false,
  providerTransactions: [],
  orders: seedOrders,
  reviews: seedReviews,
  requests: seedRequests,
  technicalVisits: seedTechnicalVisits,
  companyMonetization: {
    model: "comissao",
    planActive: false,
    monthlyFee: 1500,
  },
  companyProfile: seedCompanyProfile,
  inPersonDeclarations: [],

  messages: {
    "edmilson-varela": [
      {
        id: "m1",
        from: "them",
        text: "Boa tarde! Estou a caminho.",
        at: Date.now() - 3600_000,
        status: "read",
      },
      {
        id: "m2",
        from: "them",
        text: "Chego em cerca de 15 minutos.",
        at: Date.now() - 1800_000,
        status: "read",
      },
    ],
    "maria-santos": [
      {
        id: "m1",
        from: "them",
        text: "Perfeito, até amanhã às 9h!",
        at: Date.now() - 86400_000,
        status: "read",
      },
    ],
    "dercio-costa": [
      {
        id: "m1",
        from: "them",
        text: "Obrigado pela avaliação 🙏",
        at: Date.now() - 172800_000,
        status: "read",
      },
    ],
  },
  assistantMessages: [],
  balance: 1850,
  transactions: [
    {
      id: "t1",
      kind: "out",
      label: "Pagamento — Edmilson Varela",
      amount: 450,
      at: Date.now() - 3600_000,
    },
    {
      id: "t2",
      kind: "in",
      label: "Carregamento de saldo",
      amount: 1000,
      at: Date.now() - 86400_000,
    },
    {
      id: "t3",
      kind: "out",
      label: "Pagamento — Maria Santos",
      amount: 550,
      at: Date.now() - 5 * 86400_000,
    },
    {
      id: "t4",
      kind: "in",
      label: "Reembolso KNK-1015",
      amount: 200,
      at: Date.now() - 7 * 86400_000,
    },
  ],
  favorites: [],
  notifications: [
    {
      id: "n1",
      title: "Prestador a caminho",
      body: "Edmilson Varela está a caminho da sua morada para a visita técnica.",
      at: Date.now() - 1800_000,
      read: false,
      tone: "info",
      link: "/pedidos",
    },
    {
      id: "n2",
      title: "Pagamento concluído",
      body: "450 Db debitados da sua carteira KONEKTA.",
      at: Date.now() - 3600_000,
      read: false,
      tone: "success",
      link: "/carteira",
    },
    {
      id: "n3",
      title: "Avalie o seu serviço",
      body: "Como correu a reparação de fuga com Dércio Costa?",
      at: Date.now() - 2 * 86400_000,
      read: true,
      tone: "warning",
      link: "/pedidos",
    },
  ],
  flags: defaultFlags,
  settings: defaultSettings,
  config: {
    commissionPct: 20,
    minTopUp: 100,
    currency: "Db",
    officialWhatsapp: "+239 9944747",
    officialEmail: "edeleydamiao@gmail.com",
    clientWhatsappGroup: "https://chat.whatsapp.com/KONEKTA-Clientes-STP",
    providerWhatsappGroup: "https://chat.whatsapp.com/KONEKTA-Prestadores-STP",
    companyMonthlyPlanFee: 1500,
    companyCommissionPct: 0,
    technicalVisitFee: 150,
    technicalVisitGuarantee: "Garantia de deslocação Uber-style para avaliação no terreno",
    debtBlockLimit: 500,
  },
  onboarded: false,
};

function load(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<State>;
    const debt = parsed.providerDebt ?? defaultState.providerDebt ?? 0;
    const isBlocked =
      debt >= (parsed.config?.debtBlockLimit ?? defaultState.config.debtBlockLimit ?? 500);

    return {
      ...defaultState,
      ...parsed,
      providerDebt: debt,
      isProviderBlockedForDebt: isBlocked,
      companyProfile: parsed.companyProfile ?? defaultState.companyProfile,
      inPersonDeclarations: parsed.inPersonDeclarations ?? defaultState.inPersonDeclarations,
      profiles: { ...defaultState.profiles, ...(parsed.profiles ?? {}) },
      flags: { ...defaultFlags, ...(parsed.flags ?? {}) },
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      config: { ...defaultState.config, ...(parsed.config ?? {}) },
      companyMonetization: {
        ...defaultState.companyMonetization,
        ...(parsed.companyMonetization ?? {}),
      },
      technicalVisits: parsed.technicalVisits ?? defaultState.technicalVisits,
    };
  } catch {
    return defaultState;
  }
}

let state: State = load();
if (typeof document !== "undefined") {
  if (state.settings?.darkMode || state.settings?.theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function set(next: Partial<State>, broadcast = true) {
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
  if (broadcast) {
    realtimeBus.emit("order:status_changed", { timestamp: Date.now() });
  }
}

// Sincronização multi-janela/aba em tempo real
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      try {
        const fresh = JSON.parse(e.newValue) as Partial<State>;
        state = {
          ...defaultState,
          ...fresh,
          profiles: { ...defaultState.profiles, ...(fresh.profiles ?? {}) },
          flags: { ...defaultFlags, ...(fresh.flags ?? {}) },
          settings: { ...defaultSettings, ...(fresh.settings ?? {}) },
          config: { ...defaultState.config, ...(fresh.config ?? {}) },
        };
        listeners.forEach((l) => l());
      } catch {
        // ignore
      }
    }
  });
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const getSnapshot = () => state;
const getServerSnapshot = () => defaultState;

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

useStore.getState = getSnapshot;
useStore.setState = set;
useStore.subscribe = subscribe;

function notify(n: Omit<AppNotification, "id" | "at" | "read">) {
  set({
    notifications: [
      { ...n, id: `n_${Date.now()}`, at: Date.now(), read: false },
      ...state.notifications,
    ],
  });
}

function seedProviderPool(categoryName: string) {
  const same = catalogProviders.filter(
    (p) => p.category.toLowerCase() === categoryName.toLowerCase(),
  );
  return same.length > 0 ? same : catalogProviders;
}

export const store = {
  get: () => state,
  notify,

  /* --------- Pedido Direto e Privado a um Prestador Específico -------- */

  createDirectQuoteRequest(input: {
    providerId: string;
    providerName: string;
    categorySlug: string;
    categoryName: string;
    title: string;
    description: string;
    district: string;
    address: string;
    referencePoint: string;
    urgency: RequestUrgency;
    scheduleSummary: string;
    photos: string[];
  }) {
    const reqId = `REQ-DIR-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullAddress = `${input.address} (Ref: ${input.referencePoint})`;

    const req: ServiceRequest = {
      id: reqId,
      categorySlug: input.categorySlug,
      categoryName: input.categoryName,
      title: input.title,
      description: input.description,
      district: input.district,
      address: fullAddress,
      reference: input.referencePoint,
      urgency: input.urgency,
      photos: input.photos.length,
      photosList: input.photos,
      status: "aberto",
      clientName: state.user?.name ?? "Cliente KONEKTA",
      createdAt: Date.now(),
      proposals: [],
      isDirect: true,
      directProviderId: input.providerId,
      directProviderName: input.providerName,
    };

    // Fica registado no histórico privado do cliente, sem ser publicado no mercado público
    set({ requests: [req, ...state.requests] });

    // Envia o cartão estruturado de pedido de orçamento para a conversa privada no chat
    const quoteReqData: QuoteRequestData = {
      id: reqId,
      providerId: input.providerId,
      providerName: input.providerName,
      title: input.title,
      description: input.description,
      district: input.district,
      address: input.address,
      referencePoint: input.referencePoint,
      urgency: input.urgency,
      schedule: input.scheduleSummary,
      photos: input.photos,
      createdAt: Date.now(),
      status: "enviado",
    };

    const prev = state.messages[input.providerId] ?? [];
    const clientMsg: Message = {
      id: `m_${Date.now()}`,
      from: "me",
      text: `📋 Pedido de Orçamento Direto: ${input.title}`,
      at: Date.now(),
      status: "sent",
      kind: "quote_request",
      quoteRequest: quoteReqData,
    };

    set({
      messages: {
        ...state.messages,
        [input.providerId]: [...prev, clientMsg],
      },
    });
    realtimeAudio.play("pop");

    notify({
      title: "Pedido de orçamento enviado",
      body: `Pedido privado enviado diretamente a ${input.providerName}.`,
      tone: "success",
      link: `/chat/${input.providerId}`,
    });

    // 1. Mensagem entregue
    setTimeout(() => {
      const cur = state.messages[input.providerId] ?? [];
      set({
        messages: {
          ...state.messages,
          [input.providerId]: cur.map((m) =>
            m.id === clientMsg.id ? { ...m, status: "delivered" } : m,
          ),
        },
      });
    }, 400);

    // 2. Prestador fica "A escrever..."
    setTimeout(() => {
      const cur = state.messages[input.providerId] ?? [];
      set({
        messages: {
          ...state.messages,
          [input.providerId]: cur.map((m) =>
            m.id === clientMsg.id ? { ...m, status: "read" as const } : m,
          ),
        },
      });
      realtimeBus.setTyping(input.providerId, true);
    }, 1000);

    // 3. Prestador responde no chat
    setTimeout(() => {
      realtimeBus.setTyping(input.providerId, false);
      const cur = state.messages[input.providerId] ?? [];
      const reply: Message = {
        id: `m_${Date.now() + 1}`,
        from: "them",
        text: `Olá! Recebi o seu pedido de orçamento com ${
          input.photos.length > 0 ? `as ${input.photos.length} foto(s) e ` : ""
        }a localização (${input.district}). Já estou a analisar os detalhes para lhe emitir a proposta oficial com o valor exato aqui pelo chat.`,
        at: Date.now(),
        status: "read",
      };
      set({
        messages: {
          ...state.messages,
          [input.providerId]: [...cur, reply],
        },
      });
      realtimeAudio.play("message");
    }, 2400);

    return req;
  },

  /* --------- Modelo GetNinjas: pedidos abertos + propostas de prestadores -------- */

  createRequest(input: {
    categorySlug: string;
    categoryName: string;
    title: string;
    description: string;
    district: string;
    address?: string;
    reference?: string;
    urgency: RequestUrgency;
    preferredDate?: string;
    preferredTime?: string;
    scheduleSummary?: string;
    budget?: number;
    materialStatus?: "tem_material" | "prestador_compra" | "avaliar";
    photos?: number;
    photosList?: string[];
  }) {
    const photosCount = input.photosList ? input.photosList.length : (input.photos ?? 0);
    const req: ServiceRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      categorySlug: input.categorySlug,
      categoryName: input.categoryName,
      title: input.title,
      description: input.description,
      district: input.district,
      address: input.address,
      reference: input.reference,
      urgency: input.urgency,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      scheduleSummary: input.scheduleSummary,
      budget: input.budget,
      materialStatus: input.materialStatus,
      photos: photosCount,
      photosList: input.photosList ?? [],
      status: "aberto",
      clientName: state.user?.name ?? "Cliente KONEKTA",
      createdAt: Date.now(),
      proposals: [],
    };
    set({ requests: [req, ...state.requests] });
    notify({
      title: "Pedido publicado",
      body: `${req.id} — os prestadores de ${req.categoryName} já podem enviar propostas.`,
      tone: "success",
      link: "/pedidos",
    });
    // Simula a chegada de propostas reais de prestadores da categoria.
    setTimeout(() => store.simulateProposals(req.id), 2500);
    return req;
  },

  simulateProposals(requestId: string) {
    const req = state.requests.find((r) => r.id === requestId);
    if (!req || req.status !== "aberto") return;
    const pool = seedProviderPool(req.categoryName);
    if (pool.length === 0) return;
    const base = req.budget ?? 800;
    const incoming: Proposal[] = pool.slice(0, 3).map((p, i) => ({
      id: `pr_${Date.now()}_${i}`,
      providerId: p.id,
      providerName: p.name,
      price: Math.max(150, Math.round((base * (0.85 + i * 0.12)) / 10) * 10),
      message:
        i === 0
          ? "Tenho disponibilidade imediata e faço orçamento sem compromisso."
          : "Trabalho com garantia e material incluído. Posso combinar o horário consigo.",
      availability: i === 0 ? "Hoje" : "Amanhã",
      at: Date.now() + i,
    }));
    set({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, proposals: [...r.proposals, ...incoming] } : r,
      ),
    });
    notify({
      title: "Novas propostas recebidas",
      body: `${incoming.length} prestadores responderam ao pedido ${requestId}.`,
      tone: "info",
      link: "/pedidos",
    });
  },

  sendProposal(requestId: string, input: { price: number; message: string; availability: string }) {
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return false;
    const proposal: Proposal = {
      id: `pr_${Date.now()}`,
      providerId: state.user?.id ?? "me",
      providerName: state.user?.name ?? "Prestador KONEKTA",
      price: input.price,
      message: input.message,
      availability: input.availability,
      at: Date.now(),
    };
    set({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, proposals: [...r.proposals, proposal] } : r,
      ),
    });
    notify({
      title: "Proposta enviada",
      body: `Enviou uma proposta de ${input.price} Db para ${req.title}.`,
      tone: "success",
      link: "/pro/oportunidades",
    });
    return true;
  },

  acceptProposal(requestId: string, proposalId: string) {
    const req = state.requests.find((r) => r.id === requestId);
    const proposal = req?.proposals.find((p) => p.id === proposalId);
    if (!req || !proposal) return null;
    set({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, status: "adjudicado", acceptedProposalId: proposalId } : r,
      ),
    });
    const order = store.createOrder({
      providerId: proposal.providerId,
      service: req.title,
      total: proposal.price,
      scheduledFor: proposal.availability,
      address: req.address,
      notes: req.description,
      paymentMethod: "carteira",
    });
    return order;
  },

  closeRequest(requestId: string) {
    set({
      requests: state.requests.map((r) => (r.id === requestId ? { ...r, status: "fechado" } : r)),
    });
  },

  markOnboarded() {
    set({ onboarded: true });
  },

  signIn(input: { phone: string; name?: string; email?: string; role?: UserRole }) {
    const user: User = {
      id: `u_${Date.now()}`,
      role: input.role ?? "cliente",
      name: input.name?.trim() || "Cliente KONEKTA",
      phone: input.phone.trim(),
      email: input.email?.trim(),
      createdAt: Date.now(),
    };
    set({ user });
    return user;
  },

  registerClient(data: Partial<User> & { phone: string; name: string }) {
    const user: User = {
      id: `u_${Date.now()}`,
      role: "cliente",
      name: data.name,
      phone: data.phone,
      email: data.email,
      avatar: data.avatar,
      birthDate: data.birthDate,
      gender: data.gender,
      district: data.district,
      city: data.city,
      address: data.address,
      createdAt: Date.now(),
    };
    set({ user, profiles: { cliente: true, prestador: false } });
    return user;
  },

  registerProvider(
    user: Partial<User> & { phone: string; name: string },
    profile: Omit<ProviderProfile, "status" | "submittedAt">,
  ) {
    const u: User = {
      id: `u_${Date.now()}`,
      role: "prestador",
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      birthDate: user.birthDate,
      district: profile.district,
      city: profile.city,
      createdAt: Date.now(),
    };
    const p: ProviderProfile = { ...profile, status: "em_analise", submittedAt: Date.now() };
    set({ user: u, providerProfile: p, profiles: { cliente: true, prestador: true } });
    return { user: u, profile: p };
  },

  /** Etapa 3 — ativa o perfil Prestador na MESMA conta (identidade única). */
  enableProviderProfile(profile: Omit<ProviderProfile, "status" | "submittedAt">) {
    if (!state.user) return null;
    const p: ProviderProfile = { ...profile, status: "em_analise", submittedAt: Date.now() };
    set({ providerProfile: p, profiles: { ...state.profiles, prestador: true } });
    notify({
      title: "Perfil de prestador enviado",
      body: "Os seus documentos estão em análise (24–48h).",
      tone: "info",
      link: "/perfil",
    });
    return p;
  },

  approveProviderProfile() {
    if (!state.providerProfile) return;
    set({ providerProfile: { ...state.providerProfile, status: "aprovado" } });
    notify({
      title: "Perfil de prestador aprovado",
      body: "Já pode receber pedidos no KONEKTA.",
      tone: "success",
      link: "/pro",
    });
  },

  /** Alterna entre perfis sem terminar sessão. */
  switchProfile(profile: ProfileKind) {
    if (!state.user) return false;
    if (!state.profiles[profile]) return false;
    if (profile === "prestador" && state.providerProfile?.status !== "aprovado") {
      // permitido entrar, mas em modo limitado (conta em análise)
    }
    set({ user: { ...state.user, role: profile } });
    return true;
  },

  updateUser(patch: Partial<User>) {
    if (!state.user) return;
    set({ user: { ...state.user, ...patch } });
  },

  updateProviderProfile(patch: Partial<ProviderProfile>) {
    if (!state.providerProfile) return;
    set({ providerProfile: { ...state.providerProfile, ...patch } });
  },

  addPortfolioItem(item: {
    title: string;
    image: string;
    description?: string;
    category?: string;
    date?: string;
  }) {
    const currentProfile = state.providerProfile || {
      category: "Serviços Gerais",
      yearsExperience: 3,
      bio: "Prestador de serviços na KONEKTA STP.",
      services: [{ name: "Serviço Padrão", price: 350 }],
      district: "Água Grande",
      city: "São Tomé",
      radiusKm: 15,
      documents: { selfieOk: true },
      status: "aprovado" as const,
      submittedAt: Date.now(),
      portfolio: [],
    };

    const newItem: PortfolioItem = {
      id: `port_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: item.title.trim() || "Serviço Realizado",
      image: item.image,
      description: item.description?.trim() || "",
      category: item.category?.trim() || currentProfile.category,
      date:
        item.date || new Date().toLocaleDateString("pt-PT", { month: "short", year: "numeric" }),
    };

    const updatedPortfolio = [newItem, ...(currentProfile.portfolio ?? [])];

    set({
      providerProfile: {
        ...currentProfile,
        portfolio: updatedPortfolio,
      },
    });

    notify({
      title: "Foto adicionada ao portfólio",
      body: `"${newItem.title}" agora faz parte da galeria do seu perfil.`,
      tone: "success",
      link: "/perfil",
    });

    return newItem;
  },

  removePortfolioItem(id: string) {
    if (!state.providerProfile) return;
    const current = state.providerProfile.portfolio ?? [];
    const filtered = current.filter((p) => p.id !== id);

    set({
      providerProfile: {
        ...state.providerProfile,
        portfolio: filtered,
      },
    });

    notify({
      title: "Foto removida",
      body: "O item foi retirado do seu portfólio.",
      tone: "info",
      link: "/perfil",
    });
  },

  updatePortfolioItem(id: string, patch: Partial<PortfolioItem>) {
    if (!state.providerProfile) return;
    const current = state.providerProfile.portfolio ?? [];
    const updated = current.map((p) => (p.id === id ? { ...p, ...patch } : p));

    set({
      providerProfile: {
        ...state.providerProfile,
        portfolio: updated,
      },
    });
  },

  switchRole(role: UserRole) {
    if (!state.user) return;
    set({ user: { ...state.user, role } });
  },

  signOut() {
    set({ user: null, providerProfile: null, profiles: { cliente: true, prestador: false } });
  },

  createOrder(input: {
    providerId: string;
    service: string;
    total: number;
    scheduledFor: string;
    address?: string;
    notes?: string;
    paymentMethod?: "carteira" | "dinheiro" | "mbway";
  }) {
    const id = `KNK-${Math.floor(1000 + Math.random() * 9000)}`;
    const payWithWallet = (input.paymentMethod ?? "carteira") === "carteira";
    const completionCode = Math.floor(1000 + Math.random() * 9000).toString();
    const order: Order = {
      id,
      providerId: input.providerId,
      service: input.service,
      scheduledFor: input.scheduledFor,
      status: "pendente" as OrderStatus,
      total: input.total,
      address: input.address,
      notes: input.notes,
      paymentMethod: input.paymentMethod ?? "carteira",
      createdAt: Date.now(),
      completionCode,
      clientName: state.user?.name,
    };
    set({
      orders: [order, ...state.orders],
      balance: payWithWallet ? Math.max(0, state.balance - input.total) : state.balance,
      transactions: payWithWallet
        ? [
            {
              id: `t_${Date.now()}`,
              kind: "out",
              label: `Reserva — ${input.service}`,
              amount: input.total,
              at: Date.now(),
            },
            ...state.transactions,
          ]
        : state.transactions,
    });
    notify({
      title: "Pedido criado",
      body: `${id} — ${input.service}. Aguarda confirmação do prestador. Código de validação gerado.`,
      tone: "success",
      link: "/pedidos",
    });
    return order;
  },

  updateOrder(id: string, patch: Partial<Order>) {
    set({ orders: state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  },

  startService(id: string) {
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;
    store.updateOrder(id, {
      status: "em-execucao",
      startedAt: Date.now(),
    });
    notify({
      title: "Serviço iniciado",
      body: `${order.id} — O profissional iniciou o serviço no local.`,
      tone: "primary",
      link: `/pedido/${order.id}`,
    });
    realtimeAudio.play("pop");
  },

  finishService(id: string) {
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;
    store.updateOrder(id, {
      status: "aguardando-codigo",
      finishedAt: Date.now(),
    });
    notify({
      title: "Trabalho terminado pelo prestador",
      body: `${order.id} — Serviço marcado como terminado. Solicite o código de 4 dígitos do cliente para libertar o pagamento.`,
      tone: "warning",
      link: `/pedido/${order.id}`,
    });
    realtimeAudio.play("pop");
  },

  verifyCompletionCode(id: string, codeInput: string): { success: boolean; error?: string } {
    const order = state.orders.find((o) => o.id === id);
    if (!order) return { success: false, error: "Pedido não encontrado." };

    const expected = (order.completionCode || "1234").trim();
    const provided = (codeInput || "").trim();

    if (provided !== expected) {
      notify({
        title: "Código de conclusão incorreto",
        body: "O código digitado não corresponde ao código do cliente. Por favor tente novamente.",
        tone: "warning",
      });
      return {
        success: false,
        error: "Código incorreto. Peça ao cliente o código de 4 dígitos exibido no ecrã dele.",
      };
    }

    const net = store.addEarning(`Serviço ${order.id} - ${order.service}`, order.total);
    store.updateOrder(id, {
      status: "concluido",
      completedAt: Date.now(),
    });

    notify({
      title: "Pagamento libertado com sucesso!",
      body: `Código validado! ${net} Db foram creditados na sua carteira KONEKTA.`,
      tone: "success",
      link: `/pedido/${order.id}`,
    });
    realtimeAudio.play("coin");
    return { success: true };
  },

  clientReleasePayment(id: string) {
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;
    const net = store.addEarning(`Serviço ${order.id} - ${order.service}`, order.total);
    store.updateOrder(id, {
      status: "concluido",
      completedAt: Date.now(),
    });
    notify({
      title: "Pagamento libertado com sucesso!",
      body: `Confirmou a conclusão de ${order.id}. ${net} Db foram creditados ao prestador.`,
      tone: "success",
      link: `/pedido/${order.id}`,
    });
    realtimeAudio.play("coin");
  },

  advanceOrder(id: string) {
    const flow: OrderStatus[] = [
      "pendente",
      "aceite",
      "a-caminho",
      "em-execucao",
      "aguardando-codigo",
      "concluido",
      "avaliado",
    ];
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;
    const currentIdx = flow.indexOf(order.status);
    const next = flow[Math.min(currentIdx + 1, flow.length - 1)];

    if (next === "em-execucao") {
      store.startService(id);
    } else if (next === "aguardando-codigo") {
      store.finishService(id);
    } else if (next === "concluido") {
      store.clientReleasePayment(id);
    } else {
      store.updateOrder(id, { status: next });
    }
  },

  cancelOrder(id: string) {
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;
    set({
      orders: state.orders.filter((o) => o.id !== id),
      balance: order.paymentMethod === "dinheiro" ? state.balance : state.balance + order.total,
      transactions:
        order.paymentMethod === "dinheiro"
          ? state.transactions
          : [
              {
                id: `t_${Date.now()}`,
                kind: "in",
                label: `Reembolso ${order.id}`,
                amount: order.total,
                at: Date.now(),
              },
              ...state.transactions,
            ],
    });
    notify({
      title: "Pedido cancelado",
      body: `${order.id} foi cancelado e reembolsado.`,
      tone: "warning",
      link: "/carteira",
    });
  },

  rateOrder(id: string, stars: number, comment?: string, tags?: string[], recommended?: boolean) {
    const order = state.orders.find((o) => o.id === id);
    store.updateOrder(id, {
      status: "avaliado",
      rating: { stars, comment, at: Date.now() },
    });

    if (order) {
      store.addReview({
        orderId: order.id,
        providerId: order.providerId,
        rating: stars,
        comment: comment || "",
        tags: tags || ["Serviço Concluído"],
        recommended: recommended ?? true,
        serviceName: order.service,
        district: order.address?.split(",")[0] || state.user?.district,
      });
    } else {
      notify({
        title: "Obrigado pela avaliação!",
        body: `Avaliou com ${stars} estrelas.`,
        tone: "success",
      });
      realtimeAudio.play("coin");
    }
  },

  addReview(input: {
    providerId: string;
    orderId?: string;
    rating: number;
    comment: string;
    tags?: string[];
    recommended?: boolean;
    serviceName?: string;
    district?: string;
    photos?: string[];
  }) {
    const reviewId = `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const clientName = state.user?.name?.trim() || "Cliente KONEKTA";
    const clientAvatar = state.user?.avatar;

    const newReview: ProviderReview = {
      id: reviewId,
      orderId: input.orderId,
      providerId: input.providerId,
      clientName,
      clientAvatar,
      rating: Math.max(1, Math.min(5, input.rating)),
      comment: input.comment.trim(),
      tags: input.tags ?? [],
      recommended: input.recommended ?? true,
      serviceName: input.serviceName,
      district: input.district || state.user?.district,
      createdAt: Date.now(),
      photos: input.photos ?? [],
    };

    // Atualiza o pedido se estiver vinculado
    if (input.orderId) {
      const order = state.orders.find((o) => o.id === input.orderId);
      if (order && order.status !== "avaliado") {
        store.updateOrder(input.orderId, {
          status: "avaliado",
          rating: { stars: input.rating, comment: input.comment, at: Date.now() },
        });
      }
    }

    set({
      reviews: [newReview, ...state.reviews],
    });

    realtimeAudio.play("coin");

    notify({
      title: "Avaliação publicada!",
      body: `A sua avaliação de ${newReview.rating} estrelas foi registada com sucesso.`,
      tone: "success",
      link: `/prestador/${input.providerId}`,
    });

    return newReview;
  },

  replyToReview(reviewId: string, replyText: string) {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    set({
      reviews: state.reviews.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              reply: {
                text: trimmed,
                at: Date.now(),
              },
            }
          : r,
      ),
    });
    notify({
      title: "Resposta publicada",
      body: "A sua resposta à avaliação do cliente foi enviada.",
      tone: "success",
    });
  },

  deleteReview(reviewId: string) {
    set({
      reviews: state.reviews.filter((r) => r.id !== reviewId),
    });
  },

  /** Chat blindado: bloqueia contactos externos antes do pagamento. */
  sendMessage(providerId: string, text: string): "sent" | "blocked" | "empty" {
    const trimmed = text.trim();
    if (!trimmed) return "empty";
    const prev = state.messages[providerId] ?? [];
    const unlocked = store.isContactUnlocked(providerId);

    if (!unlocked) {
      const analysis = analyzeBlockedContent(trimmed);
      if (analysis.blocked) {
        const warn: Message = {
          id: `m_${Date.now()}`,
          from: "me",
          text: analysis.reason ? `${analysis.reason}\n\n${BLOCK_NOTICE}` : BLOCK_NOTICE,
          at: Date.now(),
          status: "sent",
          kind: "system",
        };
        set({ messages: { ...state.messages, [providerId]: [...prev, warn] } });
        return "blocked";
      }
    }

    const msg: Message = {
      id: `m_${Date.now()}`,
      from: "me",
      text: trimmed,
      at: Date.now(),
      status: "sent",
    };
    set({ messages: { ...state.messages, [providerId]: [...prev, msg] } });
    realtimeAudio.play("pop");

    // 1. Mensagem entregue
    setTimeout(() => {
      const cur = state.messages[providerId] ?? [];
      set({
        messages: {
          ...state.messages,
          [providerId]: cur.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m)),
        },
      });
    }, 450);

    // 2. Interlocutor começa a digitar
    setTimeout(() => {
      const cur = state.messages[providerId] ?? [];
      set({
        messages: {
          ...state.messages,
          [providerId]: cur.map((m) => (m.id === msg.id ? { ...m, status: "read" as const } : m)),
        },
      });
      realtimeBus.setTyping(providerId, true);
    }, 1100);

    // 3. Resposta chega
    setTimeout(() => {
      realtimeBus.setTyping(providerId, false);
      const cur = state.messages[providerId] ?? [];
      const reply: Message = {
        id: `m_${Date.now() + 1}`,
        from: "them",
        text: "Recebido! Vou tratar disso e volto já com uma resposta.",
        at: Date.now(),
        status: "read",
      };
      set({
        messages: {
          ...state.messages,
          [providerId]: [...cur, reply],
        },
      });
      realtimeAudio.play("message");
    }, 2500);
    return "sent";
  },

  /** Envio de foto/diagnóstico à distância */
  sendPhotoMessage(providerId: string, photoUrl: string, caption?: string) {
    const prev = state.messages[providerId] ?? [];
    const msg: Message = {
      id: `m_photo_${Date.now()}`,
      from: "me",
      text: caption?.trim() || "Foto para diagnóstico à distância da avaria",
      at: Date.now(),
      status: "sent",
      kind: "photo",
      photos: [photoUrl],
    };
    set({ messages: { ...state.messages, [providerId]: [...prev, msg] } });
    realtimeAudio.play("pop");

    setTimeout(() => {
      const cur = state.messages[providerId] ?? [];
      set({
        messages: {
          ...state.messages,
          [providerId]: cur.map((m) => (m.id === msg.id ? { ...m, status: "read" as const } : m)),
        },
      });
      realtimeBus.setTyping(providerId, true);
    }, 900);

    setTimeout(() => {
      realtimeBus.setTyping(providerId, false);
      const cur = state.messages[providerId] ?? [];
      const reply: Message = {
        id: `m_${Date.now() + 1}`,
        from: "them",
        text: "Obrigado pela foto do diagnóstico! Já analisei a avaria e consigo preparar o orçamento exato ou indicar se é necessária visita técnica.",
        at: Date.now(),
        status: "read",
      };
      set({
        messages: {
          ...state.messages,
          [providerId]: [...cur, reply],
        },
      });
      realtimeAudio.play("message");
    }, 2400);

    return msg;
  },

  /* ------------------------- Orçamento + Escrow ------------------------- */

  /** O prestador envia o card de orçamento oficial no chat. */
  sendQuote(
    providerId: string,
    input: {
      net: number;
      description: string;
      from?: "me" | "them";
      billingModel?: BillingModel;
      unitPrice?: number;
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
      includedItems?: string[];
      excludedItems?: string[];
      warranty?: string;
      estimatedDuration?: string;
    },
  ) {
    const b = quoteFromNet(input.net, state.config.commissionPct);
    const quote: Quote = {
      id: `q_${Date.now()}`,
      providerId,
      description: input.description.trim() || "Serviço combinado no chat",
      net: b.net,
      fee: b.fee,
      gross: b.gross,
      feePct: b.feePct,
      status: "pendente",
      createdAt: Date.now(),
      billingModel: input.billingModel,
      unitPrice: input.unitPrice,
      unitLabel: input.unitLabel,
      quantity: input.quantity,
      minQuantity: input.minQuantity,
      displacementFee: input.displacementFee,
      materialsMode: input.materialsMode,
      materialsCost: input.materialsCost,
      materialsDescription: input.materialsDescription,
      extras: input.extras,
      urgencyFee: input.urgencyFee,
      urgencyReason: input.urgencyReason,
      milestones: input.milestones,
      packageName: input.packageName,
      recurrence: input.recurrence,
      includedItems: input.includedItems,
      excludedItems: input.excludedItems,
      warranty: input.warranty,
      estimatedDuration: input.estimatedDuration,
    };
    const prev = state.messages[providerId] ?? [];
    const msg: Message = {
      id: `m_${Date.now()}`,
      from: input.from ?? "them",
      text: quote.description,
      at: Date.now(),
      status: "read",
      kind: "quote",
      quote,
    };
    set({ messages: { ...state.messages, [providerId]: [...prev, msg] } });
    realtimeAudio.play("quote");
    notify({
      title: "Novo orçamento recebido",
      body: `${quote.gross.toLocaleString("pt-PT")} Db — ${quote.description}`,
      tone: "info",
      link: `/chat/${providerId}`,
    });
    return quote;
  },

  /** Liberta o valor de um marco/etapa concluída de um projeto para o prestador */
  releaseMilestone(providerId: string, quoteId: string, milestoneId: string) {
    const msg = (state.messages[providerId] ?? []).find((m) => m.quote?.id === quoteId);
    const quote = msg?.quote;
    if (!quote || !quote.milestones) return false;

    const milestone = quote.milestones.find((m) => m.id === milestoneId);
    if (!milestone || milestone.status === "libertado") return false;

    const updatedMilestones = quote.milestones.map((m) =>
      m.id === milestoneId ? { ...m, status: "libertado" as const, completedAt: Date.now() } : m,
    );

    const allReleased = updatedMilestones.every((m) => m.status === "libertado");

    set({
      providerBalance: state.providerBalance + milestone.amount,
      providerTransactions: [
        {
          id: `pt_m_${Date.now()}`,
          kind: "in",
          label: `Etapa Concluída: ${milestone.name} (${quote.description})`,
          amount: milestone.amount,
          at: Date.now(),
        },
        ...state.providerTransactions,
      ],
    });

    store.patchQuote(providerId, quoteId, {
      milestones: updatedMilestones,
      status: allReleased ? "concluido" : quote.status,
      completedAt: allReleased ? Date.now() : quote.completedAt,
    });

    notify({
      title: `Marco Libertado: ${milestone.name}`,
      body: `${milestone.amount.toLocaleString("pt-PT")} Db transferidos para a carteira do prestador.`,
      tone: "success",
      link: `/chat/${providerId}`,
    });

    return true;
  },

  patchQuote(providerId: string, quoteId: string, patch: Partial<Quote>) {
    const list = state.messages[providerId] ?? [];
    set({
      messages: {
        ...state.messages,
        [providerId]: list.map((m) =>
          m.quote?.id === quoteId ? { ...m, quote: { ...m.quote, ...patch } } : m,
        ),
      },
    });
  },

  /** Cliente paga: o valor fica retido (escrow) e o contacto é desbloqueado. */
  payQuote(providerId: string, quoteId: string) {
    const msg = (state.messages[providerId] ?? []).find((m) => m.quote?.id === quoteId);
    const quote = msg?.quote;
    if (!quote || quote.status !== "pendente") return false;
    if (state.balance < quote.gross) return false;
    set({
      balance: state.balance - quote.gross,
      transactions: [
        {
          id: `t_${Date.now()}`,
          kind: "out",
          label: `Retido (escrow) — ${quote.description}`,
          amount: quote.gross,
          at: Date.now(),
        },
        ...state.transactions,
      ],
    });
    store.patchQuote(providerId, quoteId, { status: "pago", paidAt: Date.now() });
    realtimeAudio.play("status");
    const list = state.messages[providerId] ?? [];
    set({
      messages: {
        ...state.messages,
        [providerId]: [
          ...list,
          {
            id: `m_${Date.now() + 2}`,
            from: "them",
            text: "Pagamento retido pela plataforma. Morada e telefone desbloqueados — contactos externos já são permitidos.",
            at: Date.now(),
            status: "read",
            kind: "system",
          },
        ],
      },
    });
    notify({
      title: "Pagamento retido com segurança",
      body: `${quote.gross.toLocaleString("pt-PT")} Db em escrow até confirmar a conclusão.`,
      tone: "success",
      link: "/carteira",
    });
    return true;
  },

  /** Cliente confirma conclusão: liberta o líquido para a carteira do prestador. */
  completeQuote(providerId: string, quoteId: string) {
    const msg = (state.messages[providerId] ?? []).find((m) => m.quote?.id === quoteId);
    const quote = msg?.quote;
    if (!quote || quote.status !== "pago") return false;
    store.patchQuote(providerId, quoteId, { status: "concluido", completedAt: Date.now() });
    set({
      providerBalance: state.providerBalance + quote.net,
      providerTransactions: [
        {
          id: `pt_${Date.now()}`,
          kind: "in",
          label: `Libertado do escrow — ${quote.description}`,
          amount: quote.net,
          at: Date.now(),
        },
        ...state.providerTransactions,
      ],
    });
    notify({
      title: "Serviço concluído",
      body: `${quote.net.toLocaleString("pt-PT")} Db libertados para o prestador (taxa ${quote.feePct}%).`,
      tone: "success",
      link: "/pro/ganhos",
    });
    return true;
  },

  declineQuote(providerId: string, quoteId: string) {
    store.patchQuote(providerId, quoteId, { status: "recusado" });
  },

  /** Contactos externos só depois do pagamento retido. */
  isContactUnlocked(providerId: string) {
    return (state.messages[providerId] ?? []).some(
      (m) => m.quote && (m.quote.status === "pago" || m.quote.status === "concluido"),
    );
  },

  sendAssistant(text: string, reply: string) {
    const t = text.trim();
    if (!t) return;
    const me: AssistantMessage = { id: `am_${Date.now()}`, from: "me", text: t, at: Date.now() };
    const ai: AssistantMessage = {
      id: `am_${Date.now() + 1}`,
      from: "ai",
      text: reply,
      at: Date.now() + 1,
    };
    set({ assistantMessages: [...state.assistantMessages, me, ai] });
  },

  clearAssistant() {
    set({ assistantMessages: [] });
  },

  toggleFavorite(providerId: string) {
    const has = state.favorites.includes(providerId);
    set({
      favorites: has
        ? state.favorites.filter((f) => f !== providerId)
        : [...state.favorites, providerId],
    });
  },

  topUp(amount: number) {
    if (amount <= 0) return;
    set({
      balance: state.balance + amount,
      transactions: [
        {
          id: `t_${Date.now()}`,
          kind: "in",
          label: "Carregamento de saldo",
          amount,
          at: Date.now(),
        },
        ...state.transactions,
      ],
    });
    notify({
      title: "Carteira carregada",
      body: `+${amount} Db adicionados à sua carteira.`,
      tone: "success",
      link: "/carteira",
    });
  },

  withdraw(amount: number) {
    if (amount <= 0 || amount > state.balance) return false;
    set({
      balance: state.balance - amount,
      transactions: [
        {
          id: `t_${Date.now()}`,
          kind: "out",
          label: "Levantamento para conta bancária",
          amount,
          at: Date.now(),
        },
        ...state.transactions,
      ],
    });
    return true;
  },

  markNotificationsRead() {
    set({ notifications: state.notifications.map((n) => ({ ...n, read: true })) });
  },

  clearNotifications() {
    set({ notifications: [] });
  },

  setFlag(key: keyof FeatureFlags, value: boolean) {
    set({ flags: { ...state.flags, [key]: value } });
  },

  updateSettings(patch: Partial<Settings>) {
    const isDark =
      patch.darkMode !== undefined
        ? patch.darkMode
        : patch.theme !== undefined
          ? patch.theme === "dark"
          : state.settings.darkMode || state.settings.theme === "dark";

    const normalizedTheme = isDark ? "dark" : "light";
    const nextSettings: Settings = {
      ...state.settings,
      ...patch,
      darkMode: isDark,
      theme: normalizedTheme,
    };

    set({ settings: nextSettings });

    if (typeof document !== "undefined") {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  },

  updateConfig(patch: Partial<PlatformConfig>) {
    set({ config: { ...state.config, ...patch } });
  },

  /* ------------------ Visita Técnica no Terreno (Uber-style) ------------------ */

  /** Proposta de visita técnica no terreno enviada pelo PROFISSIONAL ao cliente para melhor orçamentação.
   * O profissional solicita a visita presencial quando as fotos e informações não bastam para orçar com exatidão.
   */
  proposeTechnicalVisit(input: {
    providerId: string;
    providerName: string;
    serviceTitle: string;
    district: string;
    address?: string;
    scheduledDate: string;
    scheduledTime: string;
    visitFee?: number;
  }): { ok: boolean; message: string; visit?: TechnicalVisit } {
    const fee = input.visitFee || state.config.technicalVisitFee || 150;
    const visitId = `VIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVisit: TechnicalVisit = {
      id: visitId,
      providerId: input.providerId,
      providerName: input.providerName,
      clientId: state.user?.id || "usr-client",
      clientName: state.user?.name || "Cliente KONEKTA",
      clientPhone: state.user?.phone,
      serviceTitle: input.serviceTitle,
      district: input.district,
      address: input.address,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      visitFee: fee,
      status: "pendente",
      createdAt: Date.now(),
    };

    set({
      technicalVisits: [newVisit, ...state.technicalVisits],
    });

    const prevMsgs = state.messages[input.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_${Date.now()}`,
      from: "me",
      text: `🚗 Proposta de Visita Técnica no Terreno: Para avaliar com rigor as condições do local (${input.serviceTitle}) e elaborar um orçamento mais preciso, proponho uma visita presencial para ${input.scheduledDate} às ${input.scheduledTime}. Taxa de deslocação: ${fee} Db retida em custódia KONEKTA.`,
      at: Date.now(),
      status: "sent",
      kind: "system",
    };
    set({
      messages: {
        ...state.messages,
        [input.providerId]: [...prevMsgs, chatMsg],
      },
    });

    notify({
      title: "Proposta de Visita Enviada",
      body: `Aguardando confirmação do cliente para a visita técnica em ${input.district}.`,
      tone: "info",
      link: `/chat/${input.providerId}`,
    });

    return {
      ok: true,
      message: `Proposta de visita técnica enviada ao cliente com sucesso.`,
      visit: newVisit,
    };
  },

  /** O cliente aceita a proposta de visita técnica e retém a taxa de deslocação em custódia */
  clientAcceptTechnicalVisit(visitId: string): { ok: boolean; message: string } {
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };
    const fee = visit.visitFee || state.config.technicalVisitFee || 150;

    if (state.balance < fee) {
      return {
        ok: false,
        message: `Saldo insuficiente na sua carteira KONEKTA (${state.balance} Db). Recarregue no mínimo ${fee} Db para aceitar a deslocação do técnico.`,
      };
    }

    set({
      balance: state.balance - fee,
      transactions: [
        {
          id: `t_vis_${Date.now()}`,
          kind: "out",
          label: `Custódia: Deslocação Visita Técnica — ${visit.providerName}`,
          amount: fee,
          at: Date.now(),
        },
        ...state.transactions,
      ],
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId ? { ...v, status: "aceite" } : v,
      ),
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_acc_${Date.now()}`,
      from: "me",
      text: `✅ Visita técnica aceite pelo cliente! Taxa de deslocação (${fee} Db) retida em custódia segura KONEKTA. O técnico pode agora iniciar a deslocação no horário combinado.`,
      at: Date.now(),
      status: "sent",
      kind: "system",
    };
    set({
      messages: {
        ...state.messages,
        [visit.providerId]: [...prevMsgs, chatMsg],
      },
    });

    notify({
      title: "Visita Técnica Confirmada",
      body: `A taxa de ${fee} Db está retida em custódia. O prestador foi notificado.`,
      tone: "success",
      link: `/chat/${visit.providerId}`,
    });

    return {
      ok: true,
      message: `Visita técnica confirmada com garantia de deslocação (${fee} Db em custódia).`,
    };
  },

  /** Alias para manter compatibilidade */
  requestTechnicalVisit(input: {
    providerId: string;
    providerName: string;
    serviceTitle: string;
    district: string;
    address?: string;
    scheduledDate: string;
    scheduledTime: string;
  }): { ok: boolean; message: string; visit?: TechnicalVisit } {
    return store.proposeTechnicalVisit(input);
  },

  acceptTechnicalVisit(visitId: string) {
    return store.clientAcceptTechnicalVisit(visitId);
  },

  startTechnicalVisit(visitId: string) {
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return;

    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId ? { ...v, status: "a_caminho" } : v,
      ),
    });

    notify({
      title: "Técnico a Caminho",
      body: `${visit.providerName} está a deslocar-se para o seu local (${visit.district}).`,
      tone: "info",
      link: `/chat/${visit.providerId}`,
    });
  },

  completeTechnicalVisit(visitId: string, diagnosticReport: string, proposedQuote?: number) {
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return;

    // Transfere o valor da visita da custódia para a carteira do prestador
    const fee = visit.visitFee || 150;
    set({
      providerBalance: state.providerBalance + fee,
      providerTransactions: [
        {
          id: `pt_vis_${Date.now()}`,
          kind: "in",
          label: `Visita Técnica Concluída (${visit.serviceTitle})`,
          amount: fee,
          at: Date.now(),
        },
        ...state.providerTransactions,
      ],
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: "concluido",
              diagnosticReport: diagnosticReport.trim(),
              proposedQuote,
            }
          : v,
      ),
    });

    // Se tiver proposto orçamento, gera o quote oficial
    if (proposedQuote && proposedQuote > 0) {
      store.sendQuote(visit.providerId, {
        net: proposedQuote,
        description: `Orçamento Pós-Visita Técnica: ${diagnosticReport.slice(0, 80)}`,
        from: "them",
      });
    }

    notify({
      title: "Visita Técnica Concluída",
      body: `Relatório de diagnóstico registado. ${fee} Db creditados ao prestador.`,
      tone: "success",
      link: `/chat/${visit.providerId}`,
    });
  },

  /* ----------------- Modelos de Cobrança: Empresas & Prestadores ----------------- */

  subscribeCompanyPlan(months = 1): { ok: boolean; message: string } {
    const monthlyFee = state.config.companyMonthlyPlanFee || 1500;
    const total = monthlyFee * months;

    if (state.providerBalance >= total) {
      set({
        providerBalance: state.providerBalance - total,
        providerTransactions: [
          {
            id: `pt_plan_${Date.now()}`,
            kind: "out",
            label: `Subscrição Plano Empresa Pro (${months} mês/meses - 0% comissão)`,
            amount: total,
            at: Date.now(),
          },
          ...state.providerTransactions,
        ],
        companyMonetization: {
          model: "plano_mensal",
          planActive: true,
          planExpiresAt: Date.now() + months * 30 * 86400_000,
          monthlyFee,
        },
      });
      return {
        ok: true,
        message: `Plano Empresa Pro ativado com sucesso! Isenção de comissões ativada.`,
      };
    } else if (state.balance >= total) {
      set({
        balance: state.balance - total,
        transactions: [
          {
            id: `t_plan_${Date.now()}`,
            kind: "out",
            label: `Subscrição Plano Empresa Pro (${months} mês/meses)`,
            amount: total,
            at: Date.now(),
          },
          ...state.transactions,
        ],
        companyMonetization: {
          model: "plano_mensal",
          planActive: true,
          planExpiresAt: Date.now() + months * 30 * 86400_000,
          monthlyFee,
        },
      });
      return { ok: true, message: `Plano Empresa Pro ativado com sucesso!` };
    }

    return {
      ok: false,
      message: `Saldo insuficiente (${total} Db necessários). Recarregue a carteira para subscrever o Plano Empresa.`,
    };
  },

  switchMonetizationModel(model: "comissao" | "plano_mensal") {
    set({
      companyMonetization: {
        ...state.companyMonetization,
        model,
      },
    });
  },

  /** Ganhos do prestador — carteira independente da carteira de cliente. */
  addEarning(label: string, amount: number) {
    // Se a empresa tiver plano mensal ativo, comissão é 0% ou taxa reduzida
    const isPlanActive =
      state.companyMonetization.model === "plano_mensal" && state.companyMonetization.planActive;
    const effectiveCommission = isPlanActive
      ? state.config.companyCommissionPct
      : state.config.commissionPct;
    const commission = Math.round((amount * effectiveCommission) / 100);
    const net = amount - commission;
    set({
      providerBalance: state.providerBalance + net,
      providerTransactions: [
        { id: `pt_${Date.now()}`, kind: "in", label, amount: net, at: Date.now() },
        ...state.providerTransactions,
      ],
    });
    return net;
  },

  requestPayout(amount: number) {
    if (amount <= 0 || amount > state.providerBalance) return false;
    set({
      providerBalance: state.providerBalance - amount,
      providerTransactions: [
        {
          id: `pt_${Date.now()}`,
          kind: "out",
          label: "Levantamento solicitado",
          amount,
          at: Date.now(),
        },
        ...state.providerTransactions,
      ],
    });
    notify({
      title: "Levantamento solicitado",
      body: `${amount} Db serão transferidos em 1–2 dias úteis.`,
      tone: "info",
      link: "/pro/ganhos",
    });
    return true;
  },

  addCustomService(service: Omit<ProviderCustomService, "id">) {
    const current = state.providerProfile?.customServices || [];
    const newService: ProviderCustomService = {
      ...service,
      id: `srv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      isActive: service.isActive ?? true,
    };
    if (state.providerProfile) {
      set({
        providerProfile: {
          ...state.providerProfile,
          customServices: [newService, ...current],
        },
      });
    }
    notify({
      title: "Serviço Adicionado",
      body: `"${service.name}" foi publicado com sucesso no seu catálogo KONEKTA PRO.`,
      tone: "success",
      link: "/pro",
    });
    return newService;
  },

  updateCustomService(serviceId: string, patch: Partial<ProviderCustomService>) {
    if (!state.providerProfile?.customServices) return false;
    const updated = state.providerProfile.customServices.map((s) =>
      s.id === serviceId ? { ...s, ...patch } : s,
    );
    set({
      providerProfile: {
        ...state.providerProfile,
        customServices: updated,
      },
    });
    return true;
  },

  deleteCustomService(serviceId: string) {
    if (!state.providerProfile?.customServices) return false;
    const filtered = state.providerProfile.customServices.filter((s) => s.id !== serviceId);
    set({
      providerProfile: {
        ...state.providerProfile,
        customServices: filtered,
      },
    });
    notify({
      title: "Serviço Removido",
      body: "O serviço foi removido do seu catálogo.",
      tone: "info",
      link: "/pro",
    });
    return true;
  },

  /* ----------------- Pagamento Presencial / Em Mão & Blindagem de Comissões ----------------- */

  /**
   * Prestador declara quanto cobrou ao cliente em dinheiro/presencialmente após visita técnica ou serviço no terreno.
   */
  declareInPersonCashPayment(input: {
    providerId: string;
    providerName: string;
    clientId: string;
    clientName: string;
    visitId?: string;
    orderId?: string;
    serviceTitle: string;
    declaredAmount: number;
    notes?: string;
  }): { ok: boolean; message: string; declaration?: InPersonCashDeclaration } {
    if (!input.declaredAmount || input.declaredAmount <= 0) {
      return { ok: false, message: "Insira um valor válido recebido presencialmente." };
    }

    const commissionPct = state.config.commissionPct || 10;
    const commissionAmount = Math.round((input.declaredAmount * commissionPct) / 100);

    const declId = `DEC-${Date.now()}`;
    const decl: InPersonCashDeclaration = {
      id: declId,
      providerId: input.providerId,
      providerName: input.providerName,
      clientId: input.clientId,
      clientName: input.clientName,
      visitId: input.visitId,
      orderId: input.orderId,
      serviceTitle: input.serviceTitle,
      declaredAmount: input.declaredAmount,
      commissionPct,
      commissionAmount,
      status: "aguardando_confirmacao",
      declaredAt: Date.now(),
    };

    // Cria mensagem interativa no chat
    const prev = state.messages[input.providerId] ?? [];
    const declMsg: Message = {
      id: `m_dec_${Date.now()}`,
      from: "them",
      text: `💵 Declaração de Pagamento Presencial: ${input.declaredAmount} STN recebidos em dinheiro. Aguardando confirmação do cliente para validação e garantia.`,
      at: Date.now(),
      status: "sent",
      kind: "in_person_confirmation",
      inPersonDeclaration: decl,
    };

    // Se houver visita técnica associada, regista o valor
    let updatedVisits = state.technicalVisits;
    if (input.visitId) {
      updatedVisits = state.technicalVisits.map((v) =>
        v.id === input.visitId
          ? {
              ...v,
              declaredCashAmount: input.declaredAmount,
            }
          : v,
      );
    }

    set({
      inPersonDeclarations: [decl, ...state.inPersonDeclarations],
      technicalVisits: updatedVisits,
      messages: {
        ...state.messages,
        [input.providerId]: [...prev, declMsg],
      },
    });

    notify({
      title: "Confirmação de Pagamento em Dinheiro",
      body: `${input.providerName} declarou ter recebido ${input.declaredAmount} STN pelo serviço. Por favor confirme na app.`,
      tone: "warning",
      link: `/chat/${input.providerId}`,
    });

    return {
      ok: true,
      message: `Declaração de ${input.declaredAmount} STN enviada ao cliente para confirmação mútua.`,
      declaration: decl,
    };
  },

  /**
   * Cliente confirma ou retifica o valor pago em dinheiro presencialmente.
   * O sistema debita a comissão da carteira do prestador; se não tiver saldo, gera dívida.
   * Se a dívida atingir 500 STN, a conta do prestador é automaticamente bloqueada.
   */
  clientConfirmInPersonPayment(
    declarationId: string,
    action: {
      agreed: boolean;
      actualAmountPaid?: number;
      clientNotes?: string;
    },
  ): { ok: boolean; message: string } {
    const decl = state.inPersonDeclarations.find((d) => d.id === declarationId);
    if (!decl) {
      return { ok: false, message: "Declaração não encontrada." };
    }

    const finalAmount = action.agreed
      ? decl.declaredAmount
      : action.actualAmountPaid && action.actualAmountPaid > 0
        ? action.actualAmountPaid
        : decl.declaredAmount;

    const newStatus = action.agreed
      ? "confirmado_pelo_cliente"
      : action.actualAmountPaid && action.actualAmountPaid !== decl.declaredAmount
        ? "ajustado_pelo_cliente"
        : "recusado";

    // Cálculo da comissão da plataforma (ex: 10%)
    const commissionPct = decl.commissionPct || state.config.commissionPct || 10;
    const finalCommission = Math.round((finalAmount * commissionPct) / 100);

    // Ajuste da carteira e gestão de dívida
    let newBalance = state.providerBalance;
    let newDebt = state.providerDebt;

    if (newBalance >= finalCommission) {
      newBalance -= finalCommission;
    } else {
      const remainingUnpaid = finalCommission - newBalance;
      newBalance = 0;
      newDebt += remainingUnpaid;
    }

    const debtLimit = state.config.debtBlockLimit || 500;
    const isBlocked = newDebt >= debtLimit;

    // Atualiza declaração
    const updatedDeclarations = state.inPersonDeclarations.map((d) =>
      d.id === declarationId
        ? {
            ...d,
            status: newStatus as InPersonCashDeclaration["status"],
            actualAmountPaid: finalAmount,
            clientNotes: action.clientNotes,
            commissionAmount: finalCommission,
            confirmedAt: Date.now(),
          }
        : d,
    );

    // Atualiza mensagens no chat
    const prevMsgs = state.messages[decl.providerId] ?? [];
    const updatedMsgs = prevMsgs.map((m) =>
      m.inPersonDeclaration?.id === declarationId
        ? {
            ...m,
            inPersonDeclaration: {
              ...m.inPersonDeclaration,
              status: newStatus as InPersonCashDeclaration["status"],
              actualAmountPaid: finalAmount,
              commissionAmount: finalCommission,
              confirmedAt: Date.now(),
            },
          }
        : m,
    );

    // Se houver visita técnica associada, marca como concluída e confirmada
    let updatedVisits = state.technicalVisits;
    if (decl.visitId) {
      updatedVisits = state.technicalVisits.map((v) =>
        v.id === decl.visitId
          ? {
              ...v,
              status: "concluido" as const,
              cashConfirmedByClient: true,
              declaredCashAmount: finalAmount,
            }
          : v,
      );
    }

    const providerTx: Transaction = {
      id: `pt_comm_${Date.now()}`,
      kind: "out",
      label: `Comissão KONEKTA (${commissionPct}% sobre ${finalAmount} STN pago em mão)`,
      amount: finalCommission,
      at: Date.now(),
    };

    set({
      inPersonDeclarations: updatedDeclarations,
      providerBalance: newBalance,
      providerDebt: newDebt,
      isProviderBlockedForDebt: isBlocked,
      providerTransactions: [providerTx, ...state.providerTransactions],
      technicalVisits: updatedVisits,
      messages: {
        ...state.messages,
        [decl.providerId]: updatedMsgs,
      },
    });

    if (isBlocked) {
      notify({
        title: "⚠️ Conta de Prestador Suspensa por Dívida",
        body: `A sua dívida de comissões atingiu ${newDebt} STN (limite máximo de ${debtLimit} STN). Recarregue a sua carteira via transferência para voltar a receber pedidos.`,
        tone: "error",
        link: "/pro/ganhos",
      });
    } else {
      notify({
        title: "Pagamento Presencial Confirmado",
        body: `Valor de ${finalAmount} STN validado pelo cliente. Comissão de ${finalCommission} STN processada.`,
        tone: "success",
        link: `/chat/${decl.providerId}`,
      });
    }

    return {
      ok: true,
      message: action.agreed
        ? `Pagamento de ${finalAmount} STN confirmado. Comissão de ${finalCommission} STN liquidada com sucesso.`
        : `Valor ajustado para ${finalAmount} STN pelo cliente e comissão recalculada.`,
    };
  },

  /**
   * Recarga de carteira do prestador com liquidação prioritária de dívidas acumuladas.
   * Suporta transferências bancárias de STP (BISTP, BGFI, Afriland, Banco Internacional, Dobra 24).
   */
  topUpProviderWallet(
    amount: number,
    bankName = "BISTP",
    reference?: string,
  ): { ok: boolean; message: string } {
    if (!amount || amount <= 0) {
      return { ok: false, message: "Insira um montante válido para recarregar." };
    }

    let currentDebt = state.providerDebt;
    let debtLiquidated = 0;
    let remainingForBalance = amount;

    if (currentDebt > 0) {
      debtLiquidated = Math.min(amount, currentDebt);
      currentDebt -= debtLiquidated;
      remainingForBalance = amount - debtLiquidated;
    }

    const debtLimit = state.config.debtBlockLimit || 500;
    const isStillBlocked = currentDebt >= debtLimit;

    const newTransactions: Transaction[] = [];

    if (debtLiquidated > 0) {
      newTransactions.push({
        id: `pt_debt_liq_${Date.now()}`,
        kind: "out",
        label: `Liquidação de dívida de comissões (${bankName} ${reference ? `· Ref: ${reference}` : ""})`,
        amount: debtLiquidated,
        at: Date.now(),
      });
    }

    if (remainingForBalance > 0) {
      newTransactions.push({
        id: `pt_topup_${Date.now()}`,
        kind: "in",
        label: `Recarga de Carteira Prestador (${bankName} ${reference ? `· Ref: ${reference}` : ""})`,
        amount: remainingForBalance,
        at: Date.now() + 1,
      });
    }

    set({
      providerBalance: state.providerBalance + remainingForBalance,
      providerDebt: currentDebt,
      isProviderBlockedForDebt: isStillBlocked,
      providerTransactions: [...newTransactions, ...state.providerTransactions],
    });

    const msg =
      debtLiquidated > 0
        ? `Recarga de ${amount} STN processada! ${debtLiquidated} STN abateram na dívida pendente. ${remainingForBalance > 0 ? `${remainingForBalance} STN adicionados ao saldo.` : ""} Conta ${isStillBlocked ? "permanece em regularização" : "100% ativa e desbloqueada"}!`
        : `Recarga de ${amount} STN adicionada com sucesso à sua carteira KONEKTA PRO!`;

    notify({
      title: "Recarga KONEKTA PRO Confirmada",
      body: msg,
      tone: "success",
      link: "/pro/ganhos",
    });

    return { ok: true, message: msg };
  },

  /* ----------------- Gestão de Perfis de Empresa & Multi-Técnicos ----------------- */

  updateCompanyProfile(patch: Partial<CompanyProfile>) {
    const cur = state.companyProfile || seedCompanyProfile;
    set({
      companyProfile: {
        ...cur,
        ...patch,
      },
    });
    notify({
      title: "Perfil da Empresa Atualizado",
      body: "Os dados e definições da empresa foram guardados com sucesso.",
      tone: "success",
      link: "/pro/empresa",
    });
  },

  addCompanyTechnician(
    tech: Omit<CompanyTechnician, "id" | "assignedOrdersCount" | "totalEarnings" | "rating">,
  ) {
    const cur = state.companyProfile || seedCompanyProfile;
    const newTech: CompanyTechnician = {
      ...tech,
      id: `tech-${Date.now()}`,
      assignedOrdersCount: 0,
      totalEarnings: 0,
      rating: 5.0,
    };
    set({
      companyProfile: {
        ...cur,
        technicians: [newTech, ...cur.technicians],
      },
    });
    notify({
      title: "Técnico Adicionado à Equipa",
      body: `${tech.name} (${tech.specialty}) foi associado à conta da empresa.`,
      tone: "success",
      link: "/pro/empresa",
    });
    return newTech;
  },

  removeCompanyTechnician(id: string) {
    const cur = state.companyProfile || seedCompanyProfile;
    set({
      companyProfile: {
        ...cur,
        technicians: cur.technicians.filter((t) => t.id !== id),
      },
    });
    notify({
      title: "Técnico Removido",
      body: "O colaborador foi desvinculado da empresa.",
      tone: "info",
      link: "/pro/empresa",
    });
  },

  toggleCompanyTechnician(id: string) {
    const cur = state.companyProfile || seedCompanyProfile;
    set({
      companyProfile: {
        ...cur,
        technicians: cur.technicians.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
      },
    });
  },

  assignOrderToTechnician(orderId: string, technicianId: string) {
    const cur = state.companyProfile || seedCompanyProfile;
    const tech = cur.technicians.find((t) => t.id === technicianId);
    if (!tech) return false;

    set({
      companyProfile: {
        ...cur,
        technicians: cur.technicians.map((t) =>
          t.id === technicianId ? { ...t, assignedOrdersCount: t.assignedOrdersCount + 1 } : t,
        ),
      },
    });

    notify({
      title: "Serviço Atribuído ao Técnico",
      body: `O pedido ${orderId} foi delegado a ${tech.name}.`,
      tone: "success",
      link: "/pro/pedidos",
    });
    return true;
  },
};
