import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Validation schema
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  minOrderQuantity: z.number().int().positive(),
  unit: z.string().min(1),
  categories: z.array(z.string()),
  specifications: z.record(z.any()).optional(),
  markup: z.number().min(1).default(1.2),
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

    if (session.user.role !== 'SUPPLIER') {
      return NextResponse.json(
        { error: "Only suppliers can create products" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        supplierId: session.user.id,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');

    // If supplierId is provided and user is not that supplier
    if (supplierId && session.user.id !== supplierId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        supplierId: supplierId || session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 