import { useEffect } from "react";
import { store, useStore, type SecurityIncident, type Message } from "./store";
import { analyzeBlockedContent } from "./escrow";

export interface ScanResult {
  detected: boolean;
  category?: SecurityIncident["category"];
  matchedText?: string;
  reason?: string;
  severity?: "medium" | "high" | "critical";
}

// Regex aprimorados para padrões de fuga de conversação e transações off-platform
const SOCIAL_HANDLE_REGEX =
  /(?:^|\s)@([a-zA-Z0-9._]{3,30})|insta(?:gram)?[:\s]+([a-zA-Z0-9._]{3,30})|face(?:book)?[:\s]+([a-zA-Z0-9._]{3,30})|telegram[:\s]+([a-zA-Z0-9._]{3,30})|tiktok[:\s]+([a-zA-Z0-9._]{3,30})/i;

const SOCIAL_APP_NAMES_REGEX =
  /\b(whatsapp|watsap|wapp|whats|zap\b|zapzap|telegram|instagram|insta\b|facebook|messenger|tiktok|viber|skype|signal)\b/i;

const OUTSIDE_TRANSACTION_KEYWORDS = [
  "pagar por fora",
  "pago por fora",
  "pagamento por fora",
  "pagar em mao",
  "pagar em mão",
  "dinheiro em mao",
  "dinheiro em mão",
  "em mao direto",
  "em mão direto",
  "sem a app",
  "sem app",
  "fora da app",
  "fora da plataforma",
  "sem comissao",
  "sem comissão",
  "sem taxa",
  "faço mais barato fora",
  "faço mais barato por fora",
  "desconto por fora",
  "negociar por fora",
  "negociar direto",
  "direto comigo",
  "transferencia direta",
  "transferência direta",
  "dobra24 direto",
  "meu iban",
  "meu nib",
  "minha conta bancaria",
  "minha conta bancária",
  "bistp direto",
];

const CONTACT_REQUEST_PHRASES = [
  "me liga",
  "liga me",
  "liga-me",
  "passa o teu contacto",
  "passa o teu telefone",
  "dá o teu contacto",
  "teu contacto",
  "meu contacto",
  "teu numero",
  "teu número",
  "meu numero",
  "meu número",
  "chama no privado",
  "manda no privado",
  "falar no privado",
  "conversa no privado",
  "chama no zap",
  "manda no zap",
  "passa o zap",
];

// STP Phone: 7 dígitos iniciados por 90, 98, 99 ou 22, com ou sem +239
const STP_PHONE_STRICT =
  /(?:\+?239\s*)?(?:90|98|99|22)[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d/i;

// Telefones com dígitos separados por espaços para disfarce (ex: 9 9 4 4 7 4 7)
const OBFUSCATED_DIGITS_REGEX = /\b(?:\d[\s.,_-]){6,12}\d\b/;

// E-mails
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

/**
 * Analisador de mensagens para o Listener de Background.
 * Retorna se a mensagem contém indícios de dados de contacto externo ou evasão de custódia.
 */
export function scanMessageForLeakage(text: string): ScanResult {
  if (!text || !text.trim()) return { detected: false };
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Verificar através do analisador de custódia central (escrow.ts)
  const escrowAnalysis = analyzeBlockedContent(trimmed);
  if (escrowAnalysis.blocked) {
    let cat: SecurityIncident["category"] = "phone";
    if (escrowAnalysis.category === "social_app") cat = "social_app";
    else if (escrowAnalysis.category === "banking" || escrowAnalysis.category === "outside_payment")
      cat = "outside_payment";
    else if (escrowAnalysis.category === "email_link") cat = "email_link";
    else if (escrowAnalysis.category === "contact_request") cat = "contact_request";

    return {
      detected: true,
      category: cat,
      matchedText: escrowAnalysis.matchedText || trimmed.slice(0, 50),
      reason: escrowAnalysis.reason || "Indício de contacto externo detectado.",
      severity: cat === "outside_payment" || cat === "phone" ? "critical" : "high",
    };
  }

  // 2. Propostas explícitas de pagamento e transações off-platform
  for (const kw of OUTSIDE_TRANSACTION_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        detected: true,
        category: "outside_payment",
        matchedText: kw,
        reason: `Tentativa de negociação externa ou evasão de custódia detectada: "${kw}".`,
        severity: "critical",
      };
    }
  }

  // 3. Menções a redes sociais e handles (@username, WhatsApp, Telegram, etc.)
  const handleMatch = trimmed.match(SOCIAL_HANDLE_REGEX);
  if (handleMatch) {
    const matched = handleMatch[0].trim();
    return {
      detected: true,
      category: "social_app",
      matchedText: matched,
      reason: `Identificador ou perfil de rede social detectado: "${matched}".`,
      severity: "high",
    };
  }

  const appNameMatch = trimmed.match(SOCIAL_APP_NAMES_REGEX);
  if (appNameMatch) {
    return {
      detected: true,
      category: "social_app",
      matchedText: appNameMatch[0],
      reason: `Menção a aplicativo externo de mensagens: "${appNameMatch[0]}".`,
      severity: "high",
    };
  }

  // 4. Contactos telefónicos STP e internacionais
  const phoneMatch = trimmed.match(STP_PHONE_STRICT);
  if (phoneMatch) {
    return {
      detected: true,
      category: "phone",
      matchedText: phoneMatch[0],
      reason: `Número de telefone de São Tomé e Príncipe detectado: "${phoneMatch[0]}".`,
      severity: "critical",
    };
  }

  // Números ofuscados com espaços
  const obfuscatedMatch = trimmed.match(OBFUSCATED_DIGITS_REGEX);
  if (obfuscatedMatch) {
    const digitsOnly = obfuscatedMatch[0].replace(/\D/g, "");
    if (digitsOnly.length >= 7 && digitsOnly.length <= 13) {
      return {
        detected: true,
        category: "phone",
        matchedText: obfuscatedMatch[0],
        reason: `Sequência numérica suspeita com disfarce de contacto telefónico: "${obfuscatedMatch[0]}".`,
        severity: "critical",
      };
    }
  }

  // 5. Pedidos explícitos de migração para canais privados
  for (const phrase of CONTACT_REQUEST_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        detected: true,
        category: "contact_request",
        matchedText: phrase,
        reason: `Solicitação de contacto direto ou migração para canal privado: "${phrase}".`,
        severity: "high",
      };
    }
  }

  // 6. E-mails
  const emailMatch = trimmed.match(EMAIL_REGEX);
  if (emailMatch) {
    return {
      detected: true,
      category: "email_link",
      matchedText: emailMatch[0],
      reason: `Endereço de e-mail externo detectado: "${emailMatch[0]}".`,
      severity: "medium",
    };
  }

  return { detected: false };
}

// Conjunto de IDs de mensagens já inspecionadas em memória nesta sessão
const inspectedMessageIds = new Set<string>();

/**
 * Varre todas as conversas do store e sinaliza mensagens com padrões de fuga.
 * Retorna o número de novos incidentes identificados.
 */
export function scanAllChatMessages(): number {
  const state =
    (typeof store.getState === "function" ? store.getState() : store.get?.()) ||
    useStore.getState();
  const allConversations = state.messages || {};
  const existingIncidents = state.securityIncidents || [];
  let newIncidentsCount = 0;

  for (const [providerId, messages] of Object.entries(allConversations)) {
    if (!Array.isArray(messages)) continue;

    for (const msg of messages) {
      // Ignorar mensagens de sistema da própria app
      if (msg.kind === "system" || msg.kind === "in_person_confirmation") continue;

      // Se já foi inspecionada nesta sessão e já possui flag no store, avançar
      if (inspectedMessageIds.has(msg.id) && msg.flaggedForReview) continue;
      inspectedMessageIds.add(msg.id);

      const scan = scanMessageForLeakage(msg.text);
      if (scan.detected && scan.category && scan.reason) {
        // Verificar se já existe incidente registado
        const alreadyLogged = existingIncidents.some(
          (inc) => inc.providerId === providerId && inc.messageId === msg.id,
        );

        if (!alreadyLogged) {
          // Determina o nome do remetente
          let senderName = msg.from === "me" ? state.user?.name || "Cliente" : "Prestador";
          if (msg.from === "them") {
            const provider = state.providers.find((p) => p.id === providerId);
            if (provider) senderName = provider.name;
          }

          store.flagSecurityIncident({
            providerId,
            messageId: msg.id,
            from: msg.from,
            senderName,
            textSnippet: msg.text.slice(0, 140),
            matchedText: scan.matchedText || msg.text.slice(0, 40),
            category: scan.category,
            reason: scan.reason,
            severity: scan.severity || "high",
            timestamp: msg.at || Date.now(),
          });

          // Notificação de alerta para monitorização interna
          store.addNotification({
            title: `🛡️ Alerta Anti-Fuga: ${scan.category === "outside_payment" ? "Pagamento por Fora" : "Contacto Externo"}`,
            body: `Conversa com ${senderName}: detectado "${scan.matchedText}". Mensagem colocada sob monitorização interna.`,
            tone: scan.severity === "critical" ? "error" : "warning",
            link: "/admin?tab=security",
          });

          newIncidentsCount++;
        }
      }
    }
  }

  return newIncidentsCount;
}

/**
 * Inicializador do background listener em tempo de execução.
 * Observa alterações nas mensagens do store via assinatura reactiva.
 */
export function initChatMonitoringListener(): () => void {
  if (typeof window === "undefined") return () => {};

  // Primeira varredura no arranque
  scanAllChatMessages();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Inscreve-se nas mutações de estado do store
  const unsubscribe = useStore.subscribe(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      scanAllChatMessages();
    }, 300);
  });

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubscribe();
  };
}

/**
 * Hook React para manter o Background Listener ativo globalmente.
 */
export function useChatMonitoringListener() {
  useEffect(() => {
    const cleanup = initChatMonitoringListener();
    return cleanup;
  }, []);
}
