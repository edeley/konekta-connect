/**
 * Inteligência Local e Padrões de Pedido para São Tomé e Príncipe (STP)
 * Especializado nos hábitos, infraestrutura e bairros reais de STP.
 */

export interface StpDistrictNeighborhoods {
  district: string;
  popularNeighborhoods: string[];
  commonLandmarks: string[];
}

export const STP_LOCAL_GEOGRAPHY: StpDistrictNeighborhoods[] = [
  {
    district: "Água Grande",
    popularNeighborhoods: [
      "São Gabriel",
      "Quinta de Santo António",
      "Pantufo",
      "Riboque",
      "Bairro do Hospital",
      "Almeirim",
      "Campo de Milho",
      "Madre de Deus",
      "Chamiço",
      "Cruzeiro",
      "Praça Yon Gato (Centro)",
      "Vila Maria",
    ],
    commonLandmarks: [
      "Junto ao Hospital Ayres de Menezes",
      "Perto do Mercado Grande (Bobô Kadogo)",
      "Próximo ao Liceu Nacional",
      "Perto da Embaixada de Portugal",
      "Junto ao Banco BISTP Centro",
      "Cruzamento do Riboque",
      "Perto da Rádio Nacional (RNSTP)",
    ],
  },
  {
    district: "Mé-Zóchi",
    popularNeighborhoods: [
      "Trindade (Centro)",
      "Batepá",
      "Bombom",
      "Cruzeiro",
      "Água Crioula",
      "Madalena",
      "Monte Café",
      "Caixão Grande",
      "Milagrosa",
      "Uba Budo",
    ],
    commonLandmarks: [
      "Perto da Rotunda da Trindade",
      "Junto à Igreja da Trindade",
      "Próximo ao Jardim Botânico do Bom Sucesso",
      "Perto da Roça Monte Café",
      "Cruzamento de Caixão Grande",
      "Subida de Batepá",
    ],
  },
  {
    district: "Lobata",
    popularNeighborhoods: [
      "Guadalupe (Centro)",
      "Agostinho Neto",
      "Conde",
      "Micoló",
      "Plano",
      "Fernão Dias",
      "Boa Entrada",
    ],
    commonLandmarks: [
      "Junto ao Hospital de Guadalupe",
      "Perto da Roça Agostinho Neto",
      "Praia de Micoló",
      "Próximo ao Monumento de Fernão Dias",
      "Entrada de Conde",
    ],
  },
  {
    district: "Cantagalo",
    popularNeighborhoods: [
      "Santana (Centro)",
      "Ribeira Afonso",
      "Covão",
      "Água-Izé",
      "Praia Mesquita",
      "Colónia Açoriana",
    ],
    commonLandmarks: [
      "Junto à Roça Água-Izé",
      "Perto da Câmara Distrital de Santana",
      "Próximo ao Clube Santana Resort",
      "Ponte de Ribeira Afonso",
    ],
  },
  {
    district: "Caué",
    popularNeighborhoods: [
      "São João dos Angolares (Centro)",
      "Porto Alegre",
      "Vila Malanza",
      "Praia Inhame",
      "Ponta Baleia",
    ],
    commonLandmarks: [
      "Junto à Roça São João dos Angolares",
      "Perto do cais de embarque para o Ilhéu das Rolas",
      "Próximo à Cascata da Praia Pesqueira",
      "Entrada de Porto Alegre",
    ],
  },
  {
    district: "Lembá",
    popularNeighborhoods: [
      "Neves (Centro)",
      "Santa Catarina",
      "Ponta Figo",
      "Monte Forte",
      "Generosa",
    ],
    commonLandmarks: [
      "Perto da Central Térmica de Neves",
      "Junto à Cervejeira Rosema",
      "Próximo à Roça Ponta Figo",
      "Final do alcatrão em Santa Catarina",
    ],
  },
  {
    district: "Príncipe (RAP)",
    popularNeighborhoods: [
      "Santo António (Capital)",
      "Porto Real",
      "Sundy",
      "Terreiro Velho",
      "Praia Burra",
      "Picão",
    ],
    commonLandmarks: [
      "Perto do Aeroporto do Príncipe",
      "Junto à Baía de Santo António",
      "Próximo à Roça Sundy (Espaço Eddington)",
      "Centro da Cidade de Santo António",
    ],
  },
];

export interface ServiceQuickTemplate {
  id: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  suggestedDesc: string;
  materialStatus: "tem_material" | "prestador_compra" | "avaliar";
  estimatedBudgetSTN: number;
  urgency: "urgente" | "esta-semana" | "sem-pressa";
  badge: string;
}

export const STP_QUICK_SERVICE_TEMPLATES: ServiceQuickTemplate[] = [
  // Eletricidade (Problema muito frequente em STP devido a quebras de fase e sobretensões)
  {
    id: "tpl-elet-1",
    categorySlug: "eletricista",
    categoryName: "Eletricista",
    title: "Curto-circuito ou queda constante de disjuntor",
    suggestedDesc:
      "O disjuntor principal está a disparar com frequência ao ligar electrodomésticos ou luzes. Preciso de teste de fase, isolamento e substituição do disjuntor com defeito.",
    materialStatus: "avaliar",
    estimatedBudgetSTN: 350,
    urgency: "urgente",
    badge: "⚡ Emergência Frequente",
  },
  {
    id: "tpl-elet-2",
    categorySlug: "eletricista",
    categoryName: "Eletricista",
    title: "Instalação de Inversor Solar / Bateria ou Grupo Gerador",
    suggestedDesc:
      "Pretendo ligar e configurar um inversor com baterias/gerador de socorro ao quadro da casa para garantir energia durante os cortes da EMAE.",
    materialStatus: "tem_material",
    estimatedBudgetSTN: 1200,
    urgency: "esta-semana",
    badge: "☀️ Energia de Socorro",
  },
  {
    id: "tpl-elet-3",
    categorySlug: "eletricista",
    categoryName: "Eletricista",
    title: "Instalação de tomadas, disjuntor e luzes LED",
    suggestedDesc:
      "Montagem de novas tomadas elétricas, interruptores e luminárias em quartos/sala. Verificação do fio terra de segurança.",
    materialStatus: "prestador_compra",
    estimatedBudgetSTN: 450,
    urgency: "esta-semana",
    badge: "💡 Instalação",
  },

  // Canalização & Água (Muito crítico em STP: tanques elevados, bombas e pressão)
  {
    id: "tpl-can-1",
    categorySlug: "canalizador",
    categoryName: "Canalizador",
    title: "Fuga de água urgente ou tubo furado",
    suggestedDesc:
      "Fuga de água visível em canalização de PVC/PEX na casa de banho ou cozinha. A torneira de corte geral não estanca totalmente.",
    materialStatus: "avaliar",
    estimatedBudgetSTN: 400,
    urgency: "urgente",
    badge: "🚰 Fuga de Água",
  },
  {
    id: "tpl-can-2",
    categorySlug: "canalizador",
    categoryName: "Canalizador",
    title: "Instalação de Bomba de Água e Tanque de Reserva",
    suggestedDesc:
      "Ligação de eletrobomba, boia automática e tubagem do tanque de reserva para alimentar a casa com pressão constante de água.",
    materialStatus: "tem_material",
    estimatedBudgetSTN: 950,
    urgency: "esta-semana",
    badge: "💧 Tanque & Bomba",
  },
  {
    id: "tpl-can-3",
    categorySlug: "canalizador",
    categoryName: "Canalizador",
    title: "Desentupimento de esgoto ou fossa séptica",
    suggestedDesc:
      "Esgoto da sanita/lava-louça lento ou entupido. Necessário desobstrução mecânica da caixa de visita e escoamento.",
    materialStatus: "avaliar",
    estimatedBudgetSTN: 500,
    urgency: "urgente",
    badge: "🛠️ Desentupimento",
  },

  // Ar Condicionado & Frio (Clima tropical húmido de STP exige manutenção periódica)
  {
    id: "tpl-ac-1",
    categorySlug: "ar-condicionado",
    categoryName: "Ar Condicionado",
    title: "Limpeza profunda, desinfeção e recarga de gás R410A",
    suggestedDesc:
      "O ar condicionado deita pouco ar frio e tem cheiro a humidade. Preciso de lavagem da unidade interna, condensadora exterior e verificação do nível de gás.",
    materialStatus: "prestador_compra",
    estimatedBudgetSTN: 600,
    urgency: "esta-semana",
    badge: "❄️ Manutenção & Gás",
  },
  {
    id: "tpl-ac-2",
    categorySlug: "ar-condicionado",
    categoryName: "Ar Condicionado",
    title: "Instalação completa de Ar Condicionado Split novo",
    suggestedDesc:
      "Montagem de aparelho novo de 9.000 ou 12.000 BTUs com suporte de parede, perfuração, tubos de cobre e ligação elétrica dedicada.",
    materialStatus: "tem_material",
    estimatedBudgetSTN: 1100,
    urgency: "esta-semana",
    badge: "❄️ Instalação Nova",
  },

  // Limpeza Residencial & Comercial
  {
    id: "tpl-limp-1",
    categorySlug: "limpeza",
    categoryName: "Limpeza",
    title: "Limpeza profunda geral de residência (Faxina Completa)",
    suggestedDesc:
      "Limpeza minuciosa de toda a casa: cozinha, armários, casas de banho, vidros, chão e terraço/varanda.",
    materialStatus: "tem_material",
    estimatedBudgetSTN: 550,
    urgency: "esta-semana",
    badge: "🧹 Faxina Geral",
  },
  {
    id: "tpl-limp-2",
    categorySlug: "limpeza",
    categoryName: "Limpeza",
    title: "Limpeza pós-obra ou mudança de casa",
    suggestedDesc:
      "Remoção de poeiras de cimento, tinta em chão/azulejos e higienização geral para entrada imediata na habitação.",
    materialStatus: "tem_material",
    estimatedBudgetSTN: 850,
    urgency: "urgente",
    badge: "🧽 Pós-Obra",
  },

  // Pintura e Tratamento de Humidade (Comum em STP devido ao salitre e chuvas)
  {
    id: "tpl-pint-1",
    categorySlug: "pintor",
    categoryName: "Pintor",
    title: "Tratamento de salitre, humidade e pintura de paredes",
    suggestedDesc:
      "Raspagem de tinta descascada por humidade/salitre, aplicação de hidrófugo/impermeabilizante e demãos de tinta anti-mofo.",
    materialStatus: "avaliar",
    estimatedBudgetSTN: 1400,
    urgency: "esta-semana",
    badge: "🎨 Tratamento & Tinta",
  },

  // Mecânica & Baterias (Estradas tropicais de STP)
  {
    id: "tpl-mec-1",
    categorySlug: "mecanico",
    categoryName: "Mecânico",
    title: "Carro não pega / Diagnóstico de Bateria ou Motor de Arranque",
    suggestedDesc:
      "A viatura está imobilizada no local. Preciso de socorro mecânico com multímetro/jump-starter para diagnóstico elétrico ou mecânico rápido.",
    materialStatus: "avaliar",
    estimatedBudgetSTN: 450,
    urgency: "urgente",
    badge: "🚗 Socorro Mecânico",
  },
];

/**
 * Retorna as referências e bairros sugeridos para um determinado distrito de STP
 */
export function getStpDistrictData(districtName: string): StpDistrictNeighborhoods {
  const found = STP_LOCAL_GEOGRAPHY.find(
    (g) => g.district.toLowerCase() === districtName.toLowerCase(),
  );
  return (
    found || {
      district: districtName,
      popularNeighborhoods: ["Centro", "Bairro Residencial", "Zona Comercial"],
      commonLandmarks: ["Perto da Igreja Principal", "Junto à Escola", "Perto da Praça"],
    }
  );
}
