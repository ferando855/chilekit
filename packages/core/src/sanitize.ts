// Texto de fuentes externas es input no confiable: puede traer secuencias ANSI que
// manipulan la terminal, caracteres bidi que ocultan contenido (Trojan Source) o
// payloads largos de prompt injection dirigidos a agentes.

// C0 (salvo \t y \n), DEL y C1: incluye ESC, que inicia secuencias ANSI.
// biome-ignore lint/suspicious/noControlCharactersInRegex: se eliminan a proposito.
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
// Overrides bidi, marcas de direccion y caracteres de ancho cero.
const INVISIBLE_CHARS = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

export const MAX_EXTERNAL_TEXT_LENGTH = 500;

export interface SanitizeTextOptions {
  maxLength?: number;
  singleLine?: boolean;
}

export function sanitizeText(value: string, options: SanitizeTextOptions = {}): string {
  const maxLength = options.maxLength ?? MAX_EXTERNAL_TEXT_LENGTH;
  let text = value.replace(CONTROL_CHARS, "").replace(INVISIBLE_CHARS, "");

  if (options.singleLine) {
    text = text.replace(/\s+/g, " ");
  }

  text = text.trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function sanitizeOptionalText(
  value: unknown,
  options: SanitizeTextOptions = {},
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = sanitizeText(value, options);

  return text.length > 0 ? text : undefined;
}

/**
 * Solo deja pasar URLs http(s) bien formadas; descarta javascript:, data:, file:, etc.
 */
export function sanitizeUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) {
    return undefined;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
