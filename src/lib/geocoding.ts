import { identifySTPZone, STP_ZONES_DATABASE } from "./stp-geo";

export interface ReverseGeocodeResult {
  street?: string;
  houseNumber?: string;
  neighborhood?: string;
  district: string;
  city: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
  landmark?: string;
  distanceToLandmarkMeters?: number;
  plusCode?: string;
  provider: "google" | "bigdatacloud" | "nominatim" | "stp-local";
  rawAddress?: string;
}

/**
 * Converte coordenadas geográficas (latitude, longitude) num endereço legível e estruturado
 * utilizando a API do Google Geocoding (se configurada), com fallbacks de alta precisão
 * (BigDataCloud, OpenStreetMap e base de dados geográfica local de São Tomé e Príncipe).
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
  apiKey?: string,
): Promise<ReverseGeocodeResult> {
  const isInsideSTP = latitude >= -0.15 && latitude <= 1.85 && longitude >= 6.3 && longitude <= 7.6;

  // 1. Identificar zona local mais próxima em São Tomé e Príncipe
  let localZoneMatch: ReturnType<typeof identifySTPZone> | null = null;
  if (isInsideSTP) {
    try {
      localZoneMatch = identifySTPZone(latitude, longitude);
    } catch (err) {
      console.warn("Erro ao identificar zona local de STP:", err);
    }
  }

  const defaultDistrict = localZoneMatch?.zone.district || "Água Grande";
  const defaultZoneName = localZoneMatch?.zone.name || "Cidade de São Tomé";
  const landmarkDistance = localZoneMatch?.distanceMeters ?? 0;

  // 2. Tentar Google Geocoding API se a chave estiver presente
  const googleApiKey =
    apiKey ||
    (typeof import.meta !== "undefined" &&
      (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env?.VITE_GOOGLE_API_KEY));

  if (googleApiKey) {
    try {
      const googleRes = await fetchGoogleGeocode(latitude, longitude, googleApiKey);
      if (googleRes) {
        return refineWithSTPContext(googleRes, localZoneMatch, isInsideSTP, latitude, longitude);
      }
    } catch (err) {
      console.warn("Google Geocoding API indisponível ou limitada, a usar fallback:", err);
    }
  }

  // 3. Fallback: BigDataCloud Reverse Geocode Client (Rápido, sem CORS, com suporte a português)
  try {
    const bdcRes = await fetchBigDataCloudGeocode(latitude, longitude);
    if (bdcRes) {
      return refineWithSTPContext(bdcRes, localZoneMatch, isInsideSTP, latitude, longitude);
    }
  } catch (err) {
    console.warn("BigDataCloud Geocoding indisponível:", err);
  }

  // 4. Fallback: OpenStreetMap Nominatim
  try {
    const osmRes = await fetchNominatimGeocode(latitude, longitude);
    if (osmRes) {
      return refineWithSTPContext(osmRes, localZoneMatch, isInsideSTP, latitude, longitude);
    }
  } catch (err) {
    console.warn("Nominatim Geocoding indisponível:", err);
  }

  // 5. Fallback definitivo: Base de dados cartográfica local de São Tomé e Príncipe
  const landmarkRef =
    landmarkDistance > 0 && landmarkDistance <= 500
      ? ` (a ~${landmarkDistance}m de ${defaultZoneName})`
      : "";

  const fallbackAddress = isInsideSTP
    ? `${defaultZoneName}, ${defaultDistrict}, São Tomé e Príncipe${landmarkRef}`
    : `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Fora de STP)`;

  return {
    neighborhood: defaultZoneName,
    district: defaultDistrict,
    city: "São Tomé",
    country: "São Tomé e Príncipe",
    formattedAddress: fallbackAddress,
    landmark: defaultZoneName,
    distanceToLandmarkMeters: landmarkDistance,
    provider: "stp-local",
  };
}

/**
 * Chamada à Google Geocoding API REST
 */
async function fetchGoogleGeocode(
  lat: number,
  lng: number,
  apiKey: string,
): Promise<Partial<ReverseGeocodeResult> | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(apiKey)}&language=pt`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const first = data.results[0];
    let street = "";
    let houseNumber = "";
    let neighborhood = "";
    let district = "";
    let city = "";
    let country = "";
    let postalCode = "";

    for (const comp of first.address_components || []) {
      const types = comp.types || [];
      if (types.includes("route")) street = comp.long_name;
      else if (types.includes("street_number")) houseNumber = comp.long_name;
      else if (types.includes("sublocality") || types.includes("neighborhood"))
        neighborhood = comp.long_name;
      else if (types.includes("administrative_area_level_2")) district = comp.long_name;
      else if (types.includes("locality") || types.includes("administrative_area_level_1"))
        city = comp.long_name;
      else if (types.includes("country")) country = comp.long_name;
      else if (types.includes("postal_code")) postalCode = comp.long_name;
    }

    return {
      street: street || undefined,
      houseNumber: houseNumber || undefined,
      neighborhood: neighborhood || undefined,
      district: district || undefined,
      city: city || "São Tomé",
      country: country || "São Tomé e Príncipe",
      postalCode: postalCode || undefined,
      formattedAddress: first.formatted_address,
      plusCode: data.plus_code?.compound_code || data.plus_code?.global_code,
      provider: "google",
      rawAddress: first.formatted_address,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Chamada à BigDataCloud Reverse Geocoding Client
 */
async function fetchBigDataCloudGeocode(
  lat: number,
  lng: number,
): Promise<Partial<ReverseGeocodeResult> | null> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();

    const street = data.localityInfo?.informative?.[0]?.name || data.locality;
    const district = data.principalSubdivision;
    const city = data.city || data.locality || "São Tomé";
    const country = data.countryName || "São Tomé e Príncipe";

    return {
      street: street !== city ? street : undefined,
      neighborhood: data.locality || undefined,
      district: district || undefined,
      city,
      country,
      provider: "bigdatacloud",
      rawAddress: `${street || ""}, ${district || ""}, ${country}`.trim(),
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Chamada ao OpenStreetMap Nominatim
 */
async function fetchNominatimGeocode(
  lat: number,
  lng: number,
): Promise<Partial<ReverseGeocodeResult> | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept-Language": "pt,pt-PT;q=0.9,en;q=0.8" },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    const street = addr.road || addr.pedestrian || addr.footway || addr.path;
    const houseNumber = addr.house_number;
    const neighborhood =
      addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || addr.village;
    const district = addr.county || addr.state || addr.state_district;
    const city = addr.city || addr.town || addr.village || "São Tomé";
    const country = addr.country || "São Tomé e Príncipe";
    const postalCode = addr.postcode;

    return {
      street: street || undefined,
      houseNumber: houseNumber || undefined,
      neighborhood: neighborhood || undefined,
      district: district || undefined,
      city,
      country,
      postalCode: postalCode || undefined,
      formattedAddress: data.display_name,
      provider: "nominatim",
      rawAddress: data.display_name,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Cruza o resultado de geocodificação com a base de distritos e localidades de STP
 * para garantir endereços consistentes com a realidade local.
 */
function refineWithSTPContext(
  apiResult: Partial<ReverseGeocodeResult>,
  localZoneMatch: ReturnType<typeof identifySTPZone> | null,
  isInsideSTP: boolean,
  lat: number,
  lng: number,
): ReverseGeocodeResult {
  const localZoneName = localZoneMatch?.zone.name || "Cidade de São Tomé";
  const localDistrict = localZoneMatch?.zone.district || "Água Grande";
  const distance = localZoneMatch?.distanceMeters ?? 0;

  let street = apiResult.street;
  const neighborhood = apiResult.neighborhood || localZoneName;
  const district = isInsideSTP ? localDistrict : apiResult.district || "Água Grande";
  const city = apiResult.city || "São Tomé";
  const country = apiResult.country || "São Tomé e Príncipe";

  // Se a rua detectada for apenas o nome da ilha ou do distrito, ajusta
  if (
    street &&
    (street.toLowerCase() === "são tomé" ||
      street.toLowerCase() === "príncipe" ||
      street.toLowerCase() === district.toLowerCase())
  ) {
    street = undefined;
  }

  // Monta endereço legível e estruturado
  const parts: string[] = [];
  if (street) {
    const streetLine = apiResult.houseNumber ? `${street}, nº ${apiResult.houseNumber}` : street;
    parts.push(streetLine);
  }

  if (neighborhood && (!street || !street.toLowerCase().includes(neighborhood.toLowerCase()))) {
    parts.push(neighborhood);
  }

  if (isInsideSTP) {
    if (distance > 0 && distance <= 250 && localZoneName !== neighborhood) {
      parts.push(`(próx. ${localZoneName})`);
    }
    parts.push(district);
    parts.push("São Tomé e Príncipe");
  } else {
    parts.push(city);
    parts.push(country);
    parts.push(`(GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)})`);
  }

  const formattedAddress = parts.join(", ");

  return {
    street,
    houseNumber: apiResult.houseNumber,
    neighborhood,
    district,
    city,
    country,
    postalCode: apiResult.postalCode,
    formattedAddress: apiResult.formattedAddress || formattedAddress,
    landmark: localZoneName,
    distanceToLandmarkMeters: distance,
    plusCode: apiResult.plusCode,
    provider: apiResult.provider || "stp-local",
    rawAddress: apiResult.rawAddress,
  };
}
