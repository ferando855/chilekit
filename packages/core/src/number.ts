/**
 * Interpreta montos escritos a la chilena o en formato internacional:
 * "1.500.000" (miles con punto), "3,5" (decimal con coma), "1.234,56", "1500.5".
 * Un solo punto seguido de exactamente 3 digitos se lee como separador de miles.
 */
export function parseChileanNumber(value: string): number {
  const text = value
    .trim()
    .replace(/^\$\s*/, "")
    .replace(/\s+/g, "");

  if (!/^-?[\d.,]+$/.test(text) || text.length > 30) {
    throw new Error(`Monto invalido: ${value}`);
  }

  let normalized: string;

  if (text.includes(",") && text.includes(".")) {
    if (text.lastIndexOf(",") < text.lastIndexOf(".")) {
      throw new Error(`Monto ambiguo: ${value}. Usa punto para miles y coma para decimales.`);
    }
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    normalized = text.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, "");
  } else {
    normalized = text;
  }

  const parsed = Number(normalized);

  if (!/^-?\d+(\.\d+)?$/.test(normalized) || !Number.isFinite(parsed)) {
    throw new Error(`Monto invalido: ${value}`);
  }

  return parsed;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}
