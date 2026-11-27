import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      default: 'admin',
      enum: ['admin', 'organizer', 'participant'],
      index: true,
    },
    recipientId: {
      type: String,
      default: null,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'new_organizer_request',
        'organizer_request_approved',
        'organizer_request_rejected',
        'event_pending_approval',
        'event_approved',
        'event_declined',
        'event_rejected',
        'new_event_published',
        'event_updated',
        'registration_submitted',
        'registration_approved',
        'registration_rejected',
      ],
      default: 'new_organizer_request',
    },
    title: {
      type: String,
      required: true,
      default: 'Notification',
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });

export default mongoose.models?.Notification || mongoose.model('Notification', NotificationSchema);
