import { categories, providers, type Provider } from "./konekta-data";

export type PopularService = {
  id: string;
  name: string;
  category: string;
  from: number;
  duration: string;
  emoji: string;
};

export const popularServices: PopularService[] = [
  { id: "s1", name: "Reparação elétrica urgente", category: "eletricista", from: 450, duration: "1h", emoji: "⚡" },
  { id: "s2", name: "Desentupimento", category: "canalizador", from: 380, duration: "1h30", emoji: "🚿" },
  { id: "s3", name: "Limpeza profunda de casa", category: "limpeza", from: 550, duration: "3h", emoji: "🧽" },
  { id: "s4", name: "Pintura de interior", category: "pintor", from: 600, duration: "1 dia", emoji: "🎨" },
  { id: "s5", name: "Manutenção de ar condicionado", category: "ar-condicionado", from: 500, duration: "1h", emoji: "❄️" },
  { id: "s6", name: "Corte de relva e jardim", category: "jardinagem", from: 300, duration: "2h", emoji: "🌿" },
];

export type Promo = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  tone: "primary" | "success" | "warning";
};

export const promos: Promo[] = [
  {
    id: "p1",
    title: "-15% no primeiro pedido",
    subtitle: "Use o código KONEKTA15 ao pagar pela carteira",
    badge: "Novo cliente",
    tone: "primary",
  },
  {
    id: "p2",
    title: "Carrega 2.000 Db e recebe 200 Db",
    subtitle: "Bónus válido até ao fim do mês",
    badge: "Carteira",
    tone: "success",
  },
  {
    id: "p3",
    title: "Serviços urgentes em 60 min",
    subtitle: "Prestadores disponíveis agora em Água Grande",
    badge: "Urgente",
    tone: "warning",
  },
];

export const districts = [
  "Água Grande",
  "Mé-Zóchi",
  "Cantagalo",
  "Caué",
  "Lembá",
  "Lobata",
  "Região Autónoma do Príncipe",
];

export const categoryEmoji: Record<string, string> = {
  eletricista: "⚡",
  canalizador: "🚰",
  limpeza: "🧹",
  pintor: "🖌️",
  mecanico: "🔧",
  jardinagem: "🌱",
  "ar-condicionado": "❄️",
  beleza: "💇",
};

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function slugifyCategory(name: string) {
  return (
    categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.slug ??
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
  );
}

export function searchProviders(query: string, categorySlug?: string): Provider[] {
  const q = query.trim().toLowerCase();
  return providers.filter((p) => {
    const matchesCategory = !categorySlug || slugifyCategory(p.category) === categorySlug;
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.services.some((s) => s.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });
}

export function formatDb(value: number) {
  return `${value.toLocaleString("pt-PT")} Db`;
}
