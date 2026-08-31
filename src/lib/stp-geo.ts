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
  { name: "São Gabriel", district: "Água Grande", lat: 0.3341, lng: 6.7289, type: "bairro", description: "Zona residencial e comercial de São Gabriel" },
  { name: "Almeirim", district: "Água Grande", lat: 0.3275, lng: 6.7214, type: "bairro", description: "Bairro de Almeirim" },
  { name: "Riboque", district: "Água Grande", lat: 0.3392, lng: 6.7315, type: "bairro", description: "Riboque Santana / Riboque Central" },
  { name: "Pantufo", district: "Água Grande", lat: 0.3150, lng: 6.7450, type: "vila", description: "Vila piscatória de Pantufo" },
  { name: "Vila Maria", district: "Água Grande", lat: 0.3420, lng: 6.7190, type: "bairro", description: "Bairro Vila Maria" },
  { name: "Campo de Milho", district: "Água Grande", lat: 0.3480, lng: 6.7260, type: "bairro", description: "Campo de Milho / Estrada do Aeroporto" },
  { name: "Chamiço", district: "Água Grande", lat: 0.3310, lng: 6.7150, type: "bairro", description: "Bairro do Chamiço" },
  { name: "Madre Deus", district: "Água Grande", lat: 0.3415, lng: 6.7340, type: "bairro", description: "Madre Deus / Marginal de São Tomé" },
  { name: "Oque d'El Rei", district: "Água Grande", lat: 0.3380, lng: 6.7120, type: "bairro", description: "Oque d'El Rei" },
  { name: "Boa Morte", district: "Água Grande", lat: 0.3290, lng: 6.7080, type: "bairro", description: "Boa Morte" },
  { name: "Quinta Santo António", district: "Água Grande", lat: 0.3350, lng: 6.7210, type: "bairro", description: "Quinta de Santo António" },
  { name: "Cruz Grande", district: "Água Grande", lat: 0.3450, lng: 6.7100, type: "bairro", description: "Cruz Grande" },
  { name: "Hospital Central", district: "Água Grande", lat: 0.3370, lng: 6.7320, type: "ponto_notavel", description: "Hospital Dr. Ayres de Menezes" },
  { name: "Praia Gamboa", district: "Água Grande", lat: 0.3430, lng: 6.7370, type: "bairro", description: "Praia Gamboa / Marginal" },
  { name: "Aeroporto Internacional", district: "Água Grande", lat: 0.3780, lng: 6.7120, type: "ponto_notavel", description: "Aeroporto Nuno Xavier" },
  { name: "Bobo Forro", district: "Água Grande", lat: 0.3180, lng: 6.7100, type: "bairro", description: "Bobo Forro" },

  // --- MÉ-ZÓCHI ---
  { name: "Trindade", district: "Mé-Zóchi", lat: 0.2989, lng: 6.6491, type: "cidade", description: "Centro da Cidade de Trindade" },
  { name: "Batepá", district: "Mé-Zóchi", lat: 0.2920, lng: 6.6180, type: "vila", description: "Vila histórica de Batepá" },
  { name: "Madalena", district: "Mé-Zóchi", lat: 0.3150, lng: 6.6720, type: "vila", description: "Madalena" },
  { name: "Bombom", district: "Mé-Zóchi", lat: 0.3100, lng: 6.6950, type: "bairro", description: "Bombom / Estrada da Trindade" },
  { name: "Folha Fédê", district: "Mé-Zóchi", lat: 0.2990, lng: 6.6710, type: "vila", description: "Folha Fédê" },
  { name: "Cruzeiro", district: "Mé-Zóchi", lat: 0.3080, lng: 6.6850, type: "bairro", description: "Cruzeiro" },
  { name: "Monte Café", district: "Mé-Zóchi", lat: 0.3030, lng: 6.6380, type: "roca", description: "Roça Monte Café" },
  { name: "Saudade", district: "Mé-Zóchi", lat: 0.2850, lng: 6.6200, type: "roca", description: "Saudade / Cascata São Nicolau" },
  { name: "Caixão Grande", district: "Mé-Zóchi", lat: 0.3200, lng: 6.6800, type: "bairro", description: "Caixão Grande" },
  { name: "Almas", district: "Mé-Zóchi", lat: 0.2950, lng: 6.6800, type: "bairro", description: "Bairro das Almas" },
  { name: "Praia Melão", district: "Mé-Zóchi", lat: 0.3010, lng: 6.7350, type: "bairro", description: "Praia Melão" },

  // --- LOBATA ---
  { name: "Guadalupe", district: "Lobata", lat: 0.3601, lng: 6.6608, type: "cidade", description: "Vila de Guadalupe" },
  { name: "Conde", district: "Lobata", lat: 0.3520, lng: 6.6850, type: "vila", description: "Conde" },
  { name: "Morro Peixe", district: "Lobata", lat: 0.3850, lng: 6.6450, type: "vila", description: "Vila piscatória de Morro Peixe" },
  { name: "Micoló", district: "Lobata", lat: 0.3950, lng: 6.6750, type: "vila", description: "Praia de Micoló" },
  { name: "Santo Amaro", district: "Lobata", lat: 0.3580, lng: 6.7020, type: "bairro", description: "Santo Amaro" },
  { name: "Agostinho Neto (Rio d'Ouro)", district: "Lobata", lat: 0.3700, lng: 6.6700, type: "roca", description: "Roça Agostinho Neto" },
  { name: "Fernão Dias", district: "Lobata", lat: 0.3900, lng: 6.6900, type: "ponto_notavel", description: "Porto de Fernão Dias" },

  // --- CANTAGALO ---
  { name: "Santana", district: "Cantagalo", lat: 0.2201, lng: 6.7051, type: "cidade", description: "Vila de Santana" },
  { name: "Ribeira Afonso", district: "Cantagalo", lat: 0.1980, lng: 6.7150, type: "vila", description: "Ribeira Afonso" },
  { name: "Água Izé", district: "Cantagalo", lat: 0.2150, lng: 6.7200, type: "roca", description: "Roça Água Izé" },
  { name: "Uba Budo", district: "Cantagalo", lat: 0.2520, lng: 6.6750, type: "roca", description: "Uba Budo" },
  { name: "Micondó", district: "Cantagalo", lat: 0.1850, lng: 6.7200, type: "vila", description: "Praia Micondó" },

  // --- LEMBÁ ---
  { name: "Neves", district: "Lemba", lat: 0.3583, lng: 6.5504, type: "cidade", description: "Cidade de Neves" },
  { name: "Santa Catarina", district: "Lemba", lat: 0.2800, lng: 6.4800, type: "vila", description: "Santa Catarina" },
  { name: "Ponta Figo", district: "Lemba", lat: 0.3450, lng: 6.5350, type: "roca", description: "Roça Ponta Figo" },
  { name: "Generosa", district: "Lemba", lat: 0.3500, lng: 6.5400, type: "vila", description: "Generosa" },
  { name: "Diogo Vaz", district: "Lemba", lat: 0.3150, lng: 6.5050, type: "roca", description: "Roça Diogo Vaz" },

  // --- CAUÉ ---
  { name: "São João dos Angolares", district: "Caué", lat: 0.1384, lng: 6.6471, type: "cidade", description: "São João dos Angolares" },
  { name: "Porto Alegre", district: "Caué", lat: 0.0350, lng: 6.5350, type: "vila", description: "Porto Alegre / Sul de São Tomé" },
  { name: "Ribeira Peixe", district: "Caué", lat: 0.0900, lng: 6.6050, type: "vila", description: "Ribeira Peixe" },
  { name: "Vila Malanza", district: "Caué", lat: 0.0450, lng: 6.5400, type: "vila", description: "Vila Malanza" },
  { name: "Ilhéu das Rolas", district: "Caué", lat: 0.0010, lng: 6.5240, type: "ponto_notavel", description: "Marco do Equador / Ilhéu das Rolas" },

  // --- PAGUÉ (Ilha do Príncipe) ---
  { name: "Santo António do Príncipe", district: "Príncipe (RAP)", lat: 1.6385, lng: 7.4201, type: "cidade", description: "Capital do Príncipe" },
  { name: "Sundy", district: "Príncipe (RAP)", lat: 1.6620, lng: 7.3850, type: "roca", description: "Roça Sundy" },
  { name: "Porto Real", district: "Príncipe (RAP)", lat: 1.6200, lng: 7.4050, type: "roca", description: "Porto Real" },
  { name: "Terreiro Velho", district: "Príncipe (RAP)", lat: 1.5950, lng: 7.4100, type: "roca", description: "Roça Terreiro Velho" },
  { name: "Praia Banana", district: "Príncipe (RAP)", lat: 1.6850, lng: 7.4350, type: "ponto_notavel", description: "Praia Banana" },
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
  zoneType: string;
  distanceToZoneCenterMeters: number;
  formattedAddress: string;
  mapsUrl: string;
  directionsUrl: string;
  shareMessage: string;
  timestamp: number;
};

/**
 * Encontra a zona e o distrito mais próximos em STP a partir de coordenadas GPS
 */
export function identifySTPZone(lat: number, lng: number): {
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
 * Obtém a localização GPS em tempo real do utilizador com alta precisão
 * e identifica com inteligência a Zona e Distrito de STP onde se encontra.
 */
export async function getSTPPreciseGPS(): Promise<STPPreciseLocation | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    toast.error("GPS não suportado neste telemóvel/navegador.");
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const { zone, distanceMeters } = identifySTPZone(latitude, longitude);

        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        const formattedAddress = `${zone.name}, ${zone.district}, São Tomé e Príncipe`;
        const shareMessage = `📍 Localização GPS do Cliente: ${zone.name} (${zone.district}) · Coordenadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} · Ver no mapa: ${mapsUrl}`;

        // Haptic feedback nativo
        triggerDeviceVibration([60, 40, 80]);

        // Notificação informativa detalhada
        toast.success(
          `📍 Está em ${zone.name} (${zone.district})! Coordenadas e zona prontas para o prestador.`,
          {
            duration: 5000,
            description: `Precisão GPS: ±${Math.round(accuracy)}m. O profissional receberá este local exato.`,
          },
        );

        resolve({
          latitude,
          longitude,
          accuracy,
          district: zone.district,
          zone: zone.name,
          zoneType: zone.type,
          distanceToZoneCenterMeters: distanceMeters,
          formattedAddress,
          mapsUrl,
          directionsUrl,
          shareMessage,
          timestamp: Date.now(),
        });
      },
      (error) => {
        console.warn("GPS Error:", error);
        let errorMsg = "Não foi possível obter a localização GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Permissão de GPS negada. Por favor, autorize a localização no telemóvel para detetar a sua zona.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Tempo limite ao obter sinal GPS dos satélites.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Sinal GPS indisponível de momento.";
        }
        toast.error(errorMsg);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000,
      },
    );
  });
}
