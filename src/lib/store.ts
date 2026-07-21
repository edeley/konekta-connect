import { useSyncExternalStore } from "react";
import { orders as seedOrders, type Order, type OrderStatus } from "./konekta-data";

// Simple localStorage-backed store with pub/sub. No backend required for the MVP.

export type User = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: number;
};

export type Message = {
  id: string;
  from: "me" | "them";
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
  orders: Order[];
  messages: Record<string, Message[]>; // keyed by providerId
  balance: number;
  transactions: Transaction[];
  favorites: string[];
};

const KEY = "konekta:v1";

const defaultState: State = {
  user: null,
  orders: seedOrders,
  messages: {
    "edmilson-varela": [
      { id: "m1", from: "them", text: "Boa tarde! Estou a caminho.", at: Date.now() - 3600_000 },
      { id: "m2", from: "them", text: "Chego em cerca de 15 minutos.", at: Date.now() - 1800_000 },
    ],
    "maria-santos": [
      { id: "m1", from: "them", text: "Perfeito, até amanhã às 9h!", at: Date.now() - 86400_000 },
    ],
    "dercio-costa": [
      { id: "m1", from: "them", text: "Obrigado pela avaliação 🙏", at: Date.now() - 172800_000 },
    ],
  },
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
    // ignore quota errors
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

  signIn(input: { phone: string; name?: string; email?: string }) {
    const user: User = {
      id: `u_${Date.now()}`,
      name: input.name?.trim() || "Cliente KONEKTA",
      phone: input.phone.trim(),
      email: input.email?.trim(),
      createdAt: Date.now(),
    };
    set({ user });
    return user;
  },

  signOut() {
    set({ user: null });
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
        {
          id: `t_${Date.now()}`,
          kind: "out",
          label: `Reserva — ${input.service}`,
          amount: input.total,
          at: Date.now(),
        },
        ...state.transactions,
      ],
    });
    return order;
  },

  sendMessage(providerId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const prev = state.messages[providerId] ?? [];
    const msg: Message = { id: `m_${Date.now()}`, from: "me", text: trimmed, at: Date.now() };
    set({ messages: { ...state.messages, [providerId]: [...prev, msg] } });
  },

  toggleFavorite(providerId: string) {
    const has = state.favorites.includes(providerId);
    set({
      favorites: has
        ? state.favorites.filter((f) => f !== providerId)
        : [...state.favorites, providerId],
    });
  },

  topUp(amount: number) {
    if (amount <= 0) return;
    set({
      balance: state.balance + amount,
      transactions: [
        {
          id: `t_${Date.now()}`,
          kind: "in",
          label: "Carregamento de saldo",
          amount,
          at: Date.now(),
        },
        ...state.transactions,
      ],
    });
  },
};
