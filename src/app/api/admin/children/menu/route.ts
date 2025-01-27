import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get unique children by name and parent
    const children = await prisma.child.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        parent: {
          select: {
            name: true,
          },
        },
      },
      distinct: ['name', 'parentId'], // This ensures no duplicates
      orderBy: {
        name: 'asc'  // Order by name
      }
    });

    // Format the response
    const formattedChildren = children.map(child => ({
      id: child.id,
      name: child.name,
      parentId: child.parentId,
      parentName: child.parent.name
    }));

    return NextResponse.json(formattedChildren);
  } catch (error) {
    console.error('Failed to fetch children menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children menu' },
      { status: 500 }
    );
  }
}