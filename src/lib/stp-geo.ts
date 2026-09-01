import { toast } from "sonner";
import { triggerDeviceVibration } from "./sync-manager";

export type STPZoneInfo = {
  name: string;
  district: string;
  lat: number;
  lng: number;
  type: "bairro" | "cidade" | "vila" | "localidade" | "roca" | "ponto_notavel";
  description?: string;
};

// Base de Dados de Coordenadas Geográficas de São Tomé e Príncipe
export const STP_ZONES_DATABASE: STPZoneInfo[] = [
  // --- ÁGUA GRANDE (Capital São Tomé) ---
  {
    name: "São Gabriel",
    district: "Água Grande",
    lat: 0.3341,
    lng: 6.7289,
    type: "bairro",
    description: "Zona residencial e comercial de São Gabriel",
  },
  {
    name: "Almeirim",
    district: "Água Grande",
    lat: 0.3275,
    lng: 6.7214,
    type: "bairro",
    description: "Bairro de Almeirim",
  },
  {
    name: "Riboque",
    district: "Água Grande",
    lat: 0.3392,
    lng: 6.7315,
    type: "bairro",
    description: "Riboque Santana / Riboque Central",
  },
  {
    name: "Pantufo",
    district: "Água Grande",
    lat: 0.315,
    lng: 6.745,
    type: "vila",
    description: "Vila piscatória de Pantufo",
  },
  {
    name: "Vila Maria",
    district: "Água Grande",
    lat: 0.342,
    lng: 6.719,
    type: "bairro",
    description: "Bairro Vila Maria",
  },
  {
    name: "Campo de Milho",
    district: "Água Grande",
    lat: 0.348,
    lng: 6.726,
    type: "bairro",
    description: "Campo de Milho / Estrada do Aeroporto",
  },
  {
    name: "Chamiço",
    district: "Água Grande",
    lat: 0.331,
    lng: 6.715,
    type: "bairro",
    description: "Bairro do Chamiço",
  },
  {
    name: "Madre Deus",
    district: "Água Grande",
    lat: 0.3415,
    lng: 6.734,
    type: "bairro",
    description: "Madre Deus / Marginal de São Tomé",
  },
  {
    name: "Oque d'El Rei",
    district: "Água Grande",
    lat: 0.338,
    lng: 6.712,
    type: "bairro",
    description: "Oque d'El Rei",
  },
  {
    name: "Boa Morte",
    district: "Água Grande",
    lat: 0.329,
    lng: 6.708,
    type: "bairro",
    description: "Boa Morte",
  },
  {
    name: "Quinta Santo António",
    district: "Água Grande",
    lat: 0.335,
    lng: 6.721,
    type: "bairro",
    description: "Quinta de Santo António",
  },
  {
    name: "Cruz Grande",
    district: "Água Grande",
    lat: 0.345,
    lng: 6.71,
    type: "bairro",
    description: "Cruz Grande",
  },
  {
    name: "Hospital Central",
    district: "Água Grande",
    lat: 0.337,
    lng: 6.732,
    type: "ponto_notavel",
    description: "Hospital Dr. Ayres de Menezes",
  },
  {
    name: "Praia Gamboa",
    district: "Água Grande",
    lat: 0.343,
    lng: 6.737,
    type: "bairro",
    description: "Praia Gamboa / Marginal",
  },
  {
    name: "Aeroporto Internacional",
    district: "Água Grande",
    lat: 0.378,
    lng: 6.712,
    type: "ponto_notavel",
    description: "Aeroporto Nuno Xavier",
  },
  {
    name: "Bobo Forro",
    district: "Água Grande",
    lat: 0.318,
    lng: 6.71,
    type: "bairro",
    description: "Bobo Forro",
  },

  // --- MÉ-ZÓCHI ---
  {
    name: "Trindade",
    district: "Mé-Zóchi",
    lat: 0.2989,
    lng: 6.6491,
    type: "cidade",
    description: "Centro da Cidade de Trindade",
  },
  {
    name: "Batepá",
    district: "Mé-Zóchi",
    lat: 0.292,
    lng: 6.618,
    type: "vila",
    description: "Vila histórica de Batepá",
  },
  {
    name: "Madalena",
    district: "Mé-Zóchi",
    lat: 0.315,
    lng: 6.672,
    type: "vila",
    description: "Madalena",
  },
  {
    name: "Bombom",
    district: "Mé-Zóchi",
    lat: 0.31,
    lng: 6.695,
    type: "bairro",
    description: "Bombom / Estrada da Trindade",
  },
  {
    name: "Folha Fédê",
    district: "Mé-Zóchi",
    lat: 0.299,
    lng: 6.671,
    type: "vila",
    description: "Folha Fédê",
  },
  {
    name: "Cruzeiro",
    district: "Mé-Zóchi",
    lat: 0.308,
    lng: 6.685,
    type: "bairro",
    description: "Cruzeiro",
  },
  {
    name: "Monte Café",
    district: "Mé-Zóchi",
    lat: 0.303,
    lng: 6.638,
    type: "roca",
    description: "Roça Monte Café",
  },
  {
    name: "Saudade",
    district: "Mé-Zóchi",
    lat: 0.285,
    lng: 6.62,
    type: "roca",
    description: "Saudade / Cascata São Nicolau",
  },
  {
    name: "Caixão Grande",
    district: "Mé-Zóchi",
    lat: 0.32,
    lng: 6.68,
    type: "bairro",
    description: "Caixão Grande",
  },
  {
    name: "Almas",
    district: "Mé-Zóchi",
    lat: 0.295,
    lng: 6.68,
    type: "bairro",
    description: "Bairro das Almas",
  },
  {
    name: "Praia Melão",
    district: "Mé-Zóchi",
    lat: 0.301,
    lng: 6.735,
    type: "bairro",
    description: "Praia Melão",
  },

  // --- LOBATA ---
  {
    name: "Guadalupe",
    district: "Lobata",
    lat: 0.3601,
    lng: 6.6608,
    type: "cidade",
    description: "Vila de Guadalupe",
  },
  { name: "Conde", district: "Lobata", lat: 0.352, lng: 6.685, type: "vila", description: "Conde" },
  {
    name: "Morro Peixe",
    district: "Lobata",
    lat: 0.385,
    lng: 6.645,
    type: "vila",
    description: "Vila piscatória de Morro Peixe",
  },
  {
    name: "Micoló",
    district: "Lobata",
    lat: 0.395,
    lng: 6.675,
    type: "vila",
    description: "Praia de Micoló",
  },
  {
    name: "Santo Amaro",
    district: "Lobata",
    lat: 0.358,
    lng: 6.702,
    type: "bairro",
    description: "Santo Amaro",
  },
  {
    name: "Agostinho Neto (Rio d'Ouro)",
    district: "Lobata",
    lat: 0.37,
    lng: 6.67,
    type: "roca",
    description: "Roça Agostinho Neto",
  },
  {
    name: "Fernão Dias",
    district: "Lobata",
    lat: 0.39,
    lng: 6.69,
    type: "ponto_notavel",
    description: "Porto de Fernão Dias",
  },

  // --- CANTAGALO ---
  {
    name: "Santana",
    district: "Cantagalo",
    lat: 0.2201,
    lng: 6.7051,
    type: "cidade",
    description: "Vila de Santana",
  },
  {
    name: "Ribeira Afonso",
    district: "Cantagalo",
    lat: 0.198,
    lng: 6.715,
    type: "vila",
    description: "Ribeira Afonso",
  },
  {
    name: "Água Izé",
    district: "Cantagalo",
    lat: 0.215,
    lng: 6.72,
    type: "roca",
    description: "Roça Água Izé",
  },
  {
    name: "Uba Budo",
    district: "Cantagalo",
    lat: 0.252,
    lng: 6.675,
    type: "roca",
    description: "Uba Budo",
  },
  {
    name: "Micondó",
    district: "Cantagalo",
    lat: 0.185,
    lng: 6.72,
    type: "vila",
    description: "Praia Micondó",
  },

  // --- LEMBÁ ---
  {
    name: "Neves",
    district: "Lemba",
    lat: 0.3583,
    lng: 6.5504,
    type: "cidade",
    description: "Cidade de Neves",
  },
  {
    name: "Santa Catarina",
    district: "Lemba",
    lat: 0.28,
    lng: 6.48,
    type: "vila",
    description: "Santa Catarina",
  },
  {
    name: "Ponta Figo",
    district: "Lemba",
    lat: 0.345,
    lng: 6.535,
    type: "roca",
    description: "Roça Ponta Figo",
  },
  {
    name: "Generosa",
    district: "Lemba",
    lat: 0.35,
    lng: 6.54,
    type: "vila",
    description: "Generosa",
  },
  {
    name: "Diogo Vaz",
    district: "Lemba",
    lat: 0.315,
    lng: 6.505,
    type: "roca",
    description: "Roça Diogo Vaz",
  },

  // --- CAUÉ ---
  {
    name: "São João dos Angolares",
    district: "Caué",
    lat: 0.1384,
    lng: 6.6471,
    type: "cidade",
    description: "São João dos Angolares",
  },
  {
    name: "Porto Alegre",
    district: "Caué",
    lat: 0.035,
    lng: 6.535,
    type: "vila",
    description: "Porto Alegre / Sul de São Tomé",
  },
  {
    name: "Ribeira Peixe",
    district: "Caué",
    lat: 0.09,
    lng: 6.605,
    type: "vila",
    description: "Ribeira Peixe",
  },
  {
    name: "Vila Malanza",
    district: "Caué",
    lat: 0.045,
    lng: 6.54,
    type: "vila",
    description: "Vila Malanza",
  },
  {
    name: "Ilhéu das Rolas",
    district: "Caué",
    lat: 0.001,
    lng: 6.524,
    type: "ponto_notavel",
    description: "Marco do Equador / Ilhéu das Rolas",
  },

  // --- PAGUÉ (Ilha do Príncipe) ---
  {
    name: "Santo António do Príncipe",
    district: "Príncipe (RAP)",
    lat: 1.6385,
    lng: 7.4201,
    type: "cidade",
    description: "Capital do Príncipe",
  },
  {
    name: "Sundy",
    district: "Príncipe (RAP)",
    lat: 1.662,
    lng: 7.385,
    type: "roca",
    description: "Roça Sundy",
  },
  {
    name: "Porto Real",
    district: "Príncipe (RAP)",
    lat: 1.62,
    lng: 7.405,
    type: "roca",
    description: "Porto Real",
  },
  {
    name: "Terreiro Velho",
    district: "Príncipe (RAP)",
    lat: 1.595,
    lng: 7.41,
    type: "roca",
    description: "Roça Terreiro Velho",
  },
  {
    name: "Praia Banana",
    district: "Príncipe (RAP)",
    lat: 1.685,
    lng: 7.435,
    type: "ponto_notavel",
    description: "Praia Banana",
  },
];

/**
 * Calcula a distância em quilómetros entre duas coordenadas (Fórmula Haversine)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type STPPreciseLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  district: string;
  zone: string;
  street?: string;
  zoneType: string;
  distanceToZoneCenterMeters: number;
  formattedAddress: string;
  mapsUrl: string;
  directionsUrl: string;
  wazeUrl: string;
  appleMapsUrl: string;
  geoUri: string;
  shareMessage: string;
  timestamp: number;
};

/**
 * Encontra a zona e o distrito mais próximos em STP a partir de coordenadas GPS
 */
export function identifySTPZone(
  lat: number,
  lng: number,
): {
  zone: STPZoneInfo;
  distanceMeters: number;
} {
  let closestZone = STP_ZONES_DATABASE[0];
  let minDistance = Infinity;

  for (const zone of STP_ZONES_DATABASE) {
    const distKm = calculateDistanceKm(lat, lng, zone.lat, zone.lng);
    if (distKm < minDistance) {
      minDistance = distKm;
      closestZone = zone;
    }
  }

  return {
    zone: closestZone,
    distanceMeters: Math.round(minDistance * 1000),
  };
}

/**
 * Tenta obter detalhes da rua ou localidade por geocodificação inversa em tempo real
 */
async function fetchOnlineGeocode(
  lat: number,
  lng: number,
): Promise<{ street?: string; district?: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "pt,pt-PT;q=0.9,en;q=0.8" },
      },
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street =
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.hamlet ||
        addr.village ||
        addr.town ||
        addr.city ||
        addr.county;
      const district = addr.state || addr.county || addr.city;
      return { street, district };
    }
  } catch {
    // Fallback silencioso para base local de STP
  }
  return null;
}

/**
 * Obtém a localização GPS em tempo real do utilizador com precisão máxima de hardware (Estilo Encontrar Dispositivo / Google Maps),
 * com fallback inteligente para baixa precisão e coordenadas locais de São Tomé caso o sinal ou permissão esteja restrito no iframe.
 */
export async function getSTPPreciseGPS(): Promise<STPPreciseLocation | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // Função auxiliar para construir objeto de localização STP
  const buildLocationObject = async (
    latitude: number,
    longitude: number,
    accuracy: number,
    isFallback = false,
  ): Promise<STPPreciseLocation> => {
    const { zone, distanceMeters } = identifySTPZone(latitude, longitude);

    let resolvedStreet: string | undefined;
    if (!isFallback) {
      try {
        const onlineInfo = await fetchOnlineGeocode(latitude, longitude);
        resolvedStreet = onlineInfo?.street;
      } catch {
        // Ignora erro de rede na geocodificação inversa
      }
    }

    const resolvedZoneName = resolvedStreet ? `${resolvedStreet} (${zone.name})` : zone.name;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=18`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    const appleMapsUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
    const geoUri = `geo:${latitude},${longitude}?q=${latitude},${longitude}(Cliente+KONEKTA)`;

    const formattedAddress = `${resolvedZoneName}, ${zone.district}, São Tomé e Príncipe`;
    const shareMessage = `📍 Localização do Cliente (GPS):\n${formattedAddress}\nCoordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Precisão: ±${Math.round(accuracy)}m)\n🧭 Iniciar Rota no Google Maps: ${directionsUrl}`;

    return {
      latitude,
      longitude,
      accuracy,
      district: zone.district,
      zone: resolvedZoneName,
      street: resolvedStreet,
      zoneType: zone.type,
      distanceToZoneCenterMeters: distanceMeters,
      formattedAddress,
      mapsUrl,
      directionsUrl,
      wazeUrl,
      appleMapsUrl,
      geoUri,
      shareMessage,
      timestamp: Date.now(),
    };
  };

  // Se o navegador não suportar geolocalização
  if (!("geolocation" in navigator)) {
    toast.info(
      "GPS nativo indisponível no navegador. Localização definida para São Tomé (Água Grande).",
    );
    return buildLocationObject(0.3365, 6.7273, 50, true);
  }

  // Tenta obter posição com alta precisão
  const tryGetPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      try {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      } catch (err) {
        reject(err);
      }
    });
  };

  try {
    // 1ª Tentativa: Alta precisão (satélite / GPS de telemóvel)
    let pos: GeolocationPosition | null = null;
    try {
      pos = await tryGetPosition({
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 10000,
      });
    } catch (highAccuracyErr) {
      console.warn(
        "High accuracy GPS failed, falling back to standard precision:",
        highAccuracyErr,
      );
      // 2ª Tentativa: Precisão padrão / rede móvel / Wi-Fi
      try {
        pos = await tryGetPosition({
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        });
      } catch (lowAccuracyErr) {
        console.warn("Standard accuracy GPS failed:", lowAccuracyErr);
      }
    }

    if (pos && pos.coords) {
      const { latitude, longitude, accuracy } = pos.coords;
      triggerDeviceVibration([50, 30, 70]);
      return await buildLocationObject(latitude, longitude, accuracy || 10, false);
    }

    // 3ª Tentativa / Fallback inteligente para São Tomé Capital sem travar a interface
    toast.info(
      "A usar localização estimada de São Tomé (Água Grande). Pode ajustar a sua zona se desejar.",
      {
        duration: 4000,
      },
    );
    return await buildLocationObject(0.3365, 6.7273, 40, true);
  } catch (err) {
    console.error("GPS unexpected error:", err);
    toast.info("Localização configurada para o centro de São Tomé.");
    return await buildLocationObject(0.3365, 6.7273, 50, true);
  }
}
