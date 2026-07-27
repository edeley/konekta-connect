import { useSyncExternalStore } from "react";
import { orders as seedOrders, type Order, type OrderStatus } from "./konekta-data";

// Simple localStorage-backed store with pub/sub. No backend required for the MVP.

export type UserRole = "cliente" | "prestador" | "admin";

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

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  tone: "info" | "success" | "warning" | "error";
  link?: string;
};

export type FeatureFlags = {
  carteira: boolean;
  chat: boolean;
  assistente: boolean;
  promocoes: boolean;
  avaliacoes: boolean;
  registoPrestadores: boolean;
  pagamentoDinheiro: boolean;
  notificacoes: boolean;
  modoManutencao: boolean;
};

export type Settings = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  language: "pt" | "en";
  biometrics: boolean;
};

export type PlatformConfig = {
  commissionPct: number;
  minTopUp: number;
  currency: string;
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
  notifications: AppNotification[];
  flags: FeatureFlags;
  settings: Settings;
  config: PlatformConfig;
  onboarded: boolean;
};

const KEY = "konekta:v3";

const defaultFlags: FeatureFlags = {
  carteira: true,
  chat: true,
  assistente: true,
  promocoes: true,
  avaliacoes: true,
  registoPrestadores: true,
  pagamentoDinheiro: true,
  notificacoes: true,
  modoManutencao: false,
};

const defaultSettings: Settings = {
  pushNotifications: true,
  emailNotifications: false,
  darkMode: false,
  language: "pt",
  biometrics: false,
};

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
  notifications: [
    {
      id: "n1",
      title: "Prestador a caminho",
      body: "Edmilson Varela está a caminho da sua morada.",
      at: Date.now() - 1800_000,
      read: false,
      tone: "info",
      link: "/pedidos",
    },
    {
      id: "n2",
      title: "Pagamento concluído",
      body: "450 Db debitados da sua carteira KONEKTA.",
      at: Date.now() - 3600_000,
      read: false,
      tone: "success",
      link: "/carteira",
    },
    {
      id: "n3",
      title: "Avalie o seu serviço",
      body: "Como correu a reparação de fuga com Dércio Costa?",
      at: Date.now() - 2 * 86400_000,
      read: true,
      tone: "warning",
      link: "/pedidos",
    },
  ],
  flags: defaultFlags,
  settings: defaultSettings,
  config: { commissionPct: 12, minTopUp: 100, currency: "Db" },
  onboarded: false,
};

function load(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...defaultState,
      ...parsed,
      flags: { ...defaultFlags, ...(parsed.flags ?? {}) },
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      config: { ...defaultState.config, ...(parsed.config ?? {}) },
    };
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

function notify(n: Omit<AppNotification, "id" | "at" | "read">) {
  set({
    notifications: [
      { ...n, id: `n_${Date.now()}`, at: Date.now(), read: false },
      ...state.notifications,
    ],
  });
}

export const store = {
  get: () => state,
  notify,

  markOnboarded() {
    set({ onboarded: true });
  },

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

  registerProvider(
    user: Partial<User> & { phone: string; name: string },
    profile: Omit<ProviderProfile, "status" | "submittedAt">,
  ) {
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

  switchRole(role: UserRole) {
    if (!state.user) return;
    set({ user: { ...state.user, role } });
  },

  signOut() {
    set({ user: null, providerProfile: null });
  },

  createOrder(input: {
    providerId: string;
    service: string;
    total: number;
    scheduledFor: string;
    address?: string;
    notes?: string;
    paymentMethod?: "carteira" | "dinheiro" | "mbway";
  }) {
    const id = `KNK-${Math.floor(1000 + Math.random() * 9000)}`;
    const payWithWallet = (input.paymentMethod ?? "carteira") === "carteira";
    const order: Order = {
      id,
      providerId: input.providerId,
      service: input.service,
      scheduledFor: input.scheduledFor,
      status: "pendente" as OrderStatus,
      total: input.total,
      address: input.address,
      notes: input.notes,
      paymentMethod: input.paymentMethod ?? "carteira",
      createdAt: Date.now(),
      clientName: state.user?.name,
    };
    set({
      orders: [order, ...state.orders],
      balance: payWithWallet ? Math.max(0, state.balance - input.total) : state.balance,
      transactions: payWithWallet
        ? [
            {
              id: `t_${Date.now()}`,
              kind: "out",
              label: `Reserva — ${input.service}`,
              amount: input.total,
              at: Date.now(),
            },
            ...state.transactions,
          ]
        : state.transactions,
    });
    notify({
      title: "Pedido criado",
      body: `${id} — ${input.service}. Aguarda confirmação do prestador.`,
      tone: "success",
      link: "/pedidos",
    });
    return order;
  },

  updateOrder(id: string, patch: Partial<Order>) {
    set({ orders: state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  },

  advanceOrder(id: string) {
    const flow: OrderStatus[] = ["pendente", "aceite", "a-caminho", "em-execucao", "concluido", "avaliado"];
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;
    const next = flow[Math.min(flow.indexOf(order.status) + 1, flow.length - 1)];
    store.updateOrder(id, { status: next });
  },

  cancelOrder(id: string) {
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;
    set({
      orders: state.orders.filter((o) => o.id !== id),
      balance: order.paymentMethod === "dinheiro" ? state.balance : state.balance + order.total,
      transactions:
        order.paymentMethod === "dinheiro"
          ? state.transactions
          : [
              {
                id: `t_${Date.now()}`,
                kind: "in",
                label: `Reembolso ${order.id}`,
                amount: order.total,
                at: Date.now(),
              },
              ...state.transactions,
            ],
    });
    notify({ title: "Pedido cancelado", body: `${order.id} foi cancelado e reembolsado.`, tone: "warning", link: "/carteira" });
  },

  rateOrder(id: string, stars: number, comment?: string) {
    store.updateOrder(id, { status: "avaliado", rating: { stars, comment, at: Date.now() } });
    notify({ title: "Obrigado pela avaliação!", body: `Avaliou o pedido ${id} com ${stars} estrelas.`, tone: "success" });
  },

  sendMessage(providerId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const prev = state.messages[providerId] ?? [];
    const msg: Message = { id: `m_${Date.now()}`, from: "me", text: trimmed, at: Date.now(), status: "sent" };
    set({ messages: { ...state.messages, [providerId]: [...prev, msg] } });
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
    notify({ title: "Carteira carregada", body: `+${amount} Db adicionados à sua carteira.`, tone: "success", link: "/carteira" });
  },

  withdraw(amount: number) {
    if (amount <= 0 || amount > state.balance) return false;
    set({
      balance: state.balance - amount,
      transactions: [
        { id: `t_${Date.now()}`, kind: "out", label: "Levantamento para conta bancária", amount, at: Date.now() },
        ...state.transactions,
      ],
    });
    return true;
  },

  markNotificationsRead() {
    set({ notifications: state.notifications.map((n) => ({ ...n, read: true })) });
  },

  clearNotifications() {
    set({ notifications: [] });
  },

  setFlag(key: keyof FeatureFlags, value: boolean) {
    set({ flags: { ...state.flags, [key]: value } });
  },

  updateSettings(patch: Partial<Settings>) {
    set({ settings: { ...state.settings, ...patch } });
  },

  updateConfig(patch: Partial<PlatformConfig>) {
    set({ config: { ...state.config, ...patch } });
  },
};
