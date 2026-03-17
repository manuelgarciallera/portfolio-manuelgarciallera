import { clamp01, clampRange } from "./utils";

export function computePortfolioLayout(vp) {
  const isDesktopDown4k = vp.w >= 1024 && vp.w < 2560;
  const wNorm = clamp01((vp.w - 1280) / 1280);
  const hNorm = clamp01((vp.h - 800) / 640);
  const desktopFluid = isDesktopDown4k ? 0.86 + ((wNorm * 0.6 + hNorm * 0.4) * 0.14) : 1;
  const toFluidPx = (v) => `${Math.round(v * desktopFluid)}px`;
  const viewportContentH = Math.max(700, vp.h - 52);

  const heroGalleryPadTop = isDesktopDown4k ? clampRange(88, Math.round(viewportContentH * 0.1), 156) : Math.round(132 * desktopFluid);
  const heroGalleryPanelPadBottom = isDesktopDown4k ? 0 : 0;
  const heroGalleryPadBottom = isDesktopDown4k ? clampRange(96, Math.round(viewportContentH * 0.11), 168) : 0;
  const heroGalleryExtraBottom = Math.max(0, heroGalleryPadBottom - heroGalleryPanelPadBottom);
  const heroGalleryTitleBlock = isDesktopDown4k ? clampRange(60, Math.round(viewportContentH * 0.096), 92) : 84;
  const heroGalleryControlsMt = isDesktopDown4k ? clampRange(18, Math.round(viewportContentH * 0.035), 56) : Math.round(86 * desktopFluid);
  const heroGalleryControlH = isDesktopDown4k ? clampRange(46, Math.round(viewportContentH * 0.05), 54) : 58;
  const heroGalleryDotSize = isDesktopDown4k ? clampRange(7, Math.round(heroGalleryControlH * 0.16), 9) : 10;
  const heroGalleryActiveW = isDesktopDown4k ? clampRange(54, Math.round(heroGalleryControlH * 1.18), 66) : 74;
  const heroGalleryPillPadX = isDesktopDown4k ? clampRange(14, Math.round(heroGalleryControlH * 0.3), 18) : 20;
  const heroGalleryContentBudget =
    viewportContentH - heroGalleryPadTop - heroGalleryPanelPadBottom - heroGalleryTitleBlock - heroGalleryControlH - heroGalleryControlsMt;
  const heroGallerySlideH = isDesktopDown4k ? clampRange(452, Math.round(heroGalleryContentBudget * 0.99) + 10, 762) : Math.round(686 * desktopFluid);
  const heroGalleryTitleMb = isDesktopDown4k ? clampRange(18, Math.round(viewportContentH * 0.03), 42) : Math.round(42 * desktopFluid);

  const closeLookPadTop = isDesktopDown4k ? clampRange(6, Math.round(viewportContentH * 0.01), 14) : Math.round(10 * desktopFluid);
  const closeLookTitleBlock = isDesktopDown4k ? clampRange(70, Math.round(viewportContentH * 0.102), 116) : 94;
  const closeLookPanelPadBottom = isDesktopDown4k ? clampRange(22, Math.round(viewportContentH * 0.05), 78) : Math.round(170 * desktopFluid);
  const closeLookPadBottom = isDesktopDown4k
    ? closeLookPanelPadBottom + clampRange(26, Math.round(viewportContentH * 0.06), 62) + 70
    : Math.round(170 * desktopFluid);
  const closeLookExtraBottom = Math.max(0, closeLookPadBottom - closeLookPanelPadBottom);
  const closeLookPanelH = isDesktopDown4k
    ? clampRange(390, viewportContentH - closeLookPadTop - closeLookPanelPadBottom - closeLookTitleBlock, 800)
    : Math.round(800 * desktopFluid);
  const closeLookTitleMb = isDesktopDown4k ? clampRange(18, Math.round(viewportContentH * 0.03), 42) : Math.round(42 * desktopFluid);

  const heroTrackW = vp.w;
  const heroSlideW = heroTrackW < 760 ? Math.max(304, heroTrackW * 0.93) : Math.min(1280, Math.max(1030, heroTrackW * 0.68));
  const heroLeadX = Math.max(0, (heroTrackW - heroSlideW) / 2);
  const pagePadPx = Math.round(28 * desktopFluid);
  const closeLookContainerW = Math.min(1420, Math.max(0, heroTrackW - pagePadPx * 2));
  const closeLookContainerLeft = (heroTrackW - closeLookContainerW) / 2;
  const closeLookAlignLeft = Math.max(0, heroLeadX - closeLookContainerLeft);
  const navPadX = isDesktopDown4k ? clampRange(24, Math.round(vp.w * 0.015), 32) : Math.round(24 * desktopFluid);
  const navMaxW = isDesktopDown4k ? clampRange(1240, Math.round(vp.w * 0.7), 1440) : 1540;

  const rootVars = {
    "--nav-pad-x": `${navPadX}px`,
    "--nav-max-w": `${navMaxW}px`,
    "--hero-side-pad": toFluidPx(24),
    "--hero-min-h": toFluidPx(620),
    "--hero-full-h": "100dvh",
    "--page-pad-x": toFluidPx(28),
    "--sec-pad-y": toFluidPx(130),
    "--sec-pad-y-lg": toFluidPx(150),
    "--sec-pad-y-sm": toFluidPx(72),
    "--hero-gallery-pad-top": `${heroGalleryPadTop}px`,
    "--hero-gallery-pad-bottom": `${heroGalleryPadBottom}px`,
    "--hero-gallery-slide-h": `${heroGallerySlideH}px`,
    "--hero-gallery-controls-mt": `${heroGalleryControlsMt}px`,
    "--hero-gallery-control-h": `${heroGalleryControlH}px`,
    "--hero-gallery-dot-size": `${heroGalleryDotSize}px`,
    "--hero-gallery-active-dot-w": `${heroGalleryActiveW}px`,
    "--hero-gallery-pill-pad-x": `${heroGalleryPillPadX}px`,
    "--hero-gallery-title-mb": `${heroGalleryTitleMb}px`,
    "--hero-gallery-section-h": isDesktopDown4k ? `${viewportContentH + heroGalleryExtraBottom}px` : "84vh",
    "--featured-head-pad-top": toFluidPx(96),
    "--featured-head-pad-bottom": toFluidPx(56),
    "--close-look-pad-top": `${closeLookPadTop}px`,
    "--close-look-pad-bottom": `${closeLookPadBottom}px`,
    "--close-look-panel-h": `${closeLookPanelH}px`,
    "--close-look-title-mb": `${closeLookTitleMb}px`,
    "--close-look-section-h": isDesktopDown4k ? `${viewportContentH + closeLookExtraBottom}px` : "auto",
    "--device-min-h": toFluidPx(540),
  };

  return { rootVars, closeLookAlignLeft };
}
