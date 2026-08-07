/**
 * Regras de negócio financeiras e de segurança do KONEKTA STP.
 * - Filtro anti-bypass do chat (telefones, links, "WhatsApp", "ligar"...)
 * - Calculadora de comissão (taxa de sucesso sobre o serviço concluído)
 * - Ciclo de saques às quintas-feiras
 */

export const COMMISSION_PCT = 20;

/* ------------------------------- Anti-bypass ------------------------------ */

const PATTERNS: RegExp[] = [
  // números de telefone (STP e internacionais), com ou sem separadores
  /(\+?\d[\d\s().-]{6,}\d)/i,
  // números por extenso colados tipo "9 9 1 2 3 4 5"
  /(?:\b\d\b[\s.-]*){7,}/,
  // links e domínios
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|st|pt|br|io|me|app|link)\b)/i,
  // redes e canais externos
  /\b(whats\s*app|whatsapp|whatsap|zap|telegram|messenger|instagram|insta|facebook|face|viber|imo|e-?mail|gmail|hotmail)\b/i,
  // pedidos de contacto direto
  /\b(liga(r|-?me)?|liguem|chama(r|-me)?\s*(no|pelo)|meu\s*(n[uú]mero|contacto|contato)|passa(r)?\s*(o)?\s*(n[uú]mero|contacto)|fora\s*d(a|o)\s*(app|plataforma))\b/i,
];

export const BLOCK_NOTICE =
  "Por motivos de segurança, contactos externos só são liberados após a confirmação do serviço.";

export function containsBlockedContent(text: string): boolean {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_*~`]/g, "");
  return PATTERNS.some((re) => re.test(normalized));
}

/* --------------------------- Calculadora de taxa -------------------------- */

export type QuoteBreakdown = {
  /** valor líquido que o prestador quer receber */
  net: number;
  /** taxa da plataforma em Dobras */
  fee: number;
  /** valor cobrado ao cliente */
  gross: number;
  feePct: number;
};

/** A partir do líquido desejado pelo prestador, calcula o valor cobrado ao cliente. */
export function quoteFromNet(net: number, feePct = COMMISSION_PCT): QuoteBreakdown {
  const safeNet = Math.max(0, Math.round(net || 0));
  const gross = Math.round(safeNet / (1 - feePct / 100));
  return { net: safeNet, fee: gross - safeNet, gross, feePct };
}

/** A partir do valor cobrado ao cliente, calcula o líquido do prestador. */
export function quoteFromGross(gross: number, feePct = COMMISSION_PCT): QuoteBreakdown {
  const safeGross = Math.max(0, Math.round(gross || 0));
  const fee = Math.round((safeGross * feePct) / 100);
  return { net: safeGross - fee, fee, gross: safeGross, feePct };
}

export function formatDb(value: number) {
  return `${Math.round(value).toLocaleString("pt-PT")} Db`;
}

/* ----------------------------- Ciclo de saques ---------------------------- */

/** Saques só são libertados às quintas-feiras (dia 4 da semana). */
export const PAYOUT_WEEKDAY = 4;

export function isPayoutDay(date = new Date()) {
  return date.getDay() === PAYOUT_WEEKDAY;
}

export function nextPayoutDate(date = new Date()) {
  const d = new Date(date);
  const diff = (PAYOUT_WEEKDAY - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function payoutLabel(date = new Date()) {
  if (isPayoutDay(date)) return "Disponível hoje (quinta-feira)";
  const next = nextPayoutDate(date);
  return `Disponível ${next.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" })}`;
}
