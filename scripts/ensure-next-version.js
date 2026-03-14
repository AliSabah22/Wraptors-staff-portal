#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");

const pkgPath = path.join(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const wanted = (pkg.dependencies && pkg.dependencies.next) || "15.2.9";
const wantedMajorMinor = wanted.replace(/[\^~]/, "").split(".").slice(0, 2).join(".");

let installed;
try {
  const nextPkg = require(path.join(process.cwd(), "node_modules", "next", "package.json"));
  installed = nextPkg.version;
} catch {
  console.error("Next.js is not installed. Run: npm install");
  process.exit(1);
}

const installedMajorMinor = installed.split(".").slice(0, 2).join(".");
if (installedMajorMinor !== wantedMajorMinor || installed.startsWith("15.1")) {
  console.error(
    `Next.js version mismatch: package.json wants ${wanted}, but node_modules has ${installed}.\n` +
    "Run: npm install\n" +
    "Then try again: npm run dev:clean  or  npm run build"
  );
  process.exit(1);
}
