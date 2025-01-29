import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { parse as csvParse } from 'csv-parse/sync';
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Validation schema for a single product from CSV
const csvProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) throw new Error("Price must be a positive number");
    return num;
  }),
  minOrderQuantity: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) throw new Error("Minimum order quantity must be a positive number");
    return num;
  }),
  unit: z.string().min(1, "Unit is required"),
  categories: z.string().transform((val) => val.split(',').map(cat => cat.trim())),
  specifications: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }),
  markup: z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 1) throw new Error("Markup must be 1 or greater");
    return num;
  }),
  images: z.string().transform((val) => val.split(';').map(url => url.trim()).filter(Boolean)),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }

    // Read and parse CSV
    const csvText = await file.text();
    const records = csvParse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Validate and transform each record
    const validationResults = await Promise.all(
      records.map(async (record: any, index: number) => {
        try {
          const validatedData = await csvProductSchema.parseAsync(record);
          return {
            success: true,
            data: validatedData,
            row: index + 2, // +2 because 1-based index and header row
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof z.ZodError ? error.errors : 'Invalid data',
            row: index + 2,
          };
        }
      })
    );

    // Check for any validation errors
    const errors = validationResults.filter(result => !result.success);
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
      }, { status: 400 });
    }

    // Insert valid products
    const validProducts = validationResults
      .filter((result): result is { success: true; data: any; row: number } => result.success)
      .map(result => result.data);

    const createdProducts = await prisma.$transaction(
      validProducts.map(product => 
        prisma.product.create({
          data: {
            ...product,
            supplierId: session.user.id,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      productsCreated: createdProducts.length,
    });
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    return new Response('Error processing file', { status: 500 });
  }
} 