import { mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const mode = process.argv[2] || "desktop";
const url = process.env.LIGHTHOUSE_URL || "http://localhost:3000";
const outDir = path.resolve(".lighthouse");
mkdirSync(outDir, { recursive: true });

const outputBase = path.join(outDir, `report-${mode}`);

const args = [
  url,
  "--only-categories=performance,accessibility,best-practices,seo",
  "--chrome-flags=--headless=new",
  "--chrome-flags=--disable-gpu",
  "--chrome-flags=--no-sandbox",
  "--output=html",
  "--output=json",
  `--output-path=${outputBase}`,
];

if (mode === "desktop") {
  args.push("--preset=desktop");
}

if (mode === "mobile") {
  args.push("--form-factor=mobile");
  args.push("--screenEmulation.mobile");
}

const child =
  process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", `npm exec lighthouse -- ${args.join(" ")}`], {
        stdio: "inherit",
      })
    : spawn("npm", ["exec", "lighthouse", "--", ...args], {
        stdio: "inherit",
      });

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
