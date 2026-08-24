export type KycStatus = "NOT_SUBMITTED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export type ProviderUIStateMode = "VIEW_MODE_PUBLIC" | "VIEW_MODE_SELF";

export interface PortfolioBeforeAfterItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  completedAt?: string;
  clientDistrict?: string;
  rating?: number;
}

export interface ProviderCoverage {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  districts: string[];
  baseAddress?: string;
}

export interface ScheduleDaySlot {
  start: string;
  end: string;
}

export interface ProviderWeeklySchedule {
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ... 6=Sábado
  dayName: string;
  dayShort: string;
  enabled: boolean;
  slots: ScheduleDaySlot[];
}

export interface ProviderKycDocument {
  idType: "bi_stp" | "passaporte" | "carta_conducao";
  idNumber?: string;
  frontDocUrl?: string;
  backDocUrl?: string;
  selfieUrl?: string;
  residenceProofUrl?: string;
  status: KycStatus;
  rejectionReason?: string;
  submittedAt?: number;
  verifiedAt?: number;
}

export interface ProviderProfileContract {
  providerId: string;
  isOnline: boolean;
  kycStatus: KycStatus;
  personalInfo: {
    fullName: string;
    avatarUrl: string;
    bio: string;
    phoneMasked: string; // Ex: "+239 *****321"
    rawPhone?: string;
    yearsExperience: number;
    primaryCategory: string;
    allCategories: { id: string; name: string }[];
    certifications?: string[];
    guaranteePolicy?: string;
    district: string;
  };
  metrics: {
    rating: number; // 1.0 a 5.0
    totalReviews: number;
    completedJobs: number;
    responseTimeMinutes: number;
    completionRatePct: number;
  };
  coverage: ProviderCoverage;
  portfolio: PortfolioBeforeAfterItem[];
  wallet: {
    availableBalance: number;
    pendingEscrow: number;
    currency: "STD" | "Db";
    lastPayoutAt?: number;
    payoutAccount?: {
      method: "dobrapay" | "bancaria" | "cst_money";
      identifier: string;
      holderName: string;
      bankName?: string;
    };
  };
  kycDocuments?: ProviderKycDocument;
  schedule?: ProviderWeeklySchedule[];
}

/**
 * Função utilitária para mascarar números de telefone preservando privacidade do prestador
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return "+239 99****321";
  const clean = phone.replace(/\s+/g, "");
  if (clean.length <= 6) return "+239 ****" + clean.slice(-2);
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-3);
  return `${prefix} *****${suffix}`;
}

export const DEFAULT_WEEKLY_SCHEDULE: ProviderWeeklySchedule[] = [
  {
    dayOfWeek: 1,
    dayName: "Segunda-feira",
    dayShort: "Seg",
    enabled: true,
    slots: [
      { start: "08:00", end: "12:30" },
      { start: "14:00", end: "18:00" },
    ],
  },
  {
    dayOfWeek: 2,
    dayName: "Terça-feira",
    dayShort: "Ter",
    enabled: true,
    slots: [
      { start: "08:00", end: "12:30" },
      { start: "14:00", end: "18:00" },
    ],
  },
  {
    dayOfWeek: 3,
    dayName: "Quarta-feira",
    dayShort: "Qua",
    enabled: true,
    slots: [
      { start: "08:00", end: "12:30" },
      { start: "14:00", end: "18:00" },
    ],
  },
  {
    dayOfWeek: 4,
    dayName: "Quinta-feira",
    dayShort: "Qui",
    enabled: true,
    slots: [
      { start: "08:00", end: "12:30" },
      { start: "14:00", end: "18:00" },
    ],
  },
  {
    dayOfWeek: 5,
    dayName: "Sexta-feira",
    dayShort: "Sex",
    enabled: true,
    slots: [
      { start: "08:00", end: "12:30" },
      { start: "14:00", end: "18:00" },
    ],
  },
  {
    dayOfWeek: 6,
    dayName: "Sábado",
    dayShort: "Sáb",
    enabled: true,
    slots: [{ start: "09:00", end: "14:00" }],
  },
  {
    dayOfWeek: 0,
    dayName: "Domingo",
    dayShort: "Dom",
    enabled: false,
    slots: [{ start: "09:00", end: "13:00" }],
  },
];

export const STP_DISTRICTS = [
  "Água Grande",
  "Mé-Zóchi",
  "Cantagalo",
  "Lobata",
  "Caué",
  "Lembá",
  "Pagué (Príncipe)",
];
