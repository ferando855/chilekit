/**
 * Respuesta de tool con el resultado como JSON estructurado (para clientes que lo
 * soportan) y como texto (para compatibilidad con clientes anteriores).
 */
export function textJson(value: unknown) {
  const text = JSON.stringify(value, null, 2);
  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);

  return {
    content: [{ text, type: "text" as const }],
    ...(isObject ? { structuredContent: value as Record<string, unknown> } : {}),
  };
}
