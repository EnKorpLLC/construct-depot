import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Validation schema for creating/updating products
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  minOrderQuantity: z.number().int().positive(),
  unit: z.string().min(1),
  categories: z.array(z.string()),
  specifications: z.record(z.any()).optional(),
  markup: z.number().min(1).default(1.2),
  images: z.array(z.string()).default([]), // Array of image URLs
});

// Schema for PATCH request
const patchProductSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
});

// GET - List supplier's products
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        supplierId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product
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
    console.error("Error creating product:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// PATCH - Update product
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPPLIER') {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = patchProductSchema.parse(body);

    // Verify product belongs to supplier
    const product = await prisma.product.findFirst({
      where: {
        id: validatedData.id,
        supplierId: session.user.id,
      },
    });

    if (!product) {
      return new Response('Product not found', { status: 404 });
    }

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: {
        id: validatedData.id,
      },
      data: {
        isActive: validatedData.isActive,
      },
    });

    return new Response(JSON.stringify(updatedProduct), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof z.ZodError) {
      return new Response('Invalid request data', { status: 400 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
} 