// Montos en palabras segun la norma del español (RAE), para contratos, pagares y
// escritos. Escala larga: mil millones = 10^9, un billon = 10^12.

type Form = "apocope" | "full" | "feminine";

const UNITS = [
  "",
  "",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];
const TENS = [
  "",
  "",
  "",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];
const HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

const ONE: Record<Form, string> = { apocope: "un", feminine: "una", full: "uno" };
const TWENTY_ONE: Record<Form, string> = {
  apocope: "veintiún",
  feminine: "veintiuna",
  full: "veintiuno",
};

export const MAX_WORDS_AMOUNT = 999_999_999_999_999;

export const WORD_CURRENCIES = {
  clp: { feminine: false, plural: "pesos", singular: "peso", symbol: "$", decimals: 0 },
  dolar: { feminine: false, plural: "dólares", singular: "dólar", symbol: "US$", decimals: 2 },
  euro: { feminine: false, plural: "euros", singular: "euro", symbol: "€", decimals: 2 },
  none: { feminine: false, plural: "", singular: "", symbol: "", decimals: 4 },
  uf: {
    decimals: 4,
    feminine: true,
    plural: "unidades de fomento",
    singular: "unidad de fomento",
    symbol: "UF",
  },
  utm: {
    decimals: 4,
    feminine: true,
    plural: "unidades tributarias mensuales",
    singular: "unidad tributaria mensual",
    symbol: "UTM",
  },
} as const;

export type WordCurrency = keyof typeof WORD_CURRENCIES;

export interface AmountInWords {
  amount: number;
  currency: WordCurrency;
  words: string;
  /** Forma usual en documentos: "$1.500.000 (un millón quinientos mil pesos)". */
  legal: string;
}

/**
 * Numero entero no negativo en palabras. `form` decide la terminacion de "uno":
 * "full" para el numero aislado, "apocope" ante sustantivo masculino y "feminine"
 * ante sustantivo femenino.
 */
export function integerToWords(value: number, form: Form = "full"): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_WORDS_AMOUNT) {
    throw new Error(`Entero fuera de rango: ${value}`);
  }

  if (value === 0) {
    return "cero";
  }

  const trillions = Math.floor(value / 1e12);
  const millions = Math.floor((value % 1e12) / 1e6);
  const rest = value % 1e6;
  const parts: string[] = [];

  if (trillions > 0) {
    parts.push(trillions === 1 ? "un billón" : `${belowMillion(trillions, "apocope")} billones`);
  }

  if (millions > 0) {
    parts.push(millions === 1 ? "un millón" : `${belowMillion(millions, "apocope")} millones`);
  }

  if (rest > 0) {
    parts.push(belowMillion(rest, form));
  }

  return parts.join(" ");
}

export function amountToWords(amount: number, currency: WordCurrency = "clp"): AmountInWords {
  const info = WORD_CURRENCIES[currency];

  if (!Number.isFinite(amount) || Math.abs(amount) > MAX_WORDS_AMOUNT) {
    throw new Error(`Monto fuera de rango: ${amount}`);
  }

  const [integerText = "0", rawDecimals = ""] = Math.abs(amount).toFixed(info.decimals).split(".");
  const decimalText = rawDecimals.replace(/0+$/, "");
  const roundedBack = Number(`${integerText}${decimalText ? `.${decimalText}` : ""}`);

  if (Math.abs(Math.abs(amount) - roundedBack) > 1e-9) {
    throw new Error(
      info.decimals === 0
        ? `Los ${info.plural} no llevan decimales: ${amount}`
        : `Se admiten hasta ${info.decimals} decimales: ${amount}`,
    );
  }

  const integer = Number(integerText);
  const hasNoun = currency !== "none";

  // Monedas con centavos: "mil quinientos dólares con setenta y cinco centavos".
  if (info.decimals === 2 && hasNoun) {
    const cents = Number(rawDecimals || "0");
    let words = `${integerToWords(integer, "apocope")} ${withDe(integer, integer === 1 ? info.singular : info.plural)}`;

    if (cents > 0) {
      words += ` con ${integerToWords(cents, "apocope")} ${cents === 1 ? "centavo" : "centavos"}`;
    }

    words = amount < 0 ? `menos ${words}` : words;
    return { amount, currency, legal: `${formatNumber(amount, info)} (${words})`, words };
  }

  const hasDecimals = decimalText.length > 0;
  // Con decimales el numero se lee completo ("uno coma cinco"); sin ellos concuerda
  // con el sustantivo ("un peso", "una unidad de fomento").
  const form: Form = !hasNoun || hasDecimals ? "full" : info.feminine ? "feminine" : "apocope";
  let words = integerToWords(integer, form);

  if (hasDecimals) {
    words += ` coma ${readDecimals(decimalText)}`;
  }

  if (hasNoun) {
    const noun = integer === 1 && !hasDecimals ? info.singular : info.plural;
    words += ` ${hasDecimals ? noun : withDe(integer, noun)}`;
  }

  if (amount < 0) {
    words = `menos ${words}`;
  }

  return { amount, currency, legal: `${formatNumber(amount, info)} (${words})`, words };
}

// "un millón de pesos", pero "un millón quinientos mil pesos".
function withDe(integer: number, noun: string): string {
  return integer >= 1e6 && integer % 1e6 === 0 ? `de ${noun}` : noun;
}

function belowMillion(value: number, form: Form): string {
  const thousands = Math.floor(value / 1000);
  const rest = value % 1000;
  const parts: string[] = [];

  if (thousands === 1) {
    parts.push("mil");
  } else if (thousands > 1) {
    // Ante "mil" se usa apocope en masculino ("veintiún mil") y concordancia en femenino
    // ("doscientas mil unidades").
    parts.push(`${belowThousand(thousands, form === "feminine" ? "feminine" : "apocope")} mil`);
  }

  if (rest > 0) {
    parts.push(belowThousand(rest, form));
  }

  return parts.join(" ");
}

function belowThousand(value: number, form: Form): string {
  if (value === 100) {
    return "cien";
  }

  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts: string[] = [];

  if (hundreds > 0) {
    const word = HUNDREDS[hundreds] as string;
    parts.push(form === "feminine" ? word.replace(/ientos$/, "ientas") : word);
  }

  if (rest > 0) {
    parts.push(belowHundred(rest, form));
  }

  return parts.join(" ");
}

function belowHundred(value: number, form: Form): string {
  if (value === 1) {
    return ONE[form];
  }

  if (value === 21) {
    return TWENTY_ONE[form];
  }

  if (value < 30) {
    return UNITS[value] as string;
  }

  const tens = TENS[Math.floor(value / 10)] as string;
  const unit = value % 10;

  return unit === 0 ? tens : `${tens} y ${unit === 1 ? ONE[form] : UNITS[unit]}`;
}

function readDecimals(digits: string): string {
  const leadingZeros = digits.match(/^0+/)?.[0].length ?? 0;
  const zeros = Array.from({ length: leadingZeros }, () => "cero");
  const remainder = digits.slice(leadingZeros);

  return [...zeros, ...(remainder ? [integerToWords(Number(remainder))] : [])].join(" ");
}

function formatNumber(amount: number, info: (typeof WORD_CURRENCIES)[WordCurrency]): string {
  const sign = amount < 0 ? "-" : "";
  const number = new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: info.decimals,
    minimumFractionDigits: info.decimals === 2 && !Number.isInteger(amount) ? 2 : 0,
  }).format(Math.abs(amount));

  if (!info.symbol) {
    return `${sign}${number}`;
  }

  return info.symbol === "UF" || info.symbol === "UTM"
    ? `${sign}${number} ${info.symbol}`
    : `${sign}${info.symbol}${number}`;
}
