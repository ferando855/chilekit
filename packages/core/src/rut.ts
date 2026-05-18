export interface RutValidationResult {
  valid: boolean;
  normalized: string;
  body?: string;
  checkDigit?: string;
}

export function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function calculateRutCheckDigit(body: string): string {
  if (!/^\d+$/.test(body)) {
    throw new Error("RUT body must contain only digits.");
  }

  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const value = 11 - (sum % 11);

  if (value === 11) {
    return "0";
  }

  if (value === 10) {
    return "K";
  }

  return String(value);
}

export function validateRut(value: string): RutValidationResult {
  const cleaned = cleanRut(value);

  if (cleaned.length < 2) {
    return { valid: false, normalized: cleaned };
  }

  const body = cleaned.slice(0, -1);
  const checkDigit = cleaned.slice(-1);
  const expected = calculateRutCheckDigit(body);

  return {
    body,
    checkDigit,
    normalized: `${body}-${checkDigit}`,
    valid: checkDigit === expected,
  };
}
