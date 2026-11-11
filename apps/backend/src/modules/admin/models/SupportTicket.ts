import mongoose, { Schema, Document } from 'mongoose';
import { TicketCategory, TicketPriority, TicketStatus } from '@fic/shared-types';

export interface ISupportMessage {
  sender: 'MEMBER' | 'ADMIN';
  senderId?: mongoose.Types.ObjectId;
  senderName?: string;
  message: string;
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  ticketNumber: string;
  memberId?: mongoose.Types.ObjectId;
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: ISupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    sender: { type: String, enum: ['MEMBER', 'ADMIN'], required: true },
    senderId: { type: Schema.Types.ObjectId },
    senderName: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: false },
    memberName: { type: String },
    memberEmail: { type: String },
    memberPhone: { type: String },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ['PAYMENT_ISSUE', 'KYC_QUERY', 'TECHNICAL_BUG', 'GENERAL_INQUIRY'],
      default: 'GENERAL_INQUIRY',
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      required: true,
    },
    messages: [SupportMessageSchema],
  },
  { timestamps: true }
);

export const SupportTicketModel = (mongoose.models.SupportTicket as mongoose.Model<ISupportTicket>) || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
