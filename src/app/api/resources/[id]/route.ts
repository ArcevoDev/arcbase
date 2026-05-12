// app/api/resources/[id]/route.ts
import { prisma } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: resourceWithRelations,
    });

    if (!resource)
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );

    return NextResponse.json(resource);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.resource.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 },
    );
  }
}
