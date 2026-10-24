import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import eventService from '../../services/eventService.js';

export default function OrganizerCreateEvent({ onEventCreated, onCancel }) {
  const { user } = useAuth();

  const isOrganizer = user?.role === 'organizer';
  const isAdmin = user?.role === 'admin';
  const clubName = user?.clubAffiliation || (isAdmin ? 'Central BAUST Event Management' : null);

  const isApproved =
    isAdmin ||
    user?.organizerStatus === 'approved' ||
    user?.organizerRequestStatus === 'approved';

  const todayStr = new Date().toISOString().split('T')[0];

  const initialFormState = {
    title: '',
    description: '',
    bannerUrl: '',
    date: '',
    time: '10:00 AM',
    venue: '',
    ticketPrice: 0,
    capacity: 100,
    items: {
      food: false,
      tshirt: false,
    },
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [previewError, setPreviewError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('item_')) {
      const itemKey = name.replace('item_', '');
      setFormData((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [itemKey]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
      }));
    }

    if (name === 'bannerUrl') {
      setPreviewError(false);
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Event Name / Title is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Event Description is required';
    }
    if (!formData.date.trim()) {
      errors.date = 'Event Date is required';
    }
    if (!formData.time.trim()) {
      errors.time = 'Event Time is required';
    }
    if (!formData.venue.trim()) {
      errors.venue = 'Event Venue is required';
    }
    if (formData.ticketPrice === '' || formData.ticketPrice < 0) {
      errors.ticketPrice = 'Ticket price cannot be negative';
    }
    if (formData.capacity !== '' && formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!isApproved) {
      setGeneralError(
        'Your organizer account is pending administrator approval. Only approved organizers can create campus events.'
      );
      return;
    }

    if (isOrganizer && !clubName) {
      setGeneralError(
        'You must have an assigned Club Affiliation to publish events. Please contact the administrator.'
      );
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        eventName: formData.title.trim(),
        description: formData.description.trim(),
        bannerUrl: formData.bannerUrl.trim(),
        date: formData.date,
        time: formData.time.trim(),
        startTime: formData.time.trim(),
        venue: formData.venue.trim(),
        ticketPrice: Number(formData.ticketPrice) || 0,
        fee: Number(formData.ticketPrice) || 0,
        capacity: Number(formData.capacity) || 100,
        items: formData.items,
        clubName: clubName,
        clubAffiliation: clubName,
      };

      const created = await eventService.createEvent(payload);

      // Reset form
      setFormData(initialFormState);
      setFieldErrors({});

      if (onEventCreated) {
        onEventCreated(created);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create event';
      setGeneralError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-2 border border-white/20">
            <span>🏛️ {clubName || 'Organizer Portal'}</span>
            <span>•</span>
            <span>Event Creator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Create New Campus Event</h2>
          <p className="mt-1 text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Fill in the details below to publish an official event. Upon creation, it will be submitted for
            review and linked directly to{' '}
            <strong className="text-white font-semibold">{clubName || 'your assigned club'}</strong>.
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="p-6 sm:p-8">
        {/* Organizer Authorization Check Warning */}
        {!isApproved && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="text-xs">
              <p className="font-bold">Pending Approval Required</p>
              <p className="mt-0.5 text-amber-800">
                Your organizer registration is currently pending review. An administrator must approve your
                organizer status before you can publish events to the university portal.
              </p>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {generalError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fade-in">
            <span className="text-base text-rose-600">❌</span>
            <div className="flex-1 text-xs">
              <p className="font-semibold">{generalError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Event Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Basic Event Information
            </h3>

            {/* Event Name */}
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-slate-700 mb-1">
                Event Name / Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. BAUST CSE Fest 2026 - Hackathon & Game Jam"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                  fieldErrors.title
                    ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.title}</p>
              )}
            </div>

            {/* Event Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Agenda <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide event details, objectives, guest speakers, eligibility rules, schedule, prizes, and contact instructions..."
                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                  fieldErrors.description
                    ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {fieldErrors.description && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.description}</p>
              )}
            </div>

            {/* Banner / Image URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="bannerUrl" className="block text-xs font-semibold text-slate-700">
                  Banner / Image URL <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400">Direct image link (JPG, PNG, WebP)</span>
              </div>
              <div className="relative">
                <input
                  id="bannerUrl"
                  name="bannerUrl"
                  type="url"
                  value={formData.bannerUrl}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              {/* Live Banner Preview */}
              {formData.bannerUrl && !previewError && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 group">
                  <img
                    src={formData.bannerUrl}
                    alt="Banner preview"
                    onError={() => setPreviewError(true)}
                    className="w-full h-48 object-cover object-center"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/70 text-white text-[10px] font-semibold backdrop-blur-sm">
                    Banner Preview
                  </div>
                </div>
              )}
              {previewError && formData.bannerUrl && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠️ Image URL could not be previewed. Please verify the link is accessible.
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Logistics & Schedule */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Schedule, Venue & Pricing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  min={todayStr}
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.date
                      ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {fieldErrors.date && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.date}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label htmlFor="time" className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="time"
                  name="time"
                  type="text"
                  value={formData.time}
                  onChange={handleInputChange}
                  placeholder="e.g. 10:00 AM or 02:30 PM"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.time
                      ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {fieldErrors.time && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.time}</p>
                )}
              </div>

              {/* Ticket Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="ticketPrice" className="block text-xs font-semibold text-slate-700">
                    Ticket Price (BDT ৳) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        ticketPrice: 0,
                      }))
                    }
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Set Free (৳0)
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                  <input
                    id="ticketPrice"
                    name="ticketPrice"
                    type="number"
                    min="0"
                    step="10"
                    value={formData.ticketPrice}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={`w-full pl-7 pr-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                      fieldErrors.ticketPrice
                        ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.ticketPrice && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.ticketPrice}</p>
                )}
              </div>
            </div>

            {/* Venue & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="venue" className="block text-xs font-semibold text-slate-700 mb-1">
                  Venue Location <span className="text-rose-500">*</span>
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="e.g. Central Auditorium, BAUST / Academic Building 2, Room 304"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.venue
                      ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {fieldErrors.venue && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.venue}</p>
                )}
              </div>

              <div>
                <label htmlFor="capacity" className="block text-xs font-semibold text-slate-700 mb-1">
                  Attendee Capacity
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="100"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Perks / Items Checkboxes */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Included Perks & Items
            </h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  name="item_food"
                  checked={formData.items.food}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700">🍲 Food / Refreshments Provided</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  name="item_tshirt"
                  checked={formData.items.tshirt}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700">👕 Event T-Shirt / Kit Included</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel & Back to Manage Events
            </button>

            <button
              type="submit"
              disabled={submitting || !isApproved}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Publishing Event...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Publish Event for Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

