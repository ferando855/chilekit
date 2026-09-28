import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { textJson } from "../src/format.js";
import { createMcpServer } from "../src/index.js";

describe("mcp", () => {
  const client = new Client({ name: "chilekit-test", version: "0.0.0" });

  beforeAll(async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await createMcpServer().connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
  });

  const callJson = async (name: string, args: Record<string, unknown>) => {
    const result = await client.callTool({ arguments: args, name });
    const [content] = result.content as Array<{ text: string; type: string }>;

    return { isError: Boolean(result.isError), text: content?.text ?? "" };
  };

  it("exposes the documented tools", async () => {
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual(
      expect.arrayContaining([
        "get_commune_info",
        "get_economic_indicator",
        "get_holiday",
        "get_holidays",
        "get_source_manifest",
        "list_communes",
        "search_chile_sources",
        "search_open_datasets",
      ]),
    );
  });

  it("answers holiday queries from bundled data", async () => {
    const { isError, text } = await callJson("get_holiday", { date: "2026-09-18" });

    expect(isError).toBe(false);
    expect(JSON.parse(text)).toMatchObject({ isHoliday: true });
  });

  it("returns tool errors instead of crashing on bad input", async () => {
    const invalid = await callJson("get_holidays", { year: 1492 });
    const ambiguous = await callJson("list_communes", { region: "Los" });

    expect(invalid.isError).toBe(true);
    expect(ambiguous.isError).toBe(true);
    expect(ambiguous.text).toMatch(/ambigua/);
  });

  it("formats tool responses as JSON text", () => {
    expect(textJson({ ok: true })).toEqual({
      content: [{ text: '{\n  "ok": true\n}', type: "text" }],
    });
  });
});
