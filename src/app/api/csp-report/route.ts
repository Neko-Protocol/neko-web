import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_000;

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (body.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  try {
    const parsed = JSON.parse(body) as { "csp-report"?: unknown };
    const report = parsed["csp-report"] ?? parsed;
    console.warn("csp_violation", JSON.stringify(report));
  } catch {}

  return new NextResponse(null, { status: 204 });
}
