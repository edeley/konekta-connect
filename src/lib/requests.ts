/* Modelo GetNinjas: o cliente publica um pedido e os prestadores enviam propostas. */

export type RequestUrgency = "urgente" | "esta-semana" | "sem-pressa";

export type RequestStatus = "aberto" | "adjudicado" | "fechado";

export type Proposal = {
  id: string;
  providerId: string;
  providerName: string;
  price: number;
  message: string;
  availability: string;
  at: number;
};

export type ServiceRequest = {
  id: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  description: string;
  district: string;
  address?: string;
  /** Ponto de referência / local de encontro. */
  reference?: string;
  urgency: RequestUrgency;
  preferredDate?: string;
  preferredTime?: string;
  scheduleSummary?: string;
  budget?: number;
  materialStatus?: "tem_material" | "prestador_compra" | "avaliar";
  photos: number;
  photosList?: string[];
  status: RequestStatus;
  clientName: string;
  createdAt: number;
  proposals: Proposal[];
  acceptedProposalId?: string;
  /** Pedido direto e privado com um prestador específico */
  isDirect?: boolean;
  directProviderId?: string;
  directProviderName?: string;
};

export const urgencyLabel: Record<RequestUrgency, string> = {
  urgente: "Urgente (hoje)",
  "esta-semana": "Esta semana",
  "sem-pressa": "Sem pressa",
};

export const requestStatusLabel: Record<RequestStatus, string> = {
  aberto: "A receber propostas",
  adjudicado: "Prestador escolhido",
  fechado: "Fechado",
};

const now = Date.now();

export const seedRequests: ServiceRequest[] = [
  {
    id: "REQ-2041",
    categorySlug: "eletricista",
    categoryName: "Eletricista",
    title: "Instalação de quadro elétrico novo",
    description:
      "Preciso de substituir o quadro elétrico de uma moradia de 3 quartos em Água Grande. Já tenho o material.",
    district: "Água Grande",
    urgency: "esta-semana",
    budget: 3500,
    photos: 2,
    status: "aberto",
    clientName: "Ana Trovoada",
    createdAt: now - 2 * 3600_000,
    proposals: [
      {
        id: "pr1",
        providerId: "edmilson-varela",
        providerName: "Edmilson Varela",
        price: 3200,
        message: "Faço o serviço em meio dia, com garantia de 6 meses.",
        availability: "Quinta, 09:00",
        at: now - 3600_000,
      },
    ],
  },
  {
    id: "REQ-2038",
    categorySlug: "limpeza",
    categoryName: "Limpeza",
    title: "Limpeza pós-obra de apartamento T2",
    description: "Apartamento acabado de pintar, precisa de limpeza profunda incluindo vidros.",
    district: "Mé-Zóchi",
    urgency: "urgente",
    budget: 1200,
    photos: 0,
    status: "aberto",
    clientName: "Nelson Pires",
    createdAt: now - 6 * 3600_000,
    proposals: [],
  },
  {
    id: "REQ-2030",
    categorySlug: "canalizador",
    categoryName: "Canalizador",
    title: "Fuga de água na cozinha",
    description: "Torneira e sifão a pingar há dois dias.",
    district: "Água Grande",
    urgency: "urgente",
    photos: 1,
    status: "aberto",
    clientName: "Ivone Neto",
    createdAt: now - 26 * 3600_000,
    proposals: [
      {
        id: "pr2",
        providerId: "dercio-costa",
        providerName: "Dércio Costa",
        price: 600,
        message: "Posso passar hoje ao final da tarde para diagnosticar.",
        availability: "Hoje, 17:30",
        at: now - 20 * 3600_000,
      },
    ],
  },
];

export function timeAgo(at: number) {
  const diff = Math.max(0, Date.now() - at);
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}
