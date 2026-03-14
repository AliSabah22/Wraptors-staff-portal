#!/usr/bin/env node
"use strict";

/**
 * Runs next dev while keeping .next/server manifest files present.
 * Next.js 15 dev can remove them during compilation; this script recreates
 * them every 80ms so the server never hits ENOENT.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = process.cwd();
const serverDir = path.join(root, ".next", "server");
const isWin = process.platform === "win32";
// Use npx so project's next is used (handles path-with-spaces and PATH)
const nextArgs = ["next", "dev"];
const nextCmd = "npx";

const manifests = [
  ["pages-manifest.json", {}],
  ["app-paths-manifest.json", {}],
  ["server-reference-manifest.json", {}],
  [
    "middleware-manifest.json",
    {
      sortedMiddleware: [],
      middleware: {},
      functions: {},
      matchers: [],
    },
  ],
];

function writeManifests(onlyIfMissing = false) {
  try {
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    for (const [name, content] of manifests) {
      const filePath = path.join(serverDir, name);
      if (onlyIfMissing && fs.existsSync(filePath)) continue;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
    }
  } catch (_) {
    // ignore
  }
}

// Ensure .next/server and placeholder manifests exist before Next starts
if (!fs.existsSync(path.join(root, ".next"))) {
  fs.mkdirSync(path.join(root, ".next"), { recursive: true });
}
writeManifests();
console.error("[dev-with-manifests] Placeholder manifests ready. Starting Next.js (only recreating missing manifests).");

// Recreate only missing files (never overwrite). Run every 20ms so we beat Next's require().
function ensureLoop() {
  try {
    if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
    for (const [name, content] of manifests) {
      const filePath = path.join(serverDir, name);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
      }
    }
  } catch (_) {}
}
const interval = setInterval(ensureLoop, 10);
try {
  fs.watch(serverDir, { persistent: false }, (event, filename) => {
    if (filename && manifests.some(([n]) => n === filename)) ensureLoop();
  });
} catch (_) {
  // watch can fail if dir doesn't exist yet; interval still runs
}

const child = spawn(nextCmd, nextArgs, {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  clearInterval(interval);
  process.exit(code != null ? code : 0);
});

process.on("SIGINT", () => {
  clearInterval(interval);
  child.kill("SIGINT");
});
process.on("SIGTERM", () => {
  clearInterval(interval);
  child.kill("SIGTERM");
});
