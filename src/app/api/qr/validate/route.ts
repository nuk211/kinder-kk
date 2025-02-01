import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient, ChildStatus, AttendanceStatus, Role } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendStatusEmail(
  parentEmail: string,
  studentName: string,
  status: ChildStatus,
  timestamp: Date
) {
  try {
    const statusMessage = {
      PRESENT: 'قد وصل إلى الحضانة',
      PICKED_UP: 'غادر',
      ABSENT: 'تم تسجيله غائباً',
      PICKUP_REQUESTED: 'تم طلب استلامه'
    }[status] || 'تم تحديث الحالة';

    const formattedTime = timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Riyadh'
    });

    const { data, error } = await resend.emails.send({
      from: 'SunWay Attendance <status@sunwayiq.com>',
      to: parentEmail,
      subject: `تحديث حالة ${studentName}`,
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; text-align: right;">
        <!-- Kindergarten Logo -->
        <img src="https://www.sunwayiq.com/_next/image?url=%2Fassets%2FLogo.png&w=48&q=75" alt="Kindergarten Logo" style="width: 150px; margin-bottom: 20px;">
  
        <h1 style="color: #6b46c1;">تحديث الحالة</h1>
          <p style="font-size: 16px; line-height: 1.5;">
            السلام عليكم ورحمة الله وبركاته،
          </p>
          <p style="font-size: 16px; line-height: 1.5;">
            نود إعلامكم بأن ${studentName} ${statusMessage} في تمام الساعة ${formattedTime}.
          </p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #4b5563;">
              <strong>الطالب/ة:</strong> ${studentName}<br>
              <strong>الحالة:</strong> ${status === 'PRESENT' ? 'حاضر' : 
                                      status === 'PICKED_UP' ? 'في طريقه الى المنزل' : 
                                      status === 'ABSENT' ? 'غائب' : 
                                      status === 'PICKUP_REQUESTED' ? 'تم طلب الاستلام' : 
                                      'غير معروف'}<br>
              <strong>الوقت:</strong> ${formattedTime}
            </p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            هذه رسالة آلية، يرجى عدم الرد عليها.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('------ STARTING ATTENDANCE PROCESS ------');
    // @ts-ignore
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('Authentication failed: No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { qrCode } = await request.json();
    console.log('Received QR code:', qrCode);

    const result = await prisma.$transaction(async (tx) => {
      console.log('\n1. Checking user authorization...');
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || (user.role !== Role.ADMIN && user.role !== Role.MISS)) {
        console.error('Authorization failed for user:', user?.id);
        throw new Error('Not authorized');
      }

      console.log('\n2. Finding student...');
      const student = await tx.child.findFirst({
        where: { qrCode: qrCode },
        include: {
          parent: true,
          attendanceRecords: {
            where: {
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(24, 0, 0, 0)),
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!student) {
        console.error('Student not found with QR code:', qrCode);
        throw new Error('Student not found');
      }

      // Add cooldown check
      const currentTime = new Date();
      const lastUpdate = await tx.attendance.findFirst({
        where: { childId: student.id },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      });

      if (lastUpdate?.updatedAt) {
        const timeSinceLastUpdate = currentTime.getTime() - lastUpdate.updatedAt.getTime();
        if (timeSinceLastUpdate < 1000) { // 1000ms = 1 second
          console.log('Cooldown active - ignoring duplicate scan');
          // Return the current status without making any changes
          return {
            student: {
              id: student.id,
              name: student.name,
              status: student.status
            },
            status: student.status,
            message: 'No change',
            timestamp: currentTime,
          };
        }
      }

      console.log('\n3. Current student status:', student.status);
      console.log('Existing attendance records:', student.attendanceRecords);

      const existingAttendance = student.attendanceRecords[0];
      let attendanceStatus;
      let childStatus;
      let message;

      // Fixed status transitions
      if (student.status === ChildStatus.ABSENT) {
        console.log('Case: ABSENT -> PRESENT');
        attendanceStatus = AttendanceStatus.PRESENT;
        childStatus = ChildStatus.PRESENT;
        message = 'Marked as present';
      } else if (student.status === ChildStatus.PRESENT) {
        console.log('Case: PRESENT -> PICKED_UP');
        attendanceStatus = AttendanceStatus.PICKED_UP;
        childStatus = ChildStatus.PICKED_UP;
        message = 'Marked for pickup';
      } else if (student.status === ChildStatus.PICKED_UP) {
        console.log('Case: PICKED_UP -> PRESENT');
        attendanceStatus = AttendanceStatus.PRESENT;
        childStatus = ChildStatus.PRESENT;
        message = 'Returned to present';
      } else {
        console.error('Unhandled student status:', student.status);
        throw new Error('Invalid student status');
      }

      console.log('\n4. Updating attendance...');
      if (!existingAttendance) {
        console.log('Creating new attendance record');
        await tx.attendance.create({
          data: {
            childId: student.id,
            status: attendanceStatus,
            date: currentTime,
            checkInTime: currentTime,
          },
        });
      } else {
        console.log('Updating existing attendance record');
        await tx.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: attendanceStatus,
            updatedAt: currentTime,
            checkOutTime: attendanceStatus === AttendanceStatus.PICKED_UP ? currentTime : null,
          },
        });
      }

      console.log('\n5. Updating child status to:', childStatus);
      await tx.child.update({
        where: { id: student.id },
        data: { status: childStatus },
      });

      // Send email notification
      if (student.parent.email) {
        await sendStatusEmail(
          student.parent.email,
          student.name,
          childStatus,
          currentTime
        );
      }

      console.log('\n6. Creating admin notifications...');
      const adminUsers = await tx.user.findMany({
        where: {
          role: Role.ADMIN
        },
        select: { id: true }
      });

      console.log('Found admins:', adminUsers);

      // Create notifications for each admin
      await Promise.all(adminUsers.map(admin => 
        tx.notification.create({
          data: {
            userId: admin.id,
            type: childStatus === ChildStatus.PRESENT ? 'CHECK_IN' : 'PICK_UP',
            message: `${student.name} ${childStatus === ChildStatus.PRESENT ? 'تم تسجيل حضوره' : 'تم تسجيل انصرافه'}`,
            read: false,
            timestamp: currentTime,
            childId: student.id,
            parentId: student.parent.id
          }
        })
      ));

      console.log('\n7. Verifying update...');
      const updatedStudent = await tx.child.findUnique({
        where: { id: student.id },
        select: { id: true, name: true, status: true },
      });

      console.log('Final student status:', updatedStudent?.status);
      return {
        student: updatedStudent,
        status: childStatus,
        message,
        timestamp: currentTime,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        children: [{
          id: result.student.id,
          name: result.student.name,
          status: result.student.status,
          message: result.message,
          timestamp: new Date(result.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Riyadh'
          })
        }]
      }
    });

  } catch (error) {
    console.error('\n!!! ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process attendance' },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
    console.log('------ PROCESS COMPLETED ------\n');
  }
}