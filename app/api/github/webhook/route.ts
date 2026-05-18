import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/app/generated/prisma/client";
import { logError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

function verifyGitHubSignature(body: string, signature: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || !signature?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`;

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGitHubSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const deliveryId = request.headers.get("x-github-delivery");
  const eventType = request.headers.get("x-github-event");

  if (!deliveryId || !eventType) {
    return NextResponse.json(
      { error: "Missing GitHub webhook headers." },
      { status: 400 },
    );
  }

  try {
    const payload = JSON.parse(rawBody) as Prisma.InputJsonValue;

    await prisma.webhookEvent.upsert({
      where: { deliveryId },
      create: {
        provider: "github",
        eventType,
        deliveryId,
        rawPayload: payload,
        status: "pending",
      },
      update: {
        rawPayload: payload,
        status: "pending",
        errorMessage: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("api/github/webhook", error);

    return NextResponse.json(
      { error: "Failed to process webhook." },
      { status: 500 },
    );
  }
}
