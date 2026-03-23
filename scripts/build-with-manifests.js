#!/usr/bin/env node
"use strict";

/**
 * Runs next build while keeping .next/server manifest files present.
 * Next.js 15 build can require these before webpack has written them; this script
 * keeps writing placeholders until the build completes.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = process.cwd();
const serverDir = path.join(root, ".next", "server");
const isWin = process.platform === "win32";

// Keep placeholders only for missing files; never overwrite any manifest that
// Next has already produced.
const manifests = [
  ["app-paths-manifest.json", {}],
  ["pages-manifest.json", {}],
  ["server-reference-manifest.json", {}],
];

function writeManifests() {
  try {
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    for (const [name, content] of manifests) {
      const filePath = path.join(serverDir, name);
      // Only write if missing — never overwrite manifests Next.js has already written
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
      }
    }
  } catch (_) {
    // ignore
  }
}

if (!fs.existsSync(path.join(root, ".next"))) {
  fs.mkdirSync(path.join(root, ".next"), { recursive: true });
}
writeManifests();

const interval = setInterval(writeManifests, 100);

const child = spawn("npx", ["next", "build"], {
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
