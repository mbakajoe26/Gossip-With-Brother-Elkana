import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import SpaceReminderEmail from '@/app/components/emails/SpaceReminderEmail';
import { rateLimit } from '@/utils/rate-limit'

// Move transporter to a separate email utility
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Add better error handling and retry logic
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  prefix: 'email_rate_limit'
})

export async function GET() {
  try {
    const { success, reset } = await limiter.limit('SEND_EMAIL_CACHE_TOKEN')
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          resetAt: new Date(reset).toISOString() 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const emailHtml = await render(
      SpaceReminderEmail({
        title: "Test Space",
        scheduledfor: new Date().toISOString(),
        guestspeaker: "@testguest",
        description: "This is a test space",
        spaceId: "test_space_id"
      })
    );

    const info = await transporter.sendMail({
      from: `"Gossip With Brother Elkana" <${process.env.GMAIL_USER}>`,
      to: "mbakajoe26@gmail.com",
      subject: "🎙️ Test: Your Twitter Space Starts Soon!",
      html: emailHtml,
      // Add message priority and tracking
      priority: 'high',
      headers: {
        'X-Entity-Ref-ID': Date.now().toString()
      }
    });

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 