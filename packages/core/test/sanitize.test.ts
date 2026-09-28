import { describe, expect, it } from "vitest";

import { sanitizeOptionalText, sanitizeText, sanitizeUrl } from "../src/index.js";

describe("sanitizeText", () => {
  it("strips ANSI escape sequences that could manipulate terminals", () => {
    expect(sanitizeText("Salud\u001b]8;;https://evil\u0007 Demo\u001b[2J")).toBe(
      "Salud]8;;https://evil Demo[2J",
    );
  });

  it("strips bidi overrides and zero-width characters (Trojan Source)", () => {
    expect(sanitizeText("admin‮⁦gnp.exe​")).toBe("admingnp.exe");
  });

  it("collapses whitespace when single-line output is required", () => {
    expect(sanitizeText("line 1\n\nIGNORE PREVIOUS\tINSTRUCTIONS", { singleLine: true })).toBe(
      "line 1 IGNORE PREVIOUS INSTRUCTIONS",
    );
  });

  it("truncates oversized payloads", () => {
    const text = sanitizeText("a".repeat(10_000), { maxLength: 50 });

    expect(text).toHaveLength(50);
    expect(text.endsWith("…")).toBe(true);
  });

  it("drops non-string and empty values", () => {
    expect(sanitizeOptionalText({ toString: () => "x" })).toBeUndefined();
    expect(sanitizeOptionalText("\u0000​ ")).toBeUndefined();
  });
});

describe("sanitizeUrl", () => {
  it.each(["javascript:alert(1)", "data:text/html,<script>", "file:///etc/passwd", "not a url"])(
    "rejects %s",
    (url) => {
      expect(sanitizeUrl(url)).toBeUndefined();
    },
  );

  it("keeps http(s) URLs", () => {
    expect(sanitizeUrl(" https://datos.gob.cl/a.csv ")).toBe("https://datos.gob.cl/a.csv");
  });
});
