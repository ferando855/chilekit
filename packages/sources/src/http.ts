import { VERSION } from "./version.js";

export type FetchLike = typeof fetch;

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;

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

  // Un unico signal cubre conexion, redirects y lectura del body.
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const response = await fetchFollowingAllowedRedirects(target, fetchImpl, signal);

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
  } catch (error) {
    if (error instanceof SourceRequestError) {
      throw error;
    }

    const reason =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
        ? `sin respuesta tras ${timeoutMs} ms`
        : error instanceof Error
          ? error.message
          : String(error);
    throw new SourceRequestError(`${target.host}: ${reason}`, target.host);
  }
}

/**
 * Sigue redirects manualmente y valida cada destino contra la allowlist ANTES de
 * contactarlo. Con redirect: "follow" el request al host no permitido ya habria salido.
 */
async function fetchFollowingAllowedRedirects(
  target: URL,
  fetchImpl: FetchLike,
  signal: AbortSignal,
): Promise<Response> {
  let current = target;

  for (let hop = 0; ; hop += 1) {
    assertAllowedUrl(current);

    const response = await fetchImpl(current, {
      headers: {
        accept: "application/json",
        "user-agent": `chilekit/${VERSION} (+https://github.com/ferando855/chilekit)`,
      },
      redirect: "manual",
      signal,
    });
    const location = response.headers.get("location");

    if (response.status >= 300 && response.status < 400 && location) {
      if (hop >= MAX_REDIRECTS) {
        throw new SourceRequestError(`${target.host}: demasiados redirects`, target.host);
      }

      current = new URL(location, current);
      continue;
    }

    if (response.url) {
      assertAllowedUrl(new URL(response.url));
    }

    return response;
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
