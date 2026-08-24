/**
 * Catálogo do módulo de registo — dados mock preparados para migrar para o
 * backend (tabelas `categories`, `services`, `pricing_models`).
 * Realidade administrativa de São Tomé e Príncipe.
 */

export const STP_DISTRICTS = [
  "Água Grande",
  "Mé-Zóchi",
  "Lobata",
  "Lembá",
  "Cantagalo",
  "Caué",
  "Região Autónoma do Príncipe",
] as const;

export type StpDistrict = (typeof STP_DISTRICTS)[number];

/** Bairros/localidades sugeridos por distrito (autocompletar leve). */
export const LOCALITIES: Record<string, string[]> = {
  "Água Grande": [
    "Cidade de São Tomé",
    "Riboque",
    "Bairro Hospital",
    "Quinta de Santo António",
    "Pantufo",
  ],
  "Mé-Zóchi": ["Trindade", "Bombaim", "Madre de Deus", "Batepá"],
  Lobata: ["Guadalupe", "Conde", "Agostinho Neto", "Micoló"],
  Lembá: ["Neves", "Ponta Figo", "Santa Catarina"],
  Cantagalo: ["Santana", "Água Izé", "Ribeira Afonso"],
  Caué: ["São João dos Angolares", "Porto Alegre", "Ribeira Peixe"],
  "Região Autónoma do Príncipe": ["Santo António", "Sundy", "Praia Abade"],
};

export type PricingModel =
  | "hora"
  | "dia"
  | "servico"
  | "unidade"
  | "ponto"
  | "metro"
  | "m2"
  | "kg"
  | "projeto"
  | "orcamento"
  | "visita"
  | "diagnostico"
  | "deslocacao"
  | "mao_material"
  | "fixo"
  | "negociavel";

export const PRICING_LABELS: Record<PricingModel, string> = {
  hora: "Por hora",
  dia: "Por dia",
  servico: "Por serviço",
  unidade: "Por unidade",
  ponto: "Por ponto",
  metro: "Por metro",
  m2: "Por m²",
  kg: "Por kg",
  projeto: "Por projeto",
  orcamento: "Por orçamento",
  visita: "Por visita",
  diagnostico: "Por diagnóstico",
  deslocacao: "Por deslocação",
  mao_material: "Mão de obra + material",
  fixo: "Preço fixo",
  negociavel: "Preço negociável",
};

export type ServiceCategory = {
  id: string;
  name: string;
  emoji: string;
  /** Documentos extra exigidos pela categoria (além do BI). */
  requiresLicense?: boolean;
  pricing: PricingModel[];
  subcategories: { name: string; services: string[] }[];
};

export const SERVICE_TREE: ServiceCategory[] = [
  {
    id: "eletricidade",
    name: "Eletricidade",
    emoji: "⚡",
    requiresLicense: true,
    pricing: ["servico", "ponto", "hora", "visita", "orcamento"],
    subcategories: [
      {
        name: "Instalação",
        services: [
          "Instalação de tomada",
          "Instalação de quadro elétrico",
          "Instalação de iluminação",
        ],
      },
      {
        name: "Reparação",
        services: ["Curto-circuito", "Substituição de disjuntor", "Reparação de tomada"],
      },
      { name: "Energia solar", services: ["Instalação de painel solar", "Manutenção de bateria"] },
    ],
  },
  {
    id: "canalizacao",
    name: "Canalização",
    emoji: "🚰",
    pricing: ["servico", "hora", "visita", "orcamento", "mao_material"],
    subcategories: [
      {
        name: "Reparação",
        services: ["Fuga de água", "Desentupimento", "Substituição de torneira"],
      },
      {
        name: "Instalação",
        services: [
          "Instalação de autoclismo",
          "Instalação de depósito de água",
          "Instalação de chuveiro",
        ],
      },
    ],
  },
  {
    id: "limpeza",
    name: "Limpeza",
    emoji: "🧹",
    pricing: ["hora", "dia", "servico", "m2", "orcamento"],
    subcategories: [
      { name: "Doméstica", services: ["Limpeza geral", "Limpeza profunda", "Passar a ferro"] },
      { name: "Comercial", services: ["Limpeza de escritório", "Limpeza pós-obra"] },
    ],
  },
  {
    id: "construcao",
    name: "Construção",
    emoji: "🧱",
    pricing: ["m2", "dia", "projeto", "orcamento", "mao_material"],
    subcategories: [
      {
        name: "Alvenaria",
        services: ["Levantamento de parede", "Reboco", "Assentamento de blocos"],
      },
      { name: "Acabamentos", services: ["Colocação de azulejo", "Betonilha", "Tetos falsos"] },
    ],
  },
  {
    id: "pintura",
    name: "Pintura",
    emoji: "🖌️",
    pricing: ["m2", "dia", "servico", "orcamento", "mao_material"],
    subcategories: [
      { name: "Interior", services: ["Pintura de quarto", "Pintura de sala"] },
      { name: "Exterior", services: ["Pintura de fachada", "Pintura de muro"] },
    ],
  },
  {
    id: "carpintaria",
    name: "Carpintaria",
    emoji: "🪚",
    pricing: ["servico", "unidade", "dia", "projeto", "orcamento"],
    subcategories: [
      {
        name: "Móveis",
        services: ["Fabrico de armário", "Reparação de móvel", "Montagem de móvel"],
      },
      { name: "Portas e janelas", services: ["Instalação de porta", "Reparação de janela"] },
    ],
  },
  {
    id: "mecanica",
    name: "Mecânica auto",
    emoji: "🔧",
    pricing: ["diagnostico", "servico", "hora", "deslocacao", "orcamento"],
    subcategories: [
      { name: "Manutenção", services: ["Mudança de óleo", "Travões", "Revisão geral"] },
      { name: "Reparação", services: ["Motor", "Caixa de velocidades", "Sistema elétrico"] },
    ],
  },
  {
    id: "ar-condicionado",
    name: "Ar condicionado e frio",
    emoji: "❄️",
    pricing: ["unidade", "servico", "visita", "orcamento"],
    subcategories: [
      { name: "Instalação", services: ["Instalação de split", "Instalação de arca frigorífica"] },
      {
        name: "Manutenção",
        services: ["Limpeza de filtro", "Carga de gás", "Reparação de frigorífico"],
      },
    ],
  },
  {
    id: "jardinagem",
    name: "Jardinagem",
    emoji: "🌿",
    pricing: ["hora", "dia", "m2", "servico", "orcamento"],
    subcategories: [
      { name: "Manutenção", services: ["Corte de relva", "Poda de árvores", "Limpeza de terreno"] },
      { name: "Criação", services: ["Criação de jardim", "Plantação"] },
    ],
  },
  {
    id: "transporte",
    name: "Transporte e mudanças",
    emoji: "🚚",
    requiresLicense: true,
    pricing: ["servico", "hora", "kg", "deslocacao", "orcamento"],
    subcategories: [
      { name: "Mudanças", services: ["Mudança de casa", "Transporte de móveis"] },
      { name: "Cargas", services: ["Entrega de materiais", "Transporte de mercadoria"] },
    ],
  },
  {
    id: "beleza",
    name: "Beleza e bem-estar",
    emoji: "💇",
    pricing: ["servico", "hora", "unidade", "fixo", "deslocacao"],
    subcategories: [
      { name: "Cabelo", services: ["Corte", "Tranças", "Penteado"] },
      { name: "Estética", services: ["Manicure", "Pedicure", "Massagem"] },
    ],
  },
  {
    id: "costura",
    name: "Costura",
    emoji: "🧵",
    pricing: ["unidade", "servico", "fixo", "orcamento"],
    subcategories: [
      { name: "Confeção", services: ["Vestido", "Camisa", "Uniforme"] },
      { name: "Arranjos", services: ["Ajuste de roupa", "Substituição de fecho"] },
    ],
  },
  {
    id: "informatica",
    name: "Informática e redes",
    emoji: "💻",
    pricing: ["diagnostico", "servico", "hora", "visita", "orcamento"],
    subcategories: [
      {
        name: "Computadores",
        services: ["Formatação", "Reparação de portátil", "Remoção de vírus"],
      },
      {
        name: "Redes",
        services: ["Instalação de Wi-Fi", "Configuração de router", "Câmaras de vigilância"],
      },
    ],
  },
  {
    id: "eventos",
    name: "Eventos e catering",
    emoji: "🎉",
    pricing: ["servico", "dia", "unidade", "projeto", "orcamento"],
    subcategories: [
      { name: "Alimentação", services: ["Catering", "Bolos", "Bar"] },
      { name: "Organização", services: ["Decoração", "Som e luz", "Fotografia"] },
    ],
  },
  {
    id: "aulas",
    name: "Aulas e explicações",
    emoji: "📚",
    requiresLicense: true,
    pricing: ["hora", "servico", "fixo", "negociavel"],
    subcategories: [
      { name: "Escolar", services: ["Matemática", "Português", "Física e Química"] },
      { name: "Outras", services: ["Informática", "Inglês", "Música"] },
    ],
  },
];

export function categoryById(id: string) {
  return SERVICE_TREE.find((c) => c.id === id);
}

/** Modelos de cobrança relevantes para as categorias escolhidas. */
export function pricingModelsFor(categoryIds: string[]): PricingModel[] {
  const set = new Set<PricingModel>();
  categoryIds.forEach((id) => categoryById(id)?.pricing.forEach((p) => set.add(p)));
  return [...set];
}

export type RequiredDocument = {
  id: string;
  label: string;
  hint: string;
  required: boolean;
  /** 2 = precisa de frente e verso. */
  sides: 1 | 2;
  format: "image" | "pdf";
};

/** Documentos exigidos consoante o tipo de prestador e categorias. */
export function requiredDocuments(
  kind: "individual" | "empresa",
  categoryIds: string[],
): RequiredDocument[] {
  const docs: RequiredDocument[] = [
    {
      id: "bi",
      label: "Documento de identidade (BI ou passaporte)",
      hint: "Fotografe o documento",
      required: true,
      sides: 2,
      format: "image",
    },
  ];
  if (kind === "empresa") {
    docs.push({
      id: "empresa",
      label: "Registo comercial da empresa",
      hint: "Envie o ficheiro em PDF (documento de constituição ou NIF)",
      required: true,
      sides: 1,
      format: "pdf",
    });
  }
  if (categoryIds.some((id) => categoryById(id)?.requiresLicense)) {
    docs.push({
      id: "licenca",
      label: "Licença ou certificação profissional",
      hint: "Apenas para atividades reguladas",
      required: false,
      sides: 1,
      format: "pdf",
    });
  }
  return docs;
}

export const WEEK_DAYS = [
  { id: "seg", label: "Seg" },
  { id: "ter", label: "Ter" },
  { id: "qua", label: "Qua" },
  { id: "qui", label: "Qui" },
  { id: "sex", label: "Sex" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
] as const;

export const SERVICE_RADIUS = [
  "5 km",
  "10 km",
  "20 km",
  "30 km",
  "Toda a região selecionada",
] as const;

export const PAYMENT_PREFERENCES = [
  { id: "sao_wallet", label: "São Wallet", hint: "Pagamento móvel" },
  { id: "konekta", label: "Carteira KONEKTA", hint: "Saldo dentro da app" },
  { id: "dinheiro", label: "Dinheiro no local", hint: "Paga ao prestador" },
  { id: "depois", label: "Configurar depois", hint: "Escolhe no primeiro pedido" },
] as const;
