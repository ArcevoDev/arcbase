import { prisma } from "@/lib/prisma/prisma"
import { NextResponse } from "next/server"
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers"

// temporary auth
async function getAuthenticatedUser() {
  return { id: "dev-user-id", username: "dev" }
}

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
      include: resourceWithRelations,
    })

    return NextResponse.json(resources)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    const data = await req.json()

    const resource = await prisma.resource.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        content: data.content,
        fileUrl: data.fileUrl,
        thumbnail: data.thumbnail,
        category: data.category,
        tags: data.tags ?? [],
        authorId: user.id,
      },
      include: resourceWithRelations,
    })

    return NextResponse.json(resource)
  } catch {
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    )
  }
}