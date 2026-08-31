import { STP_TIMEZONE } from "./stp-time";
import { COUNTRIES } from "./countries";

/**
 * Regras de negócio financeiras e de segurança do KONEKTA STP.
 * - Filtro anti-bypass do chat e formulários (telefones, links, "WhatsApp", "ligar"...)
 * - Calculadora de comissão (taxa de sucesso sobre o serviço concluído)
 * - Ciclo de saques às quintas-feiras
 */

export const COMMISSION_PCT = 20;
export const COMPANY_MONTHLY_PLAN_DEFAULT = 1500; // 1.500 Db/mês
export const TECHNICAL_VISIT_FEE_DEFAULT = 150; // 150 Db taxa de visita técnica Uber-style

/* ------------------------------- Anti-bypass ------------------------------ */

/**
 * Categorias e razões de bloqueio para negociação fora da app.
 */
export type BlockCategory =
  "phone" | "social_app" | "email_link" | "banking" | "outside_payment" | "contact_request";

export interface BlockAnalysis {
  blocked: boolean;
  category?: BlockCategory;
  reason?: string;
  matchedText?: string;
  country?: {
    name: string;
    code: string;
    flag: string;
    expectedDigits: number;
  };
}

/** Tabela de regras de países construída a partir da lista oficial de países */
interface CountryPhoneRule {
  name: string;
  code: string;
  flag: string;
  expectedDigits: number;
  prefixRegex: RegExp;
  localRegex?: RegExp;
}

function buildCountryRules(): CountryPhoneRule[] {
  return COUNTRIES.map((c) => {
    const rawCode = c.code.replace("+", "");
    // Regex para identificar número com indicativo internacional (+239, 00239, 239)
    const prefixRegex = new RegExp(
      `(?:(?:\\+|00)\\s*${rawCode}|\\b${rawCode})[\\s.-]*([0-9][\\d\\s.-]{${Math.max(4, c.digits - 2)},}\\d|\\b\\d{${c.digits}}\\b)`,
      "i",
    );

    let localRegex: RegExp | undefined = undefined;

    if (c.code === "+239") {
      // STP: estritamente 7 dígitos começando por 9 (móvel: 90, 98, 99) ou 2 (fixo: 22)
      localRegex =
        /(?:^|[^\d+])\b([92]\d[\s.-]*\d{2}[\s.-]*\d{3}|[92]\d{6}|[92]\d{2}[\s.-]*\d{4})\b(?!\s*(?:db|stn|dobras?|euros?|€|\$|kg|m2|metros|horas?|h|min|dias?|anos?|%|\/))/i;
    } else if (c.code === "+351") {
      // Portugal: 9 dígitos começando por 9 ou 2
      localRegex =
        /(?:^|[^\d+])\b(9[1236]\d[\s.-]*\d{3}[\s.-]*\d{3}|2\d[\s.-]*\d{3}[\s.-]*\d{4})\b(?!\s*(?:db|stn|dobras?|euros?|€|\$))/i;
    } else if (c.code === "+244") {
      // Angola: 9 dígitos começando por 9
      localRegex =
        /(?:^|[^\d+])\b(9[1-9]\d[\s.-]*\d{3}[\s.-]*\d{3})\b(?!\s*(?:db|stn|dobras?|kz|kwanzas?))/i;
    } else if (c.code === "+238") {
      // Cabo Verde: 7 dígitos começando por 9 ou 2
      localRegex =
        /(?:^|[^\d+])\b([92]\d[\s.-]*\d{2}[\s.-]*\d{3}|[92]\d{6})\b(?!\s*(?:db|stn|cve))/i;
    } else if (c.code === "+258") {
      // Moçambique: 9 dígitos começando por 8
      localRegex =
        /(?:^|[^\d+])\b(8[2-7]\d[\s.-]*\d{3}[\s.-]*\d{3})\b(?!\s*(?:db|stn|mtn|meticais?))/i;
    } else if (c.code === "+245") {
      // Guiné-Bissau: 7 dígitos começando por 9
      localRegex = /(?:^|[^\d+])\b(9[567]\d{5})\b(?!\s*(?:db|cfa|xof))/i;
    }

    return {
      name: c.name,
      code: c.code,
      flag: c.flag,
      expectedDigits: c.digits,
      prefixRegex,
      localRegex,
    };
  });
}

const COUNTRY_PHONE_RULES: CountryPhoneRule[] = buildCountryRules();

/** Detecta e valida se um texto contém um número de telefone e determina o país correspondente */
function detectPhoneNumberWithCountry(text: string): {
  detected: boolean;
  country?: { name: string; code: string; flag: string; expectedDigits: number };
  matchedText?: string;
  reason?: string;
} {
  // 1. Procura primeiro com regras de países com prefixo ou indicativo explícito
  for (const rule of COUNTRY_PHONE_RULES) {
    const match = text.match(rule.prefixRegex);
    if (match) {
      return {
        detected: true,
        country: {
          name: rule.name,
          code: rule.code,
          flag: rule.flag,
          expectedDigits: rule.expectedDigits,
        },
        matchedText: match[0].trim(),
        reason: `${rule.flag} Contacto telefónico de ${rule.name} detectado (${rule.code} · ${rule.expectedDigits} dígitos). É estritamente proibido partilhar contactos para garantir a custódia do serviço.`,
      };
    }
  }

  // 2. Procura números locais específicos (em particular STP: 7 dígitos começando por 9 ou 2)
  for (const rule of COUNTRY_PHONE_RULES) {
    if (rule.localRegex) {
      const match = text.match(rule.localRegex);
      if (match) {
        const rawMatch = match[1] || match[0];
        const cleanDigits = rawMatch.replace(/\D/g, "");
        // Garante que não é um preço ou medida (verifica contagem exata)
        if (cleanDigits.length === rule.expectedDigits) {
          return {
            detected: true,
            country: {
              name: rule.name,
              code: rule.code,
              flag: rule.flag,
              expectedDigits: rule.expectedDigits,
            },
            matchedText: rawMatch.trim(),
            reason: `${rule.flag} Contacto telefónico de ${rule.name} detectado (${rule.code} · o formato tem ${rule.expectedDigits} dígitos: ${rawMatch.trim()}). As negociações devem ser feitas exclusivamente na app.`,
          };
        }
      }
    }
  }

  // 3. Sequências de 7 dígitos espaçados tipo "9 9 4 4 7 4 7" ou "9 8 1 2 3 4 5"
  const spacedDigitsMatch = text.match(/\b([92])\s*(\d)\s*(\d)\s*(\d)\s*(\d)\s*(\d)\s*(\d)\b/);
  if (spacedDigitsMatch) {
    const full = spacedDigitsMatch[0];
    const cleanDigits = full.replace(/\D/g, "");
    if (cleanDigits.length === 7) {
      return {
        detected: true,
        country: {
          name: "São Tomé e Príncipe",
          code: "+239",
          flag: "🇸🇹",
          expectedDigits: 7,
        },
        matchedText: full,
        reason: `🇸🇹 Contacto de São Tomé e Príncipe detectado (+239 · 7 dígitos: ${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3)}). Partilha de contactos na plataforma é bloqueada.`,
      };
    }
  }

  const spaced9Match = text.match(
    /\b([92])\s*(\d)\s*(\d)\s*(\d)\s*(\d)\s*(\d)\s*(\d)\s*(\d)\s*(\d)\b/,
  );
  if (spaced9Match) {
    const full = spaced9Match[0];
    const cleanDigits = full.replace(/\D/g, "");
    if (cleanDigits.length === 9) {
      return {
        detected: true,
        country: {
          name: "Contacto Internacional",
          code: "+",
          flag: "🌍",
          expectedDigits: 9,
        },
        matchedText: full,
        reason: `🌍 Contacto telefónico internacional de 9 dígitos detectado (${cleanDigits}). É proibido partilhar contactos no aplicativo.`,
      };
    }
  }

  // 4. Números soletrados por extenso em português (ex: "nove nove quatro quatro sete quatro sete")
  const spelledStp = text.match(
    /(?:numero|contacto|contato|telefone|telemovel|fone|ligar|chama|meu)?\s*(?:e|eh|:|-)?\s*(?:(?:nove|dois|oito|sete|seis|cinco|quatro|tres|um|zero)[\s,.-]+){4,}(?:nove|dois|oito|sete|seis|cinco|quatro|tres|um|zero)/i,
  );
  if (spelledStp) {
    return {
      detected: true,
      country: {
        name: "São Tomé e Príncipe",
        code: "+239",
        flag: "🇸🇹",
        expectedDigits: 7,
      },
      matchedText: spelledStp[0],
      reason:
        "🇸🇹 Número de telefone soletrado detectado. Para sua proteção e garantia, os contactos não podem ser partilhados na aplicação.",
    };
  }

  // 5. Qualquer outro indicativo internacional genérico com mais de 6 dígitos
  const genericIntl = text.match(/(?:\+|00)[1-9]\d{0,3}[\s.-]*\d[\d\s.-]{5,}\d/);
  if (genericIntl) {
    return {
      detected: true,
      matchedText: genericIntl[0],
      reason:
        "Contacto telefónico internacional detectado. O envio de contactos é bloqueado para manter a segurança.",
    };
  }

  return { detected: false };
}

const SOCIAL_APP_REGEXES: RegExp[] = [
  // WhatsApp e variações (leetspeak, espaçados, abreviações)
  /\b(?:whats\s*app|whatsapp|whatsap|watsapp|watssap|watzap|vatsap|whats|wats|wpp|w\.p\.p|zapp?|zap\s*zap|z\.a\.p|wa\.me|api\.whatsapp)\b/i,
  // Telegram
  /\b(?:telegram|telegran|t\.me|t\/me|tg)\b/i,
  // Instagram / Facebook / Redes
  /\b(?:instagram|instagr|insta|direct\s*do\s*insta|facebook|face|messenger|fb\.com|fb\.me|m\.me|fb)\b/i,
  // Outras apps de mensagens e redes sociais
  /\b(?:viber|imo|signal|skype|discord|tiktok|tik\s*tok|twitter|x\.com|linkedin|wechat|snapchat|youtube|youtu\.be)\b/i,
  // Agregadores de link social (Linktree, etc.)
  /\b(?:linktr\.ee|beacons\.ai|bio\.link|carrd\.co)\b/i,
  // Handles com @ (menção a redes sociais: @nome)
  /(?:^|\s)@[a-z0-9_.]{3,}/i,
];

const EMAIL_LINK_REGEXES: RegExp[] = [
  // E-mails padrão
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  // Domínios de email e variações soletradas (arroba gmail, ponto com)
  /\b(?:gmail|hotmail|outlook|yahoo|icloud|protonmail|live\.com|sapo\.pt|uol\.com|bol\.com)\b/i,
  /\b(?:arroba|\[at\]|\(at\))\s*(?:gmail|hotmail|outlook|yahoo|icloud|mail|sapo)\b/i,
  // Links, URLs e domínios
  /(?:https?:\/\/|www\.)[^\s]+/i,
  /\b[a-z0-9-]+\.(?:st|pt|com|net|org|io|app|link|xyz|site|online|me|info|tech|biz)\b/i,
  /\b(?:ponto\s*(?:st|pt|com|net|org|io|app))\b/i,
];

const BANKING_REGEXES: RegExp[] = [
  // Dobra 24 e serviços de pagamento STP
  /\b(?:dobra\s*24|dobra24|cartao\s*dobra\s*24|app\s*dobra\s*24|d-?24)\b/i,
  // Bancos de São Tomé e Príncipe
  /\b(?:bistp|b\.i\.s\.t\.p|bgfi|bgfibank|afriland|banco\s*internacional|banco\s*central|caixa\s*geral)\b/i,
  // Bancos internacionais comuns
  /\b(?:bai|bfa|bic|millennium|santander|bradesco|itau|nubank)\b/i,
  // Chaves Pix, transferências diretas e termos bancários
  /\b(?:chave\s*pix|minha\s*chave|pix\s*e|manda\s*o\s*pix|paga\s*no\s*pix|pix\s*copia|copia\s*e\s*cola|meu\s*pix|pix)\b/i,
  /\b(?:nib|iban|swift|n[uú]mero\s*d[ea]\s*conta|n[ºo]\s*conta|comprovativo|dep[oó]sito\s*direto|transfer[eê]ncia\s*banc[aá]ria|mbway|paypal|multicaixa|western\s*union|moneygram)\b/i,
];

const OUTSIDE_PAYMENT_REGEXES: RegExp[] = [
  // Pagamento por fora / desintermediação
  /\b(?:pagar\s*por\s*fora|paga\s*por\s*fora|pagamos\s*por\s*fora|pagamento\s*por\s*fora|fazer\s*por\s*fora|tratar\s*por\s*fora|negociar\s*por\s*fora|acertar\s*por\s*fora|fechar\s*por\s*fora|fazemos\s*por\s*fora)\b/i,
  // Pagamento direto / em mão
  /\b(?:pagar\s*direto|paga\s*direto|pagamento\s*direto|acerto\s*direto|acertar\s*direto|pagar\s*no\s*direto|combinar\s*por\s*fora)\b/i,
  // Dinheiro físico / cash
  /\b(?:dinheiro\s*em\s*m[aã]o|dinheiro\s*na\s*m[aã]o|em\s*m[aã]os?|pagar\s*em\s*dinheiro|no\s*cash|em\s*numer[aá]rio|dinheiro\s*vivo)\b/i,
  // Evasão de comissão / taxa
  /\b(?:sem\s*(?:a\s*)?comiss[aã]o|sem\s*(?:a\s*)?taxa|evitar\s*(?:a\s*)?taxa|mais\s*barato\s*por\s*fora|desconto\s*por\s*fora|sem\s*passar\s*pel[ao]\s*app)\b/i,
  // Fora da app / plataforma
  /\b(?:fora\s*d[ao]\s*(?:app|aplica[cç][aã]o|plataforma|konekta))\b/i,
  // Crioulo Forro / São Tomé (dinhero na mon, paga na mon, etc.)
  /\b(?:dinhero\s*na\s*mon|paga\s*na\s*mon|fora\s*di\s*app|kontatu|numru|paga\s*diretu)\b/i,
];

const CONTACT_REQUEST_REGEXES: RegExp[] = [
  // Pedidos de chamada ou telefone
  /\b(?:liga(?:r|-?me)?|liguem|liga\s*pra\s*mim|me\s*liga|te\s*ligo|te\s*telefono)\b/i,
  // Pedidos e partilha de número ou contacto
  /\b(?:meu\s*(?:n[uú]mero|contacto|contato|fone)|passa(?:r)?\s*(?:o)?\s*(?:teu\s*)?(?:n[uú]mero|contacto|contato|zap|wpp)|d[aá](?:-me)?\s*(?:o)?\s*(?:teu\s*)?(?:n[uú]mero|contacto|zap))\b/i,
  /\b(?:manda(?:r)?\s*(?:o)?\s*(?:teu\s*)?(?:n[uú]mero|contacto|contato|zap|wpp)|deixa\s*(?:o\s*)?(?:teu\s*)?(?:n[uú]mero|contacto))\b/i,
  // Desvio para chat privado ou redes ("me chama no zap", "vamos falar no pv", etc.)
  /\b(?:me\s*chama\s*no\s*(?:zap|whatsapp|wpp|pv|privado|insta|face|facebook|telegram)|chama(?:r|-?me)?\s*(?:no|pelo|em)\s*(?:privado|pv|zap|wpp|insta|whatsapp|facebook|face)|falar?\s*no\s*(?:privado|pv|zap|wpp|whatsapp)|vamos\s*falar\s*no\s*pv)\b/i,
  /\b(?:vem\s*no\s*pv|manda\s*pv|conversar\s*por\s*fora|falar\s*por\s*fora|acertamos\s*por\s*fora|chama\s*no\s*zap|chama\s*zap|me\s*adiciona)\b/i,
];

export const BLOCK_NOTICE =
  "🔒 Bloqueio de Segurança KONEKTA: Todas as negociações, visitas técnicas, orçamentos e pagamentos são realizados de forma 100% interna e protegida no KONEKTA com garantia de custódia (escrow). É estritamente proibido partilhar contactos, telefones, redes sociais ou negociar por fora para proteger a garantia do serviço e os seus fundos.";

const SPELLED_DIGIT_MAP: Record<string, string> = {
  zero: "0",
  um: "1",
  uma: "1",
  dois: "2",
  duas: "2",
  tres: "3",
  três: "3",
  quatro: "4",
  cinco: "5",
  seis: "6",
  meia: "6",
  sete: "7",
  oito: "8",
  nove: "9",
  dez: "10",
  vinte: "20",
  trinta: "30",
  quarenta: "40",
  cinquenta: "50",
  cem: "100",
  mil: "1000",
};

/** Normaliza texto removendo acentos, separadores repetitivos e decodificando leetspeak comum */
function normalizeForAnalysis(text: string): {
  base: string;
  collapsed: string;
  leet: string;
  digitsFromWords: string;
} {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_*~`#|/\\]/g, " ")
    .toLowerCase();

  // Versão colapsando espaços entre letras únicas tipo "w h a t s a p p" ou "9 9 4 1 2 3 4"
  const collapsed = base.replace(/(\b[a-z0-9])\s+(?=[a-z0-9]\b)/gi, "$1");

  // Versão traduzindo leetspeak comum: @ -> a, 0 -> o, 3 -> e, 1 -> i, 4 -> a, 5 -> s, 7 -> t, 9 -> g
  const leet = base
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");

  // Extrai dígitos soletrados por extenso em sequência
  const words = base.split(/[\s,.-]+/);
  let digitsFromWords = "";
  for (const w of words) {
    if (SPELLED_DIGIT_MAP[w]) {
      digitsFromWords += SPELLED_DIGIT_MAP[w];
    }
  }

  return { base, collapsed, leet, digitsFromWords };
}

/**
 * 2 Camadas de Proteção: Sanitização prévia + Regex em Tempo Real
 * Identifica e mascara telefones, emails, redes sociais, pagamentos por fora e números soletrados.
 */
export interface FilterMessageResult {
  bloqueado: boolean;
  textoOriginal: string;
  textoFormatado: string;
  alertaUsuario: string | null;
  category?: BlockCategory;
  reason?: string;
}

export function filtrarMensagem(textoOriginal: string): FilterMessageResult {
  if (!textoOriginal || !textoOriginal.trim()) {
    return {
      bloqueado: false,
      textoOriginal: textoOriginal || "",
      textoFormatado: textoOriginal || "",
      alertaUsuario: null,
    };
  }

  // 1. Normalização do texto para análise prévia
  const textoNormalizado = textoOriginal
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/@/g, "a")
    .replace(/\$/g, "s");

  // 2. Definição da suíte de padrões de segurança
  const padroesSeguranca: { regex: RegExp; category: BlockCategory; reason: string }[] = [
    // 1. Telefones (inclui São Tomé e Príncipe +239 com 7 dígitos e formatos internacionais de 8-11 dígitos com espaços, pontos e traços)
    {
      regex:
        /(?:\+?239[\s.-]*)?\b[92]\d[\s.-]*\d{2}[\s.-]*\d{3}\b|\b[92]\d{6}\b|(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,3}\)?[-.\s]?)?(?:\d[-.\s]?){8,11}/gi,
      category: "phone",
      reason:
        "Contacto telefónico detectado. O envio de números pessoais é estritamente proibido para garantir a proteção de custódia da KONEKTA.",
    },
    // 2. Sequências de números espaçados tipo "9 9 4 4 7 4 7" ou "9.9.1.2.3.4.5"
    {
      regex:
        /\b(?:[92]\s*[\d.]\s*[\d.]\s*[\d.]\s*[\d.]\s*[\d.]\s*[\d.]|\d(?:\s*[-.]\s*\d){6,10})\b/gi,
      category: "phone",
      reason: "Sequência numérica mascarada detectada.",
    },
    // 3. Números por extenso sequenciais (detecta ao menos 3 seguidos)
    {
      regex:
        /(?:zero|um|uma|dois|duas|tres|tres|quatro|cinco|seis|meia|sete|oito|nove)[\s\W\d]{0,3}(?:zero|um|uma|dois|duas|tres|tres|quatro|cinco|seis|meia|sete|oito|nove)[\s\W\d]{0,3}(?:zero|um|uma|dois|duas|tres|tres|quatro|cinco|seis|meia|sete|oito|nove)/gi,
      category: "phone",
      reason: "Número de telefone soletrado por extenso detectado.",
    },
    // 4. E-mails e domínios
    {
      regex:
        /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|gmail|hotmail|yahoo|outlook|icloud|sapo)/gi,
      category: "email_link",
      reason: "Endereço de e-mail detectado. Mantenha toda a comunicação dentro do chat KONEKTA.",
    },
    // 5. Redes Sociais, Aplicativos de Mensagem e Termos de Evasão
    {
      regex:
        /\b(?:whats\s*app|whatsapp|whatsap|watsapp|wpp|zapp?|zap\s*zap|telegram|instagram|insta|direct\s*do\s*insta|facebook|face|fb|mumu|chave\s*pix|chama\s*no\s*(?:zap|wpp|insta|pv)|chama\s*no|chama\s*la|liga\s*pra\s*mim|me\s*liga|te\s*ligo|por\s*fora|meu\s*num|meu\s*contacto|passa\s*o\s*teu|vamos\s*falar\s*no\s*pv|dinheiro\s*em\s*m[aã]o|pagar\s*por\s*fora|sem\s*comissao)\b/gi,
      category: "social_app",
      reason:
        "Para sua segurança e garantia do serviço, mantenha a conversa e o pagamento dentro do app.",
    },
  ];

  let contemInfracao = false;
  let textoFiltrado = textoOriginal;
  let detectedCategory: BlockCategory | undefined = undefined;
  let detectedReason: string | undefined = undefined;

  // 3. Aplicação dos filtros com mascaramento transparente
  for (const { regex, category, reason } of padroesSeguranca) {
    if (regex.test(textoNormalizado) || regex.test(textoOriginal)) {
      contemInfracao = true;
      if (!detectedCategory) {
        detectedCategory = category;
        detectedReason = reason;
      }
      textoFiltrado = textoFiltrado.replace(regex, "[Conteúdo Bloqueado por Segurança]");
    }
  }

  // 4. Se não pegou pelo regex global, roda a análise profunda de país/bancário existente
  if (!contemInfracao) {
    const deepAnalysis = analyzeBlockedContent(textoOriginal);
    if (deepAnalysis.blocked) {
      contemInfracao = true;
      detectedCategory = deepAnalysis.category;
      detectedReason = deepAnalysis.reason;
      if (deepAnalysis.matchedText) {
        textoFiltrado = textoFiltrado.replace(
          new RegExp(deepAnalysis.matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
          "[Conteúdo Bloqueado por Segurança]",
        );
      } else {
        textoFiltrado = "[Conteúdo Bloqueado por Segurança]";
      }
    }
  }

  return {
    bloqueado: contemInfracao,
    textoOriginal,
    textoFormatado: contemInfracao ? textoFiltrado : textoOriginal,
    alertaUsuario: contemInfracao
      ? "Sua mensagem continha dados de contacto ou menção externa. Para sua segurança e garantia de pagamento, mantenha a conversa dentro do app."
      : null,
    category: detectedCategory,
    reason: detectedReason,
  };
}

/** Analisa se o texto viola as políticas de segurança e anti-desintermediação */
export function analyzeBlockedContent(text: string): BlockAnalysis {
  if (!text || !text.trim()) return { blocked: false };

  // 1. Verificação inteligente de Telefones com detecção de país e contagem de dígitos (STP: 7 dígitos)
  const phoneDetection = detectPhoneNumberWithCountry(text);
  if (phoneDetection.detected) {
    return {
      blocked: true,
      category: "phone",
      reason:
        phoneDetection.reason || "Partilha de números de telefone e contactos pessoais é proibida.",
      matchedText: phoneDetection.matchedText,
      country: phoneDetection.country,
    };
  }

  const { base, collapsed, leet, digitsFromWords } = normalizeForAnalysis(text);
  const targets = [base, collapsed, leet];

  // 1.1 Verificação de números soletrados por extenso (ex: "nove nove quatro um dois três quatro")
  if (digitsFromWords && digitsFromWords.length >= 7) {
    const isStp =
      digitsFromWords.length === 7 &&
      (digitsFromWords.startsWith("9") || digitsFromWords.startsWith("2"));
    return {
      blocked: true,
      category: "phone",
      reason: isStp
        ? `🇸🇹 Contacto de São Tomé e Príncipe soletrado detectado (+239 · ${digitsFromWords.slice(0, 3)} ${digitsFromWords.slice(3)}). A partilha de contactos pessoais é bloqueada para sua segurança.`
        : `Sequência numérica soletrada por extenso (${digitsFromWords}) detectada. O envio de contactos telefónicos é bloqueado.`,
      matchedText: text.trim(),
      country: isStp
        ? {
            name: "São Tomé e Príncipe",
            code: "+239",
            flag: "🇸🇹",
            expectedDigits: 7,
          }
        : undefined,
    };
  }

  // 2. Redes sociais e mensagens externas (WhatsApp, Telegram, etc.)
  for (const t of targets) {
    for (const re of SOCIAL_APP_REGEXES) {
      const match = t.match(re);
      if (match) {
        return {
          blocked: true,
          category: "social_app",
          reason:
            "Menções a WhatsApp, Facebook, Instagram, redes sociais ou mensagens externas são proibidas na plataforma.",
          matchedText: match[0],
        };
      }
    }
  }

  // 3. E-mails e websites externos
  for (const t of targets) {
    for (const re of EMAIL_LINK_REGEXES) {
      const match = t.match(re);
      if (match) {
        return {
          blocked: true,
          category: "email_link",
          reason: "Partilha de e-mails e links externos não é permitida.",
          matchedText: match[0],
        };
      }
    }
  }

  // 4. Dados bancários e pagamentos externos (Dobra24, BISTP, NIB, etc.)
  for (const t of targets) {
    for (const re of BANKING_REGEXES) {
      const match = t.match(re);
      if (match) {
        return {
          blocked: true,
          category: "banking",
          reason:
            "Informações bancárias externas (Dobra24, BISTP, NIB/IBAN) são proibidas. Os pagamentos são processados via custódia da app.",
          matchedText: match[0],
        };
      }
    }
  }

  // 5. Negociação por fora / dinheiro em mão
  for (const t of targets) {
    for (const re of OUTSIDE_PAYMENT_REGEXES) {
      const match = t.match(re);
      if (match) {
        return {
          blocked: true,
          category: "outside_payment",
          reason:
            "Propostas de pagamento em mão, por fora ou sem taxa anulam as garantias de segurança KONEKTA e são bloqueadas.",
          matchedText: match[0],
        };
      }
    }
  }

  // 6. Pedidos de contacto pessoal e migração para canais privados
  for (const t of targets) {
    for (const re of CONTACT_REQUEST_REGEXES) {
      const match = t.match(re);
      if (match) {
        return {
          blocked: true,
          category: "contact_request",
          reason: "Pedidos de troca de contacto telefónico ou migração para privado são proibidos.",
          matchedText: match[0],
        };
      }
    }
  }

  return { blocked: false };
}

export function containsBlockedContent(text: string): boolean {
  return analyzeBlockedContent(text).blocked;
}

/** Valida múltiplos campos de texto e retorna se algum campo contém violações */
export function validateFormSafety(fields: Record<string, string | undefined | null>): {
  isValid: boolean;
  field?: string;
  reason?: string;
  analysis?: BlockAnalysis;
} {
  for (const [fieldName, val] of Object.entries(fields)) {
    if (!val) continue;
    const analysis = analyzeBlockedContent(val);
    if (analysis.blocked) {
      return {
        isValid: false,
        field: fieldName,
        reason: analysis.reason,
        analysis,
      };
    }
  }
  return { isValid: true };
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

/** Saques só são libertados às quintas-feiras (dia 4 da semana em STP). */
export const PAYOUT_WEEKDAY = 4;

export function isPayoutDay(date = new Date()) {
  const weekdayStr = date.toLocaleDateString("en-US", { timeZone: STP_TIMEZONE, weekday: "short" });
  return weekdayStr === "Thu";
}

export function nextPayoutDate(date = new Date()) {
  const d = new Date(date);
  const diff = (PAYOUT_WEEKDAY - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function payoutLabel(date = new Date()) {
  if (isPayoutDay(date)) return "Disponível hoje (quinta-feira em STP)";
  const next = nextPayoutDate(date);
  return `Disponível ${next.toLocaleDateString("pt-PT", { timeZone: STP_TIMEZONE, weekday: "long", day: "2-digit", month: "long" })}`;
}
