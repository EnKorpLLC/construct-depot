import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const categories = await prisma.category.findMany({
      where: {
        parentId: parentId || null,
      },
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
        ...(includeProducts && {
          products: {
            include: {
              images: true,
              supplier: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
          },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parentId') as string;
    const imageFile = formData.get('image') as File;

    let imageUrl: string | undefined;

    if (imageFile) {
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      imageFormData.append('type', 'category');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: imageFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await uploadResponse.json();
      imageUrl = url;
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        parentId: parentId || undefined,
        imageUrl,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parentId') as string;
    const imageFile = formData.get('image') as File;
    const removeImage = formData.get('removeImage') === 'true';

    let imageUrl: string | undefined | null = undefined;

    if (imageFile) {
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      imageFormData.append('type', 'category');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: imageFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await uploadResponse.json();
      imageUrl = url;
    } else if (removeImage) {
      imageUrl = null;
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        parentId: parentId || undefined,
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category has children or products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category._count.children > 0 || category._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with children or products' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 