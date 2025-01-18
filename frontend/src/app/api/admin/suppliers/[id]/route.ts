import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { status } = updateSchema.parse(body);

    // Update application and user status in a transaction
    const [application] = await prisma.$transaction([
      prisma.supplierApplication.update({
        where: { id: params.id },
        data: {
          user: {
            update: {
              supplierStatus: status,
            },
          },
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    // TODO: Send email notification to supplier about status update

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating supplier application:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 