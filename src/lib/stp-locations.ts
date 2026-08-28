/**
 * Estrutura Geográfica e Administrativa Oficial de São Tomé e Príncipe (STP).
 * Contém os 7 Distritos Nacionais com divisão por regiões, capitais, cidades,
 * vilas, bairros periféricos, comunidades rurais, roças históricas e zonas costeiras.
 */

export interface StpZoneGroup {
  groupName: string;
  zones: string[];
}

export interface StpDistrictDetail {
  id: string;
  name: string;
  capital: string;
  region: "Ilha de São Tomé" | "Ilha e Região Autónoma do Príncipe";
  description: string;
  groups: StpZoneGroup[];
}

export const STP_DISTRICTS_DETAILED: StpDistrictDetail[] = [
  {
    id: "agua-grande",
    name: "Água Grande",
    capital: "Cidade de São Tomé",
    region: "Ilha de São Tomé",
    description: "Capital Nacional e centro económico e urbano de São Tomé.",
    groups: [
      {
        groupName: "Cidades e Sedes",
        zones: ["Cidade de São Tomé (Capital)", "Vila de Pantufo"],
      },
      {
        groupName: "Bairros, Zonas Urbanas e Periféricas",
        zones: [
          "Água Porca",
          "Almeirim",
          "Avenidinha",
          "Bairro da Caixa",
          "Bairro do Hospital",
          "Boa Morte",
          "Campo de Milho",
          "Campo do Carro",
          "Chácara",
          "Conceição",
          "Cruz Grande",
          "Cruzeiro",
          "Cuba",
          "Madre Deus",
          "Oque del Rei",
          "Palmar",
          "Quinta Santo António",
          "Riboque",
          "São João da Vargem",
          "Vila Maria",
          "Blu Blu",
          "Vila Mariz",
          "Rua 3 de Fevereiro",
          "Chonizinho",
          "Ponte Cais",
          "São Marçal",
          "Chaminé",
          "Bairro da Liberdade",
          "Vila Dolores",
        ],
      },
      {
        groupName: "Zonas Costeiras",
        zones: ["Praia de Gamboa", "Praia Melão", "Praia Lagarto"],
      },
    ],
  },
  {
    id: "me-zochi",
    name: "Mé-Zóchi",
    capital: "Trindade",
    region: "Ilha de São Tomé",
    description: "Distrito interior, centro agrícola e residencial de grande densidade.",
    groups: [
      {
        groupName: "Vilas e Povoados Populosos",
        zones: [
          "Cidade de Trindade",
          "Caixão Grande",
          "Bombom",
          "Caminho Novo",
          "Bobo Forro",
          "Potó",
          "Almas",
          "Piedade",
          "Guegue",
          "Madalena",
          "Cruzeiro (Mé-Zóchi)",
          "Obô Longo",
        ],
      },
      {
        groupName: "Comunidades Rurais e Sanzalas",
        zones: [
          "Água Creola",
          "Vila Verde",
          "Quinta das Flores",
          "Poto Poto",
          "Abade (Mé-Zóchi)",
          "Batepá",
          "Água Comprida",
          "Quimpo",
          "Catraio",
          "Lemos",
        ],
      },
      {
        groupName: "Roças e Dependências Agrícolas",
        zones: [
          "Monte Café",
          "Uba Budo",
          "Milagrosa",
          "Saudade",
          "Nova Moca",
          "Alice",
          "Java",
          "Bemposta",
          "Quinta da Graça",
          "Cangá",
          "Cláudio Faro",
          "Florestinha",
          "Filomena",
        ],
      },
    ],
  },
  {
    id: "lobata",
    name: "Lobata",
    capital: "Guadalupe",
    region: "Ilha de São Tomé",
    description: "Distrito norte de grande importância histórica e industrial.",
    groups: [
      {
        groupName: "Vilas e Povoados",
        zones: [
          "Guadalupe",
          "Santo Amaro",
          "Fernão Dias",
          "Conde",
          "Micoló",
          "Bela Vista",
          "Canavial",
          "Plácido",
          "Morro Peixe",
        ],
      },
      {
        groupName: "Zonas Costeiras, Ilhéus e Praias",
        zones: ["Praia das Conchas", "Lagoa Azul", "Palmar (Lobata)", "Gamba", "Ilhéu das Cabras"],
      },
      {
        groupName: "Roças e Sedes Históricas",
        zones: [
          "Agostinho Neto (antiga Rio do Ouro)",
          "Boa Entrada",
          "Rio Leça",
          "Boa Esperança",
          "Caldeiras",
          "Maianço",
          "Dependency",
          "Desejada",
          "Santa Margarida",
          "Misericórdia",
        ],
      },
    ],
  },
  {
    id: "cantagalo",
    name: "Cantagalo",
    capital: "Santana",
    region: "Ilha de São Tomé",
    description: "Distrito oriental costeiro, centro de pesca e património de cacau.",
    groups: [
      {
        groupName: "Cidades e Vilas",
        zones: ["Cidade de Santana", "Ribeira Afonso", "Micondó"],
      },
      {
        groupName: "Localidades e Pistas",
        zones: [
          "Uba Budo Praia",
          "Claudino Faro",
          "Pinheira",
          "Santana Praia",
          "Lo Grande",
          "Santo António da Mussacavu",
          "Colónia Açoriana",
          "Covada",
          "Portinho",
          "Praia Messias",
          "Zandanha",
          "Ribeira Santana",
        ],
      },
      {
        groupName: "Roças e Antigos Engenhos",
        zones: [
          "Água Izé",
          "Olá Linda",
          "Mendes da Silva",
          "Henrique",
          "Iô Grande",
          "Monte Hermínio",
          "Colónia",
          "Freguesia",
        ],
      },
    ],
  },
  {
    id: "lemba",
    name: "Lembá",
    capital: "Neves",
    region: "Ilha de São Tomé",
    description: "Distrito ocidental, polo portuário de combustíveis e biodiversidade costeira.",
    groups: [
      {
        groupName: "Cidades e Vilas Piscatórias",
        zones: ["Cidade de Neves", "São Miguel", "Santa Catarina", "Diogo Vaz", "Ponta Figo"],
      },
      {
        groupName: "Comunidades e Enclaves Isolados",
        zones: [
          "Generosa",
          "Rosema",
          "Esprainha",
          "Ponta Furada",
          "Ribã",
          "Plágio",
          "Rio Leça (Lembá)",
          "Bindá",
          "Gundá",
          "Praia das Conchas (Lembá)",
          "Ponta do Sol (Lembá)",
          "Lográ",
          "Santa Cruz (Lembá)",
        ],
      },
      {
        groupName: "Roças Principais",
        zones: [
          "Monte Forte",
          "Vista Alegre",
          "Constança",
          "Clarença",
          "Quadi",
          "Esprainha Grande",
        ],
      },
    ],
  },
  {
    id: "caue",
    name: "Caué",
    capital: "São João dos Angolares",
    region: "Ilha de São Tomé",
    description: "Extremo sul de São Tomé, ecoturismo, Ilhéu das Rolas e cultura angolar.",
    groups: [
      {
        groupName: "Vilas e Enclaves do Extremo Sul",
        zones: ["São João dos Angolares", "Porto Alegre", "Vila de Ribeira Peixe"],
      },
      {
        groupName: "Comunidades Isoladas",
        zones: [
          "Angolares",
          "Malanza",
          "Santa Cruz (Caué)",
          "Dona Augusta",
          "Ribeira Funda",
          "Ponta Baleia",
          "Sanzala Angolares",
        ],
      },
      {
        groupName: "Zonas Costeiras e Ilhas",
        zones: ["Ilhéu das Rolas", "Praia Inhame", "Praia Jalé", "Praia Piscina", "Praia Grande"],
      },
      {
        groupName: "Roças e Núcleos Históricos",
        zones: [
          "Henrique (Caué)",
          "Vila Clotilde",
          "Soledade",
          "Monte Mário",
          "São José",
          "Ió Grande (Sul)",
          "Fraternidade",
          "Misericórdia (Caué)",
          "Trindade (Caué)",
        ],
      },
    ],
  },
  {
    id: "pague-principe",
    name: "Pagué (Príncipe)",
    capital: "Cidade de Santo António",
    region: "Ilha e Região Autónoma do Príncipe",
    description: "Região Autónoma do Príncipe e Reserva Mundial da Biosfera da UNESCO.",
    groups: [
      {
        groupName: "Cidades e Projetos Modernos",
        zones: [
          "Cidade de Santo António (Capital Regional)",
          "Vila Comunitária da Terra Prometida",
        ],
      },
      {
        groupName: "Vilas e Pistas",
        zones: [
          "Infante D. Henrique",
          "Picão",
          "Aeroporto (Príncipe)",
          "São Joaquim",
          "Abade (Príncipe)",
          "Nova Estrela",
          "Paciência",
          "Ponta do Sol (Príncipe)",
          "São Tomézinho",
          "Lapa",
          "Oque Daniel",
        ],
      },
      {
        groupName: "Zonas Balneares e Ilhéus",
        zones: ["Praia Burra", "Praia Banana", "Praia Évora", "Ilhéu Bom Bom"],
      },
      {
        groupName: "Roças (Ecossistema Agroindustrial)",
        zones: [
          "Sundy",
          "Terreiro Velho",
          "Porto Real",
          "Belo Monte",
          "Esperança",
          "São João (Príncipe)",
          "Santa Rita",
          "Maria Correia",
        ],
      },
    ],
  },
];

/** Lista de nomes dos distritos de STP */
export const STP_DISTRICT_NAMES = [
  "Água Grande",
  "Mé-Zóchi",
  "Lobata",
  "Cantagalo",
  "Lembá",
  "Caué",
  "Pagué (Príncipe)",
] as const;

export type StpDistrictName = (typeof STP_DISTRICT_NAMES)[number];

/** Mapeamento de todas as localidades por distrito em formato de array simples */
export const STP_ALL_LOCALITIES: Record<string, string[]> = STP_DISTRICTS_DETAILED.reduce(
  (acc, district) => {
    const allZones = district.groups.flatMap((g) => g.zones);
    acc[district.name] = allZones;
    // Atalho para "Região Autónoma do Príncipe"
    if (district.name === "Pagué (Príncipe)") {
      acc["Região Autónoma do Príncipe"] = allZones;
      acc["Príncipe"] = allZones;
    }
    return acc;
  },
  {} as Record<string, string[]>,
);
