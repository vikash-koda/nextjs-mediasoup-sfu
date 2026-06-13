import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISharedFile extends Document {
  sessionId: string;
  senderRole: "agent" | "customer";
  senderName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
}

const SharedFileSchema: Schema = new Schema({
  sessionId: { type: String, required: true, index: true },
  senderRole: { type: String, enum: ['agent', 'customer'], required: true },
  senderName: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now, index: true }
});

export const SharedFile: Model<ISharedFile> = mongoose.models.SharedFile || mongoose.model<ISharedFile>('SharedFile', SharedFileSchema);
