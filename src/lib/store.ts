import { useSyncExternalStore } from "react";
import { orders as seedOrders, type Order, type OrderStatus } from "./konekta-data";

// Simple localStorage-backed store with pub/sub. No backend required for the MVP.

export type UserRole = "cliente" | "prestador";

export type User = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  birthDate?: string;
  gender?: string;
  district?: string;
  city?: string;
  address?: string;
  createdAt: number;
};

export type ProviderProfile = {
  category: string;
  subcategory?: string;
  yearsExperience: number;
  bio: string;
  services: { name: string; price: number }[];
  district: string;
  city: string;
  radiusKm: number;
  documents: { idNumber?: string; nif?: string; selfieOk: boolean };
  bankAccount?: string;
  status: "em_analise" | "aprovado" | "rejeitado";
  submittedAt: number;
};

export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  at: number;
  status?: "sent" | "delivered" | "read";
};

export type AssistantMessage = {
  id: string;
  from: "me" | "ai";
  text: string;
  at: number;
};

export type Transaction = {
  id: string;
  kind: "in" | "out";
  label: string;
  amount: number;
  at: number;
};

type State = {
  user: User | null;
  providerProfile: ProviderProfile | null;
  orders: Order[];
  messages: Record<string, Message[]>;
  assistantMessages: AssistantMessage[];
  balance: number;
  transactions: Transaction[];
  favorites: string[];
};

const KEY = "konekta:v2";

const defaultState: State = {
  user: null,
  providerProfile: null,
  orders: seedOrders,
  messages: {
    "edmilson-varela": [
      { id: "m1", from: "them", text: "Boa tarde! Estou a caminho.", at: Date.now() - 3600_000, status: "read" },
      { id: "m2", from: "them", text: "Chego em cerca de 15 minutos.", at: Date.now() - 1800_000, status: "read" },
    ],
    "maria-santos": [
      { id: "m1", from: "them", text: "Perfeito, até amanhã às 9h!", at: Date.now() - 86400_000, status: "read" },
    ],
    "dercio-costa": [
      { id: "m1", from: "them", text: "Obrigado pela avaliação 🙏", at: Date.now() - 172800_000, status: "read" },
    ],
  },
  assistantMessages: [],
  balance: 1850,
  transactions: [
    { id: "t1", kind: "out", label: "Pagamento — Edmilson Varela", amount: 450, at: Date.now() - 3600_000 },
    { id: "t2", kind: "in", label: "Carregamento de saldo", amount: 1000, at: Date.now() - 86400_000 },
    { id: "t3", kind: "out", label: "Pagamento — Maria Santos", amount: 550, at: Date.now() - 5 * 86400_000 },
    { id: "t4", kind: "in", label: "Reembolso KNK-1015", amount: 200, at: Date.now() - 7 * 86400_000 },
  ],
  favorites: [],
};

function load(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const getSnapshot = () => state;
const getServerSnapshot = () => defaultState;

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

export const store = {
  get: () => state,

  signIn(input: { phone: string; name?: string; email?: string; role?: UserRole }) {
    const user: User = {
      id: `u_${Date.now()}`,
      role: input.role ?? "cliente",
      name: input.name?.trim() || "Cliente KONEKTA",
      phone: input.phone.trim(),
      email: input.email?.trim(),
      createdAt: Date.now(),
    };
    set({ user });
    return user;
  },

  registerClient(data: Partial<User> & { phone: string; name: string }) {
    const user: User = {
      id: `u_${Date.now()}`,
      role: "cliente",
      name: data.name,
      phone: data.phone,
      email: data.email,
      avatar: data.avatar,
      birthDate: data.birthDate,
      gender: data.gender,
      district: data.district,
      city: data.city,
      address: data.address,
      createdAt: Date.now(),
    };
    set({ user });
    return user;
  },

  registerProvider(user: Partial<User> & { phone: string; name: string }, profile: Omit<ProviderProfile, "status" | "submittedAt">) {
    const u: User = {
      id: `u_${Date.now()}`,
      role: "prestador",
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      birthDate: user.birthDate,
      district: profile.district,
      city: profile.city,
      createdAt: Date.now(),
    };
    const p: ProviderProfile = { ...profile, status: "em_analise", submittedAt: Date.now() };
    set({ user: u, providerProfile: p });
    return { user: u, profile: p };
  },

  updateUser(patch: Partial<User>) {
    if (!state.user) return;
    set({ user: { ...state.user, ...patch } });
  },

  signOut() {
    set({ user: null, providerProfile: null });
  },

  createOrder(input: { providerId: string; service: string; total: number; scheduledFor: string }) {
    const id = `KNK-${Math.floor(1000 + Math.random() * 9000)}`;
    const order: Order = {
      id,
      providerId: input.providerId,
      service: input.service,
      scheduledFor: input.scheduledFor,
      status: "pendente" as OrderStatus,
      total: input.total,
    };
    set({
      orders: [order, ...state.orders],
      balance: Math.max(0, state.balance - input.total),
      transactions: [
        { id: `t_${Date.now()}`, kind: "out", label: `Reserva — ${input.service}`, amount: input.total, at: Date.now() },
        ...state.transactions,
      ],
    });
    return order;
  },

  sendMessage(providerId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const prev = state.messages[providerId] ?? [];
    const msg: Message = { id: `m_${Date.now()}`, from: "me", text: trimmed, at: Date.now(), status: "sent" };
    set({ messages: { ...state.messages, [providerId]: [...prev, msg] } });
    // Simulate delivery + auto-reply
    setTimeout(() => {
      const cur = state.messages[providerId] ?? [];
      set({
        messages: {
          ...state.messages,
          [providerId]: cur.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m)),
        },
      });
    }, 600);
    setTimeout(() => {
      const cur = state.messages[providerId] ?? [];
      const reply: Message = {
        id: `m_${Date.now() + 1}`,
        from: "them",
        text: "Recebido! Vou tratar disso e volto já com uma resposta.",
        at: Date.now(),
        status: "read",
      };
      set({
        messages: {
          ...state.messages,
          [providerId]: [...cur.map((m) => (m.id === msg.id ? { ...m, status: "read" as const } : m)), reply],
        },
      });
    }, 2200);
  },

  sendAssistant(text: string, reply: string) {
    const t = text.trim();
    if (!t) return;
    const me: AssistantMessage = { id: `am_${Date.now()}`, from: "me", text: t, at: Date.now() };
    const ai: AssistantMessage = { id: `am_${Date.now() + 1}`, from: "ai", text: reply, at: Date.now() + 1 };
    set({ assistantMessages: [...state.assistantMessages, me, ai] });
  },

  clearAssistant() {
    set({ assistantMessages: [] });
  },

  toggleFavorite(providerId: string) {
    const has = state.favorites.includes(providerId);
    set({
      favorites: has ? state.favorites.filter((f) => f !== providerId) : [...state.favorites, providerId],
    });
  },

  topUp(amount: number) {
    if (amount <= 0) return;
    set({
      balance: state.balance + amount,
      transactions: [
        { id: `t_${Date.now()}`, kind: "in", label: "Carregamento de saldo", amount, at: Date.now() },
        ...state.transactions,
      ],
    });
  },
};
