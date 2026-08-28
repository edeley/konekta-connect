import { categories, providers, type Provider } from "./konekta-data";

export type PopularService = {
  id: string;
  name: string;
  category: string;
  from: number;
  duration: string;
  code: string;
};

export const popularServices: PopularService[] = [
  {
    id: "s1",
    name: "Reparação e Diagnóstico Elétrico",
    category: "eletricista",
    from: 450,
    duration: "1h",
    code: "ELEC",
  },
  {
    id: "s2",
    name: "Desentupimento e Fugas de Água",
    category: "canalizador",
    from: 380,
    duration: "1h30",
    code: "CANAL",
  },
  {
    id: "s3",
    name: "Limpeza Técnica e Pós-Obra",
    category: "limpeza",
    from: 550,
    duration: "3h",
    code: "LIMP",
  },
  {
    id: "s4",
    name: "Pintura com Proteção Anti-Salitre",
    category: "pintor",
    from: 600,
    duration: "1 dia",
    code: "PINT",
  },
  {
    id: "s5",
    name: "Manutenção & Recarga de AC",
    category: "ar-condicionado",
    from: 500,
    duration: "1h",
    code: "CLIM",
  },
  {
    id: "s6",
    name: "Manutenção de Gerador e Mecânica",
    category: "mecanico",
    from: 450,
    duration: "2h",
    code: "MEC",
  },
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
    title: "Garantia KONEKTA Escrow",
    subtitle: "O seu dinheiro permanece seguro até validar o serviço com PIN",
    badge: "Proteção Total",
    tone: "primary",
  },
  {
    id: "p2",
    title: "Técnicos Credenciados em STP",
    subtitle: "Identificação civil e registo de antecedentes rigorosamente validados",
    badge: "100% Verificado",
    tone: "success",
  },
  {
    id: "p3",
    title: "Atendimento Rápido em Água Grande e Mé-Zóchi",
    subtitle: "Equipas prontas para piquete de assistência em menos de 45 min",
    badge: "Piquete Rápido",
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
  eletricista: "Eletricidade",
  canalizador: "Canalização",
  limpeza: "Limpeza",
  pintor: "Pintura",
  mecanico: "Mecânica & Geradores",
  jardinagem: "Jardinagem",
  "ar-condicionado": "Climatização",
  beleza: "Estética",
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
    const matchesCategory =
      !categorySlug ||
      p.categorySlug === categorySlug ||
      slugifyCategory(p.category) === categorySlug;
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.services.some((s) => s.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });
}

export function formatDb(value: number) {
  return `${value.toLocaleString("pt-PT")} STN`;
}
