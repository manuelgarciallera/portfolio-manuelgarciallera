// Measured originals; keep in sync with the media audit and its file-dimension test.
export const projectImageDimensions: Record<string, readonly [number, number]> = {
  '/projects/coordination-hub/testigo-workspace-demo-20260922.webp': [2880, 2100],
  '/projects/coordination-hub/testigo-memory-demo-20260922.webp': [2880, 2100],
  '/projects/coordination-hub/testigo-new-project-demo-20260922.webp': [2880, 2100],
  '/projects/buy-sell/figma-brand-navigation-hd.webp': [3200, 2331],
  '/projects/buy-sell/figma-list-states-hd.webp': [3200, 1776],
  '/projects/buy-sell/foundations-hd.webp': [3200, 2331],
  '/projects/buy-sell/product-hd.webp': [2514, 2958],
  '/projects/buy-sell/home-hd.webp': [2514, 3082],
  '/projects/laliga/club-home-hd.webp': [1425, 891],
  '/projects/laliga/infrastructure-home-hd.webp': [1424, 1106],
  '/projects/laliga/club-dark-hd.webp': [1425, 891],
  '/projects/laliga/club-mobile-hd.webp': [390, 843],
  '/projects/laliga/club-home-render-2x.webp': [2880, 1800],
  '/projects/laliga/infrastructure-home-render-2x.webp': [2880, 2212],
  '/projects/laliga/club-dark-render-2x.webp': [2880, 1800],
  '/projects/laliga/club-mobile-render-3x.webp': [1170, 2532],
  '/projects/theuxunion/mobile-discover-figma-hd.webp': [1290, 2796],
  '/projects/theuxunion/mobile-nodes-figma-hd.webp': [1290, 2796],
  '/projects/theuxunion/design-system-foundations-figma-hd.webp': [1920, 1080],
  '/projects/theuxunion/design-system-components-figma-hd.webp': [1920, 1080],
  '/projects/theuxunion/mvp-implemented-hd.webp': [2530, 1424],
  '/projects/theuxunion/pitch-nodes-figma-hd.webp': [1920, 1080],
  '/projects/nude-project/mobile-home.webp': [1290, 2796],
  '/projects/nude-project/mobile-bag.webp': [1290, 2796],
  '/projects/nude-project/navigation-system.webp': [1410, 1500],
  '/projects/nude-project/flow.webp': [3400, 2100],
}

export function isPortraitEvidence(src: string) {
  const size = projectImageDimensions[src]
  return Boolean(size && size[1] / size[0] > 1.65)
}
