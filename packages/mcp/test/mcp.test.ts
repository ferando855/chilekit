import { describe, expect, it } from "vitest";

import { textJson } from "../src/format.js";
import { createMcpServer } from "../src/index.js";

describe("mcp", () => {
  it("creates a server instance", () => {
    expect(createMcpServer()).toBeTruthy();
  });

  it("formats tool responses as JSON text", () => {
    expect(textJson({ ok: true })).toEqual({
      content: [{ text: '{\n  "ok": true\n}', type: "text" }],
    });
  });
});
