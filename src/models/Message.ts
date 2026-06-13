import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  sessionId: string;
  senderRole: "agent" | "customer" | "system";
  senderName: string;
  message: string;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  sessionId: { type: String, required: true, index: true },
  senderRole: { type: String, enum: ['agent', 'customer', 'system'], required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
