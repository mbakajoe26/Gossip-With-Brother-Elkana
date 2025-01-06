import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { supabase } from '@/utils/supabase';
import SpaceReminderEmail from '@/app/components/emails/SpaceReminderEmail';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const TIMEOUT = 60 * 1000 // 1 minute timeout

// This endpoint will be called by Vercel Cron
export async function GET(req: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), TIMEOUT)
    )

    const result = await Promise.race([
      // Your existing reminder logic
      timeoutPromise
    ])

    console.log('Reminders sent successfully:', new Date().toISOString())
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reminder sending error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
} 

// Add actual reminder sending logic and better error handling
const sendReminders = async () => {
  const { data: reminders, error } = await supabase
    .from('space_reminders')
    .select('*')
    .eq('reminder_sent', false)
    .lt('scheduled_for', new Date(Date.now() + 30 * 60 * 1000).toISOString()); // 30 minutes from now

  if (error) throw error;

  const results = await Promise.allSettled(
    reminders.map(async (reminder) => {
      const emailHtml = await render(
        SpaceReminderEmail({
          title: reminder.title,
          scheduledfor: reminder.scheduled_for,
          guestspeaker: reminder.guest_speaker,
          description: reminder.description,
          spaceId: reminder.space_id
        })
      );

      await transporter.sendMail({
        from: `"Gossip With Brother Elkana" <${process.env.GMAIL_USER}>`,
        to: reminder.email,
        subject: "🎙️ Your Twitter Space Starts Soon!",
        html: emailHtml,
      });

      await supabase
        .from('space_reminders')
        .update({ reminder_sent: true })
        .eq('id', reminder.id);
    })
  );

  return results;
}; 