import electricianImg from "@/assets/provider-electrician.jpg";
import plumberImg from "@/assets/provider-plumber.jpg";
import cleanerImg from "@/assets/provider-cleaner.jpg";
import painterImg from "@/assets/provider-painter.jpg";

export type Category = {
  slug: string;
  name: string;
  tint: "cocoa" | "ocean" | "sun" | "terracotta";
};

export type PortfolioItem = {
  id: string;
  title: string;
  image: string;
  description?: string;
  category?: string;
  date?: string;
};

export const categories: Category[] = [
  { slug: "eletricista", name: "Eletricista", tint: "cocoa" },
  { slug: "canalizador", name: "Canalizador", tint: "ocean" },
  { slug: "limpeza", name: "Limpeza", tint: "sun" },
  { slug: "pintor", name: "Pintor", tint: "terracotta" },
  { slug: "mecanico", name: "Mecânico", tint: "cocoa" },
  { slug: "jardinagem", name: "Jardinagem", tint: "ocean" },
  { slug: "ar-condicionado", name: "Ar Condicionado", tint: "sun" },
  { slug: "beleza", name: "Beleza", tint: "terracotta" },
];

export type BillingMethodType = "fixo" | "hora" | "diagnostico" | "orcamento";

export type ServiceItemDetail = {
  id: string;
  name: string;
  price: number; // in STN
  billingMethod: BillingMethodType;
  billingLabel: string; // "Preço Fixo", "Por Hora", "Diagnóstico / Visita", "Sob Orçamento"
  unit?: string; // "serviço", "hora", "visita", "projeto"
  duration?: string;
  description?: string;
  travelFeeAmount?: number;
};

export type Provider = {
  id: string;
  name: string;
  category: string;
  categorySlug?: string;
  rating: number;
  reviews: number;
  reviewsCount?: number;
  priceFrom: number;
  image: string;
  bio: string;
  services: string[];
  detailedServices?: ServiceItemDetail[];
  portfolio?: PortfolioItem[];
  district?: string;
  districts?: string[];
  phone?: string;
  status?: string;
  verified?: boolean;
};

export const providers: Provider[] = [
  {
    id: "edmilson-varela",
    name: "Edmilson Varela",
    category: "Eletricista",
    rating: 4.9,
    reviews: 128,
    priceFrom: 450,
    image: electricianImg,
    bio: "Eletricista certificado com 8 anos de experiência em instalações residenciais e comerciais em São Tomé.",
    services: ["Instalações", "Reparações", "Iluminação", "Quadros elétricos"],
    detailedServices: [
      {
        id: "ev-s1",
        name: "Instalações Elétricas Residenciais",
        price: 450,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "ponto/divisão",
        duration: "1h - 2h",
        description: "Instalação de tomadas, interruptores e circuitos novos com teste de carga.",
      },
      {
        id: "ev-s2",
        name: "Reparações & Deteção de Curto-circuito",
        price: 350,
        billingMethod: "diagnostico",
        billingLabel: "Diagnóstico & Reparação",
        unit: "avaria",
        duration: "1h",
        description: "Identificação rápida de avarias, cabos queimados ou fuga de corrente.",
      },
      {
        id: "ev-s3",
        name: "Iluminação & Focos LED Embutidos",
        price: 300,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "conjunto",
        duration: "1h30",
        description: "Montagem de focos LED, apliques de parede e fitas de iluminação.",
      },
      {
        id: "ev-s4",
        name: "Quadros Elétricos & Disjuntores",
        price: 650,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "quadro",
        duration: "2h - 3h",
        description: "Montagem e substituição de disjuntores diferenciais e proteção contra picos.",
      },
      {
        id: "ev-s5",
        name: "Visita Técnica & Diagnóstico no Local",
        price: 180,
        billingMethod: "diagnostico",
        billingLabel: "Visita / Diagnóstico",
        unit: "visita",
        duration: "45min",
        description: "Deslocação ao local para avaliação técnica pormenorizada da instalação.",
      },
      {
        id: "ev-s6",
        name: "Mão-de-Obra Elétrica por Hora",
        price: 250,
        billingMethod: "hora",
        billingLabel: "Por Hora",
        unit: "hora",
        duration: "1h+",
        description: "Serviço contínuo de eletricista faturado com base nas horas necessárias.",
      },
      {
        id: "ev-s7",
        name: "Grande Reforma / Instalação Completa",
        price: 0,
        billingMethod: "orcamento",
        billingLabel: "Sob Orçamento",
        unit: "projeto",
        duration: "Sob avaliação",
        description: "Envio de plano e orçamento sob medida após avaliação no chat da app.",
      },
    ],
    portfolio: [
      {
        id: "ev-1",
        title: "Montagem de Quadro Trifásico Residencial",
        description:
          "Instalação completa com disjuntores diferenciais e proteção contra picos em Santana.",
        image:
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        category: "Quadros Elétricos",
        date: "Jul 2026",
      },
      {
        id: "ev-2",
        title: "Iluminação LED Embutida em Teto Falso",
        description: "Design e ligação de focos embutidos e fitas LED na sala de estar.",
        image:
          "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
        category: "Iluminação",
        date: "Jun 2026",
      },
      {
        id: "ev-3",
        title: "Sistema de Energia Solar & Inversor",
        description: "Ligação de baterias e inversor híbrido para autonomia elétrica.",
        image:
          "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        category: "Energia Solar",
        date: "Mai 2026",
      },
      {
        id: "ev-4",
        title: "Substituição e Reparação de Cabos",
        description: "Troca de fiação antiga e testes de condutividade em moradia na Trindade.",
        image:
          "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
        category: "Instalações",
        date: "Abr 2026",
      },
    ],
  },
  {
    id: "dercio-costa",
    name: "Dércio Costa",
    category: "Canalizador",
    rating: 4.8,
    reviews: 84,
    priceFrom: 380,
    image: plumberImg,
    bio: "Especialista em canalização doméstica, deteção de fugas e reparação de tubagens.",
    services: ["Fugas", "Reparações", "Instalação de torneiras", "Aquecedores"],
    detailedServices: [
      {
        id: "dc-s1",
        name: "Deteção e Reparação de Fugas de Água",
        price: 380,
        billingMethod: "diagnostico",
        billingLabel: "Diagnóstico & Reparação",
        unit: "ponto de fuga",
        duration: "1h - 2h",
        description: "Localização precisa de ruturas em tubos de água fria ou quente e reparação.",
      },
      {
        id: "dc-s2",
        name: "Instalação de Torneiras, Lavatórios e Sanitários",
        price: 280,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "peça",
        duration: "1h",
        description: "Montagem e substituição com isolamento e vedação completa.",
      },
      {
        id: "dc-s3",
        name: "Desentupimento de Canos e Esgotos",
        price: 420,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "ponto",
        duration: "1h30",
        description: "Desobstrução mecânica de tubagens, sifões e ralos de chão.",
      },
      {
        id: "dc-s4",
        name: "Instalação de Termoacumulador & Aquecedor",
        price: 550,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "aparelho",
        duration: "2h - 3h",
        description: "Ligação hidráulica e elétrica segura de sistemas de água quente.",
      },
      {
        id: "dc-s5",
        name: "Visita de Inspeção e Diagnóstico",
        price: 150,
        billingMethod: "diagnostico",
        billingLabel: "Visita / Diagnóstico",
        unit: "visita",
        duration: "45min",
        description:
          "Avaliação técnica no local para diagnosticar problemas complexos de canalização.",
      },
      {
        id: "dc-s6",
        name: "Mão-de-Obra de Canalizador por Hora",
        price: 220,
        billingMethod: "hora",
        billingLabel: "Por Hora",
        unit: "hora",
        duration: "1h+",
        description: "Serviço com cobrança flexível por hora trabalhada.",
      },
      {
        id: "dc-s7",
        name: "Instalação Completa de Rede de Águas",
        price: 0,
        billingMethod: "orcamento",
        billingLabel: "Sob Orçamento",
        unit: "projeto",
        duration: "Sob avaliação",
        description: "Projeto de canalização integral para casas novas ou remodelações.",
      },
    ],
    portfolio: [
      {
        id: "dc-1",
        title: "Instalação de Termoacumulador & Tubagem PEX",
        description: "Montagem de água quente e fria com isolamento térmico em São Tomé.",
        image:
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
        category: "Aquecedores",
        date: "Jul 2026",
      },
      {
        id: "dc-2",
        title: "Renovação de Casa de Banho e Loiças",
        description: "Substituição de canalização de esgoto e montagem de torneiras misturadoras.",
        image:
          "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
        category: "Instalação",
        date: "Jun 2026",
      },
      {
        id: "dc-3",
        title: "Deteção e Reparação de Fuga Oculta",
        description: "Localização precisa de rutura de cano sem partir paredes desnecessariamente.",
        image:
          "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
        category: "Fugas",
        date: "Mai 2026",
      },
    ],
  },
  {
    id: "maria-santos",
    name: "Maria Santos",
    category: "Limpeza",
    rating: 4.9,
    reviews: 212,
    priceFrom: 250,
    image: cleanerImg,
    bio: "Limpeza residencial profunda e regular. Serviço meticuloso e de confiança.",
    services: ["Limpeza geral", "Limpeza profunda", "Pós-obra", "Escritórios"],
    detailedServices: [
      {
        id: "ms-s1",
        name: "Limpeza Geral Residencial",
        price: 250,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "casa (T1/T2)",
        duration: "3h - 4h",
        description: "Aspiração, lavagem de pisos, pó, casa de banho e cozinha standard.",
      },
      {
        id: "ms-s2",
        name: "Limpeza Profunda Detalhada",
        price: 450,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "moradia/apto",
        duration: "5h - 6h",
        description: "Higienização a fundo de eletrodomésticos, azulejos, janelas e estofos.",
      },
      {
        id: "ms-s3",
        name: "Limpeza Pós-Obra & Pintura",
        price: 650,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "obra",
        duration: "1 dia",
        description: "Remoção de resíduos de cimento, tintas, gorduras e pós finos de construção.",
      },
      {
        id: "ms-s4",
        name: "Limpeza de Escritórios Comerciais",
        price: 350,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "turno",
        duration: "3h",
        description: "Desinfeção de secretárias, salas de reunião e sanitários profissionais.",
      },
      {
        id: "ms-s5",
        name: "Serviço de Limpeza por Hora",
        price: 90,
        billingMethod: "hora",
        billingLabel: "Por Hora",
        unit: "hora",
        duration: "2h+",
        description: "Apoio doméstico pontual cobrado de acordo com as horas de trabalho.",
      },
      {
        id: "ms-s6",
        name: "Diária Completa de Empregada Doméstica",
        price: 350,
        billingMethod: "hora",
        billingLabel: "Por Diária",
        unit: "dia",
        duration: "8h",
        description: "Dia completo dedicado a tarefas de limpeza, engomadoria e organização.",
      },
    ],
    portfolio: [
      {
        id: "ms-1",
        title: "Limpeza Pós-Obra em Moradia",
        description: "Remoção de poeiras, resíduos de tinta e polimento de pavimentos cerâmicos.",
        image:
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        category: "Pós-obra",
        date: "Jul 2026",
      },
      {
        id: "ms-2",
        title: "Higienização Profunda de Cozinha",
        description: "Desengorduramento completo de forno, exaustor e armários embutidos.",
        image:
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        category: "Limpeza Profunda",
        date: "Jun 2026",
      },
      {
        id: "ms-3",
        title: "Manutenção de Escritório Comercial",
        description:
          "Limpeza diária de postos de trabalho e áreas comuns num escritório na capital.",
        image:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        category: "Escritórios",
        date: "Mai 2026",
      },
    ],
  },
  {
    id: "joao-pedro",
    name: "João Pedro",
    category: "Pintor",
    rating: 4.7,
    reviews: 63,
    priceFrom: 600,
    image: painterImg,
    bio: "Pintor profissional. Interiores, exteriores e acabamentos decorativos.",
    services: ["Pintura interior", "Pintura exterior", "Estuque", "Vernizes"],
    detailedServices: [
      {
        id: "jp-s1",
        name: "Pintura de Interior (por divisão)",
        price: 500,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "divisão",
        duration: "1 - 2 dias",
        description: "Preparação de paredes, lixagem e 2 a 3 demãos de tinta plástica lavável.",
      },
      {
        id: "jp-s2",
        name: "Pintura Exterior & Muros de Fachada",
        price: 750,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "fachada/área",
        duration: "2 - 3 dias",
        description:
          "Impermeabilização e aplicação de tinta de membrana resistente ao clima tropical.",
      },
      {
        id: "jp-s3",
        name: "Aplicação de Estuque & Reparação de Fissuras",
        price: 380,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "área",
        duration: "1 dia",
        description: "Alisamento de paredes, eliminação de gretas e preparação para pintura.",
      },
      {
        id: "jp-s4",
        name: "Tratamento & Envernizamento de Madeiras",
        price: 420,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "conjunto",
        duration: "1 dia",
        description: "Lixagem e aplicação de verniz marítimo protetor contra sol e humidade.",
      },
      {
        id: "jp-s5",
        name: "Diária de Pintor Profissional",
        price: 350,
        billingMethod: "hora",
        billingLabel: "Por Diária",
        unit: "dia",
        duration: "8h",
        description: "Mão-de-obra contratada por dia para apoio contínuo em pinturas.",
      },
      {
        id: "jp-s6",
        name: "Visita de Medição & Avaliação",
        price: 150,
        billingMethod: "diagnostico",
        billingLabel: "Visita / Avaliação",
        unit: "visita",
        duration: "45min",
        description: "Medição de metros quadrados no local e cálculo exato de tintas necessárias.",
      },
      {
        id: "jp-s7",
        name: "Pintura Integral de Edifício / Vivenda",
        price: 0,
        billingMethod: "orcamento",
        billingLabel: "Sob Orçamento",
        unit: "projeto",
        duration: "Sob avaliação",
        description: "Orçamento global com fornecimento de materiais ou apenas mão-de-obra.",
      },
    ],
    portfolio: [
      {
        id: "jp-1",
        title: "Pintura Decorativa de Sala de Estar",
        description:
          "Aplicação de tinta acrílica lavável com acabamento acetinado de alta durabilidade.",
        image:
          "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
        category: "Pintura Interior",
        date: "Jul 2026",
      },
      {
        id: "jp-2",
        title: "Impermeabilização e Pintura de Fachada Externa",
        description: "Proteção contra humidade e chuvas tropicais em edifício residencial.",
        image:
          "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
        category: "Pintura Exterior",
        date: "Jun 2026",
      },
      {
        id: "jp-3",
        title: "Tratamento e Envernizamento de Portas e Madeiras",
        description: "Lixagem e aplicação de verniz marítimo resistente ao sol.",
        image:
          "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
        category: "Vernizes",
        date: "Mai 2026",
      },
    ],
  },
  {
    id: "manuel-cravid",
    name: "Manuel Cravid",
    category: "Ar Condicionado",
    categorySlug: "ar-condicionado",
    rating: 4.9,
    reviews: 64,
    reviewsCount: 64,
    priceFrom: 450,
    image:
      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=800&q=80",
    bio: "Técnico Especialista em Refrigeração, Geladeiras e Climatização com mais de 12 anos de experiência em São Tomé. Diagnóstico e reparação de geladeiras, congeladores, arcas frigoríficas, recarga de gás R134a/R600a e ar condicionado split.",
    services: [
      "Reparação e Diagnóstico de Geladeira / Frigorífico",
      "Recarga de Gás Refrigerante (Geladeiras e AC)",
      "Manutenção e Limpeza Profunda de Ar Condicionado",
      "Reparação de Arcas Congeladoras e Frio Comercial",
      "Substituição de Termostato e Compressor",
    ],
    districts: ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata"],
    verified: true,
    badges: ["Verificado KONEKTA", "Especialista em Frio", "Top Avaliado"],
    detailedServices: [
      {
        id: "mc-s1",
        name: "Reparação e Diagnóstico de Geladeira / Frigorífico",
        price: 450,
        billingMethod: "diagnostico",
        billingLabel: "Diagnóstico + Mão-de-Obra",
        unit: "aparelho",
        duration: "1h30",
        description:
          "Verificação de compressor, fuga de gás, descongelação automática, termostato e placa eletrónica.",
      },
      {
        id: "mc-s2",
        name: "Recarga de Gás Refrigerante (Geladeira ou AC)",
        price: 550,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "serviço",
        duration: "1h",
        description:
          "Vácuo no circuito frigorífico e injeção de gás ecológico de alta eficiência adequado ao equipamento.",
      },
      {
        id: "mc-s3",
        name: "Manutenção & Limpeza Profunda de Ar Condicionado Split",
        price: 500,
        billingMethod: "fixo",
        billingLabel: "Por Aparelho",
        unit: "unidade",
        duration: "1h30",
        description:
          "Higienização com produto antibacteriano das serpentinas, turbina, filtros e desobstrução do dreno.",
      },
      {
        id: "mc-s4",
        name: "Reparação de Arca Congeladora / Frio Comercial",
        price: 600,
        billingMethod: "diagnostico",
        billingLabel: "Diagnóstico no Local",
        unit: "aparelho",
        duration: "2h",
        description:
          "Intervenção em arcas horizontais e congeladores verticais domésticos ou comerciais.",
      },
      {
        id: "mc-s5",
        name: "Substituição de Compressor ou Motor de Frio",
        price: 750,
        billingMethod: "fixo",
        billingLabel: "Mão-de-Obra Técnica",
        unit: "serviço",
        duration: "2h30",
        description:
          "Instalação e brasagem de novo compressor com teste de estanqueidade e nova carga de óleo/gás.",
      },
    ],
    portfolio: [
      {
        id: "mc-1",
        title: "Reparação de Geladeira No-Frost com Fuga de Gás",
        description: "Soldadura de tubagem em cobre, teste de pressão e recarga de gás R600a.",
        image:
          "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
        category: "Geladeiras",
        date: "Ago 2026",
      },
      {
        id: "mc-2",
        title: "Instalação de Ar Condicionado Split Inverter 12000 BTU",
        description: "Instalação de unidade interior e exterior com suporte antivibratório.",
        image:
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        category: "Climatização",
        date: "Jul 2026",
      },
    ],
  },
  {
    id: "helder-aguiar",
    name: "Hélder Aguiar",
    category: "Mecânico",
    categorySlug: "mecanico",
    rating: 4.8,
    reviews: 51,
    reviewsCount: 51,
    priceFrom: 400,
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    bio: "Mecânico automotivo e técnico eletromecânico para geradores residenciais e comerciais em São Tomé e Príncipe. Assistência rápida, socorro de estrada e diagnóstico avançado.",
    services: [
      "Diagnóstico Mecânico & Eletrónico de Viatura",
      "Manutenção e Reparação de Geradores de Energia",
      "Mudança de Óleo, Filtros e Velas",
      "Reparação de Travões e Embraiagem",
      "Socorro de Bateria & Arranque no Local",
    ],
    districts: ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata", "Lembá"],
    verified: true,
    badges: ["Verificado KONEKTA", "Especialista em Geradores", "Piquete Rápido"],
    detailedServices: [
      {
        id: "ha-s1",
        name: "Diagnóstico Mecânico de Viatura no Local",
        price: 400,
        billingMethod: "diagnostico",
        billingLabel: "Visita / Diagnóstico",
        unit: "viatura",
        duration: "1h",
        description:
          "Inspeção de ruídos no motor, suspensão, falha de ignição e testes de estrada.",
      },
      {
        id: "ha-s2",
        name: "Manutenção Preventiva de Gerador Diesel ou Gasolina",
        price: 500,
        billingMethod: "fixo",
        billingLabel: "Preço Fixo",
        unit: "gerador",
        duration: "1h30",
        description: "Substituição de óleo, filtro de gasóleo/gasolina, limpeza de bicos e velas.",
      },
      {
        id: "ha-s3",
        name: "Reparação de Travões (Calços, Discos e Sangria)",
        price: 450,
        billingMethod: "fixo",
        billingLabel: "Mão-de-Obra",
        unit: "serviço",
        duration: "2h",
        description:
          "Substituição de pastilhas de travão dianteiras e traseiras com sangria de óleo.",
      },
    ],
  },
  {
    id: "armando-santo",
    name: "Armando Espírito Santo",
    category: "Jardinagem",
    categorySlug: "jardinagem",
    rating: 4.9,
    reviews: 42,
    reviewsCount: 42,
    priceFrom: 350,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    bio: "Jardineiro profissional com vasta experiência na manutenção de quintais, corte de relva com roçadora a gasolina, podas controladas de árvores e coqueiros e paisagismo tropical em STP.",
    services: [
      "Roçagem de Capim e Limpeza de Terreno",
      "Corte e Nivelamento de Relva",
      "Poda de Árvores, Palmeiras e Coqueiros",
      "Tratamento de Canteiros e Adubação",
      "Diária Completa de Jardinagem",
    ],
    districts: ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata"],
    verified: true,
    badges: ["Verificado KONEKTA", "Equipamento Próprio", "Pontual"],
    detailedServices: [
      {
        id: "as-s1",
        name: "Roçagem de Capim e Limpeza com Roçadora",
        price: 350,
        billingMethod: "fixo",
        billingLabel: "Por Lote / Quintal",
        unit: "serviço",
        duration: "2h - 3h",
        description:
          "Corte completo de capim alto e ervas daninhas com roçadora a gasolina própria.",
      },
      {
        id: "as-s2",
        name: "Poda de Árvores e Coqueiros Altos",
        price: 450,
        billingMethod: "fixo",
        billingLabel: "Mão-de-Obra",
        unit: "serviço",
        duration: "2h",
        description:
          "Poda de ramos perigosos próximos de telhados ou cabos elétricos com recolha de resíduos.",
      },
    ],
  },
  {
    id: "carla-sacramento",
    name: "Carla Sacramento",
    category: "Beleza",
    categorySlug: "beleza",
    rating: 5.0,
    reviews: 78,
    reviewsCount: 78,
    priceFrom: 300,
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    bio: "Cabeleireira e esteticista profissional com atendimento personalizado ao domicílio ou salão em São Tomé. Especialista em tranças afro, penteados para casamentos, manicure, pedicure e unhas de gel.",
    services: [
      "Tranças Afro (Box Braids / Nagô / Twists)",
      "Manicure & Pedicure Completa",
      "Unhas de Gel e Verniz Gel",
      "Tratamento Capilar e Hidratação Profunda",
      "Penteados e Maquilhagem para Eventos",
    ],
    districts: ["Água Grande", "Mé-Zóchi"],
    verified: true,
    badges: ["Verificado KONEKTA", "Atendimento ao Domicílio", "5 Estrelas"],
    detailedServices: [
      {
        id: "cs-s1",
        name: "Tranças Afro (Box Braids / Twists / Nagô)",
        price: 450,
        billingMethod: "fixo",
        billingLabel: "Penteado Completo",
        unit: "serviço",
        duration: "3h - 5h",
        description: "Trançado perfeito com ou sem postiço, acabamento profissional e duradouro.",
      },
      {
        id: "cs-s2",
        name: "Manicure & Pedicure com Tratamento de Cutículas",
        price: 250,
        billingMethod: "fixo",
        billingLabel: "Completo",
        unit: "serviço",
        duration: "1h",
        description: "Higienização, esfoliação, corte, limagem e pintura com verniz de qualidade.",
      },
    ],
  },
];

export type OrderStatus =
  | "pendente"
  | "aceite"
  | "a-caminho"
  | "em-execucao"
  | "aguardando-codigo"
  | "concluido"
  | "avaliado"
  | "cancelado";

export type Order = {
  id: string;
  providerId: string;
  service: string;
  category?: string;
  scheduledFor: string;
  status: OrderStatus;
  total: number;
  address?: string;
  district?: string;
  location?: string;
  clientPhone?: string;
  referencePoint?: string;
  notes?: string;
  paymentMethod?: "carteira" | "dinheiro" | "mbway";
  createdAt?: number;
  startedAt?: number;
  finishedAt?: number;
  completedAt?: number;
  /** Coordenadas e rotas GPS de alta precisão (Estilo Encontrar Dispositivo / Google Maps) */
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  mapsUrl?: string;
  directionsUrl?: string;
  wazeUrl?: string;
  appleMapsUrl?: string;
  gpsAddress?: string;
  /** Código de validação OTP de 4 dígitos para o cliente fornecer ao prestador na conclusão */
  completionCode?: string;
  rating?: { stars: number; comment?: string; at: number; tags?: string[]; recommended?: boolean };
  /** Avaliação mútua efetuada pelo prestador ao cliente após conclusão do serviço */
  clientRating?: {
    stars: number;
    comment?: string;
    at: number;
    tags?: string[];
    recommended?: boolean;
  };
  clientName?: string;
  clientAvatar?: string;
  photos?: string[];
  materials?: string;
  warranty?: string;
  breakdown?: {
    labor?: number;
    materials?: number;
    escrowFee?: number;
  };
  dispute?: {
    reason: string;
    createdAt: number;
    status: "aberta" | "resolvida";
  };
  /** Pedido publicado que originou este serviço (modelo de propostas) */
  requestId?: string;
  /** Confirmação de presença no local pelo prestador */
  presenceConfirmedAt?: number;
  /** Cobrança do prestador com comprovativo anexado */
  charge?: {
    amount: number;
    proofImage?: string;
    proofFileName?: string;
    note?: string;
    at: number;
    status: "pendente" | "pago";
    paidAt?: number;
  };
};

export const orders: Order[] = [
  {
    id: "KNK-1042",
    providerId: "edmilson-varela",
    service: "Instalação de iluminação",
    category: "Eletricista",
    scheduledFor: "Hoje, 15:00",
    status: "a-caminho",
    total: 450,
    address: "Bairro do Hospital, Rua dos Coqueiros nº 14, São Tomé",
    district: "Água Grande",
    referencePoint: "Próximo ao Hospital Dr. Ayres de Menezes",
    latitude: 0.3372,
    longitude: 6.7324,
    accuracy: 6,
    mapsUrl: "https://www.google.com/maps?q=0.3372,6.7324&z=18",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=0.3372,6.7324&travelmode=driving",
    notes:
      "Instalação de 6 focos embutidos LED na sala de estar, verificação do disjuntor principal e substituição do interruptor duplo.",
    paymentMethod: "carteira",
    createdAt: Date.now() - 3600000 * 2,
    completionCode: "5821",
    clientName: "Clara Mendes",
    photos: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
    ],
    warranty: "Garantia de 3 meses em todas as ligações e disjuntores instalados",
    breakdown: { labor: 350, materials: 100, escrowFee: 22.5 },
  },
  {
    id: "KNK-1039",
    providerId: "maria-santos",
    service: "Limpeza profunda",
    category: "Limpeza",
    scheduledFor: "Amanhã, 09:00",
    status: "aceite",
    total: 550,
    address: "Avenida 12 de Julho, perto da Sé Catedral, São Tomé",
    district: "Água Grande",
    notes:
      "Limpeza profunda e higienização completa de apartamento T3, incluindo desinfeção da cozinha, casas de banho e limpeza das janelas de vidro.",
    paymentMethod: "carteira",
    createdAt: Date.now() - 3600000 * 5,
    completionCode: "9342",
    clientName: "Dr. João Sacramento",
    photos: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
    ],
    warranty:
      "Garantia de retoque sem custos adicionais em até 24h caso haja algum detalhe a retificar",
    breakdown: { labor: 450, materials: 100, escrowFee: 27.5 },
  },
  {
    id: "KNK-1021",
    providerId: "dercio-costa",
    service: "Reparação de fuga",
    category: "Canalização",
    scheduledFor: "12 Nov, 14:00",
    status: "concluido",
    total: 380,
    address: "Vila Maria, perto da escola primária, Trindade",
    district: "Mé-Zóchi",
    notes:
      "Deteção e reparação de fuga de água persistente sob o lavatório da casa de banho principal, substituição do sifão e vedação.",
    paymentMethod: "carteira",
    createdAt: Date.now() - 86400000 * 3,
    completionCode: "4190",
    completedAt: Date.now() - 86400000 * 2,
    clientName: "Ana Paula Silva",
    photos: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80",
    ],
    warranty: "Garantia de 6 meses contra fugas na canalização reparada",
    breakdown: { labor: 300, materials: 80, escrowFee: 19 },
    rating: {
      stars: 5,
      comment:
        "Excelente profissional! Detetou a fuga de água na casa de banho em 10 minutos e reparou tudo sem partir azulejos desnecessários. Muito pontual, educado e deixou o chão limpo.",
      at: Date.now() - 86400000 * 2,
      tags: ["Pontualidade", "Trabalho Limpo", "Rigor Técnico"],
      recommended: true,
    },
  },
];

export const statusLabel: Record<OrderStatus, string> = {
  pendente: "Pendente",
  aceite: "Aceite",
  "a-caminho": "A caminho",
  "em-execucao": "Em execução",
  "aguardando-codigo": "Aguardando Código",
  concluido: "Concluído",
  avaliado: "Avaliado",
  cancelado: "Cancelado",
};

export function getProvider(id: string) {
  const found = providers.find((p) => p.id === id);
  if (found) return found;
  if (id === "me" || id === "usr-provider") {
    return {
      ...providers[0],
      id,
      name: "Edmilson Varela (Você)",
    };
  }
  return providers[0];
}

export function getProviderServicesWithPricing(provider: Provider): ServiceItemDetail[] {
  if (provider.detailedServices && provider.detailedServices.length > 0) {
    return provider.detailedServices;
  }

  // Fallback inteligente para prestadores sem lista detalhada explícita
  const basePrice = provider.priceFrom || 350;
  return provider.services.map((s, idx) => {
    let billingMethod: BillingMethodType = "fixo";
    let billingLabel = "Preço Fixo";
    let price = basePrice;
    let unit = "serviço";
    let duration = "1h - 2h";

    const sLower = s.toLowerCase();
    if (sLower.includes("hora") || sLower.includes("diária") || sLower.includes("tempo")) {
      billingMethod = "hora";
      billingLabel = "Por Hora";
      unit = "hora";
      price = Math.round(basePrice * 0.6);
      duration = "1h+";
    } else if (
      sLower.includes("fuga") ||
      sLower.includes("repar") ||
      sLower.includes("diagnóst") ||
      sLower.includes("visita")
    ) {
      billingMethod = "diagnostico";
      billingLabel = "Diagnóstico";
      unit = "avaria";
      price = Math.round(basePrice * 0.85);
      duration = "1h";
    } else if (
      sLower.includes("obra") ||
      sLower.includes("reforma") ||
      sLower.includes("completo") ||
      sLower.includes("projeto")
    ) {
      billingMethod = "orcamento";
      billingLabel = "Sob Orçamento";
      unit = "projeto";
      price = 0;
      duration = "Sob avaliação";
    } else {
      price = basePrice + idx * 50;
    }

    return {
      id: `${provider.id}-srv-${idx}`,
      name: s,
      price,
      billingMethod,
      billingLabel,
      unit,
      duration,
      description: `Serviço especializado de ${s} realizado com garantia KONEKTA em São Tomé.`,
    };
  });
}

export const STP_DISTRICTS = [
  "Água Grande",
  "Mé-Zóchi",
  "Lobata",
  "Cantagalo",
  "Caué",
  "Lemba",
  "Príncipe (RAP)",
] as const;
