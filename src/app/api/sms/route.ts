// src/app/api/sms/route.ts
import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: Request) {
    try {
      const { to, message } = await request.json();
  
      console.log('Received request to /api/sms:', { to, message }); // Log request data
  
      const client = twilio(accountSid, authToken);
      const messageResponse = await client.messages.create({
        body: message,
        to: to,
        from: twilioNumber,
      });
  
      console.log('Twilio message sent:', messageResponse); // Log Twilio response
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('SMS sending error:', error); // Log error
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
  