import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Key, X, ChevronDown, Search, Check } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authFlow } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";
import { COUNTRIES, DEFAULT_COUNTRY, Country } from "@/lib/countries";

export const Route = createFileRoute("/recover-access")({
  head: () => ({
    meta: [
      { title: "Recuperar acesso — KONEKTA" },
      {
        name: "description",
        content:
          "Perdeu o acesso à sua conta KONEKTA? Introduza o seu número de telemóvel e receba um código de verificação para criar uma nova palavra-passe.",
      },
      { property: "og:title", content: "Recuperar acesso — KONEKTA" },
      {
        property: "og:description",
        content: "Receba um código e recupere a sua conta em minutos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoverAccessPage,
});

function RecoverAccessPage() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const minDigits = selectedCountry.digitsMin || selectedCountry.digits;
  const maxDigits = selectedCountry.digitsMax || selectedCountry.digits;

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, maxDigits);
    setPhone(clean);
    if (error) setError(undefined);
  };

  const handleCountrySelect = (c: Country) => {
    setSelectedCountry(c);
    const maxD = c.digitsMax || c.digits;
    setPhone((prev) => prev.slice(0, maxD));
    setCountryModalOpen(false);
    setCountrySearch("");
    if (error) setError(undefined);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = phone.replace(/\D/g, "");
    if (!rawDigits || rawDigits.length < minDigits || rawDigits.length > maxDigits) {
      setError(
        `Insira um número válido para ${selectedCountry.name} (${selectedCountry.digits} dígitos, ex: ${selectedCountry.placeholder})`,
      );
      return;
    }
    const fullPhone = `${selectedCountry.code} ${selectedCountry.format(rawDigits)}`;
    setError(undefined);
    setLoading(true);
    authFlow.setPhone(fullPhone);
    authFlow.setRecovery("phone", fullPhone);
    setTimeout(() => {
      setLoading(false);
      toast.success("Código enviado por SMS para o seu contacto!");
      navigate({ to: "/verify-otp" });
    }, 800);
  };

  const digitsOnly = phone.replace(/\D/g, "");
  const isValid = digitsOnly.length >= minDigits;

  return (
    <AuthLayout back showLogo>
      <div className="flex flex-col items-center text-center">
        {/* Key Icon in soft blue circle */}
        <div className="grid size-16 place-items-center rounded-2xl bg-blue-50 text-[#1D68D8] dark:bg-blue-950/40 dark:text-blue-400">
          <Key size={28} aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Recuperar acesso</h1>
        <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
          Enviaremos um código de verificação para o seu telemóvel.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">
              Telemóvel <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {selectedCountry.name} ({selectedCountry.code})
            </span>
          </div>
          <div
            className={cn(
              "flex items-center overflow-hidden rounded-2xl border bg-card focus-within:ring-2 focus-within:ring-primary/40 transition-all",
              error ? "border-destructive" : "border-primary",
            )}
          >
            <button
              type="button"
              onClick={() => setCountryModalOpen(true)}
              className="flex select-none items-center gap-1.5 bg-muted hover:bg-muted/80 px-3 py-3 text-xs font-bold text-foreground border-r border-border/60 cursor-pointer transition"
              title="Alterar país ou indicativo"
            >
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
              <ChevronDown size={13} className="text-muted-foreground ml-0.5" />
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
                  const maxD = selectedCountry.digitsMax || selectedCountry.digits;
                  clean = clean.replace(/\D/g, "").slice(0, maxD);
                  setPhone(clean);
                  if (error) setError(undefined);
                  toast.success("Contacto colado!");
                }
              }}
              placeholder={selectedCountry.placeholder}
              autoFocus
              className="w-full bg-transparent px-3 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground/60 tracking-wider"
            />
            {phone.length > 0 && (
              <button
                type="button"
                onClick={() => setPhone("")}
                className="size-7 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center mr-2 shrink-0 transition-colors cursor-pointer"
                title="Limpar"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <p className="text-[11px] text-muted-foreground">
            Exemplo: {selectedCountry.code} {selectedCountry.placeholder}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "A enviar..." : "Enviar código"}
        </button>
      </form>

      {/* Modal de seleção de país */}
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
                  Escolha o país do seu telemóvel para recuperação
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
                  placeholder="Pesquisar país ou indicativo..."
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
    </AuthLayout>
  );
}
