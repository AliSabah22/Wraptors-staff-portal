#!/usr/bin/env node
"use strict";

/**
 * Ensures .next/server exists with minimal manifest files so Next.js build/dev
 * don't hit ENOENT when reading pages-manifest.json or middleware-manifest.json.
 * Run before: next build / next dev (e.g. in dev:clean).
 * In dev, Next may remove these during compilation; use --watch to keep recreating them.
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const serverDir = path.join(root, ".next", "server");

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

function writeManifests() {
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  for (const [name, content] of manifests) {
    const filePath = path.join(serverDir, name);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
  }
}

const watch = process.argv.includes("--watch");
if (watch) {
  writeManifests();
  const interval = setInterval(writeManifests, 2000);
  setTimeout(() => clearInterval(interval), 45000);
} else {
  writeManifests();
}
