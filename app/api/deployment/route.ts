import { NextResponse } from "next/server";

import { deployApplication } from "@/lib/deployment";
import { logError, toClientMessage, toStatusCode } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await deployApplication(body);

    return NextResponse.json(result);
  } catch (error) {
    logError("api/deployment", error);

    return NextResponse.json(
      { error: toClientMessage(error, "Deployment failed. Please try again.") },
      { status: toStatusCode(error) },
    );
  }
}
