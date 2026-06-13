import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { Message } from '@/models/Message';
import { SharedFile } from '@/models/SharedFile';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    await dbConnect();

    const [session, messageCount, fileCount] = await Promise.all([
      Session.findOne({ sessionId }).lean(),
      Message.countDocuments({ sessionId }),
      SharedFile.countDocuments({ sessionId })
    ]);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session,
      messageCount,
      fileCount
    });
  } catch (error) {
    console.error("Admin Session Error:", error);
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 });
  }
}
