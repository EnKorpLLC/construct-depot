import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OrderStatus } from '@prisma/client';
import { EnhancedValidationService } from '@/lib/services/EnhancedValidationService';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/services/NotificationService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { targetStatus, metadata } = await req.json();
    const orderId = params.orderId;

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate the transition
    const validationResult = await EnhancedValidationService.validateTransition({
      userId: session.user.id,
      userRole: session.user.role,
      orderId: order.id,
      currentStatus: order.status as OrderStatus,
      targetStatus: targetStatus as OrderStatus,
      metadata
    });

    if (validationResult) {
      return NextResponse.json(
        { error: validationResult.message, code: validationResult.code },
        { status: 400 }
      );
    }

    // Create order history entry
    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        userId: session.user.id,
        fromStatus: order.status,
        toStatus: targetStatus,
        note: metadata?.note || `Status changed from ${order.status} to ${targetStatus}`,
        metadata: metadata || {}
      },
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: targetStatus,
        ...(metadata?.trackingNumber && { trackingNumber: metadata.trackingNumber }),
        ...(metadata?.carrier && { carrier: metadata.carrier }),
        ...(metadata?.deliverySignature && { deliverySignature: metadata.deliverySignature }),
        ...(metadata?.deliveryConfirmation && { deliveryConfirmation: metadata.deliveryConfirmation })
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Send notifications
    await NotificationService.createOrderStatusNotification(
      orderId,
      order.status as OrderStatus,
      targetStatus as OrderStatus,
      order.user.id
    );

    // Handle inventory updates for PROCESSING status
    if (targetStatus === OrderStatus.PROCESSING) {
      await Promise.all(
        updatedOrder.items.map(async (item) => {
          await prisma.product.update({
            where: { id: item.product.id },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });
        })
      );
    }

    // Handle inventory releases for CANCELLED status
    if (targetStatus === OrderStatus.CANCELLED && order.status === OrderStatus.PROCESSING) {
      await Promise.all(
        updatedOrder.items.map(async (item) => {
          await prisma.product.update({
            where: { id: item.product.id },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });
        })
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
} 