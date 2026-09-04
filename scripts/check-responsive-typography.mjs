import fs from "node:fs";
import path from "node:path";

const cssPath = path.join(process.cwd(), "src/features/redesign/redesign.css");
const css = fs.readFileSync(cssPath, "utf8");

const requiredProfiles = [
  "panoramic",
  "monitor",
  "laptop-16",
  "laptop-14",
  "tablet",
  "mobile-xl",
  "mobile",
  "mobile-xs",
];

const failures = [];

for (const profile of requiredProfiles) {
  if (!css.includes(`type-profile: ${profile}`)) {
    failures.push(`Missing responsive type profile: ${profile}`);
  }
}

for (const token of [
  "--hero-inset",
  "--hero-content-inset",
  "--type-hero-name",
  "--type-hero-copy",
  "--type-section-title",
  "--type-body",
  "--type-label",
  "--type-capability-title",
  "--type-capability-copy",
]) {
  if (!css.includes(token)) failures.push(`Missing typography token: ${token}`);
}

if (!css.includes("text-wrap: balance")) {
  failures.push("Hero typography must balance wrapping across formats.");
}

for (const token of ["--hero-inset", "--hero-content-inset", "--type-hero-name", "--type-hero-copy", "--type-section-title", "--type-body", "--type-label", "--type-capability-title", "--type-capability-copy"]) {
  const declarations = css.match(new RegExp(`${token}:`, "g")) ?? [];
  if (declarations.length !== 1) {
    failures.push(`${token} must have one fluid declaration, found ${declarations.length}.`);
  }
}

if (!/--type-hero-name:\s*clamp\([^;]*calc\(/.test(css)) {
  failures.push("Hero type must interpolate continuously with clamp() and calc().");
}

if (failures.length) {
  throw new Error(`Responsive typography check failed:\n- ${failures.join("\n- ")}`);
}

console.log("Responsive typography check passed for 8 viewport profiles.");
