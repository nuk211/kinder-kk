import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for creating a child
const childCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['ABSENT', 'PRESENT', 'PICKUP_REQUESTED', 'PICKED_UP']).optional(),
});

// Function to generate a consistent QR code
const generateQRCode = async () => {
  const count = await prisma.child.count();
  return `QR${count + 1}`;
};

// Function to fix existing QR codes
const fixQRCode = async () => {
  const children = await prisma.child.findMany();
  let counter = 1;
  for (const child of children) {
    if (!child.qrCode || child.qrCode.startsWith('default')) {
      const updatedQRCode = `QR${counter++}`;
      await prisma.child.update({
        where: { id: child.id },
        data: { qrCode: updatedQRCode },
      });
      console.log(`Fixed QR Code for ${child.name}: ${updatedQRCode}`);
    }
  }
};

// ** GET: Fetch all children with unique entries **
export async function GET() {
  try {
    const children = await prisma.child.findMany({
      where: {
        OR: [
          { registrationType: { not: null } },  // Include children with registration
          { registrationType: null }            // Also include children without registration
        ]
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        fees: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Process children to include financial information
    const processedChildren = children.map(child => {
      const totalAmount = child.fees[0]?.totalAmount || 0;
      const paidAmount = child.payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        ...child,
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
      };
    });

    // Create a Map to store unique children based on name and parentId
    const uniqueChildrenMap = new Map();

    processedChildren.forEach(child => {
      const key = `${child.name}-${child.parent.id}`;
      if (!uniqueChildrenMap.has(key)) {
        uniqueChildrenMap.set(key, child);
      }
    });

    // Convert Map back to array and sort by name
    const uniqueChildren = Array.from(uniqueChildrenMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(uniqueChildren);
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}

// ** POST: Create a new child **
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, status, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    // Validate if the parent exists
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.role !== 'PARENT') {
      return NextResponse.json({ error: 'Invalid parent selected' }, { status: 400 });
    }

    // Generate a unique QR code
    const qrCode = await generateQRCode();

    // Create the child with the selected parent
    const child = await prisma.child.create({
      data: {
        name,
        status: status || 'ABSENT',
        parentId: parent.id,
        qrCode,
      },
      include: {
        parent: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json(child, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating child:', error);
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 });
  }
}

// ** PUT: Update an existing child **
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const childId = url.pathname.split('/').pop();
    const body = await request.json();

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Validate input
    const validatedData = childCreateSchema.partial().parse(body);

    // Check if the child exists
    const childExists = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!childExists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Update the child
    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: validatedData,
      include: {
        parent: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json(updatedChild);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating child:', error);
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 });
  }
}

// ** DELETE: Reset registration and delete related records **
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const childId = url.pathname.split('/').pop();

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Check if the child exists
    const childExists = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!childExists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Delete related records and reset child's registration in a transaction
    await prisma.$transaction([
      // Delete payments
      prisma.payment.deleteMany({
        where: { childId },
      }),
      // Delete fees
      prisma.fee.deleteMany({
        where: { childId },
      }),
      // Update the child record instead of deleting it
      prisma.child.update({
        where: { id: childId },
        data: {
          registrationType: null,     // Reset registration type
          status: 'ABSENT',           // Reset status to default
        },
      }),
    ]);

    return NextResponse.json({ message: 'Registration records deleted successfully' });
  } catch (error) {
    console.error('Error resetting registration:', error);
    return NextResponse.json({ error: 'Failed to reset registration' }, { status: 500 });
  }
}

// ** Optional: GET for fixing QR codes **
export async function FIX_QR_CODES(request: NextRequest) {
  try {
    await fixQRCode();
    return NextResponse.json({ message: 'QR codes fixed successfully' });
  } catch (error) {
    console.error('Error fixing QR codes:', error);
    return NextResponse.json({ error: 'Failed to fix QR codes' }, { status: 500 });
  }
}