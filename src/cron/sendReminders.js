import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { POSITIONS } from '@/config/constants';

const prisma = new PrismaClient();

export async function sendVotingReminders() {
  try {
    // Get active election settings
    const settings = await prisma.electionSettings.findFirst({
      where: {
        isActive: true
      }
    });

    if (!settings) {
      console.log('No active election found');
      return;
    }

    // Find users who haven't voted in all positions
    const users = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        votes: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log(`Sending reminders to ${users.length} users`);

    // Send reminders in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          await sendEmail({
            to: user.email,
            subject: 'Reminder: Cast Your Vote in CST Elections',
            template: 'voting-reminder',
            props: {
              name: user.name,
              votingEndTime: settings.votingEndTime,
              positions: Object.values(POSITIONS)
            }
          });
          
          await prisma.reminderLog.create({
            data: {
              userId: user.id,
              type: 'VOTING_REMINDER',
              sentAt: new Date()
            }
          });
        } catch (error) {
          console.error(`Failed to send reminder to ${user.email}:`, error);
        }
      }));

      // Add delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Voting reminders sent successfully');
  } catch (error) {
    console.error('Failed to send voting reminders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}