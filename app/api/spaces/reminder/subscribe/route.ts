import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/utils/supabase';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId, title, scheduledfor } = await request.json();
    
    // Get user's email from Clerk
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'No email address found' },
        { status: 400 }
      );
    }

    // Store reminder subscription in Supabase
    const { error: dbError } = await supabase
      .from('space_reminders')
      .insert([
        {
          space_id: spaceId,
          user_id: userId,
          email,
          scheduled_for: scheduledfor,
          reminder_sent: false,
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      throw dbError;
    }

    // Send immediate confirmation email
    await transporter.sendMail({
      from: `"Gossip With Brother Elkana" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '✅ Space Reminder Set!',
      html: `
        <h2>Your reminder is set!</h2>
        <p>We'll notify you 30 minutes before the space starts.</p>
        <p><strong>Space:</strong> ${title}</p>
        <p><strong>Scheduled for:</strong> ${new Date(scheduledfor).toLocaleString()}</p>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to reminder:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to reminder' },
      { status: 500 }
    );
  }
} 