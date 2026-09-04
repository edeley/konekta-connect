import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudUpload,
  Copy,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Plus,
  Repeat,
  Search,
  ShieldCheck,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { store, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByCodeOrIso, Country } from "@/lib/countries";

type Role = "cliente" | "prestador" | "ambos";
type ProType = "individual" | "empresa";

export const Route = createFileRoute("/registro")({
  validateSearch: (search: Record<string, unknown>): { role?: Role; edit?: boolean } => {
    return {
      role: (search.role as Role) || undefined,
      edit: search.edit === true || search.edit === "true",
    };
  },
  head: () => ({
    meta: [
      { title: "KONEKTA - Registo e Perfil" },
      {
        name: "description",
        content:
          "Um só ecrã. Simples e seguro. Crie ou edite a sua conta na KONEKTA em São Tomé e Príncipe.",
      },
    ],
  }),
  component: RegistoPage,
});

interface ServiceItem {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  pricingModel: string;
  priceDb: string;
}

// Category Data Hierarchy from screenshots 7, 8, 9, 10
interface SubCategoryDef {
  name: string;
  servicesCount: number;
  services: string[];
}

interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  subcategories: SubCategoryDef[];
}

const CATEGORIES_DATA: CategoryDef[] = [
  {
    id: "eletricidade",
    name: "Eletricidade",
    icon: "⚡",
    subcategories: [
      {
        name: "Instalação",
        servicesCount: 3,
        services: [
          "Instalação de tomada",
          "Instalação de quadro elétrico",
          "Instalação de iluminação",
        ],
      },
      {
        name: "Reparação",
        servicesCount: 3,
        services: ["Reparação de curto-circuito", "Troca de disjuntor", "Reparação de fiação"],
      },
      {
        name: "Energia solar",
        servicesCount: 2,
        services: ["Instalação de painéis solares", "Manutenção de sistema solar"],
      },
    ],
  },
  {
    id: "canalizacao",
    name: "Canalização",
    icon: "🚰",
    subcategories: [
      {
        name: "Reparação",
        servicesCount: 3,
        services: ["Fuga de água", "Desentupimento", "Substituição de torneira"],
      },
      {
        name: "Instalação",
        servicesCount: 3,
        services: [
          "Instalação de canalização",
          "Montagem de loiças sanitárias",
          "Instalação de termoacumulador",
        ],
      },
    ],
  },
  {
    id: "limpeza",
    name: "Limpeza",
    icon: "🧹",
    subcategories: [
      {
        name: "Residencial",
        servicesCount: 3,
        services: ["Limpeza profunda", "Limpeza pós-obra", "Limpeza de vidros"],
      },
      {
        name: "Comercial",
        servicesCount: 2,
        services: ["Limpeza de escritórios", "Higienização de estofados"],
      },
    ],
  },
  {
    id: "construcao",
    name: "Construção",
    icon: "🧱",
    subcategories: [
      {
        name: "Alvenaria",
        servicesCount: 3,
        services: ["Assentamento de blocos", "Reboco de paredes", "Construção de muros"],
      },
      {
        name: "Acabamentos",
        servicesCount: 2,
        services: ["Assentamento de azulejos", "Regularização de piso"],
      },
    ],
  },
  {
    id: "pintura",
    name: "Pintura",
    icon: "🖌️",
    subcategories: [
      {
        name: "Pintura geral",
        servicesCount: 3,
        services: ["Pintura interior", "Pintura exterior", "Tratamento de humidade"],
      },
    ],
  },
  {
    id: "carpintaria",
    name: "Carpintaria",
    icon: "🪚",
    subcategories: [
      {
        name: "Móveis e Estruturas",
        servicesCount: 3,
        services: ["Fabrico de armários", "Reparação de portas", "Colocação de soalho"],
      },
    ],
  },
  {
    id: "costura",
    name: "Costura",
    icon: "🧵",
    subcategories: [
      {
        name: "Arranjos e Confeção",
        servicesCount: 2,
        services: ["Ajustes de roupa", "Confeção por medida"],
      },
    ],
  },
  {
    id: "informatica",
    name: "Informática e redes",
    icon: "💻",
    subcategories: [
      {
        name: "Assistência",
        servicesCount: 3,
        services: [
          "Reparação de computadores",
          "Configuração de redes Wi-Fi",
          "Formatação e software",
        ],
      },
    ],
  },
  {
    id: "eventos",
    name: "Eventos e catering",
    icon: "🎉",
    subcategories: [
      {
        name: "Serviços",
        servicesCount: 3,
        services: ["Catering para festas", "Decoração de eventos", "Animação"],
      },
    ],
  },
  {
    id: "aulas",
    name: "Aulas e explicações",
    icon: "📚",
    subcategories: [
      {
        name: "Apoio escolar",
        servicesCount: 3,
        services: ["Explicações de Matemática", "Aulas de Inglês", "Apoio ao estudo"],
      },
    ],
  },
];

const DISTRICTS_LIST = [
  "Água Grande",
  "Mé-Zóchi",
  "Lobata",
  "Lembá",
  "Cantagalo",
  "Caué",
  "Região Autónoma do Príncipe",
];

const RADIUS_OPTIONS = ["5 km", "10 km", "20 km", "30 km", "Toda a região selecionada"];

interface SchedulePeriod {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  id: string;
  name: string;
  fullName: string;
  enabled: boolean;
  periods: SchedulePeriod[];
}

const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

const INITIAL_SCHEDULE: DaySchedule[] = [
  {
    id: "seg",
    name: "Seg",
    fullName: "Segunda-feira",
    enabled: true,
    periods: [
      { id: "1", start: "08:00", end: "16:00" },
      { id: "2", start: "14:00", end: "18:00" },
    ],
  },
  {
    id: "ter",
    name: "Ter",
    fullName: "Terça-feira",
    enabled: false,
    periods: [{ id: "1", start: "08:00", end: "16:00" }],
  },
  {
    id: "qua",
    name: "Qua",
    fullName: "Quarta-feira",
    enabled: false,
    periods: [{ id: "1", start: "08:00", end: "16:00" }],
  },
  {
    id: "qui",
    name: "Qui",
    fullName: "Quinta-feira",
    enabled: false,
    periods: [{ id: "1", start: "08:00", end: "16:00" }],
  },
  {
    id: "sex",
    name: "Sex",
    fullName: "Sexta-feira",
    enabled: false,
    periods: [{ id: "1", start: "08:00", end: "16:00" }],
  },
  {
    id: "sab",
    name: "Sáb",
    fullName: "Sábado",
    enabled: false,
    periods: [{ id: "1", start: "08:00", end: "16:00" }],
  },
  {
    id: "dom",
    name: "Dom",
    fullName: "Domingo",
    enabled: false,
    periods: [{ id: "1", start: "08:00", end: "16:00" }],
  },
];

function RegistoPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.user);
  const currentProvider = useStore((s) => s.providerProfile);
  const platformConfig = useStore((s) => s.config);

  const isEditMode = Boolean(search.edit);

  // Role selection - intelligent default: from search parameter -> or active user role -> or "cliente"
  const [role, setRole] = useState<Role>(() => {
    if (search.role) return search.role;
    if (currentUser?.role === "prestador") return "prestador";
    return "cliente";
  });

  // Country selection state (STP default +239)
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    if (currentUser?.phone) {
      return findCountryByCodeOrIso(currentUser.phone);
    }
    return DEFAULT_COUNTRY;
  });
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [registrationSuccessModal, setRegistrationSuccessModal] = useState<{
    isOpen: boolean;
    role: Role;
  }>({ isOpen: false, role: "cliente" });

  // Phone number state
  const [phone, setPhone] = useState(() => {
    if (currentUser?.phone) {
      let clean = currentUser.phone.trim();
      for (const c of COUNTRIES) {
        if (clean.startsWith(c.code)) {
          clean = clean.slice(c.code.length).trim();
          break;
        }
      }
      return clean.replace(/\D/g, "");
    }
    return "";
  });
  const [phoneConfirmed, setPhoneConfirmed] = useState(() => {
    return Boolean(currentUser?.phone);
  });

  // Accordion Section Toggles
  const [openPersonalData, setOpenPersonalData] = useState(true);
  const [openProProfile, setOpenProProfile] = useState(true);
  const [openServices, setOpenServices] = useState(true);
  const [openDistricts, setOpenDistricts] = useState(true);
  const [openAvailability, setOpenAvailability] = useState(true);
  const [openIdentity, setOpenIdentity] = useState(true);

  // Section 1: Dados pessoais
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser?.avatar || null);
  const [fullName, setFullName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");

  // Palavra-passe / Senha
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Helper para cálculo da força da palavra-passe
  const getPasswordStrength = (pass: string) => {
    if (!pass)
      return { score: 0, label: "Vazia", color: "bg-slate-200", textColor: "text-slate-400" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1)
      return { score: 1, label: "Fraca", color: "bg-red-500", textColor: "text-red-500" };
    if (score === 2)
      return { score: 2, label: "Razoável", color: "bg-amber-500", textColor: "text-amber-500" };
    if (score === 3)
      return { score: 3, label: "Boa", color: "bg-blue-500", textColor: "text-blue-500" };
    return {
      score: 4,
      label: "Forte e Segura",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
    };
  };

  // Section 2: Perfil profissional
  const [proType, setProType] = useState<ProType>(
    currentProvider?.businessName ? "empresa" : "individual",
  );
  const [proName, setProName] = useState(currentProvider?.businessName || currentUser?.name || "");
  const [proResponsibleName, setProResponsibleName] = useState(currentUser?.name || "");
  const [proDescription, setProDescription] = useState(currentProvider?.bio || "");
  const [proExperience, setProExperience] = useState(
    currentProvider?.experienceYears ? String(currentProvider.experienceYears) : "",
  );

  // Section 3: Serviços escolhidos
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>(() => {
    if (currentProvider?.subcategories && currentProvider.subcategories.length > 0) {
      return currentProvider.subcategories.map((sub, idx) => ({
        id: String(idx + 1),
        category: currentProvider.category || "Serviços Gerais",
        subcategory: sub,
        name: sub,
        pricingModel: "Por serviço",
        priceDb: "500",
      }));
    }
    return [
      {
        id: "1",
        category: "Canalização",
        subcategory: "Reparação",
        name: "Fuga de água",
        pricingModel: "",
        priceDb: "",
      },
    ];
  });

  // Section 4: Distritos & Raio
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(() => {
    if (currentProvider?.coverageDistricts && currentProvider.coverageDistricts.length > 0) {
      return currentProvider.coverageDistricts;
    }
    if (currentUser?.district) {
      return [currentUser.district];
    }
    return [
      "Água Grande",
      "Mé-Zóchi",
      "Lobata",
      "Lembá",
      "Cantagalo",
      "Caué",
      "Região Autónoma do Príncipe",
    ];
  });
  const [radiusOption, setRadiusOption] = useState("Toda a região selecionada");
  const [isRadiusModalOpen, setIsRadiusModalOpen] = useState(false);

  // Section 5: Disponibilidade State & Handlers
  const [schedule, setSchedule] = useState<DaySchedule[]>(INITIAL_SCHEDULE);
  const [configureLater, setConfigureLater] = useState(true);

  const handleToggleDay = (dayId: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, enabled: !day.enabled } : day)),
    );
  };

  const handleAddPeriod = (dayId: string) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const newPeriod: SchedulePeriod = {
            id: String(Date.now()),
            start: "14:00",
            end: "18:00",
          };
          return { ...day, periods: [...day.periods, newPeriod] };
        }
        return day;
      }),
    );
  };

  const handleRemovePeriod = (dayId: string, periodId: string) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const updatedPeriods = day.periods.filter((p) => p.id !== periodId);
          return {
            ...day,
            periods: updatedPeriods,
            enabled: updatedPeriods.length > 0 ? day.enabled : false,
          };
        }
        return day;
      }),
    );
  };

  const handleUpdatePeriod = (
    dayId: string,
    periodId: string,
    field: "start" | "end",
    val: string,
  ) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            periods: day.periods.map((p) => (p.id === periodId ? { ...p, [field]: val } : p)),
          };
        }
        return day;
      }),
    );
  };

  const handleApplyToAll = (sourceDayId: string) => {
    const sourceDay = schedule.find((d) => d.id === sourceDayId);
    if (!sourceDay) return;

    setSchedule((prev) =>
      prev.map((day) => ({
        ...day,
        enabled: true,
        periods: sourceDay.periods.map((p, idx) => ({
          ...p,
          id: `${day.id}-${idx}-${Date.now()}`,
        })),
      })),
    );
    toast.success(`Horário de ${sourceDay.fullName} aplicado a todos os dias!`);
  };

  const getScheduleSummary = () => {
    if (configureLater) return "Configurar depois";
    const enabledDays = schedule.filter((d) => d.enabled);
    if (enabledDays.length === 0) return "Indisponível";

    const first = enabledDays[0];
    const periodsStr = first.periods.map((p) => `${p.start}–${p.end}`).join(" e ");

    if (enabledDays.length === 1) {
      return `${first.name} ${periodsStr}`;
    }
    return `${first.name} ${periodsStr}`;
  };

  // Section 6: Verificação de identidade
  const [frontDocName, setFrontDocName] = useState<string | null>(null);
  const [backDocName, setBackDocName] = useState<string | null>(null);
  const [companyDocName, setCompanyDocName] = useState<string | null>(null);

  // Checkboxes
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Modal State for Adding Services
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [activeCategory, setActiveCategory] = useState<CategoryDef | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<SubCategoryDef | null>(null);

  // Custom inputs inside modal
  const [customCatInput, setCustomCatInput] = useState("");
  const [customSubcatInput, setCustomSubcatInput] = useState("");
  const [customServiceInput, setCustomServiceInput] = useState("");

  // Format phone display based on selected country
  const formattedPhoneDisplay = (raw: string) => {
    return selectedCountry.format(raw);
  };

  const handlePhoneChange = (val: string) => {
    const maxDigits = selectedCountry.digitsMax || selectedCountry.digits;
    const digits = val.replace(/\D/g, "").slice(0, maxDigits);
    setPhone(digits);
    const minDigits = selectedCountry.digitsMin || selectedCountry.digits;
    setPhoneConfirmed(digits.length >= minDigits);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    const maxDigits = country.digitsMax || country.digits;
    const truncated = phone.slice(0, maxDigits);
    setPhone(truncated);
    const minDigits = country.digitsMin || country.digits;
    setPhoneConfirmed(truncated.length >= minDigits);
    setCountryModalOpen(false);
    setCountrySearch("");
  };

  // Avatar Upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      toast.success("Foto de perfil carregada!");
    }
  };

  // Doc Upload
  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontDocName(file.name);
      toast.success("Foto da frente do BI/Passaporte carregada!");
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackDocName(file.name);
      toast.success("Foto do verso do BI/Passaporte carregada!");
    }
  };

  const handleCompanyDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyDocName(file.name);
      toast.success("Documento do registo comercial carregado!");
    }
  };

  // Delete service
  const handleRemoveService = (id: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));
    toast.info("Serviço removido");
  };

  // Update service pricing
  const handleUpdateServiceField = (
    id: string,
    field: "pricingModel" | "priceDb",
    value: string,
  ) => {
    setSelectedServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  // Modal actions
  const handleSelectCategory = (cat: CategoryDef) => {
    setActiveCategory(cat);
    setModalStep(2);
  };

  const handleSelectSubcategory = (subcat: SubCategoryDef) => {
    setActiveSubcategory(subcat);
    setModalStep(3);
  };

  const handleToggleServiceSelection = (serviceName: string) => {
    if (!activeCategory || !activeSubcategory) return;

    const exists = selectedServices.some(
      (s) =>
        s.category === activeCategory.name &&
        s.subcategory === activeSubcategory.name &&
        s.name === serviceName,
    );

    if (exists) {
      setSelectedServices((prev) =>
        prev.filter(
          (s) =>
            !(
              s.category === activeCategory.name &&
              s.subcategory === activeSubcategory.name &&
              s.name === serviceName
            ),
        ),
      );
    } else {
      setSelectedServices((prev) => [
        ...prev,
        {
          id: String(Date.now() + Math.random()),
          category: activeCategory.name,
          subcategory: activeSubcategory.name,
          name: serviceName,
          pricingModel: "",
          priceDb: "",
        },
      ]);
    }
  };

  const handleAddCustomCategory = () => {
    if (!customCatInput.trim()) return;
    const catName = customCatInput.trim();
    const subName = "Geral";
    const servName = `Serviço de ${catName}`;

    setSelectedServices((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        category: catName,
        subcategory: subName,
        name: servName,
        pricingModel: "",
        priceDb: "",
      },
    ]);

    setCustomCatInput("");
    toast.success(`Categoria "${catName}" adicionada!`);
  };

  const handleAddCustomSubcategory = () => {
    if (!customSubcatInput.trim() || !activeCategory) return;
    const subName = customSubcatInput.trim();
    const servName = `Serviço de ${subName}`;

    setSelectedServices((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        category: activeCategory.name,
        subcategory: subName,
        name: servName,
        pricingModel: "",
        priceDb: "",
      },
    ]);

    setCustomSubcatInput("");
    toast.success(`Subcategoria "${subName}" adicionada!`);
  };

  const handleAddCustomService = () => {
    if (!customServiceInput.trim() || !activeCategory || !activeSubcategory) return;
    const servName = customServiceInput.trim();

    setSelectedServices((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        category: activeCategory.name,
        subcategory: activeSubcategory.name,
        name: servName,
        pricingModel: "",
        priceDb: "",
      },
    ]);

    setCustomServiceInput("");
    toast.success(`Serviço "${servName}" adicionado!`);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Por favor insira o seu nome completo.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const minDigits = selectedCountry.digitsMin || selectedCountry.digits;
    const maxDigits = selectedCountry.digitsMax || selectedCountry.digits;

    if (!cleanPhone || cleanPhone.length < minDigits || cleanPhone.length > maxDigits) {
      toast.error(
        `Por favor insira um número de telemóvel válido para ${selectedCountry.name} (${selectedCountry.digits} dígitos, ex.: ${selectedCountry.placeholder}).`,
      );
      return;
    }

    if (!isEditMode) {
      if (!password) {
        toast.error("Por favor crie uma palavra-passe de acesso.");
        return;
      }
      if (password.length < 6) {
        toast.error("A palavra-passe deve ter no mínimo 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("As palavras-passe não coincidem. Por favor confirme a mesma palavra-passe.");
        return;
      }
    } else {
      if (password) {
        if (password.length < 6) {
          toast.error("A nova palavra-passe deve ter no mínimo 6 caracteres.");
          return;
        }
        if (password !== confirmPassword) {
          toast.error("As palavras-passe não coincidem.");
          return;
        }
      }
    }

    if (!isEditMode && (!acceptTerms || !acceptPrivacy)) {
      toast.error("Por favor aceite os Termos de Utilização e a Política de Privacidade.");
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const formattedPhone = `${selectedCountry.code} ${selectedCountry.format(phone)}`;

      if (isEditMode) {
        // Modo de Edição Inteligente
        if (role === "prestador" || role === "ambos") {
          store.updateUser({
            name: fullName.trim() || proName.trim() || currentUser?.name || "Utilizador KONEKTA",
            phone: formattedPhone,
            email: email.trim() || undefined,
            avatar: avatarUrl || undefined,
            district: selectedDistricts[0] || "Água Grande",
          });
          store.updateProviderProfile({
            businessName: proName.trim() || fullName.trim(),
            bio: proDescription.trim(),
            experienceYears: Number(proExperience) || undefined,
            coverageDistricts: selectedDistricts,
            category:
              selectedServices[0]?.category || currentProvider?.category || "Serviços Gerais",
            subcategories: selectedServices.map((s) => s.name),
          });
        } else {
          store.updateUser({
            name: fullName.trim() || currentUser?.name || "Utilizador KONEKTA",
            phone: formattedPhone,
            email: email.trim() || undefined,
            avatar: avatarUrl || undefined,
            district: selectedDistricts[0] || "Água Grande",
          });
        }

        setSubmitting(false);
        toast.success("Dados da conta atualizados com sucesso!");
        navigate({ to: "/perfil", replace: true });
      } else {
        // Modo de Registo Novo
        if (role === "prestador" || role === "ambos") {
          store.registerProvider(
            {
              name: fullName.trim() || proName.trim() || "Prestador KONEKTA",
              phone: formattedPhone,
              email: email.trim() || undefined,
              avatar: avatarUrl || undefined,
            },
            {
              category: selectedServices[0]?.category || "Serviços Gerais",
              subcategories: selectedServices.map((s) => s.name),
              businessName: proName.trim() || fullName.trim(),
              bio: proDescription.trim(),
              experienceYears: Number(proExperience) || 1,
              yearsExperience: Number(proExperience) || 1,
              services: selectedServices.map((s) => ({
                name: s.name,
                price: Number(s.priceDb) || 0,
              })),
              radiusKm: 15,
              documents: { selfieOk: true },
              coverageDistricts: selectedDistricts,
              district: selectedDistricts[0] || "Água Grande",
              city: "São Tomé",
            },
          );
        } else {
          store.registerClient({
            name: fullName.trim() || proName.trim() || "Utilizador KONEKTA",
            phone: formattedPhone,
            email: email.trim() || undefined,
            avatar: avatarUrl || undefined,
            district: selectedDistricts[0] || "Água Grande",
            city: "São Tomé",
          });
        }

        store.markOnboarded();
        setSubmitting(false);

        toast.success(
          role === "prestador"
            ? "Perfil enviado para verificação com sucesso!"
            : "Conta de cliente criada com sucesso!",
        );
        // Exibe o modal inteligente de boas-vindas com redirecionamento ao grupo oficial de WhatsApp
        setRegistrationSuccessModal({ isOpen: true, role });
      }
    }, 500);
  };

  // Group selected services by category
  const groupedServices = selectedServices.reduce<Record<string, ServiceItem[]>>((acc, curr) => {
    const catKey = curr.category.toUpperCase();
    if (!acc[catKey]) acc[catKey] = [];
    acc[catKey].push(curr);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 antialiased pb-20">
      {/* ----------------- HEADER AZUL KONEKTA STP ----------------- */}
      <header className="relative bg-[#1D68D8] text-white px-4 pt-4 pb-7 shadow-md">
        <div className="relative mx-auto w-full max-w-md">
          {/* Botão Voltar */}
          <button
            type="button"
            onClick={() => {
              if (isEditMode) {
                navigate({ to: "/perfil" });
              } else {
                navigate({ to: "/" });
              }
            }}
            aria-label="Voltar"
            className="absolute left-0 top-0 size-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95 shrink-0 z-10 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Logo e Marca KONEKTA STP */}
          <div className="flex flex-col items-center text-center pt-1 sm:pt-2">
            <div className="flex items-center justify-center gap-2.5">
              <div className="size-10 rounded-full bg-white text-[#1D68D8] font-black text-xl flex items-center justify-center shadow-xs select-none">
                K
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-wide text-white">
                KONEKTA STP
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="mt-3.5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isEditMode
                ? role === "prestador"
                  ? "Editar Perfil de Prestador"
                  : "Editar Perfil de Cliente"
                : "Criar Conta"}
            </h1>

            {/* Subtítulo */}
            <p className="mt-2 text-xs sm:text-sm text-blue-50/90 max-w-xs sm:max-w-sm font-normal leading-relaxed">
              {isEditMode
                ? "Atualize os seus dados e preferências na sua conta."
                : "Junte-se à maior plataforma de serviços e profissionais em São Tomé e Príncipe."}
            </p>
          </div>
        </div>
      </header>

      {/* ----------------- FORM BODY ----------------- */}
      <main className="mx-auto w-full max-w-md px-4 pt-4 space-y-4">
        {/* ================= CARD 1: Como pretende utilizar o KONEKTA? ================= */}
        <section className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Como pretende utilizar o KONEKTA?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Pode mudar mais tarde no seu perfil.</p>
          </div>

          <div className="space-y-3">
            {/* Option 1: Cliente */}
            <button
              type="button"
              onClick={() => setRole("cliente")}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                role === "cliente"
                  ? "border-2 border-[#1D68D8] bg-white shadow-2xs"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    role === "cliente" ? "bg-[#1D68D8] text-white" : "bg-[#EBF3FF] text-[#1D68D8]",
                  )}
                >
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cliente</h3>
                  <p className="text-xs text-slate-500">Quero contratar serviços</p>
                </div>
              </div>
              {role === "cliente" ? (
                <span className="bg-[#1D68D8] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shrink-0">
                  Perfil Cliente
                </span>
              ) : (
                <div className="size-5 rounded-full border-2 border-slate-300 shrink-0" />
              )}
            </button>

            {/* Option 2: Prestador */}
            <button
              type="button"
              onClick={() => setRole("prestador")}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                role === "prestador"
                  ? "border-2 border-[#1D68D8] bg-white shadow-2xs"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    role === "prestador"
                      ? "bg-[#1D68D8] text-white"
                      : "bg-[#EBF3FF] text-[#1D68D8]",
                  )}
                >
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Prestador</h3>
                  <p className="text-xs text-slate-500">Quero prestar serviços</p>
                </div>
              </div>
              {role === "prestador" ? (
                <span className="bg-[#1D68D8] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shrink-0">
                  Perfil Prestador
                </span>
              ) : (
                <div className="size-5 rounded-full border-2 border-slate-300 shrink-0" />
              )}
            </button>

            {/* Option 3: Ambos */}
            <button
              type="button"
              onClick={() => setRole("ambos")}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                role === "ambos"
                  ? "border-2 border-[#1D68D8] bg-white shadow-2xs"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    role === "ambos" ? "bg-[#1D68D8] text-white" : "bg-[#EBF3FF] text-[#1D68D8]",
                  )}
                >
                  <Repeat size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ambos</h3>
                  <p className="text-xs text-slate-500">Contratar e prestar serviços</p>
                </div>
              </div>
              {role === "ambos" ? (
                <span className="bg-[#1D68D8] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shrink-0">
                  Perfil Duplo
                </span>
              ) : (
                <div className="size-5 rounded-full border-2 border-slate-300 shrink-0" />
              )}
            </button>
          </div>
        </section>

        {/* ================= CARD 2: Dados pessoais e Senha (Accordion) ================= */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenPersonalData(!openPersonalData)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#EBF3FF] text-[#1D68D8] flex items-center justify-center shrink-0">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dados pessoais e Acesso</h3>
                <p className="text-xs text-slate-500">
                  Nome, telemóvel, foto, e-mail e palavra-passe
                </p>
              </div>
            </div>
            <div className="text-slate-400">
              {openPersonalData ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {openPersonalData && (
            <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
              {/* Foto de perfil */}
              <div className="flex items-center gap-4 py-1">
                <label className="relative size-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-[#1D68D8] hover:text-[#1D68D8] transition cursor-pointer shrink-0 overflow-hidden bg-slate-50">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto de perfil" className="size-full object-cover" />
                  ) : (
                    <Camera size={22} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Foto de perfil</h4>
                  <p className="text-xs text-slate-500">Opcional, mas ajuda a criar confiança.</p>
                </div>
              </div>

              {/* Nome completo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex.: Maria dos Santos"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition"
                  required
                />
              </div>

              {/* Número de telemóvel */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    Número de telemóvel <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    {selectedCountry.name} ({selectedCountry.code})
                  </span>
                </div>

                <div className="relative flex items-center rounded-2xl border border-slate-200 focus-within:border-blue-500 bg-white p-2 transition-colors shadow-2xs">
                  {/* Seletor de País e Indicativo */}
                  <button
                    type="button"
                    onClick={() => setCountryModalOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-800 shrink-0 select-none transition-colors cursor-pointer"
                    title="Alterar país ou indicativo de telemóvel"
                  >
                    <span className="text-lg leading-none">{selectedCountry.flag}</span>
                    <span className="font-bold text-slate-800">{selectedCountry.code}</span>
                    <ChevronDown size={14} className="text-slate-500 ml-0.5" />
                  </button>

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={selectedCountry.format(phone)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      if (pasted) {
                        e.preventDefault();
                        let clean = pasted.trim();
                        for (const c of COUNTRIES) {
                          if (clean.startsWith(c.code)) {
                            clean = clean.slice(c.code.length).trim();
                            setSelectedCountry(c);
                            break;
                          }
                        }
                        const maxDigits = selectedCountry.digitsMax || selectedCountry.digits;
                        clean = clean.replace(/\D/g, "").slice(0, maxDigits);
                        setPhone(clean);
                        setPhoneConfirmed(
                          clean.length >= (selectedCountry.digitsMin || selectedCountry.digits),
                        );
                        toast.success("Contacto colado!");
                      }
                    }}
                    className="w-full bg-transparent px-3 py-2 text-base font-bold text-slate-900 outline-none tracking-wider placeholder:text-slate-400 placeholder:font-normal"
                    placeholder={selectedCountry.placeholder}
                  />

                  {phone.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhone("");
                        setPhoneConfirmed(false);
                      }}
                      className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mr-1 transition-colors cursor-pointer"
                      title="Limpar número"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span>
                    Exemplo para {selectedCountry.name}:{" "}
                    <strong className="text-slate-700">
                      {selectedCountry.code} {selectedCountry.placeholder}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCountryModalOpen(true)}
                    className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    Mudar país
                  </button>
                </p>
              </div>

              {/* E-mail (opcional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900">E-mail (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.st"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition"
                />
                <p className="text-[11px] text-slate-500">
                  Serve para recibos e notificações. Não é obrigatório.
                </p>
              </div>

              {/* Seção de Palavra-passe / Criar Senha */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-[#EBF3FF] text-[#1D68D8] flex items-center justify-center shrink-0">
                    <Lock size={15} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isEditMode
                        ? "Palavra-passe de acesso (opcional)"
                        : "Criar palavra-passe de acesso"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isEditMode
                        ? "Deixe em branco para manter a sua palavra-passe atual."
                        : "Defina uma senha segura para aceder à sua conta no telemóvel ou computador."}
                    </p>
                  </div>
                </div>

                {/* Campo: Palavra-passe */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900">
                      {isEditMode ? "Nova palavra-passe" : "Palavra-passe"}{" "}
                      {!isEditMode && <span className="text-red-500">*</span>}
                    </label>
                    {password && (
                      <span
                        className={cn(
                          "text-[11px] font-bold",
                          getPasswordStrength(password).textColor,
                        )}
                      >
                        Força: {getPasswordStrength(password).label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres (ex.: Senha123)"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition"
                      required={!isEditMode}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 transition cursor-pointer"
                      aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Indicador de força de senha */}
                  {password && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((step) => {
                          const strength = getPasswordStrength(password);
                          return (
                            <div
                              key={step}
                              className={cn(
                                "flex-1 rounded-full transition-all duration-300",
                                step <= strength.score ? strength.color : "bg-slate-200",
                              )}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            password.length >= 6 ? "text-emerald-600 font-semibold" : "",
                          )}
                        >
                          <Check
                            size={12}
                            className={password.length >= 6 ? "opacity-100" : "opacity-30"}
                          />{" "}
                          Min. 6 caracteres
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            /\d/.test(password) ? "text-emerald-600 font-semibold" : "",
                          )}
                        >
                          <Check
                            size={12}
                            className={/\d/.test(password) ? "opacity-100" : "opacity-30"}
                          />{" "}
                          1 número
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            /[A-Z]/.test(password) ? "text-emerald-600 font-semibold" : "",
                          )}
                        >
                          <Check
                            size={12}
                            className={/[A-Z]/.test(password) ? "opacity-100" : "opacity-30"}
                          />{" "}
                          1 maiúscula
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo: Confirmar Palavra-passe */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">
                    Confirmar palavra-passe {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a palavra-passe"
                      className={cn(
                        "w-full rounded-2xl border bg-white px-4 py-3.5 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition",
                        confirmPassword && password
                          ? confirmPassword === password
                            ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            : "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-[#1D68D8] focus:ring-[#1D68D8]/20",
                      )}
                      required={!isEditMode || Boolean(password)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 transition cursor-pointer"
                      aria-label={
                        showConfirmPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
                      }
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {confirmPassword && password && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium pt-0.5">
                      {confirmPassword === password ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={13} className="shrink-0" /> As palavras-passe
                          coincidem
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1">
                          <X size={13} className="shrink-0" /> As palavras-passe não coincidem
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ================= CARD 4: Perfil profissional (Accordion) ================= */}
        {(role === "prestador" || role === "ambos") && (
          <section className="bg-white rounded-[24px] border border-slate-100 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenProProfile(!openProProfile)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#EBF3FF] text-[#1D68D8] flex items-center justify-center shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Perfil profissional</h3>
                  <p className="text-xs text-slate-500">Como quer ser conhecido</p>
                </div>
              </div>
              <div className="text-slate-400">
                {openProProfile ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {openProProfile && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                {/* Switch button: Profissional individual vs Empresa */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setProType("individual")}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer gap-2",
                      proType === "individual"
                        ? "border-2 border-[#1D68D8] bg-[#F0F6FF]"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <User
                      size={20}
                      className={proType === "individual" ? "text-[#1D68D8]" : "text-slate-500"}
                    />
                    <span
                      className={cn(
                        "text-xs font-bold leading-tight",
                        proType === "individual" ? "text-[#1D68D8]" : "text-slate-700",
                      )}
                    >
                      Profissional individual
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProType("empresa")}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer gap-2",
                      proType === "empresa"
                        ? "border-2 border-[#1D68D8] bg-[#F0F6FF]"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <Building2
                      size={20}
                      className={proType === "empresa" ? "text-[#1D68D8]" : "text-slate-500"}
                    />
                    <span
                      className={cn(
                        "text-xs font-bold leading-tight",
                        proType === "empresa" ? "text-[#1D68D8]" : "text-slate-700",
                      )}
                    >
                      Empresa
                    </span>
                  </button>
                </div>

                {/* Nome da empresa / Nome profissional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">
                    {proType === "empresa" ? "Nome da empresa" : "Nome profissional"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proName}
                    onChange={(e) => setProName(e.target.value)}
                    placeholder={
                      proType === "empresa" ? "Ex.: STP Serviços, Lda" : "Ex.: Eletricista Nando"
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition"
                  />
                </div>

                {/* Nome do responsável (only for empresa) */}
                {proType === "empresa" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900">Nome do responsável</label>
                    <input
                      type="text"
                      value={proResponsibleName}
                      onChange={(e) => setProResponsibleName(e.target.value)}
                      placeholder="Quem responde pela empresa"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition"
                    />
                  </div>
                )}

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Descrição</label>
                  <textarea
                    rows={3}
                    value={proDescription}
                    onChange={(e) => setProDescription(e.target.value)}
                    placeholder="Explique em poucas palavras o que faz e porque confiar em si."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition resize-none"
                  />
                </div>

                {/* Experiência (anos) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Experiência (anos)</label>
                  <input
                    type="text"
                    value={proExperience}
                    onChange={(e) => setProExperience(e.target.value)}
                    placeholder="Ex.: 5"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================= CARD 5: Serviços (Accordion) ================= */}
        {(role === "prestador" || role === "ambos") && (
          <section className="bg-white rounded-[24px] border border-slate-100 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenServices(!openServices)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#EBF3FF] text-[#1D68D8] flex items-center justify-center shrink-0">
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Serviços</h3>
                  <p className="text-xs text-slate-500">
                    {selectedServices.length > 0
                      ? `${selectedServices.length} serviço(s) escolhido(s)`
                      : "Escolha o que sabe fazer"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedServices.length > 0 && (
                  <div className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                )}
                <div className="text-slate-400">
                  {openServices ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </button>

            {openServices && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                {/* List of selected services grouped by category */}
                {Object.keys(groupedServices).length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 space-y-4">
                    {Object.entries(groupedServices).map(([categoryName, items]) => (
                      <div key={categoryName} className="space-y-2.5">
                        <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase px-1">
                          {categoryName}
                        </h4>

                        <div className="space-y-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 relative shadow-2xs"
                            >
                              <div className="flex items-start justify-between pr-8">
                                <div>
                                  <h5 className="text-sm font-bold text-slate-900 leading-snug">
                                    {item.name}
                                  </h5>
                                  <p className="text-xs text-slate-500">{item.subcategory}</p>
                                </div>
                              </div>

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveService(item.id)}
                                className="absolute top-3 right-3 size-7 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition cursor-pointer"
                              >
                                <X size={14} />
                              </button>

                              {/* Pricing Inputs */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-slate-500">
                                    Modelo de cobrança
                                  </label>
                                  <select
                                    value={item.pricingModel ?? ""}
                                    onChange={(e) =>
                                      handleUpdateServiceField(
                                        item.id,
                                        "pricingModel",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#1D68D8] transition"
                                  >
                                    <option value="">Escolher...</option>
                                    <option value="Por hora">Por hora</option>
                                    <option value="Por serviço">Por serviço</option>
                                    <option value="Sob orçamento">Sob orçamento</option>
                                    <option value="Preço fixo">Preço fixo</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-slate-500">
                                    Preço (Db)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.priceDb ?? ""}
                                    onChange={(e) =>
                                      handleUpdateServiceField(item.id, "priceDb", e.target.value)
                                    }
                                    placeholder="Ex.: 500"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] transition"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Category / Service Button */}
                <button
                  type="button"
                  onClick={() => {
                    setModalStep(1);
                    setActiveCategory(null);
                    setActiveSubcategory(null);
                    setIsServiceModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#1D68D8] text-[#1D68D8] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer bg-white"
                >
                  <Plus size={16} />
                  <span>Adicionar categoria de serviço</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* ================= CARD 6: Onde presta serviços (Optional Accordion) ================= */}
        {(role === "prestador" || role === "ambos") && (
          <section className="bg-white rounded-[24px] border border-slate-100 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenDistricts(!openDistricts)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#EBF3FF] text-[#1D68D8] flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Onde presta serviços</h3>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      Opcional
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Distritos de atendimento</p>
                </div>
              </div>
              <div className="text-slate-400">
                {openDistricts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {openDistricts && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {DISTRICTS_LIST.map((dist) => {
                    const isSelected = selectedDistricts.includes(dist);
                    return (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDistricts((p) => p.filter((d) => d !== dist));
                          } else {
                            setSelectedDistricts((p) => [...p, dist]);
                          }
                        }}
                        className={cn(
                          "px-4 py-2.5 rounded-full text-sm font-semibold border transition cursor-pointer shadow-2xs",
                          isSelected
                            ? "border-slate-300 bg-white text-slate-900 font-bold"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                        )}
                      >
                        {dist}
                      </button>
                    );
                  })}
                </div>

                {/* Raio de atendimento Dropdown Field */}
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-bold text-slate-900">Raio de atendimento</label>
                  <button
                    type="button"
                    onClick={() => setIsRadiusModalOpen(true)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 flex items-center justify-between text-base font-medium text-slate-900 shadow-2xs hover:border-slate-300 transition cursor-pointer"
                  >
                    <span>{radiusOption}</span>
                    <ChevronDown size={20} className="text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================= CARD 7: Disponibilidade (Optional Accordion) ================= */}
        {(role === "prestador" || role === "ambos") && (
          <section className="bg-white rounded-[24px] border border-slate-100 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenAvailability(!openAvailability)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#EBF3FF] text-[#1D68D8] flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Disponibilidade</h3>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      Opcional
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-[240px]">
                    {getScheduleSummary()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <div className="text-slate-400">
                  {openAvailability ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </button>

            {openAvailability && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                {/* Description info text */}
                <p className="text-xs text-slate-500 leading-relaxed">
                  Defina o horário de cada dia. Pode ter vários períodos (ex.: manhã 08:00–12:00 e
                  tarde 14:00–18:00) e usar "Aplicar a todos" para repetir o mesmo horário na
                  semana.
                </p>

                {/* Day Schedule Cards */}
                <div
                  className={cn(
                    "space-y-3 transition-opacity duration-200",
                    configureLater && "opacity-40 pointer-events-none select-none grayscale-[25%]",
                  )}
                >
                  {schedule.map((day) => (
                    <div
                      key={day.id}
                      className={cn(
                        "rounded-[20px] border p-4 transition-all space-y-3",
                        day.enabled
                          ? "border-slate-200 bg-white"
                          : "border-slate-100 bg-slate-50/50",
                      )}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleDay(day.id)}
                            className={cn(
                              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              day.enabled ? "bg-emerald-500" : "bg-slate-200",
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                day.enabled ? "translate-x-5" : "translate-x-0",
                              )}
                            />
                          </button>

                          <span className="text-sm font-bold text-slate-900">{day.name}</span>
                        </div>

                        {day.enabled ? (
                          <button
                            type="button"
                            onClick={() => handleApplyToAll(day.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#1D68D8] hover:underline cursor-pointer"
                          >
                            <Copy size={13} />
                            <span>Aplicar a todos</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Indisponível</span>
                        )}
                      </div>

                      {/* Day Periods */}
                      {day.enabled && (
                        <div className="space-y-2.5 pt-1">
                          {day.periods.map((period) => (
                            <div key={period.id} className="flex items-center gap-2">
                              {/* Start Time Picker */}
                              <div className="relative flex-1">
                                <select
                                  value={period.start ?? ""}
                                  onChange={(e) =>
                                    handleUpdatePeriod(day.id, period.id, "start", e.target.value)
                                  }
                                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-900 outline-none focus:border-[#1D68D8] transition shadow-2xs"
                                >
                                  {TIME_SLOTS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={16}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                              </div>

                              <span className="text-xs font-medium text-slate-500">até</span>

                              {/* End Time Picker */}
                              <div className="relative flex-1">
                                <select
                                  value={period.end ?? ""}
                                  onChange={(e) =>
                                    handleUpdatePeriod(day.id, period.id, "end", e.target.value)
                                  }
                                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-900 outline-none focus:border-[#1D68D8] transition shadow-2xs"
                                >
                                  {TIME_SLOTS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={16}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                              </div>

                              {/* Remove Slot Button */}
                              <button
                                type="button"
                                onClick={() => handleRemovePeriod(day.id, period.id)}
                                className="size-9 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition cursor-pointer shrink-0"
                              >
                                <X size={16} className="text-red-500" />
                              </button>
                            </div>
                          ))}

                          {/* Add Period Link */}
                          <button
                            type="button"
                            onClick={() => handleAddPeriod(day.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#1D68D8] hover:underline cursor-pointer pt-1"
                          >
                            <Plus size={14} />
                            <span>Adicionar período (ex.: manhã e tarde)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Configurar depois checkbox */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <div
                      className={cn(
                        "size-5 rounded-md flex items-center justify-center border transition-colors shrink-0",
                        configureLater
                          ? "bg-[#1D68D8] border-[#1D68D8] text-white"
                          : "border-slate-300 bg-white group-hover:border-slate-400",
                      )}
                    >
                      {configureLater && <Check size={13} className="stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={configureLater}
                      onChange={(e) => setConfigureLater(e.target.checked)}
                      className="sr-only"
                    />
                    <Calendar size={16} className="text-slate-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">Configurar depois</span>
                  </label>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================= CARD 8: Verificação de identidade (Accordion) ================= */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenIdentity(!openIdentity)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#EBF3FF] text-[#1D68D8] flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Verificação de identidade</h3>
                <p className="text-xs text-slate-500">Foto do documento (frente e verso)</p>
              </div>
            </div>
            <div className="text-slate-400">
              {openIdentity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {openIdentity && (
            <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Envie o seu documento para confirmarmos a sua identidade. Os outros utilizadores só
                veem um selo de verificado — nunca os seus documentos.
              </p>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Documento de identidade (BI ou passaporte){" "}
                    <span className="text-red-500">*</span>
                  </h4>
                  <p className="text-xs text-slate-500">Fotografe o documento</p>
                </div>

                {/* Foto da frente */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">
                    Foto da frente <span className="text-red-500">*</span>
                  </label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-[#1D68D8] transition cursor-pointer text-center">
                    <CloudUpload size={28} className="text-[#1D68D8] mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">
                      {frontDocName || "Clique ou arraste a fotografia"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFrontUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                    <ShieldCheck size={13} className="text-slate-400 shrink-0" />
                    <span>Documento seguro e privado — nunca guardado no dispositivo.</span>
                  </p>
                </div>

                {/* Foto do verso */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-900">
                    Foto do verso <span className="text-red-500">*</span>
                  </label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-[#1D68D8] transition cursor-pointer text-center">
                    <CloudUpload size={28} className="text-[#1D68D8] mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">
                      {backDocName || "Clique ou arraste a fotografia"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                    <ShieldCheck size={13} className="text-slate-400 shrink-0" />
                    <span>Documento seguro e privado — nunca guardado no dispositivo.</span>
                  </p>
                </div>
              </div>

              {/* Registo comercial da empresa (only when proType is empresa) */}
              {proType === "empresa" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Registo comercial da empresa <span className="text-red-500">*</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Envie o ficheiro em PDF (documento de constituição ou NIF)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900">
                      Ficheiro <span className="text-red-500">*</span>
                    </label>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-[#1D68D8] transition cursor-pointer text-center">
                      <CloudUpload size={28} className="text-[#1D68D8] mb-1.5" />
                      <span className="text-xs font-semibold text-slate-700">
                        {companyDocName || "PDF ou documento Word (máx. 8MB)"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCompanyDocUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                      <ShieldCheck size={13} className="text-slate-400 shrink-0" />
                      <span>Documento seguro e privado — nunca guardado no dispositivo.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ================= CARD 9: TERMS & SUBMIT BUTTON ================= */}
        <section className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-2xs space-y-4">
          {!isEditMode && (
            <div className="space-y-2.5">
              {/* Termos de Utilização */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="size-5 rounded border-slate-300 text-[#1D68D8] focus:ring-[#1D68D8] transition-all"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Aceito os{" "}
                  <Link to="/termos" className="text-[#1D68D8] font-bold underline">
                    Termos de Utilização
                  </Link>
                  .
                </span>
              </label>

              {/* Política de Privacidade */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="size-5 rounded border-slate-300 text-[#1D68D8] focus:ring-[#1D68D8] transition-all"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Aceito a{" "}
                  <Link to="/privacidade" className="text-[#1D68D8] font-bold underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#1D68D8] hover:bg-[#1859BA] text-white font-bold h-14 rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-60"
          >
            {isEditMode ? (
              <>
                <Check size={20} />
                <span>{submitting ? "A guardar alterações..." : "Guardar alterações"}</span>
              </>
            ) : role === "cliente" ? (
              <>
                <User size={20} />
                <span>{submitting ? "A processar..." : "Criar conta de Cliente"}</span>
              </>
            ) : (
              <>
                <Users size={20} />
                <span>{submitting ? "A processar..." : "Enviar perfil para verificação"}</span>
              </>
            )}
          </button>

          {/* Footer link */}
          <div className="text-center text-xs text-slate-500 pt-1">
            {isEditMode ? (
              <button
                type="button"
                onClick={() => navigate({ to: "/perfil" })}
                className="font-bold text-[#1D68D8] hover:underline"
              >
                Voltar ao perfil sem guardar
              </button>
            ) : (
              <>
                Já tem conta?{" "}
                <Link to="/login" className="font-bold text-[#1D68D8] hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      {/* ================= BOTTOM SHEET MODAL (Screenshots 7, 8, 9, 10) ================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[28px] max-h-[88vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {/* Modal Drag Handle Bar */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Modal Body Container */}
            <div className="px-5 pt-2 pb-4 overflow-y-auto flex-1 space-y-4">
              {/* STEP 1: Escolha a categoria (Screenshots 7 & 10) */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Escolha a categoria</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Se não encontrar a sua área, escolha "Outro" e escreva.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {CATEGORIES_DATA.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-[#1D68D8] bg-white text-left transition cursor-pointer active:scale-[0.99]"
                      >
                        <span className="text-xl shrink-0">{cat.icon}</span>
                        <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                      </button>
                    ))}

                    {/* Special Dashed Card for Outro (Screenshot 10) */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-[#1D68D8]/40 bg-[#F0F6FF]/30 space-y-3 mt-2">
                      <div className="flex items-center gap-2 text-[#1D68D8] font-bold text-xs">
                        <Plus size={16} />
                        <span>Outro — escreva a sua área</span>
                      </div>
                      <input
                        type="text"
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        placeholder="Ex.: Serralharia"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#1D68D8]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="w-full bg-[#94B8F7] hover:bg-[#1D68D8] text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Escolha a subcategoria (Screenshot 8) */}
              {modalStep === 2 && activeCategory && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Escolha a subcategoria</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{activeCategory.name}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="text-xs font-bold text-[#1D68D8] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    ← Voltar
                  </button>

                  <div className="space-y-2.5">
                    {activeCategory.subcategories.map((subcat) => (
                      <button
                        key={subcat.name}
                        type="button"
                        onClick={() => handleSelectSubcategory(subcat)}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-[#1D68D8] bg-white text-left transition cursor-pointer active:scale-[0.99]"
                      >
                        <span className="text-sm font-bold text-slate-900">{subcat.name}</span>
                        <span className="text-xs font-medium text-slate-500">
                          {subcat.servicesCount} serviços
                        </span>
                      </button>
                    ))}

                    {/* Special Dashed Card for Outro subcategory (Screenshot 8) */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-[#1D68D8]/40 bg-[#F0F6FF]/30 space-y-3 mt-2">
                      <div className="flex items-center gap-2 text-[#1D68D8] font-bold text-xs">
                        <Plus size={16} />
                        <span>Outro — escreva a subcategoria</span>
                      </div>
                      <input
                        type="text"
                        value={customSubcatInput}
                        onChange={(e) => setCustomSubcatInput(e.target.value)}
                        placeholder="Ex.: Portões automáticos"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#1D68D8]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSubcategory}
                        className="w-full bg-[#94B8F7] hover:bg-[#1D68D8] text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Escolha os serviços (Screenshot 9) */}
              {modalStep === 3 && activeCategory && activeSubcategory && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Escolha os serviços</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCategory.name} · {activeSubcategory.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="text-xs font-bold text-[#1D68D8] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    ← Voltar
                  </button>

                  <div className="space-y-2.5">
                    {activeSubcategory.services.map((servName) => {
                      const isSelected = selectedServices.some(
                        (s) =>
                          s.category === activeCategory.name &&
                          s.subcategory === activeSubcategory.name &&
                          s.name === servName,
                      );

                      return (
                        <button
                          key={servName}
                          type="button"
                          onClick={() => handleToggleServiceSelection(servName)}
                          className={cn(
                            "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition cursor-pointer",
                            isSelected
                              ? "border-[#1D68D8] bg-[#F0F6FF] text-[#1D68D8]"
                              : "border-slate-200 bg-white text-slate-900 hover:border-slate-300",
                          )}
                        >
                          <span className="text-sm font-bold">{servName}</span>
                          {isSelected && <Check size={18} className="text-[#1D68D8] stroke-[3]" />}
                        </button>
                      );
                    })}

                    {/* Special Dashed Card for Outro service (Screenshot 9) */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-[#1D68D8]/40 bg-[#F0F6FF]/30 space-y-3 mt-2">
                      <div className="flex items-center gap-2 text-[#1D68D8] font-bold text-xs">
                        <Plus size={16} />
                        <span>Outro — escreva o serviço que faz</span>
                      </div>
                      <input
                        type="text"
                        value={customServiceInput}
                        onChange={(e) => setCustomServiceInput(e.target.value)}
                        placeholder="Ex.: Montagem de portão de alumínio"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#1D68D8]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomService}
                        className="w-full bg-[#94B8F7] hover:bg-[#1D68D8] text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Adicionar serviço
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Sticky Bar */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="w-full bg-[#1D68D8] hover:bg-[#1859BA] text-white font-bold h-12 rounded-2xl text-sm transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                Concluir ({selectedServices.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SELECIONAR PAÍS / INDICATIVO ================= */}
      {countryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setCountryModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
            {/* Header do Modal */}
            <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Selecionar País / Indicativo</h3>
                <p className="text-xs text-slate-500">
                  Escolha o país correspondente ao seu número
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCountryModalOpen(false)}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70">
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar país ou indicativo (+239, +351, Portugal...)"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1D68D8] focus:ring-2 focus:ring-[#1D68D8]/20 transition"
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Países */}
            <div className="overflow-y-auto divide-y divide-slate-100 p-2 flex-1">
              {COUNTRIES.filter((c) => {
                const q = countrySearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  c.name.toLowerCase().includes(q) ||
                  c.code.includes(q) ||
                  c.iso.toLowerCase().includes(q)
                );
              }).length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhum país encontrado para "{countrySearch}"
                </div>
              ) : (
                COUNTRIES.filter((c) => {
                  const q = countrySearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.code.includes(q) ||
                    c.iso.toLowerCase().includes(q)
                  );
                }).map((country) => {
                  const isSelected =
                    selectedCountry.code === country.code && selectedCountry.iso === country.iso;
                  return (
                    <button
                      key={`${country.iso}-${country.code}`}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 text-left rounded-xl transition cursor-pointer mb-0.5",
                        isSelected
                          ? "bg-blue-50 text-blue-800 font-semibold shadow-2xs"
                          : "hover:bg-slate-50 text-slate-800",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{country.flag}</span>
                        <div>
                          <div className="text-sm font-medium leading-snug">{country.name}</div>
                          <div className="text-xs text-slate-500 font-normal">
                            Exemplo: {country.code} {country.placeholder}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          {country.code}
                        </span>
                        {isSelected && <Check size={16} className="text-[#1D68D8]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RAIO DE ATENDIMENTO (Cloned from Screenshot 2) ================= */}
      {isRadiusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setIsRadiusModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="py-2">
              {RADIUS_OPTIONS.map((opt) => {
                const isSelected = radiusOption === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setRadiusOption(opt);
                      setIsRadiusModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition text-left cursor-pointer"
                  >
                    <span className="text-lg font-normal text-slate-900">{opt}</span>
                    <div
                      className={cn(
                        "size-6 rounded-full border-2 flex items-center justify-center transition shrink-0",
                        isSelected ? "border-[#1D68D8] bg-white" : "border-slate-300 bg-white",
                      )}
                    >
                      {isSelected && <div className="size-3 rounded-full bg-[#1D68D8]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUCESSO DE REGISTO + REDIRECIONAMENTO WHATSAPP ================= */}
      {registrationSuccessModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="size-16 rounded-full bg-emerald-100 text-emerald-800 dark:text-emerald-300 grid place-items-center mx-auto text-2xl font-bold">
              ✓
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">Bem-vindo ao KONEKTA STP!</h2>
              <p className="text-xs text-slate-600">
                A sua conta foi criada com sucesso no maior ecossistema de serviços de São Tomé e
                Príncipe.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-xs mt-0.5">🔔</span>
                <p className="text-[11px] text-slate-700">
                  <strong>Notificações Automáticas:</strong> Receberá avisos instantâneos por
                  WhatsApp, SMS e no telemóvel quando houver novos pedidos ou orçamentos.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-xs mt-0.5">🔒</span>
                <p className="text-[11px] text-slate-700">
                  <strong>Ecossistema 100% Protegido:</strong> Todas as negociações e pagamentos são
                  garantidos internamente no KONEKTA para a sua total segurança.
                </p>
              </div>
            </div>

            {/* Aderir ao Grupo Oficial WhatsApp KONEKTA */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-slate-900">
                {registrationSuccessModal.role === "prestador" ||
                registrationSuccessModal.role === "ambos"
                  ? "Entre no Grupo Oficial dos Prestadores KONEKTA:"
                  : "Entre no Grupo Oficial dos Clientes KONEKTA:"}
              </p>

              <a
                href={
                  registrationSuccessModal.role === "prestador" ||
                  registrationSuccessModal.role === "ambos"
                    ? platformConfig.providerWhatsappGroup ||
                      "https://chat.whatsapp.com/KONEKTA-Prestadores-STP"
                    : platformConfig.clientWhatsappGroup ||
                      "https://chat.whatsapp.com/KONEKTA-Clientes-STP"
                }
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
              >
                <span>💬 Entrar no Grupo WhatsApp do KONEKTA</span>
              </a>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] text-slate-500 mb-2">
                WhatsApp Oficial:{" "}
                <strong>{platformConfig.officialWhatsapp || "+239 9944747"}</strong> · Suporte:{" "}
                <strong>{platformConfig.officialEmail || "edeleydamiao@gmail.com"}</strong>
              </p>

              <button
                type="button"
                onClick={() => {
                  setRegistrationSuccessModal({ isOpen: false, role: "cliente" });
                  navigate({
                    to: registrationSuccessModal.role === "prestador" ? "/pro" : "/",
                    replace: true,
                  });
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition"
              >
                Continuar para a Aplicação →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
