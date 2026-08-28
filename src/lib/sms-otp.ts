/**
 * Serviço de SMS OTP para São Tomé e Príncipe (STP)
 * Suporte a redes locais CST Móvel e Unitel STP (+239 98X-XXXX / 99X-XXXX)
 * Integração compatível com Twilio Verify / Twilio Programmable Messaging
 */

export interface OtpSession {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  status: "pending" | "verified" | "expired" | "failed";
}

// Armazenamento em memória / local das sessões ativas
const activeSessions = new Map<string, OtpSession>();

/**
 * Normaliza o número de telefone para o formato padrão STP (+239)
 */
export function normalizeStpPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+239")) return cleaned;
  if (cleaned.startsWith("239")) return `+${cleaned}`;
  if (cleaned.length === 7) return `+239${cleaned}`;
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Gera um código numérico de 6 dígitos
 */
function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envia o SMS OTP via gateway Twilio / simulação realista
 */
export async function sendSmsOtp(
  phone: string,
  reason = "verificação de conta",
): Promise<{
  success: boolean;
  message: string;
  formattedPhone: string;
  demoCode?: string;
  cooldownSeconds: number;
}> {
  const normalized = normalizeStpPhone(phone);

  // Validação básica do formato
  if (normalized.length < 7) {
    return {
      success: false,
      message: "Número de telefone inválido para São Tomé e Príncipe.",
      formattedPhone: normalized,
      cooldownSeconds: 0,
    };
  }

  // Gera código
  const code = generate6DigitCode();
  const session: OtpSession = {
    phone: normalized,
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos de validade
    attempts: 0,
    status: "pending",
  };

  activeSessions.set(normalized, session);

  // Simula latência de rede telecom em STP (CST / Unitel)
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Em ambiente de produção conectaria a: /api/twilio/send-otp
  console.log(`[Twilio SMS Gateway STP] Código ${code} enviado para ${normalized} (${reason})`);

  return {
    success: true,
    message: `Código SMS enviado com sucesso para ${normalized}. Válido por 5 minutos.`,
    formattedPhone: normalized,
    demoCode: code, // Disponibilizado para facilidade de teste no protótipo
    cooldownSeconds: 60,
  };
}

/**
 * Valida o código inserido pelo utilizador
 */
export async function verifySmsOtp(
  phone: string,
  inputCode: string,
): Promise<{ success: boolean; message: string }> {
  const normalized = normalizeStpPhone(phone);
  const session = activeSessions.get(normalized);

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!session) {
    // Código de teste rápido para demonstração
    if (inputCode === "123456" || inputCode === "000000") {
      return { success: true, message: "Código verificado com sucesso!" };
    }
    return {
      success: false,
      message: "Nenhuma sessão de SMS ativa para este número. Peça um novo código.",
    };
  }

  if (Date.now() > session.expiresAt) {
    session.status = "expired";
    return {
      success: false,
      message: "O código SMS expirou. Por favor solicite um novo envio.",
    };
  }

  session.attempts += 1;

  if (session.attempts > 4) {
    session.status = "failed";
    activeSessions.delete(normalized);
    return {
      success: false,
      message: "Demasiadas tentativas incorretas. Peça um novo código por segurança.",
    };
  }

  // Aceita o código gerado ou o código mestre para testes
  if (session.code === inputCode.trim() || inputCode.trim() === "123456") {
    session.status = "verified";
    activeSessions.delete(normalized);
    return {
      success: true,
      message: "Número de telefone confirmado com sucesso!",
    };
  }

  return {
    success: false,
    message: `Código incorreto. Tem mais ${4 - session.attempts} tentativa(s).`,
  };
}
