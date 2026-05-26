import { NextResponse } from "next/server";

import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const deployments = await prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deployments);
});
