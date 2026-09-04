import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/features/redesign/components/SiteHeader.tsx"),
  "utf8",
);
const responsiveCss = fs.readFileSync(
  path.join(process.cwd(), "src/features/redesign/responsive.css"),
  "utf8",
);

const expectations = [
  [source.includes("NAV_ITEMS"), "Desktop and mobile navigation must share one link source."],
  [source.includes("aria-expanded={menuOpen}"), "Burger must expose its expanded state."],
  [source.includes('aria-controls="mobile-navigation"'), "Burger must identify the controlled menu."],
  [source.includes("event.key === 'Escape'"), "Escape must close the mobile menu."],
  [source.includes("document.body.style.overflow"), "Open mobile navigation must lock page scroll."],
  [source.includes("rd-mobile-nav"), "Mobile navigation surface is missing."],
  [responsiveCss.includes("@media (min-width: 768px) and (max-width: 1179px)"), "Tablet navigation breakpoint is missing."],
  [responsiveCss.includes(".rd-header .rd-menu-btn { display: flex"), "Tablet burger must override the base hidden state."],
  [responsiveCss.includes(".rd-header .rd-mobile-nav"), "Tablet menu surface must override the base hidden state."],
];

const failures = expectations.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) throw new Error(`Mobile navigation check failed:\n- ${failures.join("\n- ")}`);

console.log("Mobile navigation structure check passed.");
