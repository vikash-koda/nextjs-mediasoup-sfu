import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  token: string;
  customerName?: string;
  status: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

const SessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  token: { type: String, required: true, unique: true },
  customerName: { type: String },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'ended'], 
    default: 'waiting' 
  },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  endedAt: { type: Date },
});

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
