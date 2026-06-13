import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    await dbConnect();
    const sessions = await Session.find({ status: { $in: ['waiting', 'active'] } }).sort({ createdAt: -1 });
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST() {
  try {
    await dbConnect();
    
    const sessionId = nanoid();
    const token = nanoid(12);

    const session = await Session.create({
      sessionId,
      token,
      status: 'waiting',
    });

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
