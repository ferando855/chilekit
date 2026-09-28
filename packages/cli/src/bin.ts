#!/usr/bin/env node

import { createProgram } from "./commands.js";
import { printError } from "./output.js";

const program = createProgram();
const wantsJson = process.argv.includes("--json");

program.parseAsync(process.argv).catch((error: unknown) => {
  printError(error, { json: wantsJson });
  process.exitCode = 1;
});
