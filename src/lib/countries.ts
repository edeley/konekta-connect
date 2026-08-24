export interface Country {
  name: string;
  code: string;
  iso: string;
  flag: string;
  digits: number;
  digitsMin?: number;
  digitsMax?: number;
  placeholder: string;
  format: (digits: string) => string;
}

export const COUNTRIES: Country[] = [
  {
    name: "São Tomé e Príncipe",
    code: "+239",
    iso: "ST",
    flag: "🇸🇹",
    digits: 7,
    placeholder: "981 2345",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 7);
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Portugal",
    code: "+351",
    iso: "PT",
    flag: "🇵🇹",
    digits: 9,
    placeholder: "912 345 678",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Angola",
    code: "+244",
    iso: "AO",
    flag: "🇦🇴",
    digits: 9,
    placeholder: "923 456 789",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Cabo Verde",
    code: "+238",
    iso: "CV",
    flag: "🇨🇻",
    digits: 7,
    placeholder: "991 23 45",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 7);
      if (clean.length > 5) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Moçambique",
    code: "+258",
    iso: "MZ",
    flag: "🇲🇿",
    digits: 9,
    placeholder: "84 123 4567",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 5) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
      }
      if (clean.length > 2) {
        return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      }
      return clean;
    },
  },
  {
    name: "Brasil",
    code: "+55",
    iso: "BR",
    flag: "🇧🇷",
    digits: 11,
    digitsMin: 10,
    digitsMax: 11,
    placeholder: "11 98765-4321",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 11);
      if (clean.length > 7) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 7)}-${clean.slice(7)}`;
      }
      if (clean.length > 2) {
        return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      }
      return clean;
    },
  },
  {
    name: "Guiné-Bissau",
    code: "+245",
    iso: "GW",
    flag: "🇬🇼",
    digits: 7,
    placeholder: "955 12 34",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 7);
      if (clean.length > 5) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Guiné Equatorial",
    code: "+240",
    iso: "GQ",
    flag: "🇬🇶",
    digits: 9,
    placeholder: "222 123 456",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Gabão",
    code: "+241",
    iso: "GA",
    flag: "🇬🇦",
    digits: 8,
    placeholder: "77 12 34 56",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 8);
      if (clean.length > 6) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 4) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4)}`;
      }
      if (clean.length > 2) {
        return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      }
      return clean;
    },
  },
  {
    name: "Espanha",
    code: "+34",
    iso: "ES",
    flag: "🇪🇸",
    digits: 9,
    placeholder: "612 345 678",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "França",
    code: "+33",
    iso: "FR",
    flag: "🇫🇷",
    digits: 9,
    placeholder: "6 12 34 56 78",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 7) {
        return `${clean.slice(0, 1)} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7)}`;
      }
      if (clean.length > 5) {
        return `${clean.slice(0, 1)} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 1)} ${clean.slice(1, 3)} ${clean.slice(3)}`;
      }
      if (clean.length > 1) {
        return `${clean.slice(0, 1)} ${clean.slice(1)}`;
      }
      return clean;
    },
  },
  {
    name: "Reino Unido",
    code: "+44",
    iso: "GB",
    flag: "🇬🇧",
    digits: 10,
    placeholder: "7911 123456",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 10);
      if (clean.length > 4) {
        return `${clean.slice(0, 4)} ${clean.slice(4)}`;
      }
      return clean;
    },
  },
  {
    name: "Estados Unidos",
    code: "+1",
    iso: "US",
    flag: "🇺🇸",
    digits: 10,
    placeholder: "202 555 0123",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 10);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Nigéria",
    code: "+234",
    iso: "NG",
    flag: "🇳🇬",
    digits: 10,
    placeholder: "802 123 4567",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 10);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Gana",
    code: "+233",
    iso: "GH",
    flag: "🇬🇭",
    digits: 9,
    placeholder: "24 123 4567",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 5) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
      }
      if (clean.length > 2) {
        return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      }
      return clean;
    },
  },
  {
    name: "Alemanha",
    code: "+49",
    iso: "DE",
    flag: "🇩🇪",
    digits: 10,
    digitsMin: 10,
    digitsMax: 11,
    placeholder: "151 12345678",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 11);
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Itália",
    code: "+39",
    iso: "IT",
    flag: "🇮🇹",
    digits: 10,
    placeholder: "312 345 6789",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 10);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Suíça",
    code: "+41",
    iso: "CH",
    flag: "🇨🇭",
    digits: 9,
    placeholder: "78 123 45 67",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 7) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7)}`;
      }
      if (clean.length > 5) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
      }
      if (clean.length > 2) {
        return `${clean.slice(0, 2)} ${clean.slice(2)}`;
      }
      return clean;
    },
  },
  {
    name: "Bélgica",
    code: "+32",
    iso: "BE",
    flag: "🇧🇪",
    digits: 9,
    placeholder: "470 12 34 56",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 7) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7)}`;
      }
      if (clean.length > 5) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
  {
    name: "Luxemburgo",
    code: "+352",
    iso: "LU",
    flag: "🇱🇺",
    digits: 9,
    placeholder: "621 123 456",
    format: (d) => {
      const clean = d.replace(/\D/g, "").slice(0, 9);
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      return clean;
    },
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // São Tomé e Príncipe (+239)

export function findCountryByCodeOrIso(codeOrIso: string): Country {
  const match = COUNTRIES.find(
    (c) =>
      c.code.toLowerCase() === codeOrIso.toLowerCase() ||
      c.iso.toLowerCase() === codeOrIso.toLowerCase() ||
      codeOrIso.startsWith(c.code),
  );
  return match || DEFAULT_COUNTRY;
}
