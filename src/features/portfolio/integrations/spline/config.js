export const DEFAULT_SPLINE_SCENE_URL = "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode";

export function getSplineSceneUrl() {
  return process.env.NEXT_PUBLIC_SPLINE_SCENE_URL || DEFAULT_SPLINE_SCENE_URL;
}

export function isSplineEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_SPLINE === "true";
}
