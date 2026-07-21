import electricianImg from "@/assets/provider-electrician.jpg";
import plumberImg from "@/assets/provider-plumber.jpg";
import cleanerImg from "@/assets/provider-cleaner.jpg";
import painterImg from "@/assets/provider-painter.jpg";

export type Category = {
  slug: string;
  name: string;
  tint: "cocoa" | "ocean" | "sun" | "terracotta";
};

export const categories: Category[] = [
  { slug: "eletricista", name: "Eletricista", tint: "cocoa" },
  { slug: "canalizador", name: "Canalizador", tint: "ocean" },
  { slug: "limpeza", name: "Limpeza", tint: "sun" },
  { slug: "pintor", name: "Pintor", tint: "terracotta" },
  { slug: "mecanico", name: "Mecânico", tint: "cocoa" },
  { slug: "jardinagem", name: "Jardinagem", tint: "ocean" },
  { slug: "ar-condicionado", name: "Ar Condicionado", tint: "sun" },
  { slug: "beleza", name: "Beleza", tint: "terracotta" },
];

export type Provider = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  priceFrom: number;
  image: string;
  bio: string;
  services: string[];
};

export const providers: Provider[] = [
  {
    id: "edmilson-varela",
    name: "Edmilson Varela",
    category: "Eletricista",
    rating: 4.9,
    reviews: 128,
    priceFrom: 450,
    image: electricianImg,
    bio: "Eletricista certificado com 8 anos de experiência em instalações residenciais e comerciais em São Tomé.",
    services: ["Instalações", "Reparações", "Iluminação", "Quadros elétricos"],
  },
  {
    id: "dercio-costa",
    name: "Dércio Costa",
    category: "Canalizador",
    rating: 4.8,
    reviews: 84,
    priceFrom: 380,
    image: plumberImg,
    bio: "Especialista em canalização doméstica, deteção de fugas e reparação de tubagens.",
    services: ["Fugas", "Reparações", "Instalação de torneiras", "Aquecedores"],
  },
  {
    id: "maria-santos",
    name: "Maria Santos",
    category: "Limpeza",
    rating: 4.9,
    reviews: 212,
    priceFrom: 250,
    image: cleanerImg,
    bio: "Limpeza residencial profunda e regular. Serviço meticuloso e de confiança.",
    services: ["Limpeza geral", "Limpeza profunda", "Pós-obra", "Escritórios"],
  },
  {
    id: "joao-pedro",
    name: "João Pedro",
    category: "Pintor",
    rating: 4.7,
    reviews: 63,
    priceFrom: 600,
    image: painterImg,
    bio: "Pintor profissional. Interiores, exteriores e acabamentos decorativos.",
    services: ["Pintura interior", "Pintura exterior", "Estuque", "Vernizes"],
  },
];

export type OrderStatus =
  | "pendente"
  | "aceite"
  | "a-caminho"
  | "em-execucao"
  | "concluido"
  | "avaliado";

export type Order = {
  id: string;
  providerId: string;
  service: string;
  scheduledFor: string;
  status: OrderStatus;
  total: number;
};

export const orders: Order[] = [
  {
    id: "KNK-1042",
    providerId: "edmilson-varela",
    service: "Instalação de iluminação",
    scheduledFor: "Hoje, 15:00",
    status: "a-caminho",
    total: 450,
  },
  {
    id: "KNK-1039",
    providerId: "maria-santos",
    service: "Limpeza profunda",
    scheduledFor: "Amanhã, 09:00",
    status: "aceite",
    total: 550,
  },
  {
    id: "KNK-1021",
    providerId: "dercio-costa",
    service: "Reparação de fuga",
    scheduledFor: "12 Nov, 14:00",
    status: "concluido",
    total: 380,
  },
];

export const statusLabel: Record<OrderStatus, string> = {
  pendente: "Pendente",
  aceite: "Aceite",
  "a-caminho": "A caminho",
  "em-execucao": "Em execução",
  concluido: "Concluído",
  avaliado: "Avaliado",
};

export function getProvider(id: string) {
  return providers.find((p) => p.id === id);
}
