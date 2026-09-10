/**
 * Motor local de interpretação de pedidos KONEKTA STP.
 * Lê uma frase escrita pelo cliente e deduz categoria, urgência,
 * orçamento estimado e o modelo de pedido mais próximo.
 * 100% offline (sem chamadas externas) — funciona com internet fraca.
 */

import { STP_QUICK_SERVICE_TEMPLATES, type ServiceQuickTemplate } from "./stp-order-intelligence";
import type { RequestUrgency } from "./requests";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  eletricista: [
    "luz",
    "luzes",
    "energia",
    "corrente",
    "electric",
    "elétric",
    "eletric",
    "disjuntor",
    "quadro",
    "curto",
    "curto-circuito",
    "tomada",
    "interruptor",
    "gerador",
    "inversor",
    "solar",
    "bateria",
    "emae",
    "lampada",
    "lâmpada",
    "fio",
    "cabo",
  ],
  canalizador: [
    "agua",
    "água",
    "cano",
    "canalizacao",
    "canalização",
    "torneira",
    "fuga",
    "vazamento",
    "esgoto",
    "sanita",
    "casa de banho",
    "chuveiro",
    "bomba",
    "tanque",
    "deposito",
    "depósito",
    "autoclismo",
    "entupido",
    "entupimento",
    "lavatorio",
    "lavatório",
  ],
  limpeza: [
    "limpeza",
    "limpar",
    "faxina",
    "arrumar",
    "lavar casa",
    "domestica",
    "doméstica",
    "empregada",
    "pos-obra",
    "pós-obra",
    "sofa",
    "sofá",
    "estofo",
    "vidros",
    "quintal",
  ],
  pintor: [
    "pintar",
    "pintura",
    "tinta",
    "parede",
    "paredes",
    "verniz",
    "massa",
    "estuque",
    "fachada",
    "repintar",
  ],
  mecanico: [
    "carro",
    "viatura",
    "moto",
    "motorizada",
    "motor",
    "travao",
    "travão",
    "travoes",
    "embraiagem",
    "oleo",
    "óleo",
    "pneu",
    "bateria do carro",
    "mecanic",
    "avaria",
    "revisao",
    "revisão",
  ],
  jardinagem: [
    "jardim",
    "relva",
    "grama",
    "capim",
    "roçar",
    "rocar",
    "arvore",
    "árvore",
    "poda",
    "podar",
    "quintal",
    "plantas",
    "horta",
  ],
  "ar-condicionado": [
    "ar condicionado",
    "ar-condicionado",
    "split",
    "climatiza",
    "frio",
    "gas do ar",
    "recarga de gas",
    "arrefec",
    "ventoinha",
    "arca",
    "frigorifico",
    "frigorífico",
    "geleira",
  ],
  beleza: [
    "cabelo",
    "trancas",
    "tranças",
    "unha",
    "manicure",
    "pedicure",
    "maquilhagem",
    "make",
    "barba",
    "corte",
    "penteado",
    "sobrancelha",
  ],
};

const URGENT_WORDS = [
  "urgente",
  "urgência",
  "urgencia",
  "hoje",
  "agora",
  "imediato",
  "emergencia",
  "emergência",
  "rápido",
  "rapido",
  "já",
  "socorro",
  "inundad",
  "a arder",
  "sem luz",
  "sem água",
  "sem agua",
];

const RELAXED_WORDS = [
  "sem pressa",
  "quando puder",
  "qualquer dia",
  "próximo mês",
  "proximo mes",
  "não é urgente",
  "nao e urgente",
];

export interface SmartIntentResult {
  categorySlug: string | null;
  confidence: number; // 0 a 1
  urgency: RequestUrgency;
  suggestedTitle: string;
  suggestedBudget?: number;
  template?: ServiceQuickTemplate;
  matchedWords: string[];
  /** Perguntas curtas que ajudam o prestador a orçar melhor */
  followUps: string[];
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectUrgency(raw: string): RequestUrgency {
  const t = normalize(raw);
  if (RELAXED_WORDS.some((w) => t.includes(normalize(w)))) return "sem-pressa";
  if (URGENT_WORDS.some((w) => t.includes(normalize(w)))) return "urgente";
  return "esta-semana";
}

function detectBudget(raw: string): number | undefined {
  const t = normalize(raw).replace(/\./g, "");
  const m = t.match(/(\d{2,7})\s*(db|dobras|stn)?/);
  if (!m) return undefined;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value < 50 || value > 500000) return undefined;
  return value;
}

const FOLLOW_UP_BY_CATEGORY: Record<string, string[]> = {
  eletricista: [
    "O problema é em toda a casa ou só numa divisão?",
    "Já tenta com a corrente da EMAE ou com gerador/inversor?",
  ],
  canalizador: [
    "A água vem da rede pública ou de tanque/depósito?",
    "A fuga é constante ou só quando abre a torneira?",
  ],
  limpeza: [
    "Quantas divisões tem o espaço?",
    "É limpeza pontual ou quer serviço regular por semana?",
  ],
  pintor: ["Qual é a área aproximada (m²)?", "Já tem a tinta comprada?"],
  mecanico: ["Qual é a marca e o ano da viatura?", "O carro ainda pega/anda?"],
  jardinagem: ["Qual é o tamanho do terreno?", "É corte de relva ou também poda de árvores?"],
  "ar-condicionado": [
    "Quantos aparelhos precisam de intervenção?",
    "É instalação, limpeza ou recarga de gás?",
  ],
  beleza: ["Prefere ser atendida em casa ou no salão?", "Que data e hora lhe dá jeito?"],
};

const GENERIC_FOLLOW_UPS = [
  "Pode juntar uma foto do local? Ajuda o prestador a orçar melhor.",
  "Indique o bairro e um ponto de referência conhecido.",
];

/** Analisa a frase do cliente e devolve a leitura inteligente do pedido. */
export function analyzeRequestText(text: string): SmartIntentResult {
  const t = normalize(text);
  const urgency = detectUrgency(text);
  let bestSlug: string | null = null;
  let bestScore = 0;
  let matched: string[] = [];

  for (const [slug, words] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = words.filter((w) => t.includes(normalize(w)));
    const score = hits.reduce((acc, w) => acc + (w.length > 5 ? 2 : 1), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSlug = slug;
      matched = hits;
    }
  }

  // Modelo mais próximo dentro da categoria detectada
  let template: ServiceQuickTemplate | undefined;
  if (bestSlug) {
    const pool = STP_QUICK_SERVICE_TEMPLATES.filter((tpl) => tpl.categorySlug === bestSlug);
    let tplScore = 0;
    for (const tpl of pool) {
      const tplWords = normalize(`${tpl.title} ${tpl.suggestedDesc}`)
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 4);
      const score = tplWords.filter((w) => t.includes(w)).length;
      if (score > tplScore) {
        tplScore = score;
        template = tpl;
      }
    }
    if (!template && pool.length > 0) {
      template = pool.find((p) => p.urgency === urgency) ?? pool[0];
    }
  }

  const confidence = Math.min(1, bestScore / 6);
  const followUps = [
    ...(bestSlug ? (FOLLOW_UP_BY_CATEGORY[bestSlug] ?? []) : []),
    ...GENERIC_FOLLOW_UPS,
  ].slice(0, 3);

  const cleaned = text.trim().replace(/\s+/g, " ");
  const suggestedTitle =
    cleaned.length > 0
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 70) + (cleaned.length > 70 ? "…" : "")
      : "";

  return {
    categorySlug: bestSlug,
    confidence,
    urgency,
    suggestedTitle,
    suggestedBudget: detectBudget(text) ?? template?.estimatedBudgetSTN,
    template,
    matchedWords: matched,
    followUps,
  };
}

/** Avalia a qualidade do pedido e sugere melhorias antes de publicar. */
export function scoreRequestQuality(input: {
  title: string;
  description: string;
  photos: number;
  address?: string;
  reference?: string;
  budget?: number;
}) {
  const tips: string[] = [];
  let score = 0;

  if (input.title.trim().length >= 8) score += 15;
  else tips.push("Escreva um título mais claro (ex.: “Fuga de água na cozinha”).");

  if (input.description.trim().length >= 60) score += 30;
  else tips.push("Detalhe melhor o problema — pedidos detalhados recebem mais propostas.");

  if (input.photos > 0) score += 25;
  else tips.push("Anexe pelo menos uma foto do local.");

  if ((input.address ?? "").trim().length >= 5) score += 15;
  else tips.push("Indique a morada aproximada.");

  if ((input.reference ?? "").trim().length >= 4) score += 10;
  else tips.push("Adicione um ponto de referência (ex.: “perto do BISTP”).");

  if (input.budget && input.budget > 0) score += 5;

  return { score: Math.min(100, score), tips: tips.slice(0, 3) };
}
