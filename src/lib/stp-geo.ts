import { toast } from "sonner";
import { triggerDeviceVibration } from "./sync-manager";

export type STPZoneInfo = {
  name: string;
  district: string;
  lat: number;
  lng: number;
  type: "bairro" | "cidade" | "vila" | "localidade" | "roca" | "ponto_notavel";
  description?: string;
};

export const STP_DISTRICTS = [
  { name: "Água Grande", capital: "Cidade de São Tomé" },
  { name: "Mé-Zóchi", capital: "Trindade" },
  { name: "Lobata", capital: "Guadalupe" },
  { name: "Cantagalo", capital: "Santana" },
  { name: "Lembá", capital: "Neves" },
  { name: "Caué", capital: "São João dos Angolares" },
  { name: "Pagué (Príncipe)", capital: "Santo António" },
];

// Base de Dados de Coordenadas Geográficas de São Tomé e Príncipe (Todos os 7 Distritos e Localidades Oficiais)
export const STP_ZONES_DATABASE: STPZoneInfo[] = [
  // ==========================================
  // 1. ÁGUA GRANDE (Capital: Cidade de São Tomé)
  // ==========================================
  // Cidades e Sedes
  {
    name: "Cidade de São Tomé",
    district: "Água Grande",
    lat: 0.339,
    lng: 6.7345,
    type: "cidade",
    description: "Capital Nacional / Centro Administrativo e Comercial",
  },
  {
    name: "Pantufo",
    district: "Água Grande",
    lat: 0.315,
    lng: 6.745,
    type: "vila",
    description: "Vila de Pantufo / Litoral Sul de Água Grande",
  },
  // Bairros, Zonas Urbanas e Periféricas
  {
    name: "Água Porca",
    district: "Água Grande",
    lat: 0.344,
    lng: 6.729,
    type: "bairro",
    description: "Bairro de Água Porca",
  },
  {
    name: "Almeirim",
    district: "Água Grande",
    lat: 0.3275,
    lng: 6.7214,
    type: "bairro",
    description: "Bairro de Almeirim",
  },
  {
    name: "Avenidinha",
    district: "Água Grande",
    lat: 0.337,
    lng: 6.726,
    type: "bairro",
    description: "Zona da Avenidinha",
  },
  {
    name: "Bairro da Caixa",
    district: "Água Grande",
    lat: 0.334,
    lng: 6.73,
    type: "bairro",
    description: "Bairro da Caixa",
  },
  {
    name: "Bairro do Hospital",
    district: "Água Grande",
    lat: 0.3375,
    lng: 6.7325,
    type: "bairro",
    description: "Bairro do Hospital / Dr. Ayres de Menezes",
  },
  {
    name: "Boa Morte",
    district: "Água Grande",
    lat: 0.328,
    lng: 6.708,
    type: "bairro",
    description: "Bairro de Boa Morte",
  },
  {
    name: "Campo de Milho",
    district: "Água Grande",
    lat: 0.352,
    lng: 6.724,
    type: "bairro",
    description: "Campo de Milho / Estrada do Aeroporto",
  },
  {
    name: "Campo do Carro",
    district: "Água Grande",
    lat: 0.338,
    lng: 6.723,
    type: "bairro",
    description: "Campo do Carro",
  },
  {
    name: "Chácara",
    district: "Água Grande",
    lat: 0.333,
    lng: 6.722,
    type: "bairro",
    description: "Bairro da Chácara",
  },
  {
    name: "Conceição",
    district: "Água Grande",
    lat: 0.341,
    lng: 6.73,
    type: "bairro",
    description: "Bairro da Conceição",
  },
  {
    name: "Cruz Grande",
    district: "Água Grande",
    lat: 0.345,
    lng: 6.71,
    type: "bairro",
    description: "Cruz Grande",
  },
  {
    name: "Cruzeiro (Água Grande)",
    district: "Água Grande",
    lat: 0.335,
    lng: 6.718,
    type: "bairro",
    description: "Bairro do Cruzeiro",
  },
  {
    name: "Cuba",
    district: "Água Grande",
    lat: 0.342,
    lng: 6.725,
    type: "bairro",
    description: "Bairro Cuba",
  },
  {
    name: "Madre Deus",
    district: "Água Grande",
    lat: 0.3425,
    lng: 6.7365,
    type: "bairro",
    description: "Bairro de Madre Deus / Marginal 12 de Julho",
  },
  {
    name: "Oque del Rei",
    district: "Água Grande",
    lat: 0.338,
    lng: 6.712,
    type: "bairro",
    description: "Oque del Rei",
  },
  {
    name: "Palmar (Água Grande)",
    district: "Água Grande",
    lat: 0.347,
    lng: 6.734,
    type: "bairro",
    description: "Palmar / Marginal",
  },
  {
    name: "Quinta Santo António",
    district: "Água Grande",
    lat: 0.335,
    lng: 6.721,
    type: "bairro",
    description: "Quinta Santo António",
  },
  {
    name: "Riboque",
    district: "Água Grande",
    lat: 0.3385,
    lng: 6.7315,
    type: "bairro",
    description: "Riboque Santana / Riboque Central",
  },
  {
    name: "São João da Vargem",
    district: "Água Grande",
    lat: 0.331,
    lng: 6.719,
    type: "bairro",
    description: "São João da Vargem",
  },
  {
    name: "Vila Maria",
    district: "Água Grande",
    lat: 0.342,
    lng: 6.719,
    type: "bairro",
    description: "Bairro Vila Maria",
  },
  {
    name: "Blu Blu",
    district: "Água Grande",
    lat: 0.329,
    lng: 6.716,
    type: "bairro",
    description: "Blu Blu",
  },
  {
    name: "Vila Mariz",
    district: "Água Grande",
    lat: 0.336,
    lng: 6.715,
    type: "bairro",
    description: "Vila Mariz",
  },
  {
    name: "Rua 3 de Fevereiro",
    district: "Água Grande",
    lat: 0.3395,
    lng: 6.732,
    type: "bairro",
    description: "Rua 3 de Fevereiro / Centro Urbano",
  },
  {
    name: "Chonizinho",
    district: "Água Grande",
    lat: 0.343,
    lng: 6.722,
    type: "bairro",
    description: "Chonizinho",
  },
  {
    name: "Ponte Cais",
    district: "Água Grande",
    lat: 0.341,
    lng: 6.739,
    type: "bairro",
    description: "Ponte Cais / Porto de São Tomé",
  },
  {
    name: "São Marçal",
    district: "Água Grande",
    lat: 0.336,
    lng: 6.738,
    type: "bairro",
    description: "Bairro de São Marçal",
  },
  {
    name: "Chaminé",
    district: "Água Grande",
    lat: 0.348,
    lng: 6.721,
    type: "bairro",
    description: "Zona da Chaminé",
  },
  {
    name: "Bairro da Liberdade",
    district: "Água Grande",
    lat: 0.332,
    lng: 6.726,
    type: "bairro",
    description: "Bairro da Liberdade",
  },
  {
    name: "Vila Dolores",
    district: "Água Grande",
    lat: 0.337,
    lng: 6.71,
    type: "bairro",
    description: "Vila Dolores",
  },
  // Zonas Costeiras
  {
    name: "Praia de Gamboa",
    district: "Água Grande",
    lat: 0.3465,
    lng: 6.7385,
    type: "bairro",
    description: "Praia de Gamboa / Baía de Ana Chaves",
  },
  {
    name: "Praia Melão",
    district: "Água Grande",
    lat: 0.301,
    lng: 6.735,
    type: "bairro",
    description: "Praia Melão",
  },
  {
    name: "Praia Lagarto",
    district: "Água Grande",
    lat: 0.36,
    lng: 6.728,
    type: "bairro",
    description: "Praia Lagarto / Zona Norte de Água Grande",
  },

  // ==========================================
  // 2. MÉ-ZÓCHI (Capital: Trindade)
  // ==========================================
  // Vilas e Povoados Populosos
  {
    name: "Cidade de Trindade",
    district: "Mé-Zóchi",
    lat: 0.2989,
    lng: 6.6491,
    type: "cidade",
    description: "Capital do Distrito de Mé-Zóchi",
  },
  {
    name: "Caixão Grande",
    district: "Mé-Zóchi",
    lat: 0.32,
    lng: 6.68,
    type: "vila",
    description: "Caixão Grande",
  },
  {
    name: "Bombom",
    district: "Mé-Zóchi",
    lat: 0.31,
    lng: 6.695,
    type: "vila",
    description: "Bombom / Estrada da Trindade",
  },
  {
    name: "Caminho Novo",
    district: "Mé-Zóchi",
    lat: 0.305,
    lng: 6.688,
    type: "vila",
    description: "Caminho Novo",
  },
  {
    name: "Bobo Forro",
    district: "Mé-Zóchi",
    lat: 0.318,
    lng: 6.71,
    type: "vila",
    description: "Bobo Forro",
  },
  {
    name: "Potó",
    district: "Mé-Zóchi",
    lat: 0.302,
    lng: 6.665,
    type: "vila",
    description: "Potó",
  },
  {
    name: "Almas",
    district: "Mé-Zóchi",
    lat: 0.295,
    lng: 6.68,
    type: "vila",
    description: "Bairro das Almas",
  },
  {
    name: "Piedade",
    district: "Mé-Zóchi",
    lat: 0.288,
    lng: 6.662,
    type: "vila",
    description: "Piedade",
  },
  {
    name: "Guegue",
    district: "Mé-Zóchi",
    lat: 0.282,
    lng: 6.678,
    type: "vila",
    description: "Guegue",
  },
  {
    name: "Madalena",
    district: "Mé-Zóchi",
    lat: 0.315,
    lng: 6.672,
    type: "vila",
    description: "Madalena",
  },
  {
    name: "Cruzeiro (Mé-Zóchi)",
    district: "Mé-Zóchi",
    lat: 0.308,
    lng: 6.685,
    type: "vila",
    description: "Cruzeiro",
  },
  {
    name: "Obô Longo",
    district: "Mé-Zóchi",
    lat: 0.294,
    lng: 6.635,
    type: "vila",
    description: "Obô Longo",
  },
  // Comunidades Rurais e Sanzalas
  {
    name: "Água Creola",
    district: "Mé-Zóchi",
    lat: 0.312,
    lng: 6.658,
    type: "localidade",
    description: "Água Creola",
  },
  {
    name: "Vila Verde",
    district: "Mé-Zóchi",
    lat: 0.291,
    lng: 6.655,
    type: "localidade",
    description: "Vila Verde",
  },
  {
    name: "Quinta das Flores",
    district: "Mé-Zóchi",
    lat: 0.304,
    lng: 6.675,
    type: "localidade",
    description: "Quinta das Flores",
  },
  {
    name: "Poto Poto",
    district: "Mé-Zóchi",
    lat: 0.286,
    lng: 6.645,
    type: "localidade",
    description: "Poto Poto",
  },
  {
    name: "Abade (Mé-Zóchi)",
    district: "Mé-Zóchi",
    lat: 0.279,
    lng: 6.67,
    type: "localidade",
    description: "Abade",
  },
  {
    name: "Batepá",
    district: "Mé-Zóchi",
    lat: 0.292,
    lng: 6.618,
    type: "localidade",
    description: "Vila histórica de Batepá",
  },
  {
    name: "Água Comprida",
    district: "Mé-Zóchi",
    lat: 0.285,
    lng: 6.65,
    type: "localidade",
    description: "Água Comprida",
  },
  {
    name: "Quimpo",
    district: "Mé-Zóchi",
    lat: 0.275,
    lng: 6.66,
    type: "localidade",
    description: "Quimpo",
  },
  {
    name: "Catraio",
    district: "Mé-Zóchi",
    lat: 0.296,
    lng: 6.63,
    type: "localidade",
    description: "Catraio",
  },
  {
    name: "Lemos",
    district: "Mé-Zóchi",
    lat: 0.307,
    lng: 6.642,
    type: "localidade",
    description: "Lemos",
  },
  // Roças e Dependências Agrícolas
  {
    name: "Monte Café",
    district: "Mé-Zóchi",
    lat: 0.303,
    lng: 6.638,
    type: "roca",
    description: "Roça Monte Café / Museu do Café",
  },
  {
    name: "Uba Budo (Mé-Zóchi)",
    district: "Mé-Zóchi",
    lat: 0.265,
    lng: 6.668,
    type: "roca",
    description: "Roça Uba Budo",
  },
  {
    name: "Milagrosa",
    district: "Mé-Zóchi",
    lat: 0.297,
    lng: 6.625,
    type: "roca",
    description: "Roça Milagrosa",
  },
  {
    name: "Saudade",
    district: "Mé-Zóchi",
    lat: 0.285,
    lng: 6.62,
    type: "roca",
    description: "Saudade / Cascata São Nicolau",
  },
  {
    name: "Nova Moca",
    district: "Mé-Zóchi",
    lat: 0.278,
    lng: 6.612,
    type: "roca",
    description: "Nova Moca / Jardim Botânico",
  },
  {
    name: "Alice",
    district: "Mé-Zóchi",
    lat: 0.282,
    lng: 6.632,
    type: "roca",
    description: "Roça Alice",
  },
  {
    name: "Java",
    district: "Mé-Zóchi",
    lat: 0.275,
    lng: 6.625,
    type: "roca",
    description: "Roça Java",
  },
  {
    name: "Bemposta",
    district: "Mé-Zóchi",
    lat: 0.289,
    lng: 6.638,
    type: "roca",
    description: "Bemposta",
  },
  {
    name: "Quinta da Graça",
    district: "Mé-Zóchi",
    lat: 0.301,
    lng: 6.655,
    type: "roca",
    description: "Quinta da Graça",
  },
  {
    name: "Cangá",
    district: "Mé-Zóchi",
    lat: 0.272,
    lng: 6.648,
    type: "roca",
    description: "Cangá",
  },
  {
    name: "Cláudio Faro",
    district: "Mé-Zóchi",
    lat: 0.281,
    lng: 6.662,
    type: "roca",
    description: "Cláudio Faro",
  },
  {
    name: "Florestinha",
    district: "Mé-Zóchi",
    lat: 0.27,
    lng: 6.618,
    type: "roca",
    description: "Florestinha",
  },
  {
    name: "Filomena",
    district: "Mé-Zóchi",
    lat: 0.287,
    lng: 6.628,
    type: "roca",
    description: "Filomena",
  },

  // ==========================================
  // 3. LOBATA (Capital: Guadalupe)
  // ==========================================
  // Vilas e Povoados
  {
    name: "Guadalupe",
    district: "Lobata",
    lat: 0.3601,
    lng: 6.6608,
    type: "cidade",
    description: "Sede do Distrito de Lobata",
  },
  {
    name: "Santo Amaro",
    district: "Lobata",
    lat: 0.358,
    lng: 6.702,
    type: "vila",
    description: "Santo Amaro",
  },
  {
    name: "Fernão Dias",
    district: "Lobata",
    lat: 0.39,
    lng: 6.69,
    type: "ponto_notavel",
    description: "Porto e Memorial de Fernão Dias",
  },
  {
    name: "Conde",
    district: "Lobata",
    lat: 0.352,
    lng: 6.685,
    type: "vila",
    description: "Vila de Conde",
  },
  {
    name: "Micoló",
    district: "Lobata",
    lat: 0.395,
    lng: 6.675,
    type: "vila",
    description: "Praia de Micoló",
  },
  {
    name: "Bela Vista",
    district: "Lobata",
    lat: 0.372,
    lng: 6.68,
    type: "vila",
    description: "Bela Vista",
  },
  {
    name: "Canavial",
    district: "Lobata",
    lat: 0.365,
    lng: 6.672,
    type: "vila",
    description: "Canavial",
  },
  {
    name: "Plácido",
    district: "Lobata",
    lat: 0.368,
    lng: 6.658,
    type: "vila",
    description: "Plácido",
  },
  {
    name: "Morro Peixe",
    district: "Lobata",
    lat: 0.385,
    lng: 6.645,
    type: "vila",
    description: "Vila piscatória de Morro Peixe",
  },
  // Zonas Costeiras, Ilhéus e Praias
  {
    name: "Praia das Conchas",
    district: "Lobata",
    lat: 0.405,
    lng: 6.635,
    type: "ponto_notavel",
    description: "Praia das Conchas / Parque Natural",
  },
  {
    name: "Lagoa Azul",
    district: "Lobata",
    lat: 0.41,
    lng: 6.628,
    type: "ponto_notavel",
    description: "Farol e Lagoa Azul",
  },
  {
    name: "Palmar (Lobata)",
    district: "Lobata",
    lat: 0.38,
    lng: 6.66,
    type: "localidade",
    description: "Palmar de Lobata",
  },
  {
    name: "Gamba",
    district: "Lobata",
    lat: 0.375,
    lng: 6.695,
    type: "localidade",
    description: "Gamba",
  },
  {
    name: "Ilhéu das Cabras",
    district: "Lobata",
    lat: 0.412,
    lng: 6.715,
    type: "ponto_notavel",
    description: "Ilhéu das Cabras / Farol",
  },
  // Roças e Sedes Históricas
  {
    name: "Agostinho Neto (antiga Roça Rio do Ouro)",
    district: "Lobata",
    lat: 0.37,
    lng: 6.67,
    type: "roca",
    description: "Roça Agostinho Neto / Maior complexo histórico",
  },
  {
    name: "Boa Entrada",
    district: "Lobata",
    lat: 0.355,
    lng: 6.675,
    type: "roca",
    description: "Roça Boa Entrada / Obô de Samaúma",
  },
  {
    name: "Rio Leça (Lobata)",
    district: "Lobata",
    lat: 0.362,
    lng: 6.65,
    type: "roca",
    description: "Rio Leça",
  },
  {
    name: "Boa Esperança",
    district: "Lobata",
    lat: 0.367,
    lng: 6.662,
    type: "roca",
    description: "Boa Esperança",
  },
  {
    name: "Caldeiras",
    district: "Lobata",
    lat: 0.374,
    lng: 6.665,
    type: "roca",
    description: "Caldeiras",
  },
  {
    name: "Maianço",
    district: "Lobata",
    lat: 0.378,
    lng: 6.655,
    type: "roca",
    description: "Maianço",
  },
  {
    name: "Dependency",
    district: "Lobata",
    lat: 0.369,
    lng: 6.668,
    type: "roca",
    description: "Dependency",
  },
  {
    name: "Desejada",
    district: "Lobata",
    lat: 0.364,
    lng: 6.682,
    type: "roca",
    description: "Desejada",
  },
  {
    name: "Santa Margarida",
    district: "Lobata",
    lat: 0.359,
    lng: 6.648,
    type: "roca",
    description: "Santa Margarida",
  },
  {
    name: "Misericórdia (Lobata)",
    district: "Lobata",
    lat: 0.361,
    lng: 6.655,
    type: "roca",
    description: "Misericórdia",
  },

  // ==========================================
  // 4. CANTAGALO (Capital: Santana)
  // ==========================================
  // Cidades e Vilas
  {
    name: "Cidade de Santana",
    district: "Cantagalo",
    lat: 0.2201,
    lng: 6.7051,
    type: "cidade",
    description: "Sede do Distrito de Cantagalo",
  },
  {
    name: "Ribeira Afonso",
    district: "Cantagalo",
    lat: 0.198,
    lng: 6.715,
    type: "vila",
    description: "Vila de Ribeira Afonso",
  },
  {
    name: "Micondó",
    district: "Cantagalo",
    lat: 0.185,
    lng: 6.72,
    type: "vila",
    description: "Praia Micondó",
  },
  // Localidades e Pistas
  {
    name: "Uba Budo Praia",
    district: "Cantagalo",
    lat: 0.238,
    lng: 6.718,
    type: "localidade",
    description: "Uba Budo Praia",
  },
  {
    name: "Claudino Faro",
    district: "Cantagalo",
    lat: 0.231,
    lng: 6.71,
    type: "localidade",
    description: "Claudino Faro",
  },
  {
    name: "Pinheira",
    district: "Cantagalo",
    lat: 0.225,
    lng: 6.708,
    type: "localidade",
    description: "Pinheira",
  },
  {
    name: "Santana Praia",
    district: "Cantagalo",
    lat: 0.218,
    lng: 6.714,
    type: "localidade",
    description: "Praia de Santana / Club Santana",
  },
  {
    name: "Lo Grande",
    district: "Cantagalo",
    lat: 0.21,
    lng: 6.695,
    type: "localidade",
    description: "Lo Grande",
  },
  {
    name: "Santo António da Mussacavu",
    district: "Cantagalo",
    lat: 0.205,
    lng: 6.702,
    type: "localidade",
    description: "Santo António da Mussacavu",
  },
  {
    name: "Colónia Açoriana",
    district: "Cantagalo",
    lat: 0.212,
    lng: 6.708,
    type: "localidade",
    description: "Colónia Açoriana",
  },
  {
    name: "Covada",
    district: "Cantagalo",
    lat: 0.201,
    lng: 6.709,
    type: "localidade",
    description: "Covada",
  },
  {
    name: "Portinho",
    district: "Cantagalo",
    lat: 0.192,
    lng: 6.718,
    type: "localidade",
    description: "Portinho",
  },
  {
    name: "Praia Messias",
    district: "Cantagalo",
    lat: 0.195,
    lng: 6.722,
    type: "localidade",
    description: "Praia Messias Alves",
  },
  {
    name: "Zandanha",
    district: "Cantagalo",
    lat: 0.188,
    lng: 6.712,
    type: "localidade",
    description: "Zandanha",
  },
  {
    name: "Ribeira Santana",
    district: "Cantagalo",
    lat: 0.222,
    lng: 6.701,
    type: "localidade",
    description: "Ribeira Santana",
  },
  // Roças e Antigos Engenhos
  {
    name: "Água Izé",
    district: "Cantagalo",
    lat: 0.215,
    lng: 6.72,
    type: "roca",
    description: "Roça Água Izé / Hospital Histórico e Praia",
  },
  {
    name: "Olá Linda",
    district: "Cantagalo",
    lat: 0.227,
    lng: 6.692,
    type: "roca",
    description: "Olá Linda",
  },
  {
    name: "Mendes da Silva",
    district: "Cantagalo",
    lat: 0.219,
    lng: 6.685,
    type: "roca",
    description: "Mendes da Silva",
  },
  {
    name: "Henrique",
    district: "Cantagalo",
    lat: 0.208,
    lng: 6.689,
    type: "roca",
    description: "Roça Henrique",
  },
  {
    name: "Iô Grande",
    district: "Cantagalo",
    lat: 0.202,
    lng: 6.681,
    type: "roca",
    description: "Iô Grande",
  },
  {
    name: "Monte Hermínio",
    district: "Cantagalo",
    lat: 0.197,
    lng: 6.69,
    type: "roca",
    description: "Monte Hermínio",
  },
  {
    name: "Colónia",
    district: "Cantagalo",
    lat: 0.215,
    lng: 6.702,
    type: "roca",
    description: "Colónia",
  },
  {
    name: "Freguesia",
    district: "Cantagalo",
    lat: 0.224,
    lng: 6.698,
    type: "roca",
    description: "Freguesia",
  },

  // ==========================================
  // 5. LEMBÁ (Capital: Neves)
  // ==========================================
  // Cidades e Vilas Piscatórias
  {
    name: "Cidade de Neves",
    district: "Lembá",
    lat: 0.3583,
    lng: 6.5504,
    type: "cidade",
    description: "Sede do Distrito de Lembá / Porto Industrial",
  },
  {
    name: "São Miguel",
    district: "Lembá",
    lat: 0.332,
    lng: 6.518,
    type: "vila",
    description: "São Miguel",
  },
  {
    name: "Santa Catarina",
    district: "Lembá",
    lat: 0.28,
    lng: 6.48,
    type: "vila",
    description: "Santa Catarina / Término da Estrada Nacional Sul",
  },
  {
    name: "Diogo Vaz",
    district: "Lembá",
    lat: 0.315,
    lng: 6.505,
    type: "vila",
    description: "Roça e Vila de Diogo Vaz",
  },
  {
    name: "Ponta Figo",
    district: "Lembá",
    lat: 0.345,
    lng: 6.535,
    type: "vila",
    description: "Roça Ponta Figo",
  },
  // Comunidades e Enclaves Isolados
  {
    name: "Generosa",
    district: "Lembá",
    lat: 0.35,
    lng: 6.54,
    type: "localidade",
    description: "Generosa",
  },
  {
    name: "Rosema",
    district: "Lembá",
    lat: 0.355,
    lng: 6.545,
    type: "localidade",
    description: "Rosema / Cervejeira Nacional",
  },
  {
    name: "Esprainha",
    district: "Lembá",
    lat: 0.34,
    lng: 6.525,
    type: "localidade",
    description: "Esprainha",
  },
  {
    name: "Ponta Furada",
    district: "Lembá",
    lat: 0.328,
    lng: 6.512,
    type: "localidade",
    description: "Ponta Furada / Túnel Natural",
  },
  {
    name: "Ribã",
    district: "Lembá",
    lat: 0.322,
    lng: 6.508,
    type: "localidade",
    description: "Ribã",
  },
  {
    name: "Plágio",
    district: "Lembá",
    lat: 0.308,
    lng: 6.498,
    type: "localidade",
    description: "Plágio",
  },
  {
    name: "Rio Leça (Lembá)",
    district: "Lembá",
    lat: 0.295,
    lng: 6.488,
    type: "localidade",
    description: "Rio Leça",
  },
  {
    name: "Bindá",
    district: "Lembá",
    lat: 0.265,
    lng: 6.465,
    type: "localidade",
    description: "Bindá / Costa Selvagem",
  },
  {
    name: "Gundá",
    district: "Lembá",
    lat: 0.255,
    lng: 6.455,
    type: "localidade",
    description: "Gundá",
  },
  {
    name: "Praia das Conchas (Lembá)",
    district: "Lembá",
    lat: 0.362,
    lng: 6.558,
    type: "localidade",
    description: "Praia das Conchas",
  },
  {
    name: "Ponta do Sol (Lembá)",
    district: "Lembá",
    lat: 0.37,
    lng: 6.568,
    type: "localidade",
    description: "Ponta do Sol",
  },
  {
    name: "Lográ",
    district: "Lembá",
    lat: 0.348,
    lng: 6.532,
    type: "localidade",
    description: "Lográ",
  },
  {
    name: "Santa Cruz (Lembá)",
    district: "Lembá",
    lat: 0.338,
    lng: 6.522,
    type: "localidade",
    description: "Santa Cruz",
  },
  // Roças Principais
  {
    name: "Monte Forte",
    district: "Lembá",
    lat: 0.352,
    lng: 6.542,
    type: "roca",
    description: "Roça Monte Forte",
  },
  {
    name: "Vista Alegre",
    district: "Lembá",
    lat: 0.342,
    lng: 6.538,
    type: "roca",
    description: "Roça Vista Alegre",
  },
  {
    name: "Constança",
    district: "Lembá",
    lat: 0.335,
    lng: 6.528,
    type: "roca",
    description: "Roça Constança",
  },
  {
    name: "Clarença",
    district: "Lembá",
    lat: 0.325,
    lng: 6.515,
    type: "roca",
    description: "Roça Clarença",
  },
  {
    name: "Quadi",
    district: "Lembá",
    lat: 0.318,
    lng: 6.502,
    type: "roca",
    description: "Quadi",
  },
  {
    name: "Esprainha Grande",
    district: "Lembá",
    lat: 0.341,
    lng: 6.526,
    type: "roca",
    description: "Esprainha Grande",
  },

  // ==========================================
  // 6. CAUÉ (Capital: São João dos Angolares)
  // ==========================================
  // Vilas e Enclaves do Extremo Sul
  {
    name: "São João dos Angolares",
    district: "Caué",
    lat: 0.1384,
    lng: 6.6471,
    type: "cidade",
    description: "Sede do Distrito de Caué / Roça São João",
  },
  {
    name: "Porto Alegre",
    district: "Caué",
    lat: 0.035,
    lng: 6.535,
    type: "vila",
    description: "Porto Alegre / Ponto de partida para o Ilhéu das Rolas",
  },
  {
    name: "Vila de Ribeira Peixe",
    district: "Caué",
    lat: 0.09,
    lng: 6.605,
    type: "vila",
    description: "Vila de Ribeira Peixe / Palmeiras de Dendém",
  },
  // Comunidades Isoladas
  {
    name: "Angolares",
    district: "Caué",
    lat: 0.135,
    lng: 6.642,
    type: "localidade",
    description: "Comunidade de Angolares",
  },
  {
    name: "Malanza",
    district: "Caué",
    lat: 0.045,
    lng: 6.54,
    type: "localidade",
    description: "Vila e Mangal de Malanza",
  },
  {
    name: "Santa Cruz (Caué)",
    district: "Caué",
    lat: 0.11,
    lng: 6.62,
    type: "localidade",
    description: "Santa Cruz",
  },
  {
    name: "Dona Augusta",
    district: "Caué",
    lat: 0.075,
    lng: 6.578,
    type: "localidade",
    description: "Dona Augusta",
  },
  {
    name: "Ribeira Funda",
    district: "Caué",
    lat: 0.065,
    lng: 6.565,
    type: "localidade",
    description: "Ribeira Funda",
  },
  {
    name: "Ponta Baleia",
    district: "Caué",
    lat: 0.038,
    lng: 6.538,
    type: "localidade",
    description: "Ponta Baleia",
  },
  {
    name: "Sanzala Angolares",
    district: "Caué",
    lat: 0.141,
    lng: 6.645,
    type: "localidade",
    description: "Sanzala Angolares",
  },
  // Zonas Costeiras e Ilhas
  {
    name: "Ilhéu das Rolas",
    district: "Caué",
    lat: 0.001,
    lng: 6.524,
    type: "ponto_notavel",
    description: "Marco do Equador / Ilhéu das Rolas",
  },
  {
    name: "Praia Inhame",
    district: "Caué",
    lat: 0.028,
    lng: 6.518,
    type: "ponto_notavel",
    description: "Praia Inhame Eco Lodge",
  },
  {
    name: "Praia Jalé",
    district: "Caué",
    lat: 0.042,
    lng: 6.545,
    type: "ponto_notavel",
    description: "Praia Jalé / Desova de Tartarugas Marinhas",
  },
  {
    name: "Praia Piscina",
    district: "Caué",
    lat: 0.032,
    lng: 6.528,
    type: "ponto_notavel",
    description: "Praia Piscina",
  },
  {
    name: "Praia Grande (Caué)",
    district: "Caué",
    lat: 0.052,
    lng: 6.552,
    type: "ponto_notavel",
    description: "Praia Grande",
  },
  // Roças e Núcleos Históricos
  {
    name: "Henrique (Caué)",
    district: "Caué",
    lat: 0.125,
    lng: 6.635,
    type: "roca",
    description: "Roça Henrique",
  },
  {
    name: "Vila Clotilde",
    district: "Caué",
    lat: 0.105,
    lng: 6.615,
    type: "roca",
    description: "Roça Vila Clotilde",
  },
  {
    name: "Soledade",
    district: "Caué",
    lat: 0.118,
    lng: 6.625,
    type: "roca",
    description: "Roça Soledade",
  },
  {
    name: "Monte Mário",
    district: "Caué",
    lat: 0.082,
    lng: 6.585,
    type: "roca",
    description: "Roça Monte Mário",
  },
  {
    name: "São José",
    district: "Caué",
    lat: 0.095,
    lng: 6.598,
    type: "roca",
    description: "Roça São José",
  },
  {
    name: "Ió Grande (Sul)",
    district: "Caué",
    lat: 0.13,
    lng: 6.638,
    type: "roca",
    description: "Ió Grande",
  },
  {
    name: "Fraternidade",
    district: "Caué",
    lat: 0.121,
    lng: 6.628,
    type: "roca",
    description: "Fraternidade",
  },
  {
    name: "Misericórdia (Caué)",
    district: "Caué",
    lat: 0.088,
    lng: 6.592,
    type: "roca",
    description: "Misericórdia",
  },
  {
    name: "Trindade (Caué)",
    district: "Caué",
    lat: 0.145,
    lng: 6.651,
    type: "roca",
    description: "Trindade do Sul",
  },

  // ==========================================
  // 7. PAGUÉ (Região Autónoma do Príncipe)
  // ==========================================
  // Cidades e Projetos Modernos
  {
    name: "Cidade de Santo António",
    district: "Pagué (Príncipe)",
    lat: 1.6385,
    lng: 7.4201,
    type: "cidade",
    description: "Capital da Região Autónoma do Príncipe",
  },
  {
    name: "Vila Comunitária da Terra Prometida",
    district: "Pagué (Príncipe)",
    lat: 1.648,
    lng: 7.412,
    type: "vila",
    description: "Reassentamento Comunitário Sustentável",
  },
  // Vilas e Pistas
  {
    name: "Infante D. Henrique",
    district: "Pagué (Príncipe)",
    lat: 1.628,
    lng: 7.425,
    type: "localidade",
    description: "Infante D. Henrique",
  },
  {
    name: "Picão",
    district: "Pagué (Príncipe)",
    lat: 1.615,
    lng: 7.418,
    type: "localidade",
    description: "Picão",
  },
  {
    name: "Aeroporto (Príncipe)",
    district: "Pagué (Príncipe)",
    lat: 1.662,
    lng: 7.412,
    type: "ponto_notavel",
    description: "Aeródromo do Príncipe",
  },
  {
    name: "São Joaquim",
    district: "Pagué (Príncipe)",
    lat: 1.622,
    lng: 7.408,
    type: "localidade",
    description: "São Joaquim",
  },
  {
    name: "Abade (Príncipe)",
    district: "Pagué (Príncipe)",
    lat: 1.608,
    lng: 7.432,
    type: "localidade",
    description: "Praia e Aldeia de Abade",
  },
  {
    name: "Nova Estrela",
    district: "Pagué (Príncipe)",
    lat: 1.598,
    lng: 7.428,
    type: "localidade",
    description: "Nova Estrela",
  },
  {
    name: "Paciência",
    district: "Pagué (Príncipe)",
    lat: 1.642,
    lng: 7.395,
    type: "localidade",
    description: "Paciência",
  },
  {
    name: "Ponta do Sol (Príncipe)",
    district: "Pagué (Príncipe)",
    lat: 1.678,
    lng: 7.422,
    type: "localidade",
    description: "Ponta do Sol",
  },
  {
    name: "São Tomézinho",
    district: "Pagué (Príncipe)",
    lat: 1.618,
    lng: 7.402,
    type: "localidade",
    description: "São Tomézinho",
  },
  {
    name: "Lapa",
    district: "Pagué (Príncipe)",
    lat: 1.632,
    lng: 7.398,
    type: "localidade",
    description: "Lapa",
  },
  {
    name: "Oque Daniel",
    district: "Pagué (Príncipe)",
    lat: 1.625,
    lng: 7.415,
    type: "localidade",
    description: "Oque Daniel",
  },
  // Zonas Balneares e Ilhéus
  {
    name: "Praia Burra",
    district: "Pagué (Príncipe)",
    lat: 1.682,
    lng: 7.438,
    type: "ponto_notavel",
    description: "Praia Burra",
  },
  {
    name: "Praia Banana",
    district: "Pagué (Príncipe)",
    lat: 1.685,
    lng: 7.435,
    type: "ponto_notavel",
    description: "Praia Banana",
  },
  {
    name: "Praia Évora",
    district: "Pagué (Príncipe)",
    lat: 1.672,
    lng: 7.442,
    type: "ponto_notavel",
    description: "Praia Évora",
  },
  {
    name: "Ilhéu Bom Bom",
    district: "Pagué (Príncipe)",
    lat: 1.698,
    lng: 7.402,
    type: "ponto_notavel",
    description: "Ilhéu Bom Bom Resort & Farol",
  },
  // Roças (Ecossistema Agroindustrial)
  {
    name: "Sundy",
    district: "Pagué (Príncipe)",
    lat: 1.662,
    lng: 7.385,
    type: "roca",
    description:
      "Roça Sundy / Local histórico da comprovação da Teoria da Relatividade de Einstein",
  },
  {
    name: "Terreiro Velho",
    district: "Pagué (Príncipe)",
    lat: 1.595,
    lng: 7.41,
    type: "roca",
    description: "Roça Terreiro Velho / Produção de Cacau Fino Claudio Corallo",
  },
  {
    name: "Porto Real",
    district: "Pagué (Príncipe)",
    lat: 1.62,
    lng: 7.405,
    type: "roca",
    description: "Roça Porto Real",
  },
  {
    name: "Belo Monte",
    district: "Pagué (Príncipe)",
    lat: 1.678,
    lng: 7.428,
    type: "roca",
    description: "Roça Belo Monte",
  },
  {
    name: "Esperança",
    district: "Pagué (Príncipe)",
    lat: 1.635,
    lng: 7.39,
    type: "roca",
    description: "Roça Esperança",
  },
  {
    name: "São João (Príncipe)",
    district: "Pagué (Príncipe)",
    lat: 1.605,
    lng: 7.415,
    type: "roca",
    description: "Roça São João",
  },
  {
    name: "Santa Rita",
    district: "Pagué (Príncipe)",
    lat: 1.645,
    lng: 7.382,
    type: "roca",
    description: "Santa Rita",
  },
  {
    name: "Maria Correia",
    district: "Pagué (Príncipe)",
    lat: 1.652,
    lng: 7.375,
    type: "roca",
    description: "Roça Maria Correia",
  },
];

/**
 * Calcula a distância em quilómetros entre duas coordenadas (Fórmula Haversine)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type STPPreciseLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  district: string;
  zone: string;
  street?: string;
  zoneType: string;
  distanceToZoneCenterMeters: number;
  formattedAddress: string;
  mapsUrl: string;
  directionsUrl: string;
  wazeUrl: string;
  appleMapsUrl: string;
  geoUri: string;
  shareMessage: string;
  timestamp: number;
};

/**
 * Encontra uma zona da base de dados pelo nome aproximado (busca textual flexível)
 */
export function findSTPZoneByName(searchTerm: string): STPZoneInfo | null {
  if (!searchTerm || !searchTerm.trim()) return null;
  const term = searchTerm.toLowerCase().trim();

  // Correspondência exata
  const exact = STP_ZONES_DATABASE.find(
    (z) => z.name.toLowerCase() === term || z.name.toLowerCase().includes(term),
  );
  if (exact) return exact;

  // Correspondência em descrição ou distrito
  return (
    STP_ZONES_DATABASE.find(
      (z) => z.description?.toLowerCase().includes(term) || z.district.toLowerCase().includes(term),
    ) || null
  );
}

/**
 * Encontra a zona e o distrito mais próximos em STP a partir de coordenadas GPS
 */
export function identifySTPZone(
  lat: number,
  lng: number,
): {
  zone: STPZoneInfo;
  distanceMeters: number;
} {
  let closestZone = STP_ZONES_DATABASE[0];
  let minDistance = Infinity;

  for (const zone of STP_ZONES_DATABASE) {
    const distKm = calculateDistanceKm(lat, lng, zone.lat, zone.lng);
    if (distKm < minDistance) {
      minDistance = distKm;
      closestZone = zone;
    }
  }

  return {
    zone: closestZone,
    distanceMeters: Math.round(minDistance * 1000),
  };
}

/**
 * Tenta obter detalhes da rua ou localidade por geocodificação inversa em tempo real
 */
async function fetchOnlineGeocode(
  lat: number,
  lng: number,
): Promise<{ street?: string; district?: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "pt,pt-PT;q=0.9,en;q=0.8" },
      },
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street =
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.hamlet ||
        addr.village ||
        addr.town ||
        addr.city ||
        addr.county;
      const district = addr.state || addr.county || addr.city;
      return { street, district };
    }
  } catch {
    // Fallback silencioso para base local de STP
  }
  return null;
}

/**
 * Obtém a localização GPS em tempo real do utilizador com precisão máxima de hardware (Estilo Encontrar Dispositivo / Google Maps),
 * com fallback inteligente para baixa precisão e coordenadas locais de São Tomé caso o sinal ou permissão esteja restrito no iframe.
 */
export async function getSTPPreciseGPS(): Promise<STPPreciseLocation | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // Função auxiliar para construir objeto de localização STP
  const buildLocationObject = async (
    latitude: number,
    longitude: number,
    accuracy: number,
    isFallback = false,
  ): Promise<STPPreciseLocation> => {
    // Verifica se as coordenadas estão dentro das fronteiras geográficas de São Tomé e Príncipe
    // Coordenadas aproximadas de STP: Lat entre -0.1 e 1.85, Lng entre 6.3 e 7.6
    const isInsideSTP =
      latitude >= -0.15 && latitude <= 1.85 && longitude >= 6.3 && longitude <= 7.6;

    let zone: STPZoneInfo;
    let distanceMeters: number;

    if (isInsideSTP) {
      const match = identifySTPZone(latitude, longitude);
      zone = match.zone;
      distanceMeters = match.distanceMeters;
    } else {
      // O dispositivo está a aceder a partir do exterior (Portugal, Angola, etc.)
      // Mantemos as coordenadas GPS reais do telemóvel para mapa/direções e associamos à capital para serviços
      zone = {
        district: "Água Grande",
        name: "Cidade de São Tomé",
        type: "cidade",
        lat: 0.3365,
        lng: 6.7273,
        description: "Centro Operacional KONEKTA (Coordenadas de teste fora de STP)",
      };
      distanceMeters = 0;
    }

    let resolvedStreet: string | undefined;
    if (!isFallback && isInsideSTP) {
      try {
        const onlineInfo = await fetchOnlineGeocode(latitude, longitude);
        if (onlineInfo?.street) {
          const rawStreet = onlineInfo.street.trim();
          const isGenericOrConflict =
            rawStreet.toLowerCase().includes("são tomé") ||
            rawStreet.toLowerCase().includes("príncipe") ||
            rawStreet.toLowerCase().includes("água grande") ||
            rawStreet.toLowerCase().includes("mé-zóchi") ||
            (rawStreet.toLowerCase() !== zone.name.toLowerCase() &&
              STP_ZONES_DATABASE.some(
                (z) =>
                  z.name.toLowerCase() === rawStreet.toLowerCase() ||
                  rawStreet.toLowerCase().includes(z.name.toLowerCase()),
              ));

          if (!isGenericOrConflict) {
            resolvedStreet = rawStreet;
          }
        }
      } catch {
        // Ignora erro de rede na geocodificação inversa
      }
    }

    const resolvedZoneName = resolvedStreet ? `${resolvedStreet}, ${zone.name}` : zone.name;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=18`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    // Protocolo nativo da Apple no iOS abre diretamente o Apple Maps com navegação passo-a-passo
    const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
    // Protocolo geo URI nativo do Android / mobile
    const geoUri = `geo:${latitude},${longitude}?q=${latitude},${longitude}(Cliente+KONEKTA)`;

    const formattedAddress = isInsideSTP
      ? `${resolvedZoneName}, ${zone.district}, São Tomé e Príncipe`
      : `${resolvedZoneName}, São Tomé e Príncipe (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

    const shareMessage = `📍 Localização Exata do Cliente (GPS Nativo):\n${formattedAddress}\nCoordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Precisão: ±${Math.round(accuracy)}m)\n🧭 Iniciar Rota no Mapa: ${directionsUrl}`;

    return {
      latitude,
      longitude,
      accuracy,
      district: zone.district,
      zone: resolvedZoneName,
      street: resolvedStreet,
      zoneType: zone.type,
      distanceToZoneCenterMeters: distanceMeters,
      formattedAddress,
      mapsUrl,
      directionsUrl,
      wazeUrl,
      appleMapsUrl,
      geoUri,
      shareMessage,
      timestamp: Date.now(),
    };
  };

  // Se o dispositivo ou navegador não suportar API de geolocalização
  if (!("geolocation" in navigator)) {
    toast.warning(
      "O navegador não possui suporte a GPS nativo. A utilizar localização de São Tomé (Água Grande).",
    );
    return buildLocationObject(0.3365, 6.7273, 50, true);
  }

  // Tenta obter posição do hardware do telemóvel
  const tryGetPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      try {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Acompanha o GPS durante alguns segundos e guarda sempre a leitura mais precisa.
   * O primeiro fix do telemóvel costuma vir da rede (±1000m); só depois os satélites
   * afinam para ±5-20m. Por isso esperamos pela convergência em vez de aceitar o 1º ponto.
   */
  const watchBestPosition = (
    targetAccuracy = 20,
    maxWaitMs = 20000,
  ): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      let best: GeolocationPosition | null = null;
      let watchId: number | null = null;
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        clearTimeout(hardTimer);
        clearTimeout(softTimer);
        resolve(best);
      };

      // Corte máximo absoluto
      const hardTimer = setTimeout(finish, maxWaitMs);
      // Se já temos algo razoável passados 9s, não fazemos o utilizador esperar mais
      const softTimer = setTimeout(() => {
        if (best && (best.coords.accuracy ?? 9999) <= 60) finish();
      }, 9000);

      try {
        watchId = navigator.geolocation.watchPosition(
          (p) => {
            const acc = p.coords.accuracy ?? 9999;
            if (!best || acc < (best.coords.accuracy ?? 9999)) best = p;
            if (acc <= targetAccuracy) finish();
          },
          () => {
            // Mantemos o melhor fix já obtido; erros intermédios não abortam
            if (best) finish();
          },
          { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 },
        );
      } catch {
        finish();
      }
    });
  };

  try {
    let pos: GeolocationPosition | null = null;
    let lastError: GeolocationPositionError | null = null;

    // 0ª verificação: permissão explicitamente negada — evita esperas inúteis
    try {
      const perm = await navigator.permissions?.query?.({ name: "geolocation" as PermissionName });
      if (perm?.state === "denied") {
        toast.error("Permissão de localização negada no navegador.", {
          description:
            "Para detetar a sua posição exata com o GPS do telemóvel, permita o acesso à localização no cadeado do navegador.",
          duration: 5000,
        });
        return await buildLocationObject(0.3365, 6.7273, 50, true);
      }
    } catch {
      // Nem todos os navegadores suportam a Permissions API — seguimos em frente
    }

    // 1ª Tentativa: acompanhamento contínuo dos satélites até convergir na posição exata
    pos = await watchBestPosition(20, 20000);

    if (!pos) {
      try {
        pos = await tryGetPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      } catch (err) {
        lastError = err as GeolocationPositionError;
        console.warn("Alta precisão GPS excedeu tempo ou falhou, tentando precisão por rede:", err);

        if (lastError?.code === 1) {
          toast.error("Permissão de localização negada no navegador.", {
            description:
              "Para detetar a sua posição exata com o GPS do telemóvel, permita o acesso à localização no cadeado do navegador.",
            duration: 5000,
          });
          return await buildLocationObject(0.3365, 6.7273, 50, true);
        }

        // 2ª Tentativa: precisão por rede (antenas CST/Unitel ou Wi-Fi)
        try {
          pos = await tryGetPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000,
          });
        } catch (lowAccuracyErr) {
          lastError = lowAccuracyErr as GeolocationPositionError;
          console.warn("Precisão de rede também falhou:", lowAccuracyErr);
        }
      }
    }

    if (pos && pos.coords) {
      const { latitude, longitude, accuracy } = pos.coords;
      triggerDeviceVibration([40, 60, 40]);

      const isInsideSTP =
        latitude >= -0.15 && latitude <= 1.85 && longitude >= 6.3 && longitude <= 7.6;

      const result = await buildLocationObject(latitude, longitude, accuracy || 10, false);

      if (isInsideSTP) {
        toast.success(`📍 GPS do Telemóvel: ${result.zone}`, {
          description: `Zona detetada em ${result.district} (precisão ±${Math.round(accuracy || 10)}m).`,
        });
      } else {
        toast.success("🛰️ GPS nativo do dispositivo detetado!", {
          description: `Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Centro operacional de São Tomé pré-selecionado para serviços locais.`,
        });
      }

      return result;
    }

    // Diagnóstico claro do motivo caso o GPS não tenha respondido
    if (lastError?.code === 2) {
      toast.warning("GPS desativado no telemóvel.", {
        description:
          "Ative a Localização/GPS nas definições do seu telemóvel para detetar a zona exata.",
      });
    } else if (lastError?.code === 3) {
      toast.info("O sinal de GPS demorou a responder. A utilizar São Tomé (Água Grande).");
    } else {
      toast.info(
        "A usar localização estimada de São Tomé (Água Grande). Pode ajustar o bairro na lista.",
      );
    }

    return await buildLocationObject(0.3365, 6.7273, 40, true);
  } catch (err) {
    console.error("GPS unexpected error:", err);
    toast.info("Localização configurada para o centro de São Tomé.");
    return await buildLocationObject(0.3365, 6.7273, 50, true);
  }
}
