import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const deployments = await prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deployments);
}
