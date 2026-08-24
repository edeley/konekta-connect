import {
  type ProviderProfileContract,
  type PortfolioBeforeAfterItem,
  type KycStatus,
  maskPhoneNumber,
  DEFAULT_WEEKLY_SCHEDULE,
} from "@/types/provider-profile";
import { getProvider, providers } from "./konekta-data";
import { store } from "./store";

// Imagens de demonstração com alta qualidade para Antes e Depois
const SEED_BEFORE_AFTER_PORTFOLIO: Record<string, PortfolioBeforeAfterItem[]> = {
  "edmilson-varela": [
    {
      id: "ev-port-1",
      title: "Reforma e Blindagem de Quadro Elétrico",
      category: "Eletricista",
      description:
        "Substituição total de disjuntores antigos com fiação solta por disjuntores diferenciais modernos com barramento em cobre e proteção contra sobretensão.",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
      completedAt: "12 de Agosto, 2026",
      clientDistrict: "Água Grande (São Gabriel)",
      rating: 5.0,
    },
    {
      id: "ev-port-2",
      title: "Instalação de Iluminação LED Embutida",
      category: "Iluminação",
      description:
        "Passagem de circuitos independentes no teto falso da sala com 12 focos LED dimerizáveis e fita LED oculta no sancateto.",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
      completedAt: "28 de Julho, 2026",
      clientDistrict: "Mé-Zóchi (Trindade)",
      rating: 5.0,
    },
    {
      id: "ev-port-3",
      title: "Automação de Bomba de Água com Relé Térmico",
      category: "Eletricista",
      description:
        "Instalação de quadro de comando com proteção contra falta de fase e boia automática em reservatório elevado.",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
      completedAt: "15 de Junho, 2026",
      clientDistrict: "Lobata",
      rating: 4.9,
    },
  ],
  "dercio-costa": [
    {
      id: "dc-port-1",
      title: "Reparação de Fuga Oculta e Substituição de Canos",
      category: "Canalizador",
      description:
        "Deteção eletrónica de infiltração sem danificar paredes. Substituição de troço de tubo galvanizado corroído por PPR termofundido.",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80",
      completedAt: "18 de Agosto, 2026",
      clientDistrict: "Água Grande (Campo de Milho)",
      rating: 5.0,
    },
    {
      id: "dc-port-2",
      title: "Instalação de Louças Sanitárias e Torneiras Monocomando",
      category: "Canalizador",
      description:
        "Montagem de coluna de duche, torneiras monocomando e vaso sanitário com duplo fluxo de água.",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&auto=format&fit=crop&q=80",
      completedAt: "03 de Agosto, 2026",
      clientDistrict: "Cantagalo (Santana)",
      rating: 4.9,
    },
  ],
  "maria-santos": [
    {
      id: "ms-port-1",
      title: "Limpeza Pós-Obra Completa de Moradia",
      category: "Limpeza",
      description:
        "Remoção de resíduos de cimento, tinta em vidros e higienização profunda de pisos cerâmicos e azulejos.",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
      completedAt: "10 de Agosto, 2026",
      clientDistrict: "Água Grande",
      rating: 5.0,
    },
  ],
  "joao-pedro": [
    {
      id: "jp-port-1",
      title: "Tratamento de Humidade e Pintura Exterior",
      category: "Pintura",
      description:
        "Raspagem, aplicação de impermeabilizante anti-fungos e acabamento com tinta acrílica de alta resistência ao clima tropical.",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80",
      completedAt: "05 de Agosto, 2026",
      clientDistrict: "Mé-Zóchi",
      rating: 5.0,
    },
  ],
};

/**
 * Retorna o perfil completo com contrato formal para o prestador
 */
export function getProviderContract(providerId: string): ProviderProfileContract {
  const p = getProvider(providerId) || providers[0];
  const user = store.get().user;
  const myProviderProfile = store.get().providerProfile;
  const isMe = user?.id === providerId || providerId === "me";

  // Se o próprio utilizador logado tiver guardado personalizações
  const portfolio =
    (isMe && myProviderProfile?.portfolio?.length
      ? myProviderProfile.portfolio.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category || p.category,
          description: item.description,
          beforeImageUrl:
            item.image ||
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
          afterImageUrl:
            item.image ||
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
        }))
      : SEED_BEFORE_AFTER_PORTFOLIO[p.id]) || SEED_BEFORE_AFTER_PORTFOLIO["edmilson-varela"];

  const kycStatus: KycStatus =
    isMe && myProviderProfile?.status === "aprovado"
      ? "VERIFIED"
      : isMe && myProviderProfile?.status === "em_analise"
        ? "PENDING_REVIEW"
        : isMe && myProviderProfile?.status === "rejeitado"
          ? "REJECTED"
          : "VERIFIED"; // Seed providers are verified by default

  return {
    providerId: p.id,
    isOnline: true,
    kycStatus,
    personalInfo: {
      fullName: p.name,
      avatarUrl: p.image,
      bio: p.bio,
      phoneMasked: maskPhoneNumber("+239 9912345"),
      rawPhone: "+239 991 2345",
      yearsExperience: 8,
      primaryCategory: p.category,
      allCategories: [
        { id: `cat_${p.category.toLowerCase()}`, name: p.category },
        { id: "cat_emergencias", name: "Emergências 24/7" },
      ],
      certifications: [
        "Certificação Técnica de Eletricidade & Baixa Tensão (CST)",
        "Seguro de Responsabilidade Civil Ativo KONEKTA",
        "Formação em Segurança e Prevenção de Riscos",
      ],
      guaranteePolicy: "Garantia de 30 dias em todos os serviços executados.",
      district: isMe && myProviderProfile?.district ? myProviderProfile.district : "Água Grande",
    },
    metrics: {
      rating: p.rating,
      totalReviews: p.reviews || 84,
      completedJobs: 142,
      responseTimeMinutes: 15,
      completionRatePct: 98.5,
    },
    coverage: {
      centerLat: 0.336,
      centerLng: 6.731,
      radiusKm: isMe && myProviderProfile?.radiusKm ? myProviderProfile.radiusKm : 15.0,
      districts: ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata"],
      baseAddress: "Av. 12 de Julho, Cidade de São Tomé",
    },
    portfolio,
    wallet: {
      availableBalance: 450.0,
      pendingEscrow: 120.0,
      currency: "STD",
      lastPayoutAt: Date.now() - 3 * 86400_000,
      payoutAccount: {
        method: "dobrapay",
        identifier: "+239 991 2345",
        holderName: p.name,
      },
    },
    kycDocuments: {
      idType: "bi_stp",
      idNumber: "STP-984214-B",
      status: kycStatus,
      frontDocUrl:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
      backDocUrl:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
      selfieUrl: p.image,
      residenceProofUrl:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      submittedAt: Date.now() - 30 * 86400_000,
      verifiedAt: Date.now() - 29 * 86400_000,
    },
    schedule: DEFAULT_WEEKLY_SCHEDULE,
  };
}
