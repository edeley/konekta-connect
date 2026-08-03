import { useSyncExternalStore } from "react";
import { OTP_BLOCK_MS, OTP_MAX_ATTEMPTS } from "./auth-schemas";

/**
 * Estado temporário do fluxo de autenticação (telefone, papel escolhido,
 * dados de registo em curso). Persistido apenas em sessionStorage —
 * nunca guarda documentos, fotos de BI, códigos OTP nem senhas.
 */

export type FlowRole = "client" | "provider" | "both";

export type RegistrationDraft = {
  fullName?: string;
  email?: string;
  district?: string;
  zone?: string;
  gender?: string;
  bio?: string;
  categories?: string[];
  workDistricts?: string[];
};

type FlowState = {
  phone: string | null;
  email: string | null;
  role: FlowRole | null;
  otpSent: boolean;
  otpAttempts: number;
  blockUntil: number | null;
  recoveryMethod: "phone" | "email" | null;
  recoveryTarget: string | null;
  registration: RegistrationDraft;
};

const KEY = "konekta:auth-flow";

const initial: FlowState = {
  phone: null,
  email: null,
  role: null,
  otpSent: false,
  otpAttempts: 0,
  blockUntil: null,
  recoveryMethod: null,
  recoveryTarget: null,
  registration: {},
};

function load(): FlowState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...initial, ...(JSON.parse(raw) as Partial<FlowState>) } : initial;
  } catch {
    return initial;
  }
}

let state: FlowState = load();
const listeners = new Set<() => void>();

function set(patch: Partial<FlowState>) {
  state = { ...state, ...patch };
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* sessionStorage indisponível */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAuthFlow<T>(selector: (s: FlowState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

export const authFlow = {
  get: () => state,
  setPhone(phone: string) {
    set({ phone, otpSent: true });
  },
  setEmail(email: string) {
    set({ email });
  },
  setRole(role: FlowRole) {
    set({ role });
  },
  updateRegistration(patch: RegistrationDraft) {
    set({ registration: { ...state.registration, ...patch } });
  },
  setRecovery(method: "phone" | "email", target: string) {
    set({ recoveryMethod: method, recoveryTarget: target });
  },
  /** Devolve true se o utilizador ficou bloqueado após esta tentativa. */
  failOtp() {
    const attempts = state.otpAttempts + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      set({ otpAttempts: attempts, blockUntil: Date.now() + OTP_BLOCK_MS });
      return true;
    }
    set({ otpAttempts: attempts });
    return false;
  },
  resetOtp() {
    set({ otpAttempts: 0, blockUntil: null });
  },
  isBlocked() {
    return !!state.blockUntil && Date.now() < state.blockUntil;
  },
  clear() {
    state = initial;
    if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
    listeners.forEach((l) => l());
  },
};
