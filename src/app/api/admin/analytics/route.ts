import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { Message } from '@/models/Message';
import { SharedFile } from '@/models/SharedFile';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const [
      totalSessions,
      activeSessions,
      totalMessages,
      totalSharedFiles,
      liveSessionsData
    ] = await Promise.all([
      Session.countDocuments(),
      Session.countDocuments({ status: { $ne: 'ended' } }),
      Message.countDocuments(),
      SharedFile.countDocuments(),
      Session.aggregate([
        { $match: { status: { $ne: 'ended' } } },
        {
          $lookup: {
            from: 'messages',
            localField: 'sessionId',
            foreignField: 'sessionId',
            as: 'messages'
          }
        },
        {
          $lookup: {
            from: 'sharedfiles',
            localField: 'sessionId',
            foreignField: 'sessionId',
            as: 'files'
          }
        },
        {
          $project: {
            _id: 1,
            sessionId: 1,
            status: 1,
            customerName: 1,
            createdAt: 1,
            startedAt: 1,
            messageCount: { $size: "$messages" },
            fileCount: { $size: "$files" }
          }
        },
        { $sort: { createdAt: -1 } }
      ])
    ]);

    return NextResponse.json({
      totalSessions,
      activeSessions,
      activeCalls: activeSessions, // In our logic, waiting + active = live
      totalMessages,
      totalSharedFiles,
      liveSessions: liveSessionsData
    });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
