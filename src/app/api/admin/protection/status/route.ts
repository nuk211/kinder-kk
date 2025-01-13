import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const page = searchParams.get('page');

  if (!page) {
    return NextResponse.json(
      { error: 'Page parameter is required' },
      { status: 400 }
    );
  }

  try {
    const protection = await prisma.adminProtection.findUnique({
      where: { page },
    });

    return NextResponse.json({
      isLocked: protection?.isLocked ?? true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check protection status' },
      { status: 500 }
    );
  }
}