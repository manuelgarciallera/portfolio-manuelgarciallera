"use client";

import { useEffect } from "react";
import type { Metric } from "web-vitals";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const DEFAULT_ENDPOINT = "/api/web-vitals";

function sendMetric(metric: Metric) {
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
  });

  const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT || DEFAULT_ENDPOINT;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
    return;
  }

  fetch(endpoint, {
    body,
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
}

export function WebVitalsReporter() {
  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS !== "false";
    if (!enabled) return;

    onCLS(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onFCP(sendMetric);
    onTTFB(sendMetric);
  }, []);

  return null;
}
