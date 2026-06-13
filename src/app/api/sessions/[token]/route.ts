import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Session } from '@/models/Session';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    await dbConnect();
    
    const session = await Session.findOne({ token });
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await req.json();
    
    await dbConnect();
    
    const updateData: any = {};
    if (body.customerName) updateData.customerName = body.customerName;
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'active') updateData.startedAt = new Date();
    }

    const session = await Session.findOneAndUpdate(
      { token },
      updateData,
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
