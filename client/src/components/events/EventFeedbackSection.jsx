import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import feedbackService from '../../services/feedbackService.js';

function StarRow({ rating, size = 'w-4 h-4' }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${size} ${star <= rating ? 'text-[#FCA311]' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function EventFeedbackSection({ eventId, myRegistration, isPastEvent }) {
  const { user } = useAuth();
  const [data, setData] = useState({ feedbacks: [], totalReviews: 0, averageRating: 0, breakdown: {} });
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadFeedback = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const res = await feedbackService.getEventFeedbacks(eventId);
      setData({
        feedbacks: Array.isArray(res?.feedbacks) ? res.feedbacks : [],
        totalReviews: Number(res?.totalReviews || 0),
        averageRating: Number(res?.averageRating || 0),
        breakdown: res?.breakdown || {},
      });
    } catch (err) {
      console.warn('Failed to load event feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const currentUid = user?.uid || user?.id;
  const alreadyReviewed = data.feedbacks.some((f) => f.userId === currentUid);
  const isEligibleToReview =
    Boolean(user) &&
    Boolean(isPastEvent) &&
    myRegistration?.status === 'approved' &&
    Boolean(myRegistration?.attended) &&
    !alreadyReviewed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please enter your feedback comment.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await feedbackService.submitFeedback({
        eventId,
        rating,
        comment: comment.trim(),
      });
      setComment('');
      setSuccessMsg('Thank you! Your verified attendee rating has been published.');
      await loadFeedback();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to submit feedback'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="event-feedback" className="pt-6 border-t border-slate-200 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-[#14213D]">
            Verified Attendee Ratings &amp; Feedback
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Only Checked-In participants can rate and review an event after it concludes.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-2xl font-black text-[#14213D]">
            {data.averageRating > 0 ? data.averageRating.toFixed(1) : '—'}
          </div>
          <div>
            <StarRow rating={Math.round(data.averageRating)} />
            <span className="block text-[11px] text-slate-500 font-medium">
              {data.totalReviews} {data.totalReviews === 1 ? 'verified review' : 'verified reviews'}
            </span>
          </div>
        </div>
      </div>

      {/* Submission Form (Only for Checked-In students after event concludes) */}
      {isEligibleToReview && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-[#14213D]/5 border border-[#FCA311]/40 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                Verified Gate Check-In ✓
              </span>
              <h4 className="text-sm font-bold text-[#14213D]">Rate Your Experience</h4>
            </div>

            <div className="flex items-center gap-1" role="radiogroup" aria-label="Event Rating">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition transform hover:scale-110 cursor-pointer"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <svg
                      className={`w-7 h-7 ${active ? 'text-[#FCA311]' : 'text-slate-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-bold text-[#14213D]">{rating}/5</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <textarea
              rows={3}
              required
              minLength={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what you liked or what can be improved for future BAUST events..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] rounded-xl text-xs font-extrabold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting Review...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {successMsg}
        </div>
      )}

      {alreadyReviewed && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
          ✓ You have already submitted verified feedback for this event. Thank you!
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading reviews...</div>
      ) : data.feedbacks.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
          {isPastEvent
            ? 'No attendee feedback submitted yet.'
            : 'Feedback opens after the event concludes for Checked-In attendees.'}
        </div>
      ) : (
        <div className="space-y-3">
          {data.feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#14213D] text-[#FCA311] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {fb.photoURL ? (
                  <img src={fb.photoURL} alt={fb.studentName} className="w-full h-full object-cover" />
                ) : (
                  (fb.studentName || 'S').charAt(0)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#14213D]">{fb.studentName}</span>
                    {fb.department && (
                      <span className="ml-2 text-[11px] text-slate-400">• {fb.department}</span>
                    )}
                  </div>
                  <StarRow rating={fb.rating} size="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{fb.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
