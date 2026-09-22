import { calculateDistanceKm } from "./stp-geo";
import type { Provider } from "./konekta-data";

export type DistrictCoords = {
  name: string;
  lat: number;
  lng: number;
};

export const STP_DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "Água Grande": { lat: 0.3365, lng: 6.7273 },
  "Mé-Zóchi": { lat: 0.2989, lng: 6.6491 },
  Lobata: { lat: 0.3601, lng: 6.6608 },
  Cantagalo: { lat: 0.2201, lng: 6.7051 },
  Lembá: { lat: 0.3583, lng: 6.5504 },
  Caué: { lat: 0.1384, lng: 6.6471 },
  "Região Autónoma do Príncipe": { lat: 1.6385, lng: 7.4201 },
  "Pagué (Príncipe)": { lat: 1.6385, lng: 7.4201 },
  Príncipe: { lat: 1.6385, lng: 7.4201 },
};

export const STP_DISTRICT_LIST = [
  "Água Grande",
  "Mé-Zóchi",
  "Lobata",
  "Cantagalo",
  "Lembá",
  "Caué",
  "Região Autónoma do Príncipe",
];

// Dicionário Semântico de Sinônimos e Termos Relacionados para São Tomé e Príncipe
export const SYNONYM_GROUPS: {
  categorySlug: string;
  categoryName: string;
  primaryTerms: string[];
  synonyms: string[];
  suggestedTags: string[];
}[] = [
  {
    categorySlug: "eletricista",
    categoryName: "Eletricista",
    primaryTerms: ["eletricista", "eletricidade", "eletrico", "eletrica"],
    synonyms: [
      "eletricidade",
      "eletricista",
      "eletrico",
      "eletrica",
      "energia",
      "luz",
      "quadro",
      "quadros",
      "disjuntor",
      "disjuntores",
      "fio",
      "fios",
      "fiacao",
      "fiação",
      "cabo",
      "cabos",
      "tomada",
      "tomadas",
      "interruptor",
      "interruptores",
      "curto",
      "curto-circuito",
      "lampada",
      "lampadas",
      "iluminacao",
      "iluminação",
      "focos",
      "led",
      "trifasico",
      "monofasico",
      "inversor",
      "solar",
      "painel solar",
      "bateria solar",
    ],
    suggestedTags: [
      "Eletricista",
      "Quadros Elétricos",
      "Tomadas & Iluminação",
      "Curto-circuito",
      "Energia Solar",
    ],
  },
  {
    categorySlug: "canalizador",
    categoryName: "Canalizador",
    primaryTerms: ["canalizador", "canalizacao", "canalização", "fontanaria"],
    synonyms: [
      "canalizador",
      "canalizacao",
      "canalização",
      "agua",
      "água",
      "cano",
      "canos",
      "tubo",
      "tubos",
      "tubagem",
      "tubagens",
      "torneira",
      "torneiras",
      "fuga",
      "fugas",
      "infiltracao",
      "infiltração",
      "inundacao",
      "inundação",
      "esgoto",
      "esgotos",
      "desentupimento",
      "desentupir",
      "desobstrucao",
      "sanita",
      "sanitarios",
      "sanitários",
      "autoclismo",
      "lavatorio",
      "lavatório",
      "chuveiro",
      "banheira",
      "aquecedor",
      "termoacumulador",
      "sifao",
      "sifão",
      "ralo",
      "hidraulica",
      "hidráulica",
    ],
    suggestedTags: [
      "Canalizador",
      "Fugas de Água",
      "Desentupimento",
      "Termoacumulador",
      "Torneiras & Loiças",
    ],
  },
  {
    categorySlug: "ar-condicionado",
    categoryName: "Ar Condicionado & Frio",
    primaryTerms: [
      "ar condicionado",
      "ar-condicionado",
      "climatizacao",
      "climatização",
      "frio",
      "refrigeracao",
      "refrigeração",
    ],
    synonyms: [
      "ar condicionado",
      "ar-condicionado",
      "ac",
      "split",
      "climatizacao",
      "climatização",
      "frio",
      "refrigeracao",
      "refrigeração",
      "geladeira",
      "geladeiras",
      "frigorifico",
      "frigorífico",
      "frigorificos",
      "frigoríficos",
      "geleira",
      "geleiras",
      "arca",
      "arcas",
      "congelador",
      "congeladores",
      "gas",
      "gás",
      "recarga de gas",
      "compressor",
      "termostato",
      "filtro ac",
      "limpeza ac",
    ],
    suggestedTags: [
      "Ar Condicionado",
      "Geladeiras & Frigoríficos",
      "Recarga de Gás",
      "Arcas Congeladoras",
      "Limpeza Split",
    ],
  },
  {
    categorySlug: "pintor",
    categoryName: "Pintor",
    primaryTerms: ["pintor", "pintura", "pinturas"],
    synonyms: [
      "pintor",
      "pintura",
      "pinturas",
      "tinta",
      "tintas",
      "verniz",
      "vernizes",
      "parede",
      "paredes",
      "fachada",
      "fachadas",
      "muro",
      "muros",
      "estuque",
      "estucar",
      "massa corrida",
      "lixagem",
      "alisamento",
      "gesso",
      "fissura",
      "fissuras",
      "rachadura",
      "salitre",
      "anti-salitre",
      "humidade",
      "impermeabilizacao",
      "impermeabilização",
      "envernizamento",
      "madeira",
    ],
    suggestedTags: [
      "Pintor",
      "Pintura de Interiores",
      "Fachadas & Muros",
      "Verniz de Madeira",
      "Estuque",
    ],
  },
  {
    categorySlug: "mecanico",
    categoryName: "Mecânico & Geradores",
    primaryTerms: ["mecanico", "mecânico", "mecanica", "mecânica"],
    synonyms: [
      "mecanico",
      "mecânico",
      "mecanica",
      "mecânica",
      "carro",
      "carros",
      "auto",
      "automovel",
      "automóvel",
      "viatura",
      "viaturas",
      "motor",
      "motores",
      "gerador",
      "geradores",
      "diesel",
      "gasolina",
      "oleo",
      "óleo",
      "travao",
      "travão",
      "travoes",
      "travões",
      "pastilhas",
      "discos",
      "embraiagem",
      "suspensao",
      "suspensão",
      "bateria",
      "baterias",
      "arranque",
      "socorro",
      "reboque",
      "eletromecanico",
      "eletromecânico",
    ],
    suggestedTags: [
      "Mecânico Auto",
      "Reparação de Geradores",
      "Mudança de Óleo",
      "Travões & Embraiagem",
      "Socorro de Bateria",
    ],
  },
  {
    categorySlug: "limpeza",
    categoryName: "Limpeza",
    primaryTerms: ["limpeza", "limpezas", "limpar"],
    synonyms: [
      "limpeza",
      "limpezas",
      "limpar",
      "faxina",
      "faxinas",
      "diarista",
      "diaristas",
      "domestica",
      "doméstica",
      "empregada",
      "pos-obra",
      "pós-obra",
      "escritorio",
      "escritório",
      "escritorios",
      "higienizacao",
      "higienização",
      "desinfeccao",
      "desinfeção",
      "lavagem",
      "aspiracao",
      "aspiração",
      "chao",
      "chão",
      "vidros",
      "janelas",
      "sofa",
      "sofá",
      "estofos",
      "engomadoria",
    ],
    suggestedTags: [
      "Limpeza Residencial",
      "Limpeza Pós-Obra",
      "Diarista",
      "Limpeza de Escritórios",
      "Higienização Profunda",
    ],
  },
  {
    categorySlug: "jardinagem",
    categoryName: "Jardinagem",
    primaryTerms: ["jardinagem", "jardineiro", "jardim"],
    synonyms: [
      "jardinagem",
      "jardineiro",
      "jardim",
      "jardins",
      "relva",
      "grama",
      "capim",
      "mato",
      "rocadora",
      "roçadora",
      "rocar",
      "roçar",
      "rocagem",
      "roçagem",
      "poda",
      "podar",
      "arvore",
      "árvore",
      "arvores",
      "árvores",
      "palmeira",
      "palmeiras",
      "coqueiro",
      "coqueiros",
      "plantas",
      "canteiros",
      "adubacao",
      "adubação",
      "paisagismo",
    ],
    suggestedTags: [
      "Jardineiro",
      "Corte de Relva",
      "Roçagem de Capim",
      "Poda de Coqueiros & Árvores",
      "Manutenção de Quintal",
    ],
  },
  {
    categorySlug: "beleza",
    categoryName: "Estética & Beleza",
    primaryTerms: ["beleza", "estetica", "estética", "salao", "salão"],
    synonyms: [
      "beleza",
      "estetica",
      "estética",
      "cabeleireira",
      "cabeleireiro",
      "cabelo",
      "cabelos",
      "tranca",
      "trança",
      "trancas",
      "tranças",
      "box braids",
      "nago",
      "nagô",
      "twists",
      "penteado",
      "penteados",
      "manicure",
      "pedicure",
      "unha",
      "unhas",
      "unhas de gel",
      "verniz gel",
      "maquilhagem",
      "make",
      "maquiagem",
      "pestanas",
      "sobrancelhas",
      "hidratacao",
      "hidratação",
    ],
    suggestedTags: [
      "Tranças Afro (Box Braids)",
      "Manicure & Pedicure",
      "Unhas de Gel",
      "Penteados para Eventos",
      "Cabeleireira ao Domicílio",
    ],
  },
  {
    categorySlug: "construcao",
    categoryName: "Construção & Alvenaria",
    primaryTerms: ["construcao", "construção", "pedreiro", "obras"],
    synonyms: [
      "construcao",
      "construção",
      "pedreiro",
      "pedreiros",
      "obra",
      "obras",
      "remodelacao",
      "remodelação",
      "reforma",
      "alvenaria",
      "cimento",
      "tijolo",
      "tijolos",
      "bloco",
      "blocos",
      "azulejo",
      "azulejos",
      "ceramica",
      "cerâmica",
      "piso",
      "chao",
      "telhado",
      "telhados",
      "calha",
      "viga",
      "fundacao",
      "fundação",
    ],
    suggestedTags: [
      "Pedreiro",
      "Assentamento de Azulejo",
      "Reparação de Telhados",
      "Pequenas Obras",
      "Alvenaria",
    ],
  },
  {
    categorySlug: "carpintaria",
    categoryName: "Carpintaria & Madeiras",
    primaryTerms: ["carpintaria", "carpinteiro", "marceneiro"],
    synonyms: [
      "carpintaria",
      "carpinteiro",
      "carpinteiros",
      "marceneiro",
      "marcenaria",
      "madeira",
      "madeiras",
      "movel",
      "móvel",
      "moveis",
      "móveis",
      "porta",
      "portas",
      "fechadura",
      "fechaduras",
      "janela",
      "janelas de madeira",
      "armario",
      "armário",
      "guarda-fatos",
      "teto falso",
    ],
    suggestedTags: [
      "Carpinteiro",
      "Montagem de Portas & Fechaduras",
      "Reparação de Móveis",
      "Estruturas em Madeira",
    ],
  },
];

/**
 * Remove acentos, pontuação e normaliza para minúsculas
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Obtém a raiz básica (stem simples) para comparar termos afins
 * Ex: eletricidade -> eletric, eletricista -> eletric, canalizacao -> canaliz
 */
export function getWordStem(word: string): string {
  const norm = normalizeSearchTerm(word);
  if (norm.length <= 4) return norm;

  const suffixes = [
    "ista",
    "istas",
    "idade",
    "idades",
    "cao",
    "coes",
    "dor",
    "dores",
    "agem",
    "agens",
    "aria",
    "arias",
    "eira",
    "eiro",
    "eiras",
    "eiros",
    "ico",
    "ica",
    "icos",
    "icas",
    "ado",
    "ada",
    "ados",
    "adas",
    "oso",
    "osa",
  ];

  for (const suf of suffixes) {
    if (norm.endsWith(suf) && norm.length - suf.length >= 4) {
      return norm.slice(0, -suf.length);
    }
  }

  return norm.slice(0, 5);
}

export type SmartSearchResult = {
  isMatch: boolean;
  score: number;
  matchedTerms: string[];
  suggestedTags: string[];
  matchedCategorySlug?: string;
  matchedCategoryName?: string;
  explanation?: string;
};

/**
 * Avalia se uma pesquisa (ex: "Eletricidade") tem correspondência semântica inteligente
 * com uma categoria ou com o perfil de um prestador
 */
function slugify(cat: string): string {
  if (!cat) return "";
  return cat
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Avalia se uma pesquisa (ex: "Eletricidade") tem correspondência semântica inteligente
 * com uma categoria ou com o perfil de um prestador, aplicando isolamento estrito de categorias.
 */
export function evaluateSmartMatch(
  query: string,
  target: {
    categoryName?: string;
    categorySlug?: string;
    providerName?: string;
    services?: string[];
    bio?: string;
    detailedServices?: { name: string; description?: string }[];
  },
): SmartSearchResult {
  const normQuery = normalizeSearchTerm(query);
  if (!normQuery) {
    return {
      isMatch: true,
      score: 1,
      matchedTerms: [],
      suggestedTags: [],
    };
  }

  // Prevenir que caracteres individuais ou fragmentos mínimos deem match aleatório
  if (normQuery.length < 3) {
    return {
      isMatch: false,
      score: 0,
      matchedTerms: [],
      suggestedTags: [],
    };
  }

  const queryWords = normQuery.split(" ").filter((w) => w.length > 0);
  const queryStems = queryWords.filter((w) => w.length >= 3).map(getWordStem);

  // 1. Identificar se a busca se refere a alguma categoria / profissão específica
  let detectedGroup: (typeof SYNONYM_GROUPS)[0] | undefined;
  let isPrimaryIntent = false;

  // A) Verificar correspondência com a categoria ou seus termos primários
  for (const group of SYNONYM_GROUPS) {
    const groupSlugNorm = normalizeSearchTerm(group.categorySlug);
    const groupNameNorm = normalizeSearchTerm(group.categoryName);

    const isDirectCategory =
      normQuery === groupSlugNorm ||
      normQuery === groupNameNorm ||
      (normQuery.length >= 3 &&
        (groupSlugNorm.startsWith(normQuery) || groupNameNorm.startsWith(normQuery)));

    const isPrimaryTerm = group.primaryTerms.some((pt) => {
      const normPT = normalizeSearchTerm(pt);
      return (
        normQuery === normPT ||
        normQuery.startsWith(normPT + " ") ||
        normQuery.endsWith(" " + normPT) ||
        normQuery.includes(" " + normPT + " ") ||
        (normQuery.length >= 3 && normPT.startsWith(normQuery)) ||
        (normPT.length >= 4 && normQuery.includes(normPT))
      );
    });

    if (isDirectCategory || isPrimaryTerm) {
      detectedGroup = group;
      isPrimaryIntent = true;
      break;
    }
  }

  // B) Se não for termo primário, verificar sinónimos fortes da categoria
  if (!detectedGroup) {
    for (const group of SYNONYM_GROUPS) {
      const isSynonym = group.synonyms.some((s) => {
        const normS = normalizeSearchTerm(s);
        if (normS.length < 3) return false;
        return (
          normQuery === normS ||
          normQuery.startsWith(normS + " ") ||
          normQuery.endsWith(" " + normS) ||
          normQuery.includes(" " + normS + " ") ||
          (normS.length >= 4 && normQuery.includes(normS)) ||
          (normQuery.length >= 4 && normS.startsWith(normQuery))
        );
      });

      const isStemMatch = queryStems.some(
        (qs) =>
          qs.length >= 4 &&
          group.synonyms.some((s) => {
            const stem = getWordStem(s);
            return stem.length >= 4 && stem === qs;
          }),
      );

      if (isSynonym || isStemMatch) {
        detectedGroup = group;
        break;
      }
    }
  }

  // 2. Normalização dos dados do alvo (Target)
  const targetCategorySlug = normalizeSearchTerm(
    target.categorySlug || slugify(target.categoryName || ""),
  );
  const targetCategoryName = normalizeSearchTerm(target.categoryName || "");
  const targetProviderName = normalizeSearchTerm(target.providerName || "");

  // Lista de títulos de serviços oferecidos
  const serviceNames = [
    ...(target.services || []),
    ...(target.detailedServices?.map((ds) => ds.name) || []),
  ].map(normalizeSearchTerm);

  // 3. Verificação de correspondência do Prestador por Nome Pessoal (ex: "Edmilson", "Dércio", "Hélder")
  const isNameMatch = Boolean(
    targetProviderName &&
    (targetProviderName === normQuery ||
      targetProviderName.startsWith(normQuery + " ") ||
      targetProviderName.endsWith(" " + normQuery) ||
      targetProviderName.includes(" " + normQuery + " ") ||
      (normQuery.length >= 3 && targetProviderName.includes(normQuery)) ||
      (queryWords.length > 0 &&
        queryWords.every((w) => w.length >= 3 && targetProviderName.includes(w)))),
  );

  if (isNameMatch) {
    return {
      isMatch: true,
      score: 100,
      matchedTerms: [target.providerName || ""],
      suggestedTags: detectedGroup ? detectedGroup.suggestedTags : [],
      matchedCategorySlug: target.categorySlug,
      matchedCategoryName: target.categoryName,
      explanation: `Profissional "${target.providerName}"`,
    };
  }

  // 4. Verificação de Pertença do Alvo ao Grupo Detetado
  const targetBelongsToDetectedGroup = Boolean(
    detectedGroup &&
    (targetCategorySlug === detectedGroup.categorySlug ||
      targetCategorySlug.includes(detectedGroup.categorySlug) ||
      detectedGroup.categorySlug.includes(targetCategorySlug) ||
      targetCategoryName.includes(normalizeSearchTerm(detectedGroup.categoryName)) ||
      normalizeSearchTerm(detectedGroup.categoryName).includes(targetCategoryName)),
  );

  // 5. REGRA DE ISOLAMENTO ESTRITO (STRICT CATEGORY ISOLATION):
  // Se a busca é direcionada a uma profissão/categoria (ex: Eletricista, Canalizador, Mecânico):
  if (detectedGroup) {
    // BLOQUEIO TOTAL: Alvos de outras especialidades JAMAIS podem aparecer!
    if (!targetBelongsToDetectedGroup) {
      return {
        isMatch: false,
        score: 0,
        matchedTerms: [],
        suggestedTags: detectedGroup.suggestedTags,
        matchedCategorySlug: detectedGroup.categorySlug,
        matchedCategoryName: detectedGroup.categoryName,
      };
    }

    // Alvo pertence à especialidade pesquisada -> Match garantido
    let score = isPrimaryIntent ? 90 : 70;

    const hasSpecificServiceMatch = serviceNames.some(
      (sn) => sn.includes(normQuery) || queryWords.some((w) => w.length >= 3 && sn.includes(w)),
    );

    if (hasSpecificServiceMatch) {
      score += 10;
    }

    return {
      isMatch: true,
      score,
      matchedTerms: detectedGroup.primaryTerms,
      suggestedTags: detectedGroup.suggestedTags,
      matchedCategorySlug: detectedGroup.categorySlug,
      matchedCategoryName: detectedGroup.categoryName,
      explanation: `Profissional credenciado em ${detectedGroup.categoryName}`,
    };
  }

  // 6. Caso a consulta NÃO pertença a nenhuma categoria do catálogo (ex: termo livre não catalogado):
  // Só pode corresponder se houver correspondência explícita nos títulos dos serviços oferecidos
  const searchWords = queryWords.filter((w) => w.length >= 3);
  if (searchWords.length === 0) {
    return {
      isMatch: false,
      score: 0,
      matchedTerms: [],
      suggestedTags: [],
    };
  }

  const exactServiceMatch = serviceNames.some(
    (sn) =>
      sn === normQuery ||
      sn.includes(" " + normQuery + " ") ||
      sn.startsWith(normQuery + " ") ||
      sn.endsWith(" " + normQuery) ||
      (normQuery.length >= 4 && sn.includes(normQuery)),
  );

  const wordServiceMatch = serviceNames.some((sn) => {
    return searchWords.every((w) => {
      const regex = new RegExp(`\\b${w}`, "i");
      return regex.test(sn);
    });
  });

  if (exactServiceMatch || wordServiceMatch) {
    return {
      isMatch: true,
      score: exactServiceMatch ? 60 : 40,
      matchedTerms: [normQuery],
      suggestedTags: [],
      matchedCategorySlug: target.categorySlug,
      matchedCategoryName: target.categoryName,
      explanation: `Serviço específico "${target.categoryName || "Técnico"}"`,
    };
  }

  return {
    isMatch: false,
    score: 0,
    matchedTerms: [],
    suggestedTags: [],
  };
}

/**
 * Encontra termos semelhantes e sugestões para exibir quando o usuário pesquisa
 * Ex: Se pesquisar "Eletricidade" -> retorna tags ["Eletricista", "Quadros Elétricos", "Tomadas", ...]
 */
export function getSmartQuerySuggestions(query: string): {
  matchedCategoryName?: string;
  matchedCategorySlug?: string;
  relatedTerms: string[];
  suggestedTags: string[];
  tipText?: string;
} {
  const normQuery = normalizeSearchTerm(query);
  if (!normQuery) {
    return {
      relatedTerms: [],
      suggestedTags: [],
    };
  }

  const queryStems = normQuery.split(" ").map(getWordStem);

  for (const group of SYNONYM_GROUPS) {
    const isPrimary = group.primaryTerms.some((pt) => {
      const normPT = normalizeSearchTerm(pt);
      return (
        normQuery === normPT ||
        normQuery.startsWith(normPT + " ") ||
        normQuery.endsWith(" " + normPT) ||
        normQuery.includes(normPT) ||
        normPT.includes(normQuery)
      );
    });

    const isGroupSlugOrName =
      normQuery === group.categorySlug || normQuery === normalizeSearchTerm(group.categoryName);

    if (isPrimary || isGroupSlugOrName) {
      return {
        matchedCategoryName: group.categoryName,
        matchedCategorySlug: group.categorySlug,
        relatedTerms: group.synonyms.slice(0, 8),
        suggestedTags: group.suggestedTags,
        tipText: `A pesquisar por "${query}": Mostrando profissionais e serviços de ${group.categoryName}.`,
      };
    }
  }

  for (const group of SYNONYM_GROUPS) {
    const isDirectSynonym = group.synonyms.some((s) => {
      const normS = normalizeSearchTerm(s);
      return normQuery.includes(normS) || normS.includes(normQuery);
    });

    const hasStem = queryStems.some((qStem) =>
      group.synonyms.some((s) => getWordStem(s) === qStem),
    );

    if (isDirectSynonym || hasStem) {
      return {
        matchedCategoryName: group.categoryName,
        matchedCategorySlug: group.categorySlug,
        relatedTerms: group.synonyms.slice(0, 8),
        suggestedTags: group.suggestedTags,
        tipText: `A pesquisar por "${query}": Mostrando profissionais e serviços de ${group.categoryName}.`,
      };
    }
  }

  return {
    relatedTerms: [],
    suggestedTags: [],
  };
}

/**
 * Cálculo inteligente de distância de um prestador em relação ao cliente
 */
export type ProviderDistanceInfo = {
  distanceKm: number;
  formatted: string;
  isNearby: boolean;
  isInSameDistrict: boolean;
  districtLabel: string;
  travelTimeEstimateMinutes: number;
};

export function calculateProviderDistance(
  provider: Provider,
  clientLocation: {
    district?: string;
    latitude?: number;
    longitude?: number;
  },
): ProviderDistanceInfo {
  const clientDistrict = clientLocation.district || "Água Grande";

  // Determinar coordenadas do cliente
  let clientLat = clientLocation.latitude;
  let clientLng = clientLocation.longitude;

  if ((!clientLat || !clientLng) && STP_DISTRICT_CENTROIDS[clientDistrict]) {
    clientLat = STP_DISTRICT_CENTROIDS[clientDistrict].lat;
    clientLng = STP_DISTRICT_CENTROIDS[clientDistrict].lng;
  }

  // Se ainda assim não houver coordenadas, default para capital Água Grande
  if (!clientLat || !clientLng) {
    clientLat = 0.3365;
    clientLng = 6.7273;
  }

  // Determinar coordenadas do prestador
  const provDistrict = provider.district || "Água Grande";
  let provLat = provider.latitude;
  let provLng = provider.longitude;

  if ((!provLat || !provLng) && STP_DISTRICT_CENTROIDS[provDistrict]) {
    provLat = STP_DISTRICT_CENTROIDS[provDistrict].lat;
    provLng = STP_DISTRICT_CENTROIDS[provDistrict].lng;
  }

  if (!provLat || !provLng) {
    provLat = 0.3365;
    provLng = 6.7273;
  }

  const distanceRaw = calculateDistanceKm(clientLat, clientLng, provLat, provLng);
  // Se for no mesmo distrito mas a distância deu 0 (mesmo centroide), estimamos ~1.5 km a 2.5 km de deslocação local urbana
  const isInSameDistrict =
    normalizeSearchTerm(clientDistrict) === normalizeSearchTerm(provDistrict) ||
    (provider.districts &&
      provider.districts.some(
        (d) => normalizeSearchTerm(d) === normalizeSearchTerm(clientDistrict),
      ));

  let distanceKm = Math.round(distanceRaw * 10) / 10;
  if (isInSameDistrict && distanceKm < 1.0) {
    distanceKm = 1.8; // Deslocação média intra-distrital
  }

  // Estimativa de tempo de resposta / deslocação em STP (~30 km/h velocidade média nas estradas nacionais e urbanas)
  const travelTimeEstimateMinutes = Math.max(10, Math.round((distanceKm / 30) * 60) + 5);

  let formatted = `${distanceKm.toFixed(1)} km`;
  if (distanceKm < 1) {
    formatted = `${Math.round(distanceKm * 1000)} m`;
  }

  return {
    distanceKm,
    formatted,
    isNearby: distanceKm <= 10,
    isInSameDistrict: Boolean(isInSameDistrict),
    districtLabel: provDistrict,
    travelTimeEstimateMinutes,
  };
}
