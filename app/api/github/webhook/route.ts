import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/app/generated/prisma/client";
import { apiHandler } from "@/lib/api-handler";
import { HttpError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

function verifyGitHubSignature(body: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || !signature?.startsWith("sha256=")) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
}

export const POST = apiHandler(async (request: NextRequest) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGitHubSignature(rawBody, signature)) {
    throw new HttpError(401, "webhook_invalid_signature", "Invalid webhook signature.");
  }

  const deliveryId = request.headers.get("x-github-delivery");
  const eventType = request.headers.get("x-github-event");

  if (!deliveryId || !eventType) {
    throw new HttpError(400, "webhook_missing_headers", "Missing GitHub webhook headers.");
  }

  logger.info({ deliveryId, eventType }, "GitHub webhook received");

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
});
