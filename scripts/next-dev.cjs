"use strict";

/**
 * Always start Turbopack dev. IDEs often run `next dev` without `--turbo`, which hits
 * Windows Webpack server chunk bugs (`Cannot find module './230.js'`).
 *
 * Extra args are forwarded, e.g. `npm run dev -- -p 3005`
 */
const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const passThrough = process.argv.slice(2);
const args = [nextBin, "dev", "--turbo", ...passThrough];

/** Same as `npm run dev` — forces Turbopack even if argv parsing ever regresses on Windows. */
const child = spawn(process.execPath, args, {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, TURBOPACK: "1" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
