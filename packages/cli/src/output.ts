import { sanitizeText } from "@chilekit/core";

export interface OutputOptions {
  json?: boolean;
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printRows(
  headers: string[],
  rows: Array<Array<string | number | boolean | undefined>>,
): void {
  // Las celdas pueden traer texto de terceros: se limpian secuencias de control
  // para que no puedan manipular la terminal.
  const normalizedRows = rows.map((row) =>
    row.map((cell) => sanitizeText(String(cell ?? ""), { maxLength: 200, singleLine: true })),
  );
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...normalizedRows.map((row) => row[index]?.length ?? 0)),
  );
  const format = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index] ?? cell.length)).join("  ");

  process.stdout.write(`${format(headers)}\n`);
  process.stdout.write(`${format(widths.map((width) => "-".repeat(width)))}\n`);

  for (const row of normalizedRows) {
    process.stdout.write(`${format(row)}\n`);
  }
}

export function printError(error: unknown, options: OutputOptions = {}): void {
  const message = error instanceof Error ? error.message : String(error);

  if (options.json) {
    process.stderr.write(`${JSON.stringify({ error: { message } })}\n`);
    return;
  }

  process.stderr.write(`chilekit: ${message}\n`);
}
