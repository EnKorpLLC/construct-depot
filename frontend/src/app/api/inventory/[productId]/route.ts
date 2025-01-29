import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { InventoryService } from '@/lib/services/InventoryService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quantity, type, reference } = await req.json();
    const productId = params.productId;

    const result = await InventoryService.updateStock(
      productId,
      quantity,
      type,
      session.user.id,
      reference
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = new URL(req.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await InventoryService.getStockHistory(
      params.productId,
      limit
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 