import { describe, expect, it, vi } from "vitest";

import { createProgram } from "../src/index.js";

describe("cli", () => {
  it("prints source search as JSON for agents", async () => {
    const output: string[] = [];
    const write = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });

    try {
      const program = createProgram();
      await program.parseAsync(["--json", "search", "banco central"], {
        from: "user",
      });

      const parsed = JSON.parse(output.join(""));
      expect(parsed.sources.map((source: { id: string }) => source.id)).toContain("banco-central");
    } finally {
      write.mockRestore();
    }
  });
});
