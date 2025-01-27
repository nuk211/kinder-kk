import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { page, password } = await req.json();
    const protection = await prisma.adminProtection.findUnique({
      where: { page },
    });

    if (!protection) {
      return NextResponse.json(
        { error: 'Page protection not found' },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(password, protection.password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    await prisma.adminProtection.update({
      where: { page },
      data: { isLocked: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { page } = await req.json();
    await prisma.adminProtection.update({
      where: { page },
      data: { isLocked: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to lock page' },
      { status: 500 }
    );
  }
}