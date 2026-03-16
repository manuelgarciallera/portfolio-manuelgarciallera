import { NextResponse } from "next/server";

type WebVitalPayload = {
  id: string;
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  navigationType?: string;
};

export async function POST(request: Request) {
  try {
    const metric = (await request.json()) as WebVitalPayload;
    if (!metric?.name || typeof metric.value !== "number") {
      return NextResponse.json({ ok: false, error: "Invalid web-vitals payload" }, { status: 400 });
    }

    // Hook for future analytics provider integration.
    console.log(
      "[web-vitals]",
      JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
      })
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to parse payload" }, { status: 400 });
  }
}
