import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram } from "../src/index.js";

async function run(args: string[]) {
  const stdout: string[] = [];
  const write = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout.push(String(chunk));
    return true;
  });
  const program = createProgram().exitOverride();
  program.configureOutput({
    outputError: () => undefined,
    writeErr: () => undefined,
    writeOut: () => undefined,
  });

  try {
    await program.parseAsync(args, { from: "user" });
    return stdout.join("");
  } finally {
    write.mockRestore();
  }
}

describe("cli", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints source search as JSON for agents", async () => {
    const parsed = JSON.parse(await run(["--json", "search", "banco central"]));

    expect(parsed.sources.map((source: { id: string }) => source.id)).toContain("banco-central");
  });

  it("answers holiday lookups offline for bundled years", async () => {
    const parsed = JSON.parse(await run(["feriado", "2026-09-19", "--json"]));

    expect(parsed).toMatchObject({ date: "2026-09-19", isHoliday: true });
  });

  it("returns commune candidates when the query is ambiguous", async () => {
    const parsed = JSON.parse(await run(["comuna", "San", "--json"]));

    expect(parsed.commune).toBeNull();
    expect(parsed.candidates.length).toBeGreaterThan(1);
  });

  it.each([
    [["feriado", "2026-13-45"]],
    [["feriados", "abc"]],
    [["search", "ipc", "--limit", "abc"]],
    [["datasets", "salud", "--rows", "1000"]],
  ])("rejects invalid arguments: %j", async (args) => {
    await expect(run(args)).rejects.toThrow();
  });
});
