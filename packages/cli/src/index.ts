#!/usr/bin/env node

import { createProgram } from "./commands.js";
import { printError } from "./output.js";

export { createProgram };

if (import.meta.url === `file://${process.argv[1]}`) {
  const program = createProgram();

  program.parseAsync(process.argv).catch((error: unknown) => {
    printError(error);
    process.exitCode = 1;
  });
}
