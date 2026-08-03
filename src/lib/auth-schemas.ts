import { z } from "zod";

/* ------------------------------- Constantes ------------------------------- */

export const STP_DISTRICTS = [
  "Água Grande",
  "Cantagalo",
  "Caué",
  "Lembá",
  "Lobata",
  "Mé-Zóchi",
  "Príncipe",
] as const;

export type StpDistrict = (typeof STP_DISTRICTS)[number];

export const SERVICE_CATEGORIES = [
  "Eletricidade",
  "Canalização",
  "Limpeza",
  "Pintura",
  "Carpintaria",
  "Jardinagem",
  "Transporte",
  "Costura",
  "Informática",
  "Outros",
] as const;

export const GENDERS = [
  { value: "homem", label: "Homem" },
  { value: "mulher", label: "Mulher" },
  { value: "outros", label: "Outros" },
] as const;

/** Código OTP de demonstração (front-end apenas, sem back-end). */
export const DEMO_OTP = "1234";
export const OTP_LENGTH = 4;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_BLOCK_MS = 15 * 60 * 1000;
export const OTP_RESEND_SECONDS = 59;

/* -------------------------------- Validação ------------------------------- */

export const phoneSchema = z
  .string()
  .regex(/^\+2399\d{8}$/, "Número inválido. Use o formato +239 9XXXXXXXX");

export const emailSchema = z.union([z.literal(""), z.string().email("Email inválido")]);

export const nameSchema = z
  .string()
  .min(3, "Nome deve ter pelo menos 3 caracteres")
  .max(100, "Nome muito longo")
  .regex(/^[A-Za-zÀ-ÿ' ]+$/, "Apenas letras e espaços permitidos");

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/\d/, "Deve conter pelo menos 1 número")
  .regex(/[A-Z]/, "Deve conter pelo menos 1 letra maiúscula");

export const districtSchema = z.enum(STP_DISTRICTS, {
  message: "Selecione um distrito válido",
});

export const clientProfileSchema = z.object({
  fullName: nameSchema,
  email: emailSchema.optional(),
  district: districtSchema,
  zone: z.string().min(3, "Indique a zona ou morada"),
  gender: z.enum(["homem", "mulher", "outros"], { message: "Selecione uma opção" }),
});

export const providerProfileSchema = clientProfileSchema.extend({
  bio: z.string().min(20, "Descreva o serviço em pelo menos 20 caracteres").max(500),
  categories: z.array(z.string()).min(1, "Escolha pelo menos 1 categoria"),
  workDistricts: z.array(z.string()).min(1, "Escolha pelo menos 1 distrito"),
  idFront: z.boolean().refine((v) => v, "Carregue a frente do BI"),
  idBack: z.boolean().refine((v) => v, "Carregue o verso do BI"),
});

/* ------------------------------- Ficheiros -------------------------------- */

export const FILE_RULES = {
  bi: { accept: ["image/jpeg", "image/png"], maxSize: 5 * 1024 * 1024 },
  profilePhoto: { accept: ["image/jpeg", "image/png"], maxSize: 2 * 1024 * 1024 },
  portfolio: { accept: ["image/jpeg", "image/png"], maxSize: 3 * 1024 * 1024, maxFiles: 5 },
} as const;

/* --------------------------------- Helpers -------------------------------- */

/** Formata 9 dígitos como "9XX XXXXXX". */
export function formatPhoneDigits(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  return d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
}

/** Máscara para apresentação: +239 91X XXX78 */
export function maskPhone(full: string) {
  const d = full.replace(/\D/g, "").slice(-9);
  if (d.length < 9) return full;
  return `+239 ${d.slice(0, 3)} ••• ${d.slice(-2)}`;
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}•••@${domain}`;
}

export function sanitizeInput(input: string) {
  return input
    .trim()
    .replace(/<[^>]*>/g, "")
    .slice(0, 1000);
}

export function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/\d/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  const labels = ["Fraca", "Fraca", "Média", "Forte"] as const;
  const tones = ["destructive", "destructive", "warning", "success"] as const;
  return { score, label: labels[score], tone: tones[score] };
}

export function validateFile(
  file: File,
  rule: { accept: readonly string[]; maxSize: number },
): string | null {
  if (!rule.accept.includes(file.type)) return "Tipo não suportado. Use JPG ou PNG.";
  if (file.size > rule.maxSize)
    return `Ficheiro muito grande. Máximo ${Math.round(rule.maxSize / (1024 * 1024))}MB.`;
  return null;
}
