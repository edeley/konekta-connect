import { forwardRef, useId, useState, useMemo } from "react";
import { AlertCircle, ChevronDown, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES, DEFAULT_COUNTRY, Country } from "@/lib/countries";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type PhoneInputProps = {
  /** Apenas os dígitos do número de telemóvel sem o indicativo do país. */
  value: string;
  onChange: (digits: string, country: Country) => void;
  selectedCountry?: Country;
  onCountryChange?: (country: Country) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
  showHelper?: boolean;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    value,
    onChange,
    selectedCountry = DEFAULT_COUNTRY,
    onCountryChange,
    error,
    disabled,
    label = "Número de telemóvel",
    autoFocus,
    showHelper = true,
  },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const maxDigits = selectedCountry.digitsMax || selectedCountry.digits;
  const cleanDigits = value.replace(/\D/g, "").slice(0, maxDigits);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.includes(q) || c.iso.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const handleCountrySelect = (country: Country) => {
    onCountryChange?.(country);
    // Re-format current digits if needed
    const newMax = country.digitsMax || country.digits;
    const truncated = cleanDigits.slice(0, newMax);
    onChange(truncated, country);
    setCountryModalOpen(false);
    setSearchQuery("");
  };

  const handleInputChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, maxDigits);
    onChange(digits, selectedCountry);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted) {
      e.preventDefault();
      // Remove any country code match if pasted with prefix
      let clean = pasted.trim();
      for (const c of COUNTRIES) {
        if (clean.startsWith(c.code)) {
          clean = clean.slice(c.code.length).trim();
          onCountryChange?.(c);
          break;
        }
      }
      clean = clean.replace(/\D/g, "").slice(0, maxDigits);
      onChange(clean, selectedCountry);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-900 flex items-center justify-between"
        >
          <span>
            {label} <span className="text-red-500">*</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">{selectedCountry.name}</span>
        </label>
      )}

      <div
        className={cn(
          "relative flex items-center rounded-2xl border bg-white p-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500/20",
          error
            ? "border-red-500 focus-within:border-red-500"
            : "border-slate-200 focus-within:border-blue-500",
          disabled && "opacity-60 pointer-events-none bg-slate-50",
        )}
      >
        {/* Seletor de País / Indicativo */}
        <button
          type="button"
          onClick={() => setCountryModalOpen(true)}
          disabled={disabled}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-800 shrink-0 select-none transition-colors cursor-pointer"
          title="Selecionar país do indicativo"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="font-semibold text-slate-800">{selectedCountry.code}</span>
          <ChevronDown size={14} className="text-slate-500 ml-0.5" />
        </button>

        {/* Campo de Entrada Numérica */}
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={selectedCountry.placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          value={selectedCountry.format(cleanDigits)}
          onChange={(e) => handleInputChange(e.target.value)}
          onPaste={handlePaste}
          className="w-full bg-transparent px-3 py-2 text-base font-bold text-slate-900 outline-none tracking-wider placeholder:text-slate-400 placeholder:font-normal"
        />

        {/* Botão de Limpar */}
        {cleanDigits.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange("", selectedCountry)}
            className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mr-1 transition-colors cursor-pointer"
            title="Limpar número"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dica do formato e exemplo */}
      {showHelper && !error && (
        <p className="text-[11px] text-slate-500 font-medium">
          Exemplo:{" "}
          <span className="font-semibold text-slate-700">
            {selectedCountry.code} {selectedCountry.placeholder}
          </span>{" "}
          ({selectedCountry.name})
        </p>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-red-600 font-medium"
        >
          <AlertCircle size={13} aria-hidden="true" /> {error}
        </p>
      )}

      {/* Modal / Diálogo de Seleção de País */}
      <Dialog open={countryModalOpen} onOpenChange={setCountryModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl bg-white">
          <DialogHeader className="p-4 pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-bold text-slate-900">
              Selecionar País / Indicativo
            </DialogTitle>
          </DialogHeader>

          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar país ou indicativo (+239, +351...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum país encontrado para "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected =
                  selectedCountry.code === country.code && selectedCountry.iso === country.iso;
                return (
                  <button
                    key={`${country.iso}-${country.code}`}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50/60 rounded-xl transition cursor-pointer",
                      isSelected && "bg-blue-50 text-blue-700 font-semibold",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{country.flag}</span>
                      <div>
                        <div className="text-sm text-slate-900 font-medium leading-snug">
                          {country.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Exemplo: {country.code} {country.placeholder}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {country.code}
                      </span>
                      {isSelected && <Check size={16} className="text-blue-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
