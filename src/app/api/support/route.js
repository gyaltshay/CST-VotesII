import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Store the support message in the database
    const supportMessage = await prisma.supportMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'PENDING'
      }
    });

    // Send email notification to support team
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@cstvotes.edu.bt',
      subject: `New Support Request: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Support Request</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            ${message}
          </p>
        </div>
      `
    });

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'Support Request Received - CST Votes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>We've Received Your Message</h2>
          <p>Dear ${name},</p>
          <p>Thank you for contacting CST Votes support. We've received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message details:</strong></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            ${message}
          </p>
          <p>If you need immediate assistance, please contact us at:</p>
          <p>Phone: +975-17-123456</p>
          <p>Email: support@cstvotes.edu.bt</p>
        </div>
      `
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Support message sent successfully',
        id: supportMessage.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Support message error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send support message'
      },
      { status: 500 }
    );
  }
} 