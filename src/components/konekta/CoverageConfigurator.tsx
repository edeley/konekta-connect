import { useState, useMemo } from "react";
import {
  MapPin,
  Check,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Compass,
} from "lucide-react";
import { type ProviderCoverage } from "@/types/provider-profile";
import {
  STP_DISTRICTS_DETAILED,
  STP_ALL_LOCALITIES,
  STP_DISTRICT_NAMES,
  type StpDistrictDetail,
} from "@/lib/stp-locations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CoverageConfiguratorProps {
  initialCoverage?: ProviderCoverage;
  onSave?: (coverage: ProviderCoverage) => void;
  className?: string;
  isReadOnly?: boolean;
}

export function CoverageConfigurator({
  initialCoverage,
  onSave,
  className,
  isReadOnly = false,
}: CoverageConfiguratorProps) {
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(() => {
    if (initialCoverage?.districts && initialCoverage.districts.length > 0) {
      return initialCoverage.districts;
    }
    return ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata"];
  });

  const [selectedLocalities, setSelectedLocalities] = useState<Record<string, string[]>>(() => {
    if (initialCoverage?.zonesByDistrict) {
      return initialCoverage.zonesByDistrict;
    }
    // Default: all localities of default selected districts
    const initial: Record<string, string[]> = {};
    ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata"].forEach((dist) => {
      initial[dist] = STP_ALL_LOCALITIES[dist] ? [...STP_ALL_LOCALITIES[dist]] : [];
    });
    return initial;
  });

  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({
    "Água Grande": true,
  });
  const [searchFilter, setSearchFilter] = useState("");

  const toggleExpand = (districtName: string) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [districtName]: !prev[districtName],
    }));
  };

  const toggleDistrict = (districtName: string) => {
    if (isReadOnly) return;
    if (selectedDistricts.includes(districtName)) {
      if (selectedDistricts.length === 1) {
        toast.error("Deve manter pelo menos 1 distrito selecionado.");
        return;
      }
      setSelectedDistricts(selectedDistricts.filter((d) => d !== districtName));
      const nextLocs = { ...selectedLocalities };
      delete nextLocs[districtName];
      setSelectedLocalities(nextLocs);
    } else {
      setSelectedDistricts([...selectedDistricts, districtName]);
      setSelectedLocalities({
        ...selectedLocalities,
        [districtName]: STP_ALL_LOCALITIES[districtName]
          ? [...STP_ALL_LOCALITIES[districtName]]
          : [],
      });
      setExpandedDistricts((prev) => ({ ...prev, [districtName]: true }));
    }
  };

  const toggleLocality = (districtName: string, locality: string) => {
    if (isReadOnly) return;
    const currentLocs = selectedLocalities[districtName] || [];
    if (currentLocs.includes(locality)) {
      setSelectedLocalities({
        ...selectedLocalities,
        [districtName]: currentLocs.filter((l) => l !== locality),
      });
    } else {
      setSelectedLocalities({
        ...selectedLocalities,
        [districtName]: [...currentLocs, locality],
      });
    }
  };

  const toggleGroupLocalities = (districtName: string, groupZones: string[]) => {
    if (isReadOnly) return;
    const currentLocs = selectedLocalities[districtName] || [];
    const allInGroupSelected = groupZones.every((z) => currentLocs.includes(z));

    if (allInGroupSelected) {
      // Remove all in this group
      setSelectedLocalities({
        ...selectedLocalities,
        [districtName]: currentLocs.filter((z) => !groupZones.includes(z)),
      });
    } else {
      // Add all missing in this group
      const combined = Array.from(new Set([...currentLocs, ...groupZones]));
      setSelectedLocalities({
        ...selectedLocalities,
        [districtName]: combined,
      });
    }
  };

  const handleSelectAllSTP = () => {
    if (isReadOnly) return;
    if (selectedDistricts.length === STP_DISTRICTS_DETAILED.length) {
      setSelectedDistricts(["Água Grande"]);
      setSelectedLocalities({ "Água Grande": [...(STP_ALL_LOCALITIES["Água Grande"] || [])] });
      setExpandedDistrict("Água Grande");
    } else {
      const allNames = STP_DISTRICTS_DETAILED.map((d) => d.name);
      setSelectedDistricts(allNames);
      const allLocs: Record<string, string[]> = {};
      allNames.forEach((d) => {
        allLocs[d] = STP_ALL_LOCALITIES[d] ? [...STP_ALL_LOCALITIES[d]] : [];
      });
      setSelectedLocalities(allLocs);
    }
  };

  const handleSave = () => {
    const allFlatLocalities = Object.values(selectedLocalities).flat();
    const payload: ProviderCoverage = {
      districts: selectedDistricts,
      localities: allFlatLocalities,
      zonesByDistrict: selectedLocalities,
      baseAddress: "São Tomé e Príncipe",
      radiusKm: 20,
    };
    if (onSave) onSave(payload);
    toast.success(
      `Locais de atendimento atualizados com sucesso (${selectedDistricts.length} distritos e ${allFlatLocalities.length} locais)!`,
    );
  };

  const totalLocalitiesCount = useMemo(() => {
    return Object.values(selectedLocalities).reduce((acc, list) => acc + (list?.length || 0), 0);
  }, [selectedLocalities]);

  const filteredDistricts = useMemo(() => {
    if (!searchFilter.trim()) return STP_DISTRICTS_DETAILED;
    const q = searchFilter.toLowerCase();
    return STP_DISTRICTS_DETAILED.filter((d) => {
      if (d.name.toLowerCase().includes(q)) return true;
      if (d.capital.toLowerCase().includes(q)) return true;
      const allZones = d.groups.flatMap((g) => g.zones);
      return allZones.some((z) => z.toLowerCase().includes(q));
    });
  }, [searchFilter]);

  // Agrupamento por Ilha / Região
  const saoTomeDistricts = filteredDistricts.filter((d) => d.region === "Ilha de São Tomé");
  const principeDistricts = filteredDistricts.filter(
    (d) => d.region === "Ilha e Região Autónoma do Príncipe",
  );

  const renderDistrictCard = (district: StpDistrictDetail) => {
    const isSelected = selectedDistricts.includes(district.name);
    const allDistrictZones = STP_ALL_LOCALITIES[district.name] || [];
    const currentDistrictLocs = selectedLocalities[district.name] || [];
    const isExpanded = Boolean(expandedDistricts[district.name]);

    if (isReadOnly && !isSelected) return null;

    return (
      <div
        key={district.id}
        className={cn(
          "rounded-2xl border transition-all overflow-hidden",
          isSelected
            ? "bg-card border-primary/30 shadow-2xs"
            : "bg-muted/20 border-border opacity-70 hover:opacity-100",
        )}
      >
        {/* CABEÇALHO DO DISTRITO */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => toggleDistrict(district.name)}
                className={cn(
                  "size-5 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer",
                  isSelected
                    ? "bg-primary border-primary text-white shadow-2xs"
                    : "border-muted-foreground/40 bg-card hover:border-primary",
                )}
              >
                {isSelected && <Check size={13} className="stroke-[3]" />}
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-xs font-bold",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {district.name}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                  <Compass size={11} className="text-primary/70" />
                  Sede: {district.capital}
                </span>
                {isSelected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {currentDistrictLocs.length} de {allDistrictZones.length} locais
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {district.description}
              </p>
            </div>
          </div>

          {/* BOTÃO EXPANDIR/VER ZONAS */}
          <button
            type="button"
            onClick={() => toggleExpand(district.name)}
            className="px-2.5 py-1 rounded-xl hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition cursor-pointer shrink-0 border border-border/50"
          >
            <span>{isExpanded ? "Ocultar locais" : "Ver locais"}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* SUBCATEGORIAS DE LOCAIS (CIDADES, BAIRROS, PRAIAS, ROÇAS) */}
        {isSelected && isExpanded && (
          <div className="px-3.5 pb-3.5 pt-2 border-t border-border/50 bg-muted/10 space-y-3">
            {district.groups.map((group) => {
              const allInGroup = group.zones;
              const selectedInGroup = allInGroup.filter((z) => currentDistrictLocs.includes(z));

              if (isReadOnly && selectedInGroup.length === 0) return null;

              return (
                <div key={group.groupName} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-foreground/80 tracking-wide flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {group.groupName}
                      <span className="text-[9px] text-muted-foreground font-normal">
                        ({selectedInGroup.length}/{allInGroup.length})
                      </span>
                    </span>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => toggleGroupLocalities(district.name, allInGroup)}
                        className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {selectedInGroup.length === allInGroup.length
                          ? "Desmarcar grupo"
                          : "Marcar grupo"}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {allInGroup.map((zone) => {
                      const isZoneSelected = currentDistrictLocs.includes(zone);
                      if (isReadOnly && !isZoneSelected) return null;

                      return (
                        <button
                          key={zone}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => toggleLocality(district.name, zone)}
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-[11px] font-medium transition flex items-center gap-1",
                            isZoneSelected
                              ? "bg-primary/15 text-primary border border-primary/25 font-bold shadow-2xs"
                              : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground border border-border/70",
                            isReadOnly && "cursor-default",
                            !isReadOnly && "cursor-pointer",
                          )}
                        >
                          {isZoneSelected && <Check size={11} className="stroke-[3]" />}
                          <span>{zone}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xs",
        className,
      )}
    >
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Locais de Atendimento</h3>
            <p className="text-[11px] text-muted-foreground">
              {selectedDistricts.length} de {STP_DISTRICTS_DETAILED.length} distritos selecionados (
              {totalLocalitiesCount} locais cobertos em STP)
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold shrink-0 flex items-center gap-1">
          <Globe size={12} />
          <span>STP Cobertura</span>
        </span>
      </div>

      {/* FILTRO DE PESQUISA RÁPIDA */}
      {!isReadOnly && (
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Pesquisar localidade, roça, praia ou vila (ex: Pantufo, Trindade, Lagoa Azul, Neves)..."
            className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
          />
        </div>
      )}

      {/* BOTÕES DE ATALHO RÁPIDO PARA O PRESTADOR */}
      {!isReadOnly && (
        <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-muted-foreground">
            Distritos Atendidos ({selectedDistricts.length}/{STP_DISTRICTS_DETAILED.length})
          </span>

          <button
            type="button"
            onClick={handleSelectAllSTP}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <MapPin size={12} />
            <span>
              {selectedDistricts.length === STP_DISTRICTS_DETAILED.length
                ? "Reduzir para São Tomé Central"
                : "Selecionar Todo o Arquipélago (STP)"}
            </span>
          </button>
        </div>
      )}

      {/* LISTA: ILHA DE SÃO TOMÉ */}
      {saoTomeDistricts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              🌍 Ilha e Região de São Tomé
            </span>
            <div className="h-px bg-border flex-1" />
          </div>
          <div className="space-y-2.5">{saoTomeDistricts.map(renderDistrictCard)}</div>
        </div>
      )}

      {/* LISTA: ILHA E REGIÃO AUTÓNOMA DO PRÍNCIPE */}
      {principeDistricts.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              🌍 Ilha e Região Autónoma do Príncipe
            </span>
            <div className="h-px bg-border flex-1" />
          </div>
          <div className="space-y-2.5">{principeDistricts.map(renderDistrictCard)}</div>
        </div>
      )}

      {/* BOTÃO DE SALVAR */}
      {!isReadOnly && onSave && (
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer"
        >
          <CheckCircle2 size={16} />
          <span>Salvar Locais de Atendimento</span>
        </button>
      )}
    </div>
  );
}
