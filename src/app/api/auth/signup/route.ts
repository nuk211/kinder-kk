import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { prisma } from "@/lib/prisma";
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: Role.PARENT // Using enum from Prisma
      }
    });

    return NextResponse.json({ message: 'User created successfully', userId: newUser.id }, { status: 201 });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Detailed signup error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}