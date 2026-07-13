import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  hero: path.join(root, "src/features/portfolio/sections/HeroSection.jsx"),
  legacy: path.join(root, "src/features/portfolio/sections/HeroSectionLegacy.jsx"),
  orb: path.join(root, "src/features/portfolio/three/HeroOrbCanvas.jsx"),
};

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required hero file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

const hero = readRequired(files.hero);
const legacy = readRequired(files.legacy);
const orb = readRequired(files.orb);

const expectations = [
  [hero.includes("pf-hero-liquid-proxy"), "HeroSection must render the controlled liquid proxy."],
  [!hero.includes("HeroOrbCanvas"), "HeroSection must not render the unfinished 3D canvas."],
  [hero.includes("<h1"), "HeroSection must keep a real DOM h1 for SEO and accessibility."],
  [hero.includes("hero-orb-fallback"), "HeroSection must include a DOM fallback for non-WebGL contexts."],
  [legacy.includes("Dise&ntilde;o productos digitales"), "HeroSectionLegacy must preserve the previous hero copy."],
  [orb.includes("MeshTransmissionMaterial"), "HeroOrbCanvas must use Drei MeshTransmissionMaterial for the glass orb."],
  [orb.includes("<Text"), "HeroOrbCanvas must render text in the 3D scene for refraction."],
  [orb.includes("prefers-reduced-motion"), "HeroOrbCanvas must respect reduced-motion preferences."],
];

const failures = expectations.filter(([passed]) => !passed).map(([, message]) => message);

if (failures.length) {
  throw new Error(`Hero structure check failed:\n- ${failures.join("\n- ")}`);
}

console.log("Hero structure check passed.");
