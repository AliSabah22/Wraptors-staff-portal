#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const manifestPath = path.join(process.cwd(), ".next", "server", "middleware-manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.log("Next.js .next build missing or incomplete — running build first…");
  execSync("next build", { stdio: "inherit", cwd: process.cwd() });
}
