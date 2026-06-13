import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Session } from '@/models/Session';

export async function PATCH(req: Request) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    await dbConnect();
    const session = await Session.findOneAndUpdate(
      { sessionId },
      { status: 'ended', endedAt: new Date() },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
