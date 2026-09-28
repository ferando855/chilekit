export interface RutValidationResult {
  valid: boolean;
  normalized: string;
  formatted?: string;
  body?: string;
  checkDigit?: string;
}

// Un RUT real tiene a lo mas 9 digitos de cuerpo; el margen evita procesar entradas enormes.
const MAX_RUT_INPUT_LENGTH = 32;
const MAX_RUT_BODY_DIGITS = 9;

export function cleanRut(value: string): string {
  return value
    .slice(0, MAX_RUT_INPUT_LENGTH)
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
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

/**
 * Valida formato y digito verificador localmente. Nunca consulta identidad asociada.
 */
export function validateRut(value: string): RutValidationResult {
  const cleaned = cleanRut(value);
  const body = cleaned.slice(0, -1).replace(/^0+/, "");
  const checkDigit = cleaned.slice(-1);

  if (
    value.length > MAX_RUT_INPUT_LENGTH ||
    !checkDigit ||
    !/^\d+$/.test(body) ||
    body.length > MAX_RUT_BODY_DIGITS
  ) {
    return { valid: false, normalized: cleaned };
  }

  const valid = checkDigit === calculateRutCheckDigit(body);

  return {
    body,
    checkDigit,
    formatted: `${formatThousands(body)}-${checkDigit}`,
    normalized: `${body}-${checkDigit}`,
    valid,
  };
}

export function formatRut(value: string): string {
  const result = validateRut(value);

  if (!result.formatted) {
    throw new Error("RUT con formato invalido.");
  }

  return result.formatted;
}

function formatThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
