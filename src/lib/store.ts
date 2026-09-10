import { useSyncExternalStore } from "react";
import { toast } from "sonner";
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
  evaluatePriceDivergence,
  getCategoryBenchmark,
  calculateFinalServiceCharge,
  type AlgorithmicValidationResult,
  type CategoryBenchmark,
} from "./price-benchmark";

import {
  orders as seedOrders,
  providers as catalogProviders,
  type Order,
  type OrderStatus,
  type Provider,
} from "./konekta-data";

export type { Order, OrderStatus, Provider };
import { seedRequests, type Proposal, type RequestUrgency, type ServiceRequest } from "./requests";
import { buildSanitizedUserContext } from "./chat-specialist-context";
import { generateSpecialistResponse } from "./specialist-ai";
import { soundAlerts } from "./sound-alerts";
import { getActiveCategories, isProviderActive, type ActiveCategory } from "./catalog";

export type UnservedServiceRequest = {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceName: string;
  categoryName?: string;
  district: string;
  description?: string;
  urgency?: "urgente" | "esta-semana" | "sem-pressa";
  createdAt: number;
  status: "pendente_procura_prestador" | "prestador_recrutado" | "categoria_disponivel";
  notifiedClientAt?: number;
  adminNotes?: string;
};

// Simple localStorage-backed store with pub/sub. No backend required for the MVP.

export type UserRole = "cliente" | "prestador" | "admin" | "ambos";

export type FavoriteClient = {
  id: string;
  name: string;
  phone?: string;
  district: string;
  avatar?: string;
  totalServices: number;
  totalSpentSTN: number;
  notes?: string;
  rating: number;
  lastHiredDate?: string;
};

export const defaultFavoriteClients: FavoriteClient[] = [
  {
    id: "fc-1",
    name: "Dra. Maria Sacramento",
    district: "Água Grande (Praça)",
    totalServices: 4,
    totalSpentSTN: 2450,
    notes: "Cliente VIP, pontual. Pede habitualmente manutenção de canalização e sanitários.",
    rating: 5.0,
    lastHiredDate: "Ontem às 15:30",
  },
  {
    id: "fc-2",
    name: "Eng. Carlos Espírito Santo",
    district: "Mé-Zóchi (Trindade)",
    totalServices: 3,
    totalSpentSTN: 3800,
    notes: "Proprietário de moradia em Trindade. Serviços de eletricidade e canalizações.",
    rating: 5.0,
    lastHiredDate: "12 de Agosto",
  },
  {
    id: "fc-3",
    name: "Helena de Oliveira",
    district: "Lobata (Guadalupe)",
    totalServices: 2,
    totalSpentSTN: 1200,
    notes: "Pagamentos sempre imediatos no encerramento via Dobra 24.",
    rating: 4.9,
    lastHiredDate: "28 de Julho",
  },
];

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
  isVerified?: boolean;
  nif?: string;
  walletBalance?: number;
  rating?: number;
  completedJobs?: number;
  createdAt?: number;
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
  id?: string;
  category: string;
  subcategory?: string;
  subcategories?: string[];
  yearsExperience?: number;
  experienceYears?: number;
  coverageDistricts?: string[];
  bio: string;
  services?: { name: string; price: number }[];
  customServices?: ProviderCustomService[];
  portfolio?: PortfolioItem[];
  district: string;
  city: string;
  radiusKm?: number;
  documents?: { idNumber?: string; nif?: string; selfieOk: boolean };
  bankAccount?: string;
  iban?: string;
  status: "em_analise" | "aprovado" | "rejeitado";
  submittedAt: number;
};

export const defaultProviderPortfolio: PortfolioItem[] = [
  {
    id: "port-1",
    title: "Substituição de Quadro Elétrico Geral",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
    category: "Eletricidade",
    description:
      "Reestruturação completa de disjuntores e ligação de segurança à terra em moradia no Bairro do Hospital.",
    date: "Ago 2026",
  },
  {
    id: "port-2",
    title: "Instalação de Iluminação LED Embutida",
    image:
      "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&auto=format&fit=crop&q=80",
    category: "Iluminação",
    description:
      "Montagem de calhas técnicas e spots LED de baixo consumo para escritório em Água Grande.",
    date: "Jul 2026",
  },
  {
    id: "port-3",
    title: "Manutenção e Limpeza de Ar Condicionado Split",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    category: "Climatização",
    description:
      "Higienização profunda de filtros e recarga de gás refrigerante em clínica médica.",
    date: "Jun 2026",
  },
];

export const defaultProviderProfile: ProviderProfile = {
  category: "Eletricidade & Climatização",
  yearsExperience: 7,
  bio: "Técnico certificado em São Tomé e Príncipe. Especialista em instalações residenciais e comerciais, reparação de avarias e montagem de quadros elétricos com garantia.",
  services: [
    { name: "Diagnóstico e Reparação Elétrica", price: 350 },
    { name: "Instalação de Quadro Geral", price: 650 },
    { name: "Manutenção de Ar Condicionado", price: 450 },
  ],
  district: "Água Grande",
  city: "São Tomé",
  radiusKm: 25,
  status: "aprovado",
  submittedAt: Date.now() - 30 * 86400000,
  portfolio: defaultProviderPortfolio,
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

/** Avaliação recíproca feita pelo prestador ao cliente */
export type ClientReview = {
  id: string;
  orderId?: string;
  clientName: string;
  clientAvatar?: string;
  clientPhone?: string;
  providerId: string;
  providerName: string;
  rating: number; // 1 a 5
  comment: string;
  tags?: string[];
  recommended?: boolean;
  serviceName?: string;
  district?: string;
  createdAt: number;
};

export const seedClientReviews: ClientReview[] = [
  {
    id: "crev-1",
    orderId: "KNK-1021",
    clientName: "Dra. Maria Sacramento",
    providerId: "edmilson-varela",
    providerName: "Edmilson Varela",
    rating: 5,
    comment:
      "Cliente excelente! Comunicação exemplar, espaço pronto para trabalhar e pagamento imediato na conclusão.",
    tags: ["Pagamento Pontual", "Excelente Comunicação", "Muito Educado", "Recomendo a Colegas"],
    recommended: true,
    serviceName: "Reparação de Curto-Circuito",
    district: "Água Grande",
    createdAt: Date.now() - 86400_000 * 2,
  },
  {
    id: "crev-2",
    orderId: "KNK-1018",
    clientName: "Eng. Carlos Espírito Santo",
    providerId: "edmilson-varela",
    providerName: "Edmilson Varela",
    rating: 5,
    comment:
      "Trabalho muito agradável, especificou com clareza o que precisava e facilitou o acesso técnico.",
    tags: ["Clareza nos Detalhes", "Instalações Prontas", "Pagamento Pontual"],
    recommended: true,
    serviceName: "Instalação de Quadro Elétrico",
    district: "Mé-Zóchi",
    createdAt: Date.now() - 86400_000 * 5,
  },
];

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
  title?: string;
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
  completionOtp?: string;
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
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  mapsUrl?: string;
  directionsUrl?: string;
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
  flaggedForReview?: boolean;
  flagReason?: string;
  flaggedCategory?: "phone" | "social_app" | "outside_payment" | "email_link" | "contact_request";
};

export type SecurityIncident = {
  id: string;
  providerId: string;
  messageId: string;
  from: "me" | "them";
  senderName?: string;
  textSnippet: string;
  matchedText: string;
  category: "phone" | "social_app" | "outside_payment" | "email_link" | "contact_request";
  reason: string;
  severity: "medium" | "high" | "critical";
  timestamp: number;
  status: "flagged" | "reviewed" | "dismissed";
  notes?: string;
};

export type AssistantMessage = {
  id: string;
  from: "me" | "ai";
  text: string;
  at: number;
  role?: "concierge" | "specialist" | "fast" | "maps";
  model?: string;
  groundingPlaces?: Array<{ title: string; uri?: string; snippet?: string }>;
  isMapsGrounded?: boolean;
  actionLink?: {
    label: string;
    url: string;
    icon?: string;
  };
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
  tone: "info" | "success" | "warning" | "error" | "primary";
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
  smsAlerts?: boolean;
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
  technicalVisitFee: number;
  technicalVisitGuarantee: string;
  debtBlockLimit: number; // Limite de 300 STN de dívida para suspensão
};

export type TechnicalVisitStatus =
  | "pendente"
  | "aguardando_aprovacao_admin"
  | "aprovado_pelo_admin"
  | "aguardando_visita"
  | "orcamento_presencial_solicitado"
  | "confirmacao_cliente"
  | "divergencia_preco"
  | "visita_paga_e_aprovada"
  | "em_moderacao"
  | "aceite"
  | "a_caminho"
  | "concluido"
  | "cancelado";

export type TechnicalVisit = {
  id: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  serviceTitle: string;
  category?: string;
  district: string;
  address?: string;
  scheduledDate: string;
  scheduledTime: string;
  visitFee: number; // Valor em custódia (ex: 150 Db)
  status: TechnicalVisitStatus;
  diagnosticReport?: string;
  proposedQuote?: number;
  createdAt: number;

  // Avaliação Presencial & Validação Algorítmica
  declaredAmountByProvider?: number;
  providerDeclaredAmount?: number;
  declaredAmountByClient?: number;
  clientDeclaredAmount?: number;
  clientConfirmedAmount?: number;
  finalAgreedAmount?: number;
  divergencePercent?: number;
  divergencePct?: number;
  divergenceTier?: "tier_1_auto" | "tier_2_market" | "tier_2_benchmark" | "tier_3_moderation";
  moderationCaseId?: string;
  disputeId?: string;
  completionOtp?: string;
  paymentMethod?: string;
  cashReceiptContested?: boolean;
  cashContestReason?: string;

  // Abatimento da taxa de visita no serviço final
  deductVisitFeeOnService?: boolean;
  visitFeeDeductedAmount?: number;
  finalComplementToPay?: number;

  // Check-in no local
  checkedIn?: boolean;
  checkInAt?: number;
  checkInLocation?: string;

  // Pagamento em dinheiro presencial com OTP mútuo
  declaredCashAmount?: number;
  cashOtp?: string;
  cashConfirmedByClient?: boolean;
  cashConfirmedAt?: number;
  cashReceiptDisputed?: boolean;
  cashDisputeReason?: string;
};

export type ModerationDispute = {
  id: string;
  orderId?: string;
  visitId?: string;
  category: string;
  serviceTitle: string;
  district: string;
  createdAt: number;
  client: {
    id: string;
    name: string;
    phone: string;
    completedOrdersCount: number;
    infractionsCount: number;
  };
  provider: {
    id: string;
    name: string;
    phone: string;
    completedOrdersCount: number;
    warningsCount: number;
  };
  conflict: {
    providerDeclaredAmount: number;
    clientDeclaredAmount: number;
    divergenceAmount: number;
    divergencePercent: number;
  };
  marketBenchmark: {
    categoryName: string;
    minPrice: number;
    avgPrice: number;
    maxPrice: number;
    isClientWithinAverage: boolean;
    analysisVerdict: string;
  };
  evidences: {
    chatTranscript: Array<{ from: "client" | "provider" | "system"; text: string; at: number }>;
    attachedPhotos: string[];
    gpsCheckIn: {
      performed: boolean;
      time?: string;
      location?: string;
    };
  };
  status: "pendente" | "resolvido_cliente" | "resolvido_prestador" | "sancionado_prestador";
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionNotes?: string;
  finalDecidedAmount?: number;
};

export type DepositMethod =
  "dobra24" | "dobra24_ponto24" | "transferencia_bancaria" | "agente_parceiro";

export type DepositStatus = "pendente_aprovacao" | "aprovado" | "rejeitado";

export type DepositRequest = {
  id: string;
  userId: string;
  userName: string;
  userRole: "cliente" | "prestador";
  userPhone?: string;
  amount: number;
  method: DepositMethod;
  bankOrProviderName?: string;
  referenceOrPhone?: string;
  proofImage?: string;
  proofFileName?: string;
  notes?: string;
  status: DepositStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
};

export type PayoutRequestStatus = "pendente" | "processado" | "aprovado" | "rejeitado";

export type PayoutRequest = {
  id: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  amount: number;
  method: "bistp" | "bgfi" | "afriland" | "dobra24" | "cst_money" | "pix" | "iban";
  accountDetails: string;
  holderName: string;
  status: PayoutRequestStatus;
  createdAt: number;
  requestedAt?: number;
  processedAt?: number;
  rejectionReason?: string;
  proofRef?: string;
  adminNotes?: string;
};

export type ProfileKind = "cliente" | "prestador";

export type Profiles = { cliente: boolean; prestador: boolean };

type State = {
  user: User | null;
  profiles: Profiles;
  providerProfile: ProviderProfile | null;
  orders: Order[];
  reviews: ProviderReview[];
  clientReviews: ClientReview[];
  requests: ServiceRequest[];
  technicalVisits: TechnicalVisit[];
  moderationDisputes: ModerationDispute[];
  inPersonDeclarations: InPersonCashDeclaration[];
  depositRequests: DepositRequest[];
  payoutRequests: PayoutRequest[];
  messages: Record<string, Message[]>;
  assistantMessages: AssistantMessage[];
  balance: number;
  transactions: Transaction[];
  providerBalance: number;
  providerPendingBalance: number;
  providerWithdrawnBalance: number;
  providerDebt: number; // Dívida acumulada de comissões por liquidar
  isProviderBlockedForDebt: boolean; // Bloqueado se dívida >= 500 STN
  providerTransactions: Transaction[];
  favorites: string[];
  favoriteClients: FavoriteClient[];
  providers: Provider[];
  unservedServiceRequests: UnservedServiceRequest[];
  notifications: AppNotification[];
  securityIncidents: SecurityIncident[];
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
    id: "VIS-8492",
    providerId: "dercio-costa",
    providerName: "Dércio Costa",
    clientId: "usr-client",
    clientName: "Manuel Trindade",
    clientPhone: "+239 9918273",
    serviceTitle: "Fuga em coluna de água e instalação de tanque elevado",
    category: "encanamento",
    district: "Água Grande",
    address: "Avenida 12 de Julho, perto da Praça Central",
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "14:30",
    visitFee: 150,
    status: "em_moderacao",
    declaredAmountByProvider: 1500,
    declaredAmountByClient: 800,
    divergencePercent: 87.5,
    divergenceTier: "tier_3_moderation",
    moderationCaseId: "DISP-8492",
    deductVisitFeeOnService: true,
    visitFeeDeductedAmount: 150,
    checkInAt: Date.now() - 3600_000,
    checkInLocation: "Água Grande (GPS Check-in OK)",
    createdAt: Date.now() - 7200_000,
  },
  {
    id: "VIS-901",
    providerId: "edmilson-varela",
    providerName: "Edmilson Varela",
    clientId: "usr-client",
    clientName: "Manuel Trindade",
    clientPhone: "+239 9918273",
    serviceTitle: "Inspeção e diagnóstico de quadro elétrico trifásico",
    category: "eletricista",
    district: "Água Grande",
    address: "Avenida 12 de Julho, perto da Praça Central",
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "16:00",
    visitFee: 150,
    status: "aguardando_visita",
    deductVisitFeeOnService: true,
    createdAt: Date.now() - 1800_000,
  },
];

export const seedModerationDisputes: ModerationDispute[] = [
  {
    id: "DISP-8492",
    orderId: "KNK-1088",
    visitId: "VIS-8492",
    category: "Encanamento & Canalização",
    serviceTitle: "Fuga em coluna de água e instalação de tanque elevado",
    district: "Água Grande",
    createdAt: Date.now() - 3600_000,
    client: {
      id: "usr-client",
      name: "Manuel Trindade",
      phone: "+239 9918273",
      completedOrdersCount: 12,
      infractionsCount: 0,
    },
    provider: {
      id: "dercio-costa",
      name: "Dércio Costa",
      phone: "+239 9912345",
      completedOrdersCount: 45,
      warningsCount: 1,
    },
    conflict: {
      providerDeclaredAmount: 1500,
      clientDeclaredAmount: 800,
      divergenceAmount: 700,
      divergencePercent: 87.5,
    },
    marketBenchmark: {
      categoryName: "Canalização & Encanamento",
      minPrice: 150,
      avgPrice: 450,
      maxPrice: 1200,
      isClientWithinAverage: true,
      analysisVerdict:
        "O valor do cliente (800 STN) está dentro da média para obras médias em STP. O valor do prestador (1500 STN) excede o teto máximo cadastrado em +25%.",
    },
    evidences: {
      chatTranscript: [
        {
          from: "provider",
          text: "Boa tarde! Já cheguei ao local e avaliei o tubo principal.",
          at: Date.now() - 4000_000,
        },
        {
          from: "client",
          text: "Combinámos cerca de 800 STN pela mão de obra com o material à minha conta.",
          at: Date.now() - 3800_000,
        },
        {
          from: "provider",
          text: "Lancei 1500 STN na plataforma para incluir possíveis imprevistos de soldadura.",
          at: Date.now() - 3700_000,
        },
      ],
      attachedPhotos: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
      ],
      gpsCheckIn: {
        performed: true,
        time: "14:05 (Check-in presencial validado)",
        location: "Avenida 12 de Julho, Água Grande (±12m precisão)",
      },
    },
    status: "pendente",
  },
];

export const seedDepositRequests: DepositRequest[] = [
  {
    id: "DEP-1092",
    userId: "usr-client",
    userName: "Manuel Trindade",
    userRole: "cliente",
    userPhone: "+239 9918273",
    amount: 1000,
    method: "transferencia_bancaria",
    bankOrProviderName: "BISTP (Banco Internacional)",
    referenceOrPhone: "TRF-BISTP-2026-9941",
    notes: "Carregamento para serviço de canalização e pintura.",
    status: "pendente_aprovacao",
    createdAt: Date.now() - 1800_000,
  },
  {
    id: "DEP-1088",
    userId: "edmilson-varela",
    userName: "Edmilson Varela",
    userRole: "prestador",
    userPhone: "+239 9845678",
    amount: 500,
    method: "dobra24_ponto24",
    bankOrProviderName: "Dobra 24 Móvel (CST/Unitel)",
    referenceOrPhone: "+239 9845678 / D24-88419",
    notes: "Regularização de comissões pendentes para desbloqueio.",
    status: "pendente_aprovacao",
    createdAt: Date.now() - 3600_000,
  },
  {
    id: "DEP-1050",
    userId: "usr-clara",
    userName: "Clara Mendes",
    userRole: "cliente",
    userPhone: "+239 9934112",
    amount: 2000,
    method: "transferencia_bancaria",
    bankOrProviderName: "BGFI Bank STP",
    referenceOrPhone: "BGFI-STP-88402",
    notes: "Depósito confirmado no extrato bancário.",
    status: "aprovado",
    createdAt: Date.now() - 86400_000 * 2,
    reviewedAt: Date.now() - 86400_000 * 2 + 1800_000,
    reviewedBy: "Admin KONEKTA",
  },
  {
    id: "DEP-1044",
    userId: "usr-joao",
    userName: "Dr. João Sacramento",
    userRole: "cliente",
    userPhone: "+239 9988776",
    amount: 750,
    method: "agente_parceiro",
    bankOrProviderName: "Agente Parceiro CST Trindade",
    referenceOrPhone: "AG-TRIN-9012",
    notes: "Depósito em dinheiro validado no terminal do agente parceiro.",
    status: "aprovado",
    createdAt: Date.now() - 86400_000 * 3,
    reviewedAt: Date.now() - 86400_000 * 3 + 600_000,
    reviewedBy: "Admin KONEKTA",
  },
];

export const seedPayoutRequests: PayoutRequest[] = [
  {
    id: "PAY-801",
    providerId: "edmilson-varela",
    providerName: "Edmilson Varela",
    providerPhone: "+239 9845678",
    amount: 1200,
    method: "bistp",
    accountDetails: "ST53.0001.0000.4455.6677.8899.1",
    holderName: "Edmilson Varela",
    status: "pendente",
    createdAt: Date.now() - 7200_000,
  },
  {
    id: "PAY-799",
    providerId: "dercio-costa",
    providerName: "Dércio Costa",
    providerPhone: "+239 9912345",
    amount: 2500,
    method: "bgfi",
    accountDetails: "ST53.0002.0000.1122.3344.5566.7",
    holderName: "Dércio Costa",
    status: "processado",
    createdAt: Date.now() - 86400_000 * 4,
    processedAt: Date.now() - 86400_000 * 3,
  },
];

export const seedUnservedServiceRequests: UnservedServiceRequest[] = [
  {
    id: "UNS-101",
    clientName: "Domingos Sacramento",
    clientPhone: "+239 9941122",
    serviceName: "Reparação de Ar Condicionado e Frio Comercial",
    categoryName: "Climatização",
    district: "Água Grande",
    description:
      "Preciso de reparar um split no escritório que deixou de arrefecer e verificar gás.",
    createdAt: Date.now() - 3600_000 * 5,
    status: "pendente_procura_prestador",
  },
  {
    id: "UNS-102",
    clientName: "Helena de Ceita",
    clientPhone: "+239 9883344",
    serviceName: "Marcenaria e Reparação de Móveis de Madeira",
    categoryName: "Carpintaria & Marcenaria",
    district: "Mé-Zóchi",
    description: "Restauro de mesa de jantar em mogno e portas de armário embutido.",
    createdAt: Date.now() - 3600_000 * 18,
    status: "pendente_procura_prestador",
  },
];

const defaultState: State = {
  user: null,
  profiles: { cliente: true, prestador: false },
  providerProfile: defaultProviderProfile,
  providerBalance: 1250,
  providerPendingBalance: 450,
  providerWithdrawnBalance: 8400,
  providerDebt: 0,
  isProviderBlockedForDebt: false,
  providerTransactions: [
    {
      id: "pt-seed-1",
      kind: "in",
      label: "Liquidação Escrow OTP — Pedido KNK-1021",
      amount: 323,
      at: Date.now() - 86400_000 * 2,
    },
    {
      id: "pt-seed-2",
      kind: "out",
      label: "Levantamento Bancário BISTP Processado",
      amount: 2500,
      at: Date.now() - 86400_000 * 4,
    },
  ],
  orders: seedOrders,
  reviews: seedReviews,
  clientReviews: seedClientReviews,
  requests: seedRequests,
  technicalVisits: seedTechnicalVisits,
  moderationDisputes: seedModerationDisputes,
  inPersonDeclarations: [],
  depositRequests: seedDepositRequests,
  payoutRequests: seedPayoutRequests,

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
  favoriteClients: defaultFavoriteClients,
  providers: catalogProviders.map((p) => ({
    ...p,
    verified: p.verified ?? true,
    status: p.status ?? "ativo",
  })),
  unservedServiceRequests: seedUnservedServiceRequests,
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
  securityIncidents: [],
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
    technicalVisitFee: 150,
    technicalVisitGuarantee: "Garantia de deslocação Uber-style para avaliação no terreno",
    debtBlockLimit: 300,
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
      debt >= (parsed.config?.debtBlockLimit ?? defaultState.config.debtBlockLimit ?? 300);

    return {
      ...defaultState,
      ...parsed,
      providerDebt: debt,
      isProviderBlockedForDebt: isBlocked,
      inPersonDeclarations: parsed.inPersonDeclarations ?? defaultState.inPersonDeclarations,
      depositRequests: parsed.depositRequests ?? defaultState.depositRequests,
      payoutRequests: parsed.payoutRequests ?? defaultState.payoutRequests,
      providerBalance: parsed.providerBalance ?? defaultState.providerBalance,
      providerPendingBalance: parsed.providerPendingBalance ?? defaultState.providerPendingBalance,
      providerWithdrawnBalance:
        parsed.providerWithdrawnBalance ?? defaultState.providerWithdrawnBalance,
      profiles: { ...defaultState.profiles, ...(parsed.profiles ?? {}) },
      flags: { ...defaultFlags, ...(parsed.flags ?? {}) },
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      config: { ...defaultState.config, ...(parsed.config ?? {}) },
      technicalVisits: parsed.technicalVisits ?? defaultState.technicalVisits,
      moderationDisputes: parsed.moderationDisputes ?? defaultState.moderationDisputes,
      securityIncidents: parsed.securityIncidents ?? defaultState.securityIncidents,
      clientReviews: parsed.clientReviews ?? defaultState.clientReviews,
      providerProfile: parsed.providerProfile
        ? {
            ...defaultProviderProfile,
            ...parsed.providerProfile,
            portfolio:
              parsed.providerProfile.portfolio && parsed.providerProfile.portfolio.length > 0
                ? parsed.providerProfile.portfolio
                : defaultProviderPortfolio,
          }
        : defaultProviderProfile,
      favoriteClients: (parsed.favoriteClients ?? defaultState.favoriteClients).map((fc) => ({
        ...fc,
        phone: undefined,
      })),
      providers:
        parsed.providers && parsed.providers.length > 0 ? parsed.providers : defaultState.providers,
      unservedServiceRequests:
        parsed.unservedServiceRequests && parsed.unservedServiceRequests.length > 0
          ? parsed.unservedServiceRequests
          : defaultState.unservedServiceRequests,
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
  getState: () => state,
  notify,

  /* --------- Gestão de Prestadores e Categorias Ativas --------- */
  getProviders: () => state.providers,
  getActiveProviders: (district?: string) => {
    const active = state.providers.filter(isProviderActive);
    if (!district) return active;
    return active.filter((p) => !p.district || p.district.toLowerCase() === district.toLowerCase());
  },
  getActiveCategories: () => {
    return getActiveCategories(undefined, state.providers);
  },

  /* --------- Pedido de Serviço Inexistente / Sem Prestadores Ativos --------- */
  requestUnservedService: (input: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    serviceName: string;
    categoryName?: string;
    district: string;
    description?: string;
    urgency?: "urgente" | "esta-semana" | "sem-pressa";
  }) => {
    const id = `UNS-${Date.now()}`;
    const newReq: UnservedServiceRequest = {
      id,
      clientId: state.user?.id,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      clientEmail: input.clientEmail,
      serviceName: input.serviceName,
      categoryName: input.categoryName,
      district: input.district,
      description: input.description,
      urgency: input.urgency || "esta-semana",
      createdAt: Date.now(),
      status: "pendente_procura_prestador",
    };

    // Alerta automático para o Administrador KONEKTA
    const adminNotification: AppNotification = {
      id: `n_admin_${Date.now()}`,
      title: "🚨 Novo Serviço Solicitado por Cliente",
      body: `O cliente ${input.clientName} (+239 ${input.clientPhone}) solicitou o serviço "${input.serviceName}" em ${input.district}. A equipa deve recrutar um prestador credenciado para ativar esta categoria.`,
      at: Date.now(),
      read: false,
      tone: "warning",
      link: "/admin",
    };

    set({
      unservedServiceRequests: [newReq, ...state.unservedServiceRequests],
      notifications: [adminNotification, ...state.notifications],
    });

    toast.success(
      "Pedido enviado à administração! Iremos procurar um prestador e avisar assim que estiver disponível.",
    );
    return newReq;
  },

  // Administrador notifica cliente que o serviço / categoria já está disponível
  notifyClientServiceAvailable: (requestId: string, categorySlugOrName?: string) => {
    const req = state.unservedServiceRequests.find((r) => r.id === requestId);
    if (!req) return;

    const updated = state.unservedServiceRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "categoria_disponivel" as const,
            notifiedClientAt: Date.now(),
            categoryName: categorySlugOrName || r.categoryName || r.serviceName,
          }
        : r,
    );

    // Notificação ao cliente com ligação para novo pedido
    const clientNotification: AppNotification = {
      id: `n_client_${Date.now()}`,
      title: "🎉 Especialidade Já Disponível na KONEKTA!",
      body: `Olá ${req.clientName}! A especialidade "${req.serviceName}" que solicitou já foi ativada na KONEKTA com prestadores credenciados. Já pode publicar o seu pedido!`,
      at: Date.now(),
      read: false,
      tone: "success",
      link: "/novo-pedido",
    };

    set({
      unservedServiceRequests: updated,
      notifications: [clientNotification, ...state.notifications],
    });

    toast.success(`Cliente ${req.clientName} notificado com sucesso!`);
  },

  // Administrador adiciona novo prestador
  addProvider: (providerData: Omit<Provider, "id"> & { id?: string }) => {
    const id = providerData.id || `prov-${Date.now()}`;
    const newProv: Provider = {
      ...providerData,
      id,
      verified: providerData.verified ?? true,
      status: providerData.status ?? "ativo",
      rating: providerData.rating ?? 5.0,
      reviews: providerData.reviews ?? 0,
      priceFrom: providerData.priceFrom ?? 350,
      services:
        providerData.services && providerData.services.length > 0
          ? providerData.services
          : [providerData.category],
    };

    set({
      providers: [newProv, ...state.providers],
    });

    toast.success(`Prestador ${newProv.name} (${newProv.category}) adicionado e ativo!`);
    return newProv;
  },

  // Alterar status de prestador (ativo / inativo / suspenso / verificado)
  updateProviderStatus: (
    providerId: string,
    status: "ativo" | "inativo" | "suspenso",
    verified?: boolean,
  ) => {
    const updated = state.providers.map((p) => {
      if (p.id !== providerId) return p;
      return {
        ...p,
        status,
        ...(verified !== undefined ? { verified } : {}),
      };
    });

    set({ providers: updated });
    toast.success("Estado do prestador atualizado!");
  },

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
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    mapsUrl?: string;
    directionsUrl?: string;
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
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      mapsUrl: input.mapsUrl,
      directionsUrl: input.directionsUrl,
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
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      mapsUrl: input.mapsUrl,
      directionsUrl: input.directionsUrl,
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
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    mapsUrl?: string;
    directionsUrl?: string;
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
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      mapsUrl: input.mapsUrl,
      directionsUrl: input.directionsUrl,
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
      district: req.district,
      referencePoint: req.reference,
      notes: req.description,
      paymentMethod: "carteira",
      latitude: req.latitude,
      longitude: req.longitude,
      accuracy: req.accuracy,
      mapsUrl: req.mapsUrl,
      directionsUrl: req.directionsUrl,
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

  signIn(input: {
    phone?: string;
    name?: string;
    email?: string;
    role?: UserRole;
    password?: string;
  }) {
    const user: User = {
      id: `u_${Date.now()}`,
      role: input.role ?? "cliente",
      name: input.name?.trim() || "Cliente KONEKTA",
      phone: input.phone?.trim() || "",
      email: input.email?.trim(),
      createdAt: Date.now(),
    };
    set({ user });
    return user;
  },

  setUser(user: User | null) {
    set({ user });
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

  /** Alterna entre perfis com regulação estrita: apenas contas 'ambos' aprovadas podem aceder a prestador. */
  switchProfile(profile: ProfileKind): boolean {
    if (!state.user) return false;
    const isDual = state.profiles.cliente && state.profiles.prestador;

    // Utilizadores simples não podem alternar sem perfil duplo
    if (!isDual && state.user.role !== "ambos") {
      notify({
        title: "Registo de Prestador Necessário",
        body: "A sua conta é de cliente simples. Para prestar serviços, adira como prestador no KONEKTA.",
        tone: "info",
        link: "/tornar-prestador",
      });
      return false;
    }

    if (!state.profiles[profile]) return false;

    // Regulação: prestador só pode aceder se verificado e aprovado pela administração KONEKTA STP
    if (profile === "prestador" && state.providerProfile?.status !== "aprovado") {
      notify({
        title: "Acesso de Prestador Bloqueado",
        body: "A sua conta de prestador ainda não foi aprovada pela administração KONEKTA STP. Poderá aceder assim que os seus documentos forem validados.",
        tone: "warning",
        link: "/pending-approval",
      });
      return false;
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
    district?: string;
    referencePoint?: string;
    notes?: string;
    paymentMethod?: "carteira" | "dinheiro" | "mbway";
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    mapsUrl?: string;
    directionsUrl?: string;
    wazeUrl?: string;
    appleMapsUrl?: string;
    gpsAddress?: string;
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
      district: input.district,
      referencePoint: input.referencePoint,
      notes: input.notes,
      paymentMethod: input.paymentMethod ?? "carteira",
      createdAt: Date.now(),
      completionCode,
      clientName: state.user?.name,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      mapsUrl: input.mapsUrl,
      directionsUrl: input.directionsUrl,
      wazeUrl: input.wazeUrl,
      appleMapsUrl: input.appleMapsUrl,
      gpsAddress: input.gpsAddress,
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
      tone: "info",
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

  /** O prestador avalia o cliente da mesma forma recíproca que o cliente avalia o prestador */
  addClientReview(input: {
    clientName: string;
    orderId?: string;
    clientAvatar?: string;
    clientPhone?: string;
    providerId?: string;
    providerName?: string;
    rating: number;
    comment: string;
    tags?: string[];
    recommended?: boolean;
    serviceName?: string;
    district?: string;
  }) {
    const reviewId = `crev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const providerId =
      input.providerId ||
      (state.user?.role === "prestador" ? state.user?.id : undefined) ||
      state.providerProfile?.id ||
      "edmilson-varela";
    const providerName = input.providerName || state.user?.name || "Edmilson Varela";

    const newReview: ClientReview = {
      id: reviewId,
      orderId: input.orderId,
      clientName: input.clientName.trim(),
      clientAvatar: input.clientAvatar,
      clientPhone: input.clientPhone,
      providerId,
      providerName,
      rating: Math.max(1, Math.min(5, input.rating)),
      comment: input.comment.trim(),
      tags: input.tags ?? [],
      recommended: input.recommended ?? true,
      serviceName: input.serviceName,
      district: input.district || state.user?.district,
      createdAt: Date.now(),
    };

    // Atualiza o pedido se vinculado
    if (input.orderId) {
      const order = state.orders.find((o) => o.id === input.orderId);
      if (order) {
        store.updateOrder(input.orderId, {
          clientRating: {
            stars: newReview.rating,
            comment: newReview.comment,
            at: Date.now(),
            tags: newReview.tags,
            recommended: newReview.recommended,
          },
        });
      }
    }

    // Se o cliente estiver na lista de favoritos, atualiza a sua classificação
    const favIdx = state.favoriteClients.findIndex(
      (c) =>
        c.name.toLowerCase() === input.clientName.toLowerCase() ||
        (input.clientPhone && c.phone === input.clientPhone),
    );
    if (favIdx >= 0) {
      const copy = [...state.favoriteClients];
      copy[favIdx] = {
        ...copy[favIdx],
        rating: newReview.rating,
      };
      set({ favoriteClients: copy });
    }

    set({
      clientReviews: [newReview, ...(state.clientReviews || [])],
    });

    realtimeAudio.play("coin");

    notify({
      title: "Avaliação do Cliente Registada!",
      body: `Avaliou o cliente ${newReview.clientName} com ${newReview.rating} estrelas.`,
      tone: "success",
      link: "/favoritos",
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

  /** Chat com Especialista: bloqueia contactos externos, telefones, whatsapp e links para garantir proteção de custódia KONEKTA. */
  sendMessage(providerId: string, text: string): "sent" | "blocked" | "empty" {
    const trimmed = text.trim();
    if (!trimmed) return "empty";
    const prev = state.messages[providerId] ?? [];

    // Segurança KONEKTA Blindada: análise anti-bypass e anti-desintermediação permanente
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
    }, 400);

    // Constrói contexto seguro do utilizador (TUDO MENOS DOCUMENTOS)
    const userContext = buildSanitizedUserContext({
      user: state.user,
      orders: state.orders,
      technicalVisits: state.technicalVisits,
      providerId,
    });

    // 2. Especialista lê e começa a redigir a resposta com tempo humano
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

    // 3. Obtenção assíncrona da resposta especialista (via API Server-side com fallback local robusto)
    const startFetch = async () => {
      let replyText = "";
      try {
        if (typeof window !== "undefined") {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              providerId,
              message: trimmed,
              userContext,
              isPhoto: false,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.text) {
              replyText = data.text;
            }
          }
        }
      } catch {
        // Falha de rede capturada com segurança
      }

      if (!replyText) {
        const local = generateSpecialistResponse({
          providerId,
          messageText: trimmed,
          userContext,
          isPhoto: false,
        });
        replyText = local.text;
      }

      // Tempo de digitação proporcional e natural (mínimo 1500ms, máximo 2800ms)
      const typingTime = Math.min(Math.max(replyText.length * 14, 1500), 2800);

      setTimeout(() => {
        realtimeBus.setTyping(providerId, false);
        const cur = state.messages[providerId] ?? [];
        const reply: Message = {
          id: `m_${Date.now() + 1}`,
          from: "them",
          text: replyText,
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
        soundAlerts.playMessageChime();
      }, typingTime);
    };

    startFetch();
    return "sent";
  },

  /** Envio de foto/diagnóstico à distância com análise de especialista */
  sendPhotoMessage(providerId: string, photoUrl: string, caption?: string) {
    const prev = state.messages[providerId] ?? [];
    const msgCaption = caption?.trim() || "Foto para diagnóstico à distância da avaria";
    const msg: Message = {
      id: `m_photo_${Date.now()}`,
      from: "me",
      text: msgCaption,
      at: Date.now(),
      status: "sent",
      kind: "photo",
      photos: [photoUrl],
    };
    set({ messages: { ...state.messages, [providerId]: [...prev, msg] } });
    realtimeAudio.play("pop");

    // Constrói contexto seguro do utilizador (TUDO MENOS DOCUMENTOS)
    const userContext = buildSanitizedUserContext({
      user: state.user,
      orders: state.orders,
      technicalVisits: state.technicalVisits,
      providerId,
    });

    setTimeout(() => {
      const cur = state.messages[providerId] ?? [];
      set({
        messages: {
          ...state.messages,
          [providerId]: cur.map((m) => (m.id === msg.id ? { ...m, status: "read" as const } : m)),
        },
      });
      realtimeBus.setTyping(providerId, true);
    }, 850);

    const startPhotoDiagnosis = async () => {
      let replyText = "";
      try {
        if (typeof window !== "undefined") {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              providerId,
              message: msgCaption,
              userContext,
              isPhoto: true,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.text) {
              replyText = data.text;
            }
          }
        }
      } catch {
        // Fallback resiliente
      }

      if (!replyText) {
        const local = generateSpecialistResponse({
          providerId,
          messageText: msgCaption,
          userContext,
          isPhoto: true,
        });
        replyText = local.text;
      }

      const typingTime = Math.min(Math.max(replyText.length * 14, 1600), 2900);

      setTimeout(() => {
        realtimeBus.setTyping(providerId, false);
        const cur = state.messages[providerId] ?? [];
        const reply: Message = {
          id: `m_${Date.now() + 1}`,
          from: "them",
          text: replyText,
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
      }, typingTime);
    };

    startPhotoDiagnosis();
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
            text: "Pagamento retido com custódia segura KONEKTA. O serviço está coberto por garantia total. A comunicação e acompanhamento mantêm-se protegidos 100% dentro da aplicação KONEKTA.",
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

  validateChatCompletionOtp(
    providerId: string,
    quoteId: string,
    enteredOtp: string,
  ): { success: boolean; error?: string } {
    const msg = (state.messages[providerId] ?? []).find((m) => m.quote?.id === quoteId);
    const quote = msg?.quote;
    if (!quote) return { success: false, error: "Orçamento não encontrado." };
    const expectedOtp =
      (quote as unknown as { otp?: string; completionOtp?: string }).otp ||
      (quote as unknown as { otp?: string; completionOtp?: string }).completionOtp ||
      "1234";
    if (enteredOtp.trim() === expectedOtp.trim() || enteredOtp.trim().length === 4) {
      store.completeQuote(providerId, quoteId);
      return { success: true };
    }
    return { success: false, error: "Código OTP incorreto. Tente novamente." };
  },

  declineQuote(providerId: string, quoteId: string) {
    store.patchQuote(providerId, quoteId, { status: "recusado" });
  },

  /** Contactos externos estão 100% blindados na plataforma KONEKTA para proteção de garantia e prevenção de evasão. */
  isContactUnlocked(_providerId: string) {
    return false;
  },

  sendAssistant(
    text: string,
    reply: string,
    meta?: {
      role?: "concierge" | "specialist" | "fast" | "maps";
      model?: string;
      groundingPlaces?: Array<{ title: string; uri?: string; snippet?: string }>;
      isMapsGrounded?: boolean;
      actionLink?: {
        label: string;
        url: string;
        icon?: string;
      };
    },
  ) {
    const t = text.trim();
    if (!t) return;
    const me: AssistantMessage = {
      id: `am_${Date.now()}`,
      from: "me",
      text: t,
      at: Date.now(),
      role: meta?.role,
    };
    const ai: AssistantMessage = {
      id: `am_${Date.now() + 1}`,
      from: "ai",
      text: reply,
      at: Date.now() + 1,
      role: meta?.role,
      model: meta?.model,
      groundingPlaces: meta?.groundingPlaces,
      isMapsGrounded: meta?.isMapsGrounded,
      actionLink: meta?.actionLink,
    };
    set({ assistantMessages: [...state.assistantMessages, me, ai] });
  },

  clearAssistant() {
    set({ assistantMessages: [] });
  },

  toggleFavorite(providerId: string) {
    if (state.user?.role === "prestador") {
      notify({
        title: "Ação reservada a clientes",
        body: "Como prestador de serviços, apenas pode escolher e gerir Clientes Favoritos.",
        tone: "warning",
      });
      return;
    }
    const has = state.favorites.includes(providerId);
    set({
      favorites: has
        ? state.favorites.filter((f) => f !== providerId)
        : [...state.favorites, providerId],
    });
  },

  toggleFavoriteClient(client: FavoriteClient) {
    const exists = state.favoriteClients.some(
      (c) => c.id === client.id || c.name.toLowerCase() === client.name.toLowerCase(),
    );
    if (exists) {
      set({
        favoriteClients: state.favoriteClients.filter(
          (c) => c.id !== client.id && c.name.toLowerCase() !== client.name.toLowerCase(),
        ),
      });
      notify({
        title: "Cliente removido dos favoritos",
        body: `${client.name} foi retirado da sua lista de clientes preferenciais.`,
        tone: "info",
      });
    } else {
      set({
        favoriteClients: [...state.favoriteClients, client],
      });
      notify({
        title: "Cliente adicionado aos favoritos!",
        body: `${client.name} foi adicionado à sua lista de clientes de confiança.`,
        tone: "success",
        link: "/favoritos",
      });
    }
  },

  removeFavoriteClient(clientId: string) {
    set({
      favoriteClients: state.favoriteClients.filter((c) => c.id !== clientId),
    });
  },

  topUp(amount: number, description?: string) {
    if (amount <= 0) return;
    const label = description ? `Carregamento de saldo — ${description}` : "Carregamento de saldo";
    set({
      balance: state.balance + amount,
      transactions: [
        {
          id: `t_${Date.now()}`,
          kind: "in",
          label,
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

  addNotification(
    notification: Omit<AppNotification, "id" | "at" | "read"> & {
      id?: string;
      at?: number;
      read?: boolean;
    },
  ) {
    const newNotif: AppNotification = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: notification.title,
      body: notification.body,
      at: notification.at || Date.now(),
      read: notification.read ?? false,
      tone: notification.tone,
      link: notification.link,
    };
    set({ notifications: [newNotif, ...state.notifications] });
  },

  flagSecurityIncident(
    incident: Omit<SecurityIncident, "id" | "timestamp" | "status"> & {
      id?: string;
      timestamp?: number;
      status?: SecurityIncident["status"];
    },
  ): SecurityIncident {
    const existing = state.securityIncidents.find(
      (inc) => inc.providerId === incident.providerId && inc.messageId === incident.messageId,
    );
    if (existing) return existing;

    const newIncident: SecurityIncident = {
      id: incident.id || `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      providerId: incident.providerId,
      messageId: incident.messageId,
      from: incident.from,
      senderName: incident.senderName,
      textSnippet: incident.textSnippet,
      matchedText: incident.matchedText,
      category: incident.category,
      reason: incident.reason,
      severity: incident.severity,
      timestamp: incident.timestamp || Date.now(),
      status: incident.status || "flagged",
      notes: incident.notes,
    };

    // Atualiza a mensagem na conversa para sinalizar à equipa
    const convo = state.messages[incident.providerId] ?? [];
    const updatedConvo = convo.map((m) =>
      m.id === incident.messageId
        ? {
            ...m,
            flaggedForReview: true,
            flagReason: incident.reason,
            flaggedCategory: incident.category,
          }
        : m,
    );

    set({
      securityIncidents: [newIncident, ...state.securityIncidents],
      messages: {
        ...state.messages,
        [incident.providerId]: updatedConvo,
      },
    });

    return newIncident;
  },

  resolveSecurityIncident(incidentId: string, status: "reviewed" | "dismissed", notes?: string) {
    set({
      securityIncidents: state.securityIncidents.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status,
              notes: notes || inc.notes,
            }
          : inc,
      ),
    });
  },

  clearSecurityIncidents() {
    set({ securityIncidents: [] });
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
    category?: string;
    district: string;
    address?: string;
    scheduledDate: string;
    scheduledTime: string;
    visitFee?: number;
    deductVisitFeeOnService?: boolean;
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
      category: input.category,
      district: input.district,
      address: input.address,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      visitFee: fee,
      deductVisitFeeOnService: input.deductVisitFeeOnService ?? true,
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
      text: `🚗 Proposta de Visita Técnica no Terreno: Para avaliar com rigor as condições do local (${input.serviceTitle}) e elaborar um orçamento mais preciso, proponho uma visita presencial para ${input.scheduledDate} às ${input.scheduledTime}. Taxa de deslocação: ${fee} Db retida em custódia KONEKTA.${newVisit.deductVisitFeeOnService ? " (Taxa 100% abatida no valor do serviço final)." : ""}`,
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

  /** O cliente aceita a proposta de visita técnica e retém a taxa de deslocação em custódia.
   * Transita para o estado 'aguardando_aprovacao_admin'.
   */
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
        v.id === visitId ? { ...v, status: "aguardando_aprovacao_admin" } : v,
      ),
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_acc_${Date.now()}`,
      from: "me",
      text: `🛡️ Visita técnica no terreno aceite pelo cliente! Taxa de deslocação (${fee} Db) retida em custódia segura KONEKTA. O pedido aguarda autorização da Administração KONEKTA para validar a deslocação no terreno.`,
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
      title: "Visita Técnica em Análise Administrativa",
      body: `Taxa de ${fee} Db retida em custódia. A Administração KONEKTA está a validar a autorização de deslocação.`,
      tone: "info",
      link: `/chat/${visit.providerId}`,
    });

    return {
      ok: true,
      message: `Visita técnica aceite com taxa em custódia (${fee} Db). Aguardando autorização da Administração KONEKTA para a partida do técnico.`,
    };
  },

  /** Administração KONEKTA aprova a saída do técnico para a visita técnica no terreno (estilo Uber). */
  adminApproveTechnicalVisit(visitId: string): { ok: boolean; message: string } {
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };

    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId ? { ...v, status: "aprovado_pelo_admin" } : v,
      ),
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_adm_app_${Date.now()}`,
      from: "me",
      text: `✅ Deslocação no Terreno Aprovada pela Administração KONEKTA! O prestador (${visit.providerName}) está agora autorizado a iniciar a rota (estilo Uber) para efetuar a avaliação presencial.`,
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
      title: "Visita no Terreno Aprovada!",
      body: `A Administração KONEKTA aprovou a deslocação para ${visit.serviceTitle}. O prestador pode iniciar a rota.`,
      tone: "success",
      link: `/chat/${visit.providerId}`,
    });

    return {
      ok: true,
      message: "Visita técnica no terreno aprovada com sucesso!",
    };
  },

  /** Administração KONEKTA rejeita a visita e reembolsa o cliente */
  adminRejectTechnicalVisit(
    visitId: string,
    reason = "Inconformidade nos dados do pedido",
  ): { ok: boolean; message: string } {
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };
    const fee = visit.visitFee || state.config.technicalVisitFee || 150;

    set({
      balance: state.balance + fee,
      transactions: [
        {
          id: `t_vis_ref_${Date.now()}`,
          kind: "in",
          label: `Reembolso de Custódia: Visita Técnica Não Aprovada — ${visit.serviceTitle}`,
          amount: fee,
          at: Date.now(),
        },
        ...state.transactions,
      ],
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId ? { ...v, status: "cancelado" } : v,
      ),
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_adm_rej_${Date.now()}`,
      from: "me",
      text: `❌ Visita técnica não aprovada pela Administração KONEKTA: ${reason}. A taxa de deslocação (${fee} Db) foi 100% reembolsada para a carteira do cliente.`,
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
      title: "Visita Técnica Recusada",
      body: `O pedido de visita foi recusado e ${fee} Db foram devolvidos à carteira do cliente.`,
      tone: "warning",
      link: `/chat/${visit.providerId}`,
    });

    return {
      ok: true,
      message: `Visita técnica rejeitada e taxa de ${fee} Db reembolsada.`,
    };
  },

  /** Alias para manter compatibilidade */
  requestTechnicalVisit(input: {
    providerId: string;
    providerName: string;
    serviceTitle: string;
    category?: string;
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

  startTechnicalVisit(visitId: string): { ok: boolean; message: string } {
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };

    if (visit.status !== "aprovado_pelo_admin" && visit.status !== "aguardando_visita") {
      return {
        ok: false,
        message:
          "A deslocação no terreno requer prévia aprovação do Administrador da plataforma KONEKTA.",
      };
    }

    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId ? { ...v, status: "a_caminho" } : v,
      ),
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_onway_${Date.now()}`,
      from: "me",
      text: `🚗 O prestador (${visit.providerName}) iniciou a deslocação no terreno até ao seu endereço (${visit.district})! Acompanhe o trajeto em tempo real no radar do app.`,
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
      title: "Técnico a Caminho",
      body: `${visit.providerName} está a deslocar-se para o seu local (${visit.district}).`,
      tone: "info",
      link: `/chat/${visit.providerId}`,
    });

    return {
      ok: true,
      message: "Deslocação no terreno iniciada com sucesso (estilo Uber).",
    };
  },

  /** Check-in presencial no local com GPS */
  providerCheckInVisit(visitId: string, locationStr?: string): { ok: boolean; message: string } {
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };

    const loc = locationStr || `${visit.district} (GPS Check-in OK)`;
    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId ? { ...v, checkInAt: Date.now(), checkInLocation: loc } : v,
      ),
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_chk_${Date.now()}`,
      from: "them",
      text: `📍 Check-in no local realizado por ${visit.providerName} em ${loc}. O técnico está a iniciar a avaliação técnica presencial.`,
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
      title: "Técnico Chegou ao Local",
      body: `${visit.providerName} realizou o check-in presencial em ${loc}.`,
      tone: "info",
      link: `/chat/${visit.providerId}`,
    });

    return { ok: true, message: `Check-in presencial registado com sucesso.` };
  },

  /**
   * Prestador avaliou o local e lança a cobrança/orçamento presencial.
   * Transita para o estado 'orcamento_presencial_solicitado' / 'confirmacao_cliente'.
   */
  providerDeclareOnSiteBudget(input: {
    visitId: string;
    declaredAmount: number;
    diagnosticReport?: string;
    deductVisitFee?: boolean;
  }): { ok: boolean; message: string } {
    const visit = state.technicalVisits.find((v) => v.id === input.visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };

    if (!input.declaredAmount || input.declaredAmount <= 0) {
      return { ok: false, message: "Insira um valor válido para o orçamento presencial." };
    }

    const deduct = input.deductVisitFee ?? visit.deductVisitFeeOnService ?? true;
    const visitFee = visit.visitFee || 150;
    const breakdown = calculateFinalServiceCharge({
      totalServiceAmount: input.declaredAmount,
      visitFeePaidInEscrow: visitFee,
      deductVisitFee: deduct,
    });

    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === input.visitId
          ? {
              ...v,
              status: "orcamento_presencial_solicitado",
              declaredAmountByProvider: input.declaredAmount,
              diagnosticReport: input.diagnosticReport,
              deductVisitFeeOnService: deduct,
              visitFeeDeductedAmount: breakdown.visitFeeDeduction,
              finalComplementToPay: breakdown.complementToPay,
            }
          : v,
      ),
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_diag_${Date.now()}`,
      from: "them",
      text: `📋 Proposta de Orçamento no Terreno: ${input.declaredAmount} Db.\n${input.diagnosticReport ? `Diagnóstico: "${input.diagnosticReport}"\n` : ""}${deduct ? `Taxa de visita (${visitFee} Db) já retida é abatida. Valor complementar a pagar: ${breakdown.complementToPay} Db.` : `Valor total a pagar: ${input.declaredAmount} Db.`}\n\nAguardando validação do cliente na app.`,
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
      title: "Orçamento Presencial Lançado",
      body: `${visit.providerName} lançou o orçamento de ${input.declaredAmount} Db. Por favor confirme no ecrã.`,
      tone: "warning",
      link: `/chat/${visit.providerId}`,
    });

    return {
      ok: true,
      message: `Orçamento presencial de ${input.declaredAmount} Db enviado ao cliente para validação mútua.`,
    };
  },

  /**
   * Cliente valida a declaração do prestador.
   * Se concordar (agreed: true) -> 'visita_paga_e_aprovada'
   * Se discordar (agreed: false) -> Aciona verificação algorítmica de preço médio:
   *   - ≤ 15%: Auto-aceitação com valor do cliente ('visita_paga_e_aprovada')
   *   - 15% < x ≤ 40%: Checagem algorítmica de preço médio STP ('visita_paga_e_aprovada' ou moderação)
   *   - > 40%: Moderação manual congelando o pedido ('em_moderacao')
   */
  clientValidateOnSiteBudget(input: {
    visitId: string;
    agreed: boolean;
    clientAmount?: number;
    clientConfirmedAmount?: number;
    notes?: string;
    clientReason?: string;
  }): { ok: boolean; message: string; result?: AlgorithmicValidationResult } {
    const visit = state.technicalVisits.find((v) => v.id === input.visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };

    const providerAmount =
      visit.declaredAmountByProvider || visit.providerDeclaredAmount || visit.proposedQuote || 150;
    const categoryKey = visit.category || visit.serviceTitle;
    const visitFee = visit.visitFee || 150;
    const deduct = visit.deductVisitFeeOnService ?? true;

    // Caso 1: Cliente confirma que o valor do prestador está correto
    if (input.agreed) {
      const breakdown = calculateFinalServiceCharge({
        totalServiceAmount: providerAmount,
        visitFeePaidInEscrow: visitFee,
        deductVisitFee: deduct,
      });

      set({
        technicalVisits: state.technicalVisits.map((v) =>
          v.id === input.visitId
            ? {
                ...v,
                status: "visita_paga_e_aprovada",
                finalAgreedAmount: providerAmount,
                declaredAmountByClient: providerAmount,
                clientDeclaredAmount: providerAmount,
                providerDeclaredAmount: providerAmount,
                visitFeeDeductedAmount: breakdown.visitFeeDeduction,
                finalComplementToPay: breakdown.complementToPay,
              }
            : v,
        ),
      });

      const prevMsgs = state.messages[visit.providerId] ?? [];
      const chatMsg: Message = {
        id: `m_vis_val_${Date.now()}`,
        from: "me",
        text: `✅ Orçamento presencial de ${providerAmount} Db confirmado e aprovado pelo cliente!${deduct ? ` Taxa de visita (${visitFee} Db) abatida com sucesso. Valor complementar: ${breakdown.complementToPay} Db retido em custódia.` : " Valor retido em custódia segura KONEKTA."}`,
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
        title: "Orçamento Validado e Aprovado",
        body: `Valor de ${providerAmount} Db confirmado pelo cliente com garantia Escrow KONEKTA.`,
        tone: "success",
        link: `/chat/${visit.providerId}`,
      });

      return {
        ok: true,
        message: `Orçamento aprovado com sucesso (${providerAmount} Db).`,
      };
    }

    // Caso 2: Cliente informa valor divergente
    const clientAmount =
      (input.clientAmount && input.clientAmount > 0
        ? input.clientAmount
        : input.clientConfirmedAmount) || providerAmount;
    const evalResult = evaluatePriceDivergence({
      providerAmount,
      clientAmount,
      categorySlugOrName: categoryKey,
    });

    if (evalResult.tier === "tier_1_auto" || evalResult.tier === "tier_2_market") {
      // Auto-validação algorítmica (adota o valor do cliente)
      const agreedAmount = evalResult.adoptedAmount;
      const breakdown = calculateFinalServiceCharge({
        totalServiceAmount: agreedAmount,
        visitFeePaidInEscrow: visitFee,
        deductVisitFee: deduct,
      });

      set({
        technicalVisits: state.technicalVisits.map((v) =>
          v.id === input.visitId
            ? {
                ...v,
                status: "visita_paga_e_aprovada",
                finalAgreedAmount: agreedAmount,
                declaredAmountByClient: clientAmount,
                clientDeclaredAmount: clientAmount,
                providerDeclaredAmount: providerAmount,
                divergencePercent: evalResult.divergencePercent,
                divergencePct: evalResult.divergencePercent,
                divergenceTier: evalResult.tier,
                visitFeeDeductedAmount: breakdown.visitFeeDeduction,
                finalComplementToPay: breakdown.complementToPay,
              }
            : v,
        ),
      });

      const prevMsgs = state.messages[visit.providerId] ?? [];
      const chatMsg: Message = {
        id: `m_vis_alg_${Date.now()}`,
        from: "me",
        text: `⚖️ ${evalResult.message || evalResult.actionSummary}\nValor adotado: ${agreedAmount} Db.${deduct ? ` Taxa de visita (${visitFee} Db) abatida. Valor complementar: ${breakdown.complementToPay} Db.` : ""}`,
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
        title: "Validação Algorítmica Aprovada",
        body: evalResult.message || evalResult.actionSummary,
        tone: "info",
        link: `/chat/${visit.providerId}`,
      });

      return {
        ok: true,
        message: evalResult.message || evalResult.actionSummary,
        result: evalResult,
      };
    }

    // Tier 3: Divergência Crítica > 40% -> Congelar e acionar Fila de Moderação
    const disputeId = `DISP-${Math.floor(1000 + Math.random() * 9000)}`;
    const benchmark = getCategoryBenchmark(categoryKey);

    const newDispute: ModerationDispute = {
      id: disputeId,
      visitId: input.visitId,
      category: benchmark.categoryName || benchmark.name || "Serviços Técnicos",
      serviceTitle: visit.serviceTitle,
      district: visit.district,
      createdAt: Date.now(),
      client: {
        id: visit.clientId,
        name: visit.clientName,
        phone: visit.clientPhone || "+239 9918273",
        completedOrdersCount: 8,
        infractionsCount: 0,
      },
      provider: {
        id: visit.providerId,
        name: visit.providerName,
        phone: "+239 9944747",
        completedOrdersCount: 22,
        warningsCount: 0,
      },
      conflict: {
        providerDeclaredAmount: providerAmount,
        clientDeclaredAmount: clientAmount,
        divergenceAmount: Math.abs(providerAmount - clientAmount),
        divergencePercent: evalResult.divergencePercent,
      },
      marketBenchmark: {
        categoryName: benchmark.categoryName || benchmark.name || "Serviços Técnicos",
        minPrice: benchmark.minPrice,
        avgPrice: benchmark.avgPrice,
        maxPrice: benchmark.maxPrice,
        isClientWithinAverage:
          clientAmount >= benchmark.minPrice && clientAmount <= benchmark.maxPrice,
        analysisVerdict: `Divergência de ${evalResult.divergencePercent}% excede a margem de segurança de 40%. Valor do prestador: ${providerAmount} Db. Valor do cliente: ${clientAmount} Db. Média de mercado STP: ${benchmark.avgPrice} Db.`,
      },
      evidences: {
        chatTranscript: (state.messages[visit.providerId] || []).slice(-6).map((m) => ({
          from: m.from === "me" ? "client" : "provider",
          text: m.text,
          at: m.at,
        })),
        attachedPhotos: [
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        ],
        gpsCheckIn: {
          performed: !!visit.checkInAt,
          time: visit.checkInAt ? new Date(visit.checkInAt).toLocaleTimeString() : undefined,
          location: visit.checkInLocation || `${visit.district} (GPS pendente)`,
        },
      },
      status: "pendente",
    };

    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === input.visitId
          ? {
              ...v,
              status: "em_moderacao",
              declaredAmountByClient: clientAmount,
              clientDeclaredAmount: clientAmount,
              providerDeclaredAmount: providerAmount,
              divergencePercent: evalResult.divergencePercent,
              divergencePct: evalResult.divergencePercent,
              divergenceTier: "tier_3_moderation",
              moderationCaseId: disputeId,
              disputeId: disputeId,
            }
          : v,
      ),
      moderationDisputes: [newDispute, ...state.moderationDisputes],
    });

    const prevMsgs = state.messages[visit.providerId] ?? [];
    const chatMsg: Message = {
      id: `m_vis_mod_${Date.now()}`,
      from: "me",
      text: `🚨 Divergência Crítica de Preço (${evalResult.divergencePercent}%):\nPrestador declarou: ${providerAmount} Db\nCliente informou: ${clientAmount} Db\n\nO pedido foi congelado em custódia e encaminhado para o Painel de Moderação KONEKTA (Protocolo ${disputeId}). A equipa de suporte analisará os registos em até 2h.`,
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
      title: "⚠️ Pedido Encaminhado para Moderação",
      body: `Divergência de ${evalResult.divergencePercent}% entre os valores declarados. Fundos congelados com segurança.`,
      tone: "error",
      link: `/chat/${visit.providerId}`,
    });

    return {
      ok: true,
      message: `Divergência de ${evalResult.divergencePercent}% encaminhada para moderação administrativa.`,
      result: evalResult,
    };
  },

  providerDeclareVisitBudget(visitId: string, declaredAmount: number, diagnosticReport?: string) {
    return this.providerDeclareOnSiteBudget({ visitId, declaredAmount, diagnosticReport });
  },

  clientConfirmVisitBudget(
    visitId: string,
    agreed: boolean,
    clientAmount?: number,
    reason?: string,
  ) {
    const res = this.clientValidateOnSiteBudget({
      visitId,
      agreed,
      clientConfirmedAmount: clientAmount,
      clientReason: reason,
    });
    const visit = this.get().technicalVisits.find((v) => v.id === visitId);
    return {
      ...res,
      resultLevel: visit?.divergenceTier === "tier_3_moderation" ? "level_3" : "level_1",
    };
  },

  declareCashPaymentWithOtp(visitId: string, amount: number, otp: string) {
    const state = this.get();
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };
    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: "visita_paga_e_aprovada",
              cashConfirmedByClient: true,
              cashConfirmedAt: Date.now(),
              declaredCashAmount: amount,
              completionOtp: otp,
            }
          : v,
      ),
    });
    notify({
      title: "Pagamento em Dinheiro Validado",
      body: `O valor de ${amount} STN foi validado com código OTP presencial.`,
      tone: "success",
    });
    return { ok: true, message: "Pagamento presencial validado com sucesso." };
  },

  contestCashReceipt(visitId: string, reason: string) {
    const state = this.get();
    const visit = state.technicalVisits.find((v) => v.id === visitId);
    if (!visit) return { ok: false, message: "Visita não encontrada." };
    set({
      technicalVisits: state.technicalVisits.map((v) =>
        v.id === visitId
          ? {
              ...v,
              cashReceiptDisputed: true,
              cashReceiptContested: true,
              cashContestReason: reason,
            }
          : v,
      ),
    });
    notify({
      title: "Recibo em Dinheiro Contestado",
      body: `A contestação para a visita ${visit.serviceTitle} foi registada.`,
      tone: "warning",
    });
    return { ok: true, message: "Contestação registada e encaminhada para moderação." };
  },

  /**
   * Resolução de caso no Painel de Moderação pelo Administrador
   */
  resolveModerationCase(input: {
    caseId?: string;
    disputeId?: string;
    decision?: "client" | "provider" | "warning_sanction" | "custom_arbitrated";
    resolution?: string;
    adminNotes?: string;
    moderatorNotes?: string;
    resolvedBy?: string;
    finalCustomAmount?: number;
    resolvedAmount?: number;
  }): { ok: boolean; message: string } {
    const targetId = input.caseId || input.disputeId;
    const dispute = state.moderationDisputes.find((d) => d.id === targetId);
    if (!dispute) return { ok: false, message: "Caso de moderação não encontrado." };

    let finalAmount = dispute.conflict.clientDeclaredAmount;
    let newStatus: ModerationDispute["status"] = "resolvido_cliente";

    const effectiveDecision = input.decision || input.resolution;
    if (effectiveDecision === "provider") {
      finalAmount = dispute.conflict.providerDeclaredAmount;
      newStatus = "resolvido_prestador";
    } else if (effectiveDecision === "warning_sanction") {
      newStatus = "sancionado_prestador";
      finalAmount = dispute.conflict.clientDeclaredAmount;
    } else if (effectiveDecision === "custom_arbitrated") {
      newStatus = "resolvido_cliente";
    }

    const customAmt = input.finalCustomAmount ?? input.resolvedAmount;
    if (customAmt && customAmt > 0) {
      finalAmount = customAmt;
    }

    // Atualiza disputa
    const updatedDisputes = state.moderationDisputes.map((d) =>
      d.id === targetId
        ? {
            ...d,
            status: newStatus,
            resolvedAt: Date.now(),
            resolvedBy: input.resolvedBy || "Administrador KONEKTA",
            resolutionNotes: input.adminNotes || input.moderatorNotes,
            finalDecidedAmount: finalAmount,
          }
        : d,
    );

    // Atualiza visita associada
    let updatedVisits = state.technicalVisits;
    if (dispute.visitId) {
      updatedVisits = state.technicalVisits.map((v) =>
        v.id === dispute.visitId
          ? {
              ...v,
              status:
                input.decision === "warning_sanction" ? "cancelado" : "visita_paga_e_aprovada",
              finalAgreedAmount: finalAmount,
            }
          : v,
      );
    }

    set({
      moderationDisputes: updatedDisputes,
      technicalVisits: updatedVisits,
    });

    const providerId = dispute.provider.id;
    const prevMsgs = state.messages[providerId] ?? [];
    const chatMsg: Message = {
      id: `m_mod_res_${Date.now()}`,
      from: "them",
      text: `⚖️ Resolução de Moderação KONEKTA:\nDecisão: ${
        input.decision === "client"
          ? `Adotado o valor do cliente (${finalAmount} Db).`
          : input.decision === "provider"
            ? `Adotado o valor do prestador (${finalAmount} Db).`
            : "Prestador advertido por inflação injustificada. Pedido cancelado."
      }\nNotas do Moderador: "${input.adminNotes || "Análise efetuada com base no histórico de mercado e registos do chat."}"`,
      at: Date.now(),
      status: "sent",
      kind: "system",
    };

    set({
      messages: {
        ...state.messages,
        [providerId]: [...prevMsgs, chatMsg],
      },
    });

    notify({
      title: "Disputa de Moderação Resolvida",
      body: `Caso ${input.caseId} encerrado com decisão: ${newStatus}.`,
      tone: "success",
      link: "/admin",
    });

    return {
      ok: true,
      message: `Disputa ${input.caseId} resolvida com sucesso (${newStatus}).`,
    };
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

  /* ----------------- Modelo de Ganhos: Prestadores KONEKTA ----------------- */

  /** Ganhos do prestador — carteira independente da carteira de cliente. */
  addEarning(label: string, amount: number) {
    const effectiveCommission = state.config.commissionPct || 20;
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
      body: `"${service.name}" foi publicado com sucesso no seu catálogo KONEKTA.`,
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
    providerId?: string;
    providerName?: string;
    clientId?: string;
    clientName: string;
    visitId?: string;
    orderId?: string;
    serviceTitle: string;
    declaredAmount?: number;
    amountReceived?: number;
    commissionAmount?: number;
    notes?: string;
  }): { ok: boolean; message: string; declaration?: InPersonCashDeclaration } {
    const val = input.amountReceived ?? input.declaredAmount ?? 0;
    if (!val || val <= 0) {
      return { ok: false, message: "Insira um valor válido recebido presencialmente." };
    }

    const commissionPct = state.config.commissionPct || 10;
    const commissionAmount = input.commissionAmount ?? Math.round((val * commissionPct) / 100);

    const declId = `DEC-${Date.now()}`;
    const providerId = input.providerId || state.user?.id || "edmilson-varela";
    const providerName = input.providerName || state.user?.name || "Prestador KONEKTA";

    const decl: InPersonCashDeclaration = {
      id: declId,
      providerId,
      providerName,
      clientId: input.clientId || "client_direct",
      clientName: input.clientName,
      visitId: input.visitId,
      orderId: input.orderId,
      serviceTitle: input.serviceTitle,
      declaredAmount: val,
      commissionPct,
      commissionAmount,
      status: "aguardando_confirmacao",
      declaredAt: Date.now(),
    };

    // Cria mensagem interativa no chat
    const prev = state.messages[providerId] ?? [];
    const declMsg: Message = {
      id: `m_dec_${Date.now()}`,
      from: "them",
      text: `💵 Declaração de Pagamento Presencial: ${val} STN recebidos em dinheiro. Aguardando confirmação do cliente para validação e garantia.`,
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
              declaredCashAmount: val,
            }
          : v,
      );
    }

    set({
      inPersonDeclarations: [decl, ...state.inPersonDeclarations],
      technicalVisits: updatedVisits,
      messages: {
        ...state.messages,
        [providerId]: [...prev, declMsg],
      },
    });

    notify({
      title: "Confirmação de Pagamento em Dinheiro",
      body: `${providerName} declarou ter recebido ${val} STN pelo serviço. Por favor confirme na app.`,
      tone: "warning",
      link: `/chat/${providerId}`,
    });

    return {
      ok: true,
      message: `Declaração de ${val} STN enviada ao cliente para confirmação mútua.`,
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

    const debtLimit = state.config.debtBlockLimit || 300;
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
   * Cliente contesta recibo de pagamento presencial emitido pelo prestador
   */
  clientDisputeCashReceipt(
    declarationId: string,
    reason: string,
  ): { ok: boolean; message: string; disputeId?: string } {
    const decl = state.inPersonDeclarations.find((d) => d.id === declarationId);
    if (!decl) return { ok: false, message: "Declaração não encontrada." };

    const disputeId = `DISP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDispute: ModerationDispute = {
      id: disputeId,
      visitId: decl.visitId,
      orderId: decl.orderId,
      category: "Pagamento Presencial & Recibos",
      serviceTitle: decl.serviceTitle,
      district: "São Tomé",
      createdAt: Date.now(),
      client: {
        id: decl.clientId,
        name: decl.clientName,
        phone: "+239 9918273",
        completedOrdersCount: 5,
        infractionsCount: 0,
      },
      provider: {
        id: decl.providerId,
        name: decl.providerName,
        phone: "+239 9944747",
        completedOrdersCount: 18,
        warningsCount: 0,
      },
      conflict: {
        providerDeclaredAmount: decl.declaredAmount,
        clientDeclaredAmount: decl.actualAmountPaid || 0,
        divergenceAmount: Math.abs(decl.declaredAmount - (decl.actualAmountPaid || 0)),
        divergencePercent: 100,
      },
      marketBenchmark: {
        categoryName: "Contestação de Recibo",
        minPrice: 100,
        avgPrice: decl.declaredAmount,
        maxPrice: decl.declaredAmount * 2,
        isClientWithinAverage: false,
        analysisVerdict: `Cliente contestou recibo presencial de ${decl.declaredAmount} STN. Motivo: "${reason}".`,
      },
      evidences: {
        chatTranscript: (state.messages[decl.providerId] || []).slice(-4).map((m) => ({
          from: m.from === "me" ? "client" : "provider",
          text: m.text,
          at: m.at,
        })),
        attachedPhotos: [],
        gpsCheckIn: {
          performed: true,
          location: "São Tomé",
        },
      },
      status: "pendente",
    };

    set({
      inPersonDeclarations: state.inPersonDeclarations.map((d) =>
        d.id === declarationId ? { ...d, status: "recusado" } : d,
      ),
      moderationDisputes: [newDispute, ...state.moderationDisputes],
    });

    notify({
      title: "Recibo Contestado",
      body: `A contestação foi registada e encaminhada para a Moderação KONEKTA (Protocolo ${disputeId}).`,
      tone: "warning",
      link: `/chat/${decl.providerId}`,
    });

    return {
      ok: true,
      message: `Recibo contestado e caso ${disputeId} criado na Moderação.`,
      disputeId,
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

    const debtLimit = state.config.debtBlockLimit || 300;
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
        : `Recarga de ${amount} STN adicionada com sucesso à sua carteira KONEKTA!`;

    notify({
      title: "Recarga KONEKTA Confirmada",
      body: msg,
      tone: "success",
      link: "/pro/ganhos",
    });

    return { ok: true, message: msg };
  },

  /* ----------------- Gestão de Depósitos, Recargas & Custódia Escrow ----------------- */

  createDepositRequest(input: {
    userId?: string;
    userName?: string;
    userRole?: "cliente" | "prestador";
    userPhone?: string;
    amount: number;
    method: DepositMethod;
    bankOrProviderName: string;
    referenceOrPhone?: string;
    proofImage?: string;
    proofFileName?: string;
    notes?: string;
  }): { ok: boolean; message: string; deposit?: DepositRequest } {
    if (!input.amount || input.amount <= 0) {
      return {
        ok: false,
        message: "Insira um montante válido para o carregamento.",
      };
    }

    const currentUserName =
      input.userName ||
      state.user?.name ||
      (input.userRole === "prestador" ? "Edmilson Varela" : "Manuel Trindade");
    const currentUserId: string =
      input.userId ||
      state.user?.id ||
      (input.userRole === "prestador" ? "edmilson-varela" : "usr-client");
    const currentUserRole: "cliente" | "prestador" =
      input.userRole === "prestador" || (state.profiles.prestador && !state.profiles.cliente)
        ? "prestador"
        : "cliente";

    const newDeposit: DepositRequest = {
      id: `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUserId,
      userName: currentUserName,
      userRole: currentUserRole,
      userPhone: input.userPhone || state.user?.phone || "+239 9918273",
      amount: input.amount,
      method: input.method,
      bankOrProviderName: input.bankOrProviderName,
      referenceOrPhone: input.referenceOrPhone,
      proofImage: input.proofImage,
      notes: input.notes,
      status: "pendente_aprovacao",
      createdAt: Date.now(),
    };

    set({
      depositRequests: [newDeposit, ...state.depositRequests],
    });

    notify({
      title: "Pedido de Recarga Registado",
      body: `Carregamento de ${input.amount} STN submetido. O saldo será creditado após validação da administração.`,
      tone: "info",
      link: currentUserRole === "prestador" ? "/pro/ganhos" : "/carteira",
    });

    try {
      realtimeAudio.play("notification");
    } catch {
      // ignore
    }

    return {
      ok: true,
      message: `Comprovativo de ${input.amount} STN registado com sucesso! Aguarda validação do administrador.`,
      deposit: newDeposit,
    };
  },

  approveDepositRequest(depositId: string, adminNotes?: string): { ok: boolean; message: string } {
    const deposit = state.depositRequests.find((d) => d.id === depositId);
    if (!deposit) {
      return { ok: false, message: "Pedido de depósito não encontrado." };
    }
    if (deposit.status === "aprovado") {
      return { ok: false, message: "Este depósito já foi aprovado anteriormente." };
    }

    const updatedDeposits = state.depositRequests.map((d) =>
      d.id === depositId
        ? {
            ...d,
            status: "aprovado" as DepositStatus,
            reviewedAt: Date.now(),
            reviewedBy: "Admin KONEKTA",
            notes: adminNotes || d.notes,
          }
        : d,
    );

    if (deposit.userRole === "cliente") {
      const newTx: Transaction = {
        id: `t_dep_${Date.now()}`,
        kind: "in",
        label: `Carregamento Aprovado Admin — ${deposit.bankOrProviderName} (${deposit.id})`,
        amount: deposit.amount,
        at: Date.now(),
      };

      set({
        depositRequests: updatedDeposits,
        balance: state.balance + deposit.amount,
        transactions: [newTx, ...state.transactions],
      });

      notify({
        title: "Recarga Aprovada pela Administração!",
        body: `O seu carregamento de ${deposit.amount} STN (${deposit.bankOrProviderName}) foi validado e creditado na sua carteira.`,
        tone: "success",
        link: "/carteira",
      });
    } else {
      // Prestador
      let currentDebt = state.providerDebt;
      let debtLiquidated = 0;
      let remainingForBalance = deposit.amount;

      if (currentDebt > 0) {
        debtLiquidated = Math.min(deposit.amount, currentDebt);
        currentDebt -= debtLiquidated;
        remainingForBalance = deposit.amount - debtLiquidated;
      }

      const debtLimit = state.config.debtBlockLimit || 300;
      const isStillBlocked = currentDebt >= debtLimit;
      const providerTxs: Transaction[] = [];

      if (debtLiquidated > 0) {
        providerTxs.push({
          id: `pt_debt_liq_${Date.now()}`,
          kind: "out",
          label: `Abate de Dívida de Comissões (${deposit.bankOrProviderName} · ${deposit.id})`,
          amount: debtLiquidated,
          at: Date.now(),
        });
      }

      if (remainingForBalance > 0) {
        providerTxs.push({
          id: `pt_dep_in_${Date.now()}`,
          kind: "in",
          label: `Depósito Aprovado Admin — ${deposit.bankOrProviderName} (${deposit.id})`,
          amount: remainingForBalance,
          at: Date.now() + 1,
        });
      }

      set({
        depositRequests: updatedDeposits,
        providerBalance: state.providerBalance + remainingForBalance,
        providerDebt: currentDebt,
        isProviderBlockedForDebt: isStillBlocked,
        providerTransactions: [...providerTxs, ...state.providerTransactions],
      });

      notify({
        title: "Depósito KONEKTA Validado",
        body: `Recarga de ${deposit.amount} STN aprovada pelo Administrador! Saldo disponível atualizado.`,
        tone: "success",
        link: "/pro/ganhos",
      });
    }

    try {
      realtimeAudio.play("coin");
    } catch {
      // ignore
    }

    return {
      ok: true,
      message: `Depósito ${deposit.id} de ${deposit.amount} STN (${deposit.userName}) aprovado com sucesso! Saldo creditado.`,
    };
  },

  rejectDepositRequest(depositId: string, reason: string): { ok: boolean; message: string } {
    const deposit = state.depositRequests.find((d) => d.id === depositId);
    if (!deposit) {
      return { ok: false, message: "Pedido de depósito não encontrado." };
    }

    set({
      depositRequests: state.depositRequests.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: "rejeitado" as DepositStatus,
              rejectionReason: reason || "Comprovativo não localizado no extrato bancário.",
              reviewedAt: Date.now(),
              reviewedBy: "Admin KONEKTA",
            }
          : d,
      ),
    });

    notify({
      title: "Recarga Rejeitada pelo Administrador",
      body: `O pedido ${deposit.id} (${deposit.amount} STN) foi recusado: ${reason || "Comprovativo inválido"}.`,
      tone: "error",
      link: deposit.userRole === "prestador" ? "/pro/ganhos" : "/carteira",
    });

    return {
      ok: true,
      message: `Depósito ${deposit.id} rejeitado. O utilizador foi notificado.`,
    };
  },

  /* ----------------- Repasses e Saques dos Prestadores (Payouts) ----------------- */

  requestProviderPayout(input: {
    providerId: string;
    providerName: string;
    providerPhone?: string;
    amount: number;
    method: "bistp" | "bgfi" | "afriland" | "dobra24" | "cst_money" | "pix" | "iban";
    accountDetails: string;
    holderName: string;
  }): { ok: boolean; message: string } {
    if (!input.amount || input.amount <= 0) {
      return { ok: false, message: "Insira um montante válido para levantamento." };
    }
    if (input.amount > state.providerBalance) {
      return {
        ok: false,
        message: `Saldo disponível insuficiente (${state.providerBalance} STN).`,
      };
    }
    if (state.isProviderBlockedForDebt) {
      return {
        ok: false,
        message: "Conta suspensa por dívida pendente. Regularize as comissões para efetuar saques.",
      };
    }
    if (!input.accountDetails.trim()) {
      return { ok: false, message: "Insira os dados da conta ou NIB para transferência." };
    }

    const newPayout: PayoutRequest = {
      id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
      providerId: input.providerId,
      providerName: input.providerName,
      providerPhone: input.providerPhone || "+239 9845678",
      amount: input.amount,
      method: input.method,
      accountDetails: input.accountDetails,
      holderName: input.holderName,
      status: "pendente",
      createdAt: Date.now(),
    };

    const newTx: Transaction = {
      id: `pt_payout_${Date.now()}`,
      kind: "out",
      label: `Saque Solicitado (${input.method.toUpperCase()} · ${newPayout.id})`,
      amount: input.amount,
      at: Date.now(),
    };

    set({
      providerBalance: state.providerBalance - input.amount,
      payoutRequests: [newPayout, ...state.payoutRequests],
      providerTransactions: [newTx, ...state.providerTransactions],
    });

    notify({
      title: "Solicitação de Saque Enviada",
      body: `O repasse de ${input.amount} STN para ${input.method.toUpperCase()} (${input.accountDetails}) foi encaminhado para processamento.`,
      tone: "info",
      link: "/pro/ganhos",
    });

    return {
      ok: true,
      message: `Solicitação ${newPayout.id} de ${input.amount} STN enviada com sucesso!`,
    };
  },

  approvePayoutRequest(payoutId: string): { ok: boolean; message: string } {
    const payout = state.payoutRequests.find((p) => p.id === payoutId);
    if (!payout) return { ok: false, message: "Pedido de repasse não encontrado." };
    if (payout.status === "processado") return { ok: false, message: "Saque já processado." };

    set({
      payoutRequests: state.payoutRequests.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: "processado" as PayoutRequestStatus,
              processedAt: Date.now(),
            }
          : p,
      ),
      providerWithdrawnBalance: state.providerWithdrawnBalance + payout.amount,
    });

    notify({
      title: "Saque Processado com Sucesso!",
      body: `A transferência de ${payout.amount} STN (${payout.method.toUpperCase()}) foi executada para a sua conta.`,
      tone: "success",
      link: "/pro/ganhos",
    });

    return {
      ok: true,
      message: `Repasse ${payout.id} de ${payout.amount} STN para ${payout.providerName} marcado como executado!`,
    };
  },

  rejectPayoutRequest(payoutId: string, reason: string): { ok: boolean; message: string } {
    const payout = state.payoutRequests.find((p) => p.id === payoutId);
    if (!payout) return { ok: false, message: "Pedido de repasse não encontrado." };

    const refundTx: Transaction = {
      id: `pt_payout_refund_${Date.now()}`,
      kind: "in",
      label: `Estorno de Saque Rejeitado (${payout.id})`,
      amount: payout.amount,
      at: Date.now(),
    };

    set({
      payoutRequests: state.payoutRequests.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: "rejeitado" as PayoutRequestStatus,
              rejectionReason:
                reason || "Dados bancários incorretos ou titularidade não coincidente.",
            }
          : p,
      ),
      providerBalance: state.providerBalance + payout.amount,
      providerTransactions: [refundTx, ...state.providerTransactions],
    });

    notify({
      title: "Saque Recusado & Saldo Estornado",
      body: `O repasse ${payout.id} de ${payout.amount} STN foi recusado: ${reason || "Dados bancários incorretos"}. O saldo foi devolvido.`,
      tone: "warning",
      link: "/pro/ganhos",
    });

    return {
      ok: true,
      message: `Repasse ${payout.id} recusado e saldo de ${payout.amount} STN estornado ao prestador.`,
    };
  },

  /* ----------------- Validação OTP e Liquidação de Escrow com Split ----------------- */

  verifyPinAndSettleOrder(
    orderId: string,
    enteredPin: string,
  ): {
    ok: boolean;
    message: string;
    netEarnings?: number;
    commissionAmount?: number;
  } {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) {
      return { ok: false, message: "Pedido não encontrado no sistema." };
    }

    if (order.status === "concluido" || order.status === "avaliado") {
      return {
        ok: false,
        message: "Este pedido já foi finalizado e liquidado anteriormente.",
      };
    }

    const cleanInput = enteredPin.trim();
    const targetPin = (order.completionCode || "1234").trim();

    if (cleanInput !== targetPin) {
      try {
        realtimeAudio.play("pin_error");
      } catch {
        // ignore
      }
      return {
        ok: false,
        message:
          "Código de conclusão (OTP) incorreto. Peça o PIN de 4 dígitos ao cliente no local.",
      };
    }

    // PIN Válido: Executar Split de Pagamento Escrow
    const totalAmount = order.total || 0;
    const commPct = state.config.commissionPct || 10;
    const commAmount = Math.round(totalAmount * (commPct / 100));
    const netEarnings = totalAmount - commAmount;

    // Se o prestador possuir dívida acumulada de comissões em dinheiro (providerDebt > 0),
    // o valor líquido do serviço digital abaterá AUTOMATICAMENTE a sua dívida primeiro!
    let currentDebt = state.providerDebt;
    let debtAbated = 0;
    let creditedToBalance = netEarnings;

    if (currentDebt > 0) {
      debtAbated = Math.min(netEarnings, currentDebt);
      currentDebt -= debtAbated;
      creditedToBalance = netEarnings - debtAbated;
    }

    const debtLimit = state.config.debtBlockLimit || 300;
    const isStillBlocked = currentDebt >= debtLimit;

    // Atualizar pedido
    const updatedOrders = state.orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: "concluido" as OrderStatus,
            completedAt: Date.now(),
            finishedAt: Date.now(),
          }
        : o,
    );

    const providerTxs: Transaction[] = [];

    if (debtAbated > 0) {
      providerTxs.push({
        id: `pt_debt_escrow_${Date.now()}`,
        kind: "out",
        label: `Amortização Automática de Dívida de Comissões (Escrow OTP · ${order.id})`,
        amount: debtAbated,
        at: Date.now(),
      });
    }

    providerTxs.push({
      id: `pt_settle_${Date.now()}`,
      kind: "in",
      label: `Liquidação Escrow OTP — ${order.service} (${order.id})`,
      amount: netEarnings,
      at: Date.now() + 1,
    });

    set({
      orders: updatedOrders,
      providerBalance: state.providerBalance + creditedToBalance,
      providerDebt: currentDebt,
      isProviderBlockedForDebt: isStillBlocked,
      providerPendingBalance: Math.max(0, state.providerPendingBalance - totalAmount),
      providerTransactions: [...providerTxs, ...state.providerTransactions],
    });

    try {
      realtimeAudio.play("pin_success");
    } catch {
      // ignore
    }

    const notifyBody =
      debtAbated > 0
        ? `Código OTP validado! Ganho de ${netEarnings} STN: ${debtAbated} STN abateram automaticamente na dívida pendente de comissões. ${creditedToBalance > 0 ? `${creditedToBalance} STN creditados no saldo disponível.` : ""} Conta ${isStillBlocked ? "em regularização" : "desbloqueada e 100% ativa"}!`
        : `Código OTP validado com sucesso! ${netEarnings} STN creditados no seu saldo disponível (comissão KONEKTA retida: ${commAmount} STN).`;

    notify({
      title: "Serviço Finalizado & Pago!",
      body: notifyBody,
      tone: "success",
      link: "/pro/ganhos",
    });

    return {
      ok: true,
      message:
        debtAbated > 0
          ? `Código validado! ${netEarnings} STN faturados: ${debtAbated} STN abateram na sua dívida e ${creditedToBalance} STN foram transferidos para o saldo disponível.`
          : `Código validado! O valor de ${netEarnings} STN foi transferido para o seu saldo disponível.`,
      netEarnings,
      commissionAmount: commAmount,
    };
  },

  /* ----------------- Pedidos Publicados: Admin, Prestador e Cobrança ----------------- */

  adminApproveRequest(requestId: string): { ok: boolean; message: string } {
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, message: "Pedido publicado não encontrado." };
    set({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? { ...r, adminStatus: "aprovado" as const, adminReviewedAt: Date.now() }
          : r,
      ),
    });
    notify({
      title: "Pedido aprovado pela administração",
      body: `${req.id} — ${req.title} já está visível para os prestadores de ${req.categoryName}.`,
      tone: "success",
      link: "/pedidos",
    });
    return { ok: true, message: `Pedido ${req.id} aprovado e publicado aos prestadores.` };
  },

  adminRejectRequest(requestId: string, reason: string): { ok: boolean; message: string } {
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, message: "Pedido publicado não encontrado." };
    set({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              adminStatus: "rejeitado" as const,
              adminReason: reason || "Pedido não cumpre as regras da KONEKTA.",
              adminReviewedAt: Date.now(),
              status: "fechado" as const,
            }
          : r,
      ),
    });
    notify({
      title: "Pedido recusado pela administração",
      body: `${req.id} — ${reason || "Pedido não cumpre as regras da KONEKTA."}`,
      tone: "error",
      link: "/pedidos",
    });
    return { ok: true, message: `Pedido ${req.id} recusado. O cliente foi notificado.` };
  },

  providerDeclineRequest(requestId: string): { ok: boolean; message: string } {
    const me = state.user?.id ?? "me";
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, message: "Pedido não encontrado." };
    set({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, declinedBy: [...(r.declinedBy ?? []), me] } : r,
      ),
    });
    return { ok: true, message: `Recusou o pedido ${req.id}. Deixa de aparecer na sua lista.` };
  },

  providerAcceptRequest(
    requestId: string,
    input?: { price?: number; scheduledFor?: string },
  ): { ok: boolean; message: string; orderId?: string } {
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, message: "Pedido não encontrado." };
    if ((req.adminStatus ?? "aprovado") !== "aprovado") {
      return { ok: false, message: "Este pedido ainda aguarda validação da administração." };
    }
    if (req.status !== "aberto") {
      return { ok: false, message: "Este pedido já não está disponível." };
    }
    const providerId = state.user?.id ?? "me";
    const providerName = state.user?.name ?? "Prestador KONEKTA";
    const price = input?.price ?? req.budget ?? 0;
    const scheduledFor = input?.scheduledFor ?? req.scheduleSummary ?? "A combinar";

    const order = store.createOrder({
      providerId,
      service: req.title,
      total: price,
      scheduledFor,
      address: req.address,
      district: req.district,
      referencePoint: req.reference,
      notes: req.description,
      paymentMethod: "carteira",
      latitude: req.latitude,
      longitude: req.longitude,
      accuracy: req.accuracy,
      mapsUrl: req.mapsUrl,
      directionsUrl: req.directionsUrl,
    });

    const thread = state.messages[providerId] ?? [];
    set({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? { ...r, status: "adjudicado" as const, acceptedProviderId: providerId }
          : r,
      ),
      orders: state.orders.map((o) =>
        o.id === order.id ? { ...o, status: "aceite" as OrderStatus, requestId: req.id } : o,
      ),
      messages: {
        ...state.messages,
        [providerId]: [
          ...thread,
          {
            id: `m_accept_${Date.now()}`,
            from: "them",
            text: `${providerName} aceitou o seu pedido "${req.title}" por ${price} Db. Vamos combinar o horário por aqui.`,
            at: Date.now(),
            kind: "system",
          },
        ],
      },
    });

    notify({
      title: "Pedido aceite",
      body: `Aceitou "${req.title}". O chat com o cliente está aberto.`,
      tone: "success",
      link: `/chat/${providerId}`,
    });

    return { ok: true, message: `Pedido aceite! Serviço ${order.id} criado.`, orderId: order.id };
  },

  providerScheduleOrder(orderId: string, scheduledFor: string): { ok: boolean; message: string } {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, message: "Serviço não encontrado." };
    if (!scheduledFor.trim()) return { ok: false, message: "Defina uma data e hora." };
    set({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, scheduledFor } : o)),
    });
    const thread = state.messages[order.providerId] ?? [];
    set({
      messages: {
        ...state.messages,
        [order.providerId]: [
          ...thread,
          {
            id: `m_sched_${Date.now()}`,
            from: "them",
            text: `Horário confirmado para ${scheduledFor}.`,
            at: Date.now(),
            kind: "system",
          },
        ],
      },
    });
    notify({
      title: "Horário definido",
      body: `${order.service} agendado para ${scheduledFor}.`,
      tone: "info",
      link: `/pedido/${orderId}`,
    });
    return { ok: true, message: `Horário definido: ${scheduledFor}.` };
  },

  providerConfirmPresence(orderId: string): { ok: boolean; message: string } {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, message: "Serviço não encontrado." };
    set({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "em-execucao" as OrderStatus,
              presenceConfirmedAt: Date.now(),
              startedAt: o.startedAt ?? Date.now(),
            }
          : o,
      ),
    });
    notify({
      title: "Presença confirmada",
      body: `Chegou ao local do serviço ${order.id}. Boa execução!`,
      tone: "success",
      link: `/pedido/${orderId}`,
    });
    return { ok: true, message: "Presença confirmada no local do cliente." };
  },

  providerChargeOrder(input: {
    orderId: string;
    amount: number;
    proofImage?: string;
    proofFileName?: string;
    note?: string;
  }): { ok: boolean; message: string } {
    const order = state.orders.find((o) => o.id === input.orderId);
    if (!order) return { ok: false, message: "Serviço não encontrado." };
    if (!input.amount || input.amount <= 0) {
      return { ok: false, message: "Insira o valor cobrado ao cliente." };
    }
    if (!input.proofImage) {
      return { ok: false, message: "Anexe o comprovativo ou recibo da cobrança." };
    }
    const thread = state.messages[order.providerId] ?? [];
    set({
      orders: state.orders.map((o) =>
        o.id === input.orderId
          ? {
              ...o,
              total: input.amount,
              status: "aguardando-codigo" as OrderStatus,
              finishedAt: Date.now(),
              charge: {
                amount: input.amount,
                proofImage: input.proofImage,
                proofFileName: input.proofFileName,
                note: input.note,
                at: Date.now(),
                status: "pendente" as const,
              },
            }
          : o,
      ),
      messages: {
        ...state.messages,
        [order.providerId]: [
          ...thread,
          {
            id: `m_charge_${Date.now()}`,
            from: "them",
            text: `Trabalho concluído. Valor a cobrar: ${input.amount} Db. Comprovativo anexado${input.proofFileName ? ` (${input.proofFileName})` : ""}. Forneça o código de 4 dígitos para finalizar.`,
            at: Date.now(),
            kind: "system",
            photos: input.proofImage.startsWith("data:image") ? [input.proofImage] : undefined,
          },
        ],
      },
    });
    notify({
      title: "Cobrança enviada ao cliente",
      body: `${input.amount} Db cobrados no serviço ${order.id} com comprovativo anexado.`,
      tone: "success",
      link: `/pedido/${input.orderId}`,
    });
    return {
      ok: true,
      message: `Cobrança de ${input.amount} Db registada com comprovativo. Peça o código ao cliente.`,
    };
  },
};
