import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { SharedFile } from '@/models/SharedFile';

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    await dbConnect();
    
    const [messages, files] = await Promise.all([
      Message.find({ sessionId }).lean(),
      SharedFile.find({ sessionId }).lean()
    ]);

    const formattedFiles = files.map(f => ({
      _id: f._id,
      sessionId: f.sessionId,
      senderRole: f.senderRole,
      senderName: f.senderName,
      timestamp: f.uploadedAt,
      fileName: f.fileName,
      fileType: f.fileType,
      fileSize: f.fileSize,
      fileUrl: f.fileUrl
    }));

    const combined = [...messages, ...formattedFiles].sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json({ messages: combined });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
