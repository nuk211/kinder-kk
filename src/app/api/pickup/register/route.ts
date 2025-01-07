// src/app/api/pickup/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const sendSms = async (to: string, message: string) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to send SMS');
    }
    console.log('SMS sent successfully:', { to, message });
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, pickupBy, pickupDetails } = body;
    
    console.log('Received request body:', { childId, pickupBy, pickupDetails });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        childId,
        date: {
          gte: today,
          lt: tomorrow
        },
        status: 'PRESENT',
        checkOutTime: null,
      },
      include: {
        child: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!attendance) {
      const child = await prisma.child.findUnique({
        where: { id: childId },
        include: {
          parent: true
        }
      });

      if (child?.status === 'PRESENT') {
        const newAttendance = await prisma.attendance.create({
          data: {
            childId,
            date: today,
            status: 'PRESENT',
            checkInTime: new Date(),
          },
          include: {
            child: {
              include: {
                parent: true,
              },
            },
          },
        });
        
        const updatedAttendance = await prisma.attendance.update({
          where: {
            id: newAttendance.id,
          },
          data: {
            checkOutTime: new Date(),
            status: 'PICKED_UP'
          },
        });

        const message = pickupBy === 'parent'
          ? `تم الاستلام`
          : `تم الاستلام بواسطة ${pickupDetails.name}`;

        await sendSms(child.parent.phoneNumber, message);

        await prisma.child.update({
          where: { id: childId },
          data: { status: 'PICKED_UP' }
        });

        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { 
          error: 'No active attendance record found',
          details: {
            childExists: !!child,
            childStatus: child?.status,
            searchPeriod: {
              start: today.toISOString(),
              end: tomorrow.toISOString()
            }
          }
        },
        { status: 404 }
      );
    }

    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOutTime: new Date(),
        status: 'PICKED_UP'
      },
    });

    await prisma.child.update({
      where: { id: childId },
      data: { status: 'PICKED_UP' }
    });

    const message = pickupBy === 'parent'
      ? `تم الاستلام`
      : `تم الاستلام بواسطة ${pickupDetails.name}`;

    await sendSms(attendance.child.parent.phoneNumber, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to register pickup:', error);
    return NextResponse.json(
      { error: 'Failed to register pickup', details: error.message },
      { status: 500 }
    );
  }
}