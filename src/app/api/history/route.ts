import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Session } from '@/models/Session';

export async function GET() {
  try {
    await dbConnect();
    const sessions = await Session.aggregate([
      {
        $lookup: {
          from: "messages",
          localField: "sessionId",
          foreignField: "sessionId",
          as: "messages"
        }
      },
      {
        $addFields: {
          totalMessages: { $size: "$messages" }
        }
      },
      { $project: { messages: 0 } },
      { $sort: { createdAt: -1 } }
    ]);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('History Error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
