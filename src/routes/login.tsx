import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { store } from "@/lib/store";
import { Smartphone, Mail, X, ChevronDown, Search, Check, Eye, EyeOff } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, Country } from "@/lib/countries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar na KONEKTA — Serviços em São Tomé e Príncipe" },
      {
        name: "description",
        content:
          "Entre na sua conta KONEKTA com email ou telefone e contrate profissionais verificados em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Entrar na KONEKTA" },
      { property: "og:description", content: "Acesso rápido à sua conta de cliente ou prestador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-xs">
        K
      </span>
      <div className="leading-tight">
        <p className="text-base font-extrabold tracking-tight text-primary">KONEKTA STP</p>
        <p className="text-xs text-muted-foreground">Conectamos quem precisa a quem sabe fazer</p>
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (val: string) => {
    const maxDigits = selectedCountry.digitsMax || selectedCountry.digits;
    const clean = val.replace(/\D/g, "").slice(0, maxDigits);
    setPhone(clean);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    const maxDigits = country.digitsMax || country.digits;
    setPhone((prev) => prev.slice(0, maxDigits));
    setCountryModalOpen(false);
    setCountrySearch("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "phone") {
      const rawDigits = phone.replace(/\D/g, "");
      const minDigits = selectedCountry.digitsMin || selectedCountry.digits;
      const maxDigits = selectedCountry.digitsMax || selectedCountry.digits;

      if (!rawDigits || rawDigits.length < minDigits || rawDigits.length > maxDigits) {
        toast.error(
          `Insira o número de telemóvel para ${selectedCountry.name} (${selectedCountry.digits} dígitos, ex: ${selectedCountry.placeholder}).`,
        );
        return;
      }
    } else {
      if (!email.trim() || !email.includes("@")) {
        toast.error("Insira um endereço de email válido.");
        return;
      }
    }

    if (pass.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const fullPhone = `${selectedCountry.code} ${selectedCountry.format(phone)}`;
      store.signIn({
        phone: method === "phone" ? fullPhone : undefined,
        email: method === "email" ? email.trim() : undefined,
        name:
          method === "email" ? email.split("@")[0] : `Utilizador ${phone.slice(-4) || "KONEKTA"}`,
        password: pass,
        role: "cliente",
      });
      store.markOnboarded();
      setLoading(false);
      navigate({ to: "/" });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-md px-6 pb-16 pt-10 md:max-w-lg">
        <BrandMark />

        <div className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bem-vindo!</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Entre na sua conta de cliente.</p>
        </div>

        {/* Escolha entre Telemóvel ou Email */}
        <div className="mt-8">
          <p className="text-xs font-semibold text-foreground mb-2">Entrar com:</p>
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-muted rounded-2xl">
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                method === "phone"
                  ? "bg-white dark:bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone size={15} />
              Telemóvel
            </button>
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                method === "email"
                  ? "bg-white dark:bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail size={15} />
              Email
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-5">
          {method === "phone" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Número de telemóvel</label>
                <span className="text-[11px] text-muted-foreground">{selectedCountry.name}</span>
              </div>
              <div className="flex items-center overflow-hidden rounded-2xl border border-border/80 bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 transition">
                <button
                  type="button"
                  onClick={() => setCountryModalOpen(true)}
                  className="flex items-center gap-1.5 bg-muted/60 hover:bg-muted px-3 py-3.5 text-xs font-bold text-foreground border-r border-border/60 select-none shrink-0 cursor-pointer transition"
                  title="Alterar país ou indicativo"
                >
                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                  <span>{selectedCountry.code}</span>
                  <ChevronDown size={13} className="text-muted-foreground ml-0.5" />
                </button>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder={selectedCountry.placeholder}
                  value={selectedCountry.format(phone)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent px-3.5 py-3.5 text-sm font-semibold tracking-wider outline-none text-foreground placeholder:text-muted-foreground/60"
                />
                {phone.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhone("")}
                    className="size-7 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground flex items-center justify-center mr-2 shrink-0 transition cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Exemplo: {selectedCountry.code} {selectedCountry.placeholder}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Endereço de email</label>
              <input
                type="email"
                placeholder="seu.nome@exemplo.st"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Senha</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3.5 pr-11 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1 cursor-pointer"
                title={showPass ? "Ocultar senha" : "Ver senha"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="text-right pt-0.5">
            <Link
              to="/recover-access"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/registro" className="font-bold text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>

      {/* Modal de Seleção de País no Login */}
      {countryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setCountryModalOpen(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
            <div className="p-4 pb-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Selecionar País / Indicativo
                </h3>
                <p className="text-xs text-muted-foreground">
                  Escolha o país do seu número de telemóvel
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCountryModalOpen(false)}
                className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 border-b border-border bg-muted/40">
              <div className="relative flex items-center">
                <Search
                  size={16}
                  className="absolute left-3 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Pesquisar país ou indicativo (+239, +351...)"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch("")}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-border/60 p-2 flex-1">
              {COUNTRIES.filter((c) => {
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
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted/70 text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{country.flag}</span>
                      <div>
                        <div className="text-sm font-medium leading-snug">{country.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          Exemplo: {country.code} {country.placeholder}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded-md">
                        {country.code}
                      </span>
                      {isSelected && <Check size={16} className="text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
