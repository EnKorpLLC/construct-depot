import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Validation schema
const applicationSchema = z.object({
  companyDetails: z.string().min(1),
  businessType: z.string().min(1),
  taxId: z.string().min(1),
  websiteUrl: z.string().url().optional(),
  phoneNumber: z.string().min(1),
  address: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = applicationSchema.parse(body);

    // Check if user already has an application
    const existingApplication = await prisma.supplierApplication.findUnique({
      where: { userId: session.user.id },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Application already submitted" },
        { status: 400 }
      );
    }

    // Create supplier application
    const application = await prisma.supplierApplication.create({
      data: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    // Update user's supplier status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: "SUPPLIER",
        supplierStatus: "PENDING",
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Supplier application error:", error);
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