/**
 * Event Model & Schema Definition
 * Complies with Mongoose schema specifications:
 * - Title: String, required
 * - Description: String
 * - Banner/Image URL: String
 * - Date: String (or Date), required
 * - Time: String, required
 * - Venue: String, required
 * - Ticket Price: Number, default 0
 * - ClubName / ClubId: String, strictly linked to Organizer's Club
 * - OrganizerId: String, strictly linked to logged-in Organizer
 *
 * In addition to Mongoose definition, provides clean runtime compatibility
 * with BAUST Event System's layered Firestore architecture.
 */

let mongoose = null;
try {
  // Dynamically resolve mongoose if present in the runtime environment
  const imported = await import('mongoose');
  mongoose = imported.default || imported;
} catch {
  // Mongoose not installed or running in pure Firestore environment
}

/**
 * Raw Mongoose schema definition fields object
 */
export const EventSchemaDefinition = {
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  bannerUrl: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: String,
    required: [true, 'Event date is required (e.g. YYYY-MM-DD)'],
    trim: true,
  },
  time: {
    type: String,
    required: [true, 'Event time is required (e.g. 10:00 AM)'],
    trim: true,
  },
  venue: {
    type: String,
    required: [true, 'Event venue is required'],
    trim: true,
  },
  ticketPrice: {
    type: Number,
    default: 0,
    min: [0, 'Ticket price cannot be negative'],
  },
  clubName: {
    type: String,
    trim: true,
    default: null,
  },
  clubId: {
    type: String,
    trim: true,
    default: null,
  },
  organizerId: {
    type: String,
    required: [true, 'Organizer ID is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  },
  capacity: {
    type: Number,
    default: 100,
    min: [1, 'Capacity must be at least 1'],
  },
  registeredCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  items: {
    food: { type: Boolean, default: false },
    tshirt: { type: Boolean, default: false },
  },
  rejectionReason: {
    type: String,
    default: null,
  },
};

/**
 * Mongoose Schema instance (instantiated if mongoose is loaded)
 */
export const EventMongooseSchema = mongoose
  ? new mongoose.Schema(EventSchemaDefinition, {
      timestamps: true,
    })
  : null;

/**
 * Mongoose Model instance (compiled if mongoose is loaded)
 */
export const EventModel =
  mongoose && EventMongooseSchema
    ? mongoose.models?.Event || mongoose.model('Event', EventMongooseSchema)
    : null;

export default EventModel || EventSchemaDefinition;

