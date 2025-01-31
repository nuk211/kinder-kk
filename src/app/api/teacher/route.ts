// app/api/teacher/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check if requester is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to create teacher accounts' },
        { status: 401 }
      );
    }

    const { email, password, name, phoneNumber } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create teacher account
    const teacher = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        role: 'TEACHER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher account created successfully',
      data: teacher,
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher account' },
      { status: 500 }
    );
  }
}