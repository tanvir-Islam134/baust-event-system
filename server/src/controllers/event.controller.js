import * as eventService from '../services/event.service.js';
import * as notifService from '../services/notification.service.js';

/**
 * POST /api/v1/events
 * Create an event (organizer or admin).
 * Creates an admin notification document and emits Socket.io event for pending approval.
 */
export const create = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.user.uid, req.body);

    const eventTitle = event.title || event.eventName || req.body?.title || 'New Event';
    const eventClub = event.clubName || event.clubAffiliation || req.body?.clubName || 'Campus Club';
    const eventDate = event.date || req.body?.date || 'TBA';
    const eventVenue = event.venue || req.body?.venue || 'TBA';

    // 1. Create Notification document in MongoDB for Admin
    let notification = null;
    try {
      notification = await notifService.createAdminNotification({
        senderId: req.user.uid,
        senderName: req.user.name || 'Club Organizer',
        senderEmail: req.user.email,
        type: 'event_pending_approval',
        title: 'New Event Approval Request',
        message: `Organizer submitted "${eventTitle}" for ${eventClub} scheduled on ${eventDate} at ${eventVenue}.`,
        data: {
          eventId: event.id || event._id,
          title: eventTitle,
          club: eventClub,
          clubName: eventClub,
          date: eventDate,
          venue: eventVenue,
          time: event.time || event.startTime || req.body?.time || '10:00 AM',
          ticketPrice: event.ticketPrice || event.fee || 0,
        },
      });
    } catch (notifErr) {
      console.warn('[EventController] Notification creation error:', notifErr.message);
    }

    // 2. Emit real-time Socket.io event to admin_room
    const io = req.app.get('io');
    if (io) {
      try {
        io.to('admin_room').emit('new_event_request', {
          notification,
          event: {
            id: event.id || event._id,
            title: eventTitle,
            club: eventClub,
            date: eventDate,
            venue: eventVenue,
            status: event.status || 'pending',
          },
          organizer: {
            id: req.user.uid,
            name: req.user.name,
            email: req.user.email,
          },
        });
      } catch (socketErr) {
        console.warn('[EventController] Socket emit error:', socketErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully and is pending administrative approval',
      data: event,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events
 * List events with privacy protection:
 * - By default: strictly returns events where status === 'approved'.
 * - If status === 'pending' is requested:
 *    * Admin: returns administrative pending approval queue.
 *    * Organizer: returns ONLY their own pending events.
 *    * Others: returns empty array to prevent data leakage.
 */
export const getApproved = async (req, res, next) => {
  try {
    const { clubName, club, title, search, q, status } = req.query;
    const filters = {
      clubName: clubName || club,
      title: title || search || q,
      status: status || 'approved',
    };
    const events = await eventService.getEvents(filters, req.user);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const getEvents = getApproved;
export const getAllEvents = getApproved;

/**
 * GET /api/v1/events/calendar
 * List events for calendar view with schedule conflict flags:
 * - Strictly returns 'approved' events by default to prevent data leakage.
 * - Only returns pending events if requested by Admin or Organizer (their own).
 */
export const getCalendarEvents = async (req, res, next) => {
  try {
    const { clubName, club, category, status } = req.query;
    const filters = {
      clubName: clubName || club,
      category,
      status: status || 'approved',
    };
    const events = await eventService.getCalendarEvents(filters, req.user);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events/my-events
 * Protected: List events created by current user.
 */
export const getMyEvents = async (req, res, next) => {
  try {
    const events = await eventService.getMyEvents(req.user.uid);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events/admin/queue
 * Protected (Admin only): List pending events.
 */
export const getAdminQueue = async (req, res, next) => {
  try {
    const events = await eventService.getAdminQueue();
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events/:id
 * Public: Get event details by ID.
 */
export const getById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/events/:eventId/status or /:id/status
 * Protected (Admin only): Update event status ('approved' or 'declined' / 'rejected').
 * Notifies the organizer in MongoDB and emits real-time Socket.io event.
 */
export const updateStatus = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const existingEvent = await eventService.getEventById(eventId);

    const updated = await eventService.updateEventStatus(eventId, req.body);
    const organizerUid = existingEvent.createdBy || existingEvent.organizerId;

    const isApproved = updated.status === 'approved';
    const reason = req.body?.reason || req.body?.rejectionReason || null;
    const eventTitle = existingEvent.title || existingEvent.eventName || 'Campus Event';

    const decisionType = isApproved
      ? 'event_approved'
      : updated.status === 'declined'
      ? 'event_declined'
      : 'event_rejected';
    const decisionTitle = isApproved ? 'Event Approved! 🎉' : 'Event Declined ⚠️';
    const decisionMessage = isApproved
      ? `Your event "${eventTitle}" has been approved by the Administration and is now live on the campus calendar.`
      : `Your event "${eventTitle}" was declined. Reason: ${reason || 'Does not comply with university event policy.'}`;

    // Auto-mark any pending admin notifications for this event as read
    try {
      await notifService.markEventRequestsAsRead(eventId);
    } catch (readErr) {
      console.warn('[EventController] markEventRequestsAsRead error:', readErr.message);
    }

    // 1. Create Notification document for the Organizer
    let notification = null;
    if (organizerUid) {
      try {
        notification = await notifService.createOrganizerNotification({
          recipientId: organizerUid,
          senderId: req.user?.uid || 'admin',
          senderName: req.user?.name || 'BAUST Administration',
          senderEmail: req.user?.email || 'admin@baust.edu.bd',
          type: decisionType,
          title: decisionTitle,
          message: decisionMessage,
          data: {
            eventId,
            title: eventTitle,
            status: updated.status,
            reason,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (notifErr) {
        console.warn('[EventController] Organizer notification error:', notifErr.message);
      }
    }

    // 1b. If approved, notify students about the newly published campus event
    if (isApproved) {
      try {
        await notifService.createParticipantBroadcastNotification({
          senderId: req.user?.uid || 'admin',
          senderName: req.user?.name || 'BAUST Administration',
          senderEmail: req.user?.email || 'admin@baust.edu.bd',
          type: 'new_event_published',
          title: 'New Campus Event Published',
          message: `"${eventTitle}" by ${existingEvent.clubName || existingEvent.clubAffiliation || 'BAUST Club'} is now open for registration (${existingEvent.date || 'TBA'}).`,
          data: {
            eventId,
            title: eventTitle,
            date: existingEvent.date || null,
          },
        });
      } catch (broadcastErr) {
        console.warn('[EventController] Participant broadcast error:', broadcastErr.message);
      }
    }

    // 2. Emit real-time Socket.io event to notify the Organizer and update admin queue
    const io = req.app.get('io');
    if (io) {
      try {
        const socketPayload = {
          eventId,
          status: updated.status,
          title: eventTitle,
          reason,
          notification,
          organizerId: organizerUid,
        };

        if (organizerUid) {
          io.to(`user_${organizerUid}`).emit('event_status_updated', socketPayload);
        }
        io.to('organizer_room').emit('event_status_updated', socketPayload);
        io.to('admin_room').emit('event_request_processed', { eventId, status: updated.status });
        io.emit('event_status_updated', socketPayload);
        io.emit('notification_created', { eventId, status: updated.status });
      } catch (socketErr) {
        console.warn('[EventController] Socket emit error:', socketErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Event status updated to '${updated.status}' successfully`,
      data: updated,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT/PATCH /api/v1/events/:id
 * Protected (Organizer | Admin): Update event details.
 */
export const update = async (req, res, next) => {
  try {
    const updated = await eventService.updateEvent(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/events/:id
 * Protected (Organizer | Admin): Delete an event.
 */
export const remove = async (req, res, next) => {
  try {
    const result = await eventService.deleteEvent(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

