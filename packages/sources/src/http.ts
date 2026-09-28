import { VERSION } from "./version.js";

export type FetchLike = typeof fetch;

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

// Unicos hosts que ChileKit contacta. Cualquier otro destino (incluido un redirect)
// se rechaza, asi un conector nunca puede usarse para alcanzar redes internas.
export const ALLOWED_HOSTS = new Set(["api.boostr.cl", "datos.gob.cl", "mindicador.cl"]);

export interface FetchJsonOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxBytes?: number;
}

export class SourceRequestError extends Error {
  constructor(
    message: string,
    readonly sourceHost: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SourceRequestError";
  }
}

export async function fetchJson(
  url: URL | string,
  options: FetchJsonOptions = {},
): Promise<unknown> {
  const target = new URL(url);
  assertAllowedUrl(target);

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? resolveTimeout();
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  let response: Response;

  try {
    response = await fetchImpl(target, {
      headers: {
        accept: "application/json",
        "user-agent": `chilekit/${VERSION} (+https://github.com/ferando855/chilekit)`,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "TimeoutError"
        ? `sin respuesta tras ${timeoutMs} ms`
        : error instanceof Error
          ? error.message
          : String(error);
    throw new SourceRequestError(`${target.host}: ${reason}`, target.host);
  }

  if (response.url) {
    assertAllowedUrl(new URL(response.url));
  }

  if (!response.ok) {
    throw new SourceRequestError(
      `${target.host} returned ${response.status}`,
      target.host,
      response.status,
    );
  }

  const text = await readTextWithLimit(response, maxBytes, target.host);

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SourceRequestError(`${target.host} returned invalid JSON`, target.host);
  }
}

export function assertAllowedUrl(url: URL): void {
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new SourceRequestError(`Destino no permitido: ${url.origin}`, url.hostname);
  }
}

async function readTextWithLimit(response: Response, maxBytes: number, host: string) {
  const declared = Number(response.headers.get("content-length"));

  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new SourceRequestError(`${host}: respuesta excede ${maxBytes} bytes`, host);
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    received += value.byteLength;

    if (received > maxBytes) {
      await reader.cancel();
      throw new SourceRequestError(`${host}: respuesta excede ${maxBytes} bytes`, host);
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

function resolveTimeout(): number {
  const fromEnv = Number(process.env.CHILEKIT_TIMEOUT_MS);

  return Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv <= 120_000
    ? fromEnv
    : DEFAULT_TIMEOUT_MS;
}
