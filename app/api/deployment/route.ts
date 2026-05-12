import { NextResponse } from "next/server";

import { deployParamsSchema } from "@/features/deployments/schemas/deploy-params.schema";
import { deployApplication } from "@/features/deployments/server/deployment";
import { logError, toClientMessage, toStatusCode } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const parsed = deployParamsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }

    const result = await deployApplication(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    logError("api/deployment", error);

    return NextResponse.json(
      { error: toClientMessage(error, "Deployment failed. Please try again.") },
      { status: toStatusCode(error) },
    );
  }
}
