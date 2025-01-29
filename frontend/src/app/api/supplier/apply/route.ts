import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Validation schema
const applicationSchema = z.object({
  companyDetails: z.string().min(1, "Company details are required"),
  businessType: z.string().min(1, "Business type is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  websiteUrl: z.string().url().optional().nullable(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Business address is required"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to submit an application" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate request body
    const validatedData = applicationSchema.parse(body);

    // Check if user already has an application
    const existingApplication = await prisma.supplierApplication.findUnique({
      where: { userId: session.user.id },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already submitted an application" },
        { status: 400 }
      );
    }

    // Create application and update user status
    const [application] = await prisma.$transaction([
      prisma.supplierApplication.create({
        data: {
          userId: session.user.id,
          ...validatedData,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          role: "SUPPLIER",
          supplierStatus: "PENDING",
        },
      }),
    ]);

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