import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getSession() {
  return await getServerSession(authOptions);
}

export async function GET() {
  const session = await getSession();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.electionSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      return NextResponse.json({ error: "No settings found" }, { status: 404 });
    }

    return NextResponse.json({
      votingStartTime: settings.votingStartTime.toISOString(),
      votingEndTime: settings.votingEndTime.toISOString(),
      autoResetEnabled: settings.autoResetEnabled || false,
      autoResetTime: settings.autoResetTime || "",
      autoResetDay: settings.autoResetDay || "",
      autoResetMonth: settings.autoResetMonth || "",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      votingStartTime,
      votingEndTime,
      autoResetEnabled,
      autoResetTime,
      autoResetDay,
      autoResetMonth,
    } = body;

    // Validate the input
    if (!votingStartTime || !votingEndTime) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }

    if (new Date(votingStartTime) >= new Date(votingEndTime)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    if (autoResetEnabled) {
      if (!autoResetTime || !autoResetDay || !autoResetMonth) {
        return NextResponse.json({ 
          error: "Reset time, day, and month are required when auto-reset is enabled" 
        }, { status: 400 });
      }
    }

    // Create or update settings
    const existingSettings = await prisma.electionSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let result;
    if (existingSettings) {
      result = await prisma.electionSettings.update({
        where: { id: existingSettings.id },
        data: {
          votingStartTime: new Date(votingStartTime),
          votingEndTime: new Date(votingEndTime),
          autoResetEnabled: Boolean(autoResetEnabled),
          autoResetTime: autoResetTime || null,
          autoResetDay: autoResetDay ? parseInt(autoResetDay) : null,
          autoResetMonth: autoResetMonth ? parseInt(autoResetMonth) : null,
        },
      });
    } else {
      result = await prisma.electionSettings.create({
        data: {
          votingStartTime: new Date(votingStartTime),
          votingEndTime: new Date(votingEndTime),
          autoResetEnabled: Boolean(autoResetEnabled),
          autoResetTime: autoResetTime || null,
          autoResetDay: autoResetDay ? parseInt(autoResetDay) : null,
          autoResetMonth: autoResetMonth ? parseInt(autoResetMonth) : null,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}