import { existsSync, mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const mode = process.argv[2] || "desktop";
const url = process.env.LIGHTHOUSE_URL || "http://localhost:3000";
const outDir = path.resolve(".lighthouse");
mkdirSync(outDir, { recursive: true });

const outputBase = path.join(outDir, `report-${mode}`);
const reportFiles = [`${outputBase}.report.html`, `${outputBase}.report.json`];
for (const reportFile of reportFiles) {
  if (existsSync(reportFile)) rmSync(reportFile, { force: true });
}

const args = [
  url,
  "--only-categories=performance,accessibility,best-practices,seo",
  "--chrome-flags=--headless=new --disable-gpu --no-sandbox",
  "--output=html",
  "--output=json",
  `--output-path=${outputBase}`,
];

if (mode === "desktop") {
  args.push("--preset=desktop");
}

if (mode === "mobile") {
  args.push("--form-factor=mobile");
  args.push("--screenEmulation.mobile=true");
  args.push("--screenEmulation.width=390");
  args.push("--screenEmulation.height=844");
  args.push("--screenEmulation.deviceScaleFactor=2.625");
}

const child = spawn("npm", ["exec", "--yes", "lighthouse@13.4.0", "--", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  const reportsCreated = reportFiles.every((reportFile) => existsSync(reportFile));
  if (code && reportsCreated) {
    console.warn(`[lighthouse] Chrome cleanup returned ${code}, but both reports were written successfully.`);
    process.exit(0);
  }
  process.exit(code ?? 1);
});
