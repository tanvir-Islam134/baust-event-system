import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import eventService from '../services/eventService.js';
import registrationService from '../services/registrationService.js';

export default function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & registration state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState(null);
  const [regSuccess, setRegSuccess] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const initialFormState = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    tshirtSize: 'M',
    foodType: 'standard',
    paymentMethod: 'cash',
    trxId: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getEventById(id);
      setEvent(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      setRegistering(true);
      setRegError(null);

      const payload = {
        eventId: id,
        tshirtSize: event.items?.tshirt ? formData.tshirtSize : null,
        foodType: event.items?.food ? formData.foodType : null,
        paymentMethod: formData.paymentMethod,
        trxId: formData.paymentMethod === 'bkash' ? formData.trxId.trim() : null,
      };

      if (!user) {
        if (!formData.guestName.trim() || !formData.guestEmail.trim() || !formData.guestPhone.trim()) {
          throw new Error('Please fill in your name, email, and phone number to register as a guest.');
        }
        payload.guest = {
          name: formData.guestName.trim(),
          email: formData.guestEmail.trim().toLowerCase(),
          phone: formData.guestPhone.trim(),
        };
      } else {
        payload.batch = user.batch || null;
        payload.section = user.section || null;
        payload.level = user.level || null;
        payload.term = user.term || null;
      }

      const response = await registrationService.createRegistration(payload);
      const createdReg = response?.data || response;

      setIsModalOpen(false);
      setFormData(initialFormState);
      setRegSuccess(createdReg);
      setToastMessage(
        `Registration submitted! Status: Pending Club Organizer Approval (Ticket Code: ${createdReg?.ticketCode || 'Generated'})`
      );
      setTimeout(() => setToastMessage(null), 8000);

      // Refresh capacity count
      fetchEvent();
    } catch (err) {
      setRegError(
        err.response?.data?.error?.message ||
          (err.response?.data?.error?.details
            ? err.response.data.error.details.map((d) => d.message).join(', ')
            : err.message) ||
          'Failed to complete registration'
      );
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-600 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Event Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">{error || 'This event does not exist or has been removed.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/events"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            &larr; Back to Events
          </Link>
          <button
            onClick={fetchEvent}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const regCount = event.registeredCount || 0;
  const capacity = event.capacity || 100;
  const isFull = regCount >= capacity;
  const isApproved = event.status === 'approved';
  const capacityPercent = Math.min(100, Math.round((regCount / capacity) * 100));
  const isFree = Number(event.fee) === 0;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 text-sm font-medium">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Breadcrumb Back Link */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Main Event Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  isFree ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {isFree ? 'Free Admission' : `Fee: ৳ ${event.fee}`}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-white/10 border border-white/20 capitalize">
                {event.status}
              </span>
            </div>

            <span className="text-xs text-slate-300 font-mono">
              Event ID: {event.id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {event.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{event.date}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{event.startTime} - {event.endTime}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Registration Status Banner (Success) */}
          {regSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You have successfully registered for this event!</span>
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                Your Ticket Code: <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">{regSuccess.ticketCode}</strong>
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
              About This Event
            </h3>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {event.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Included Attendee Items */}
          {(event.items?.food || event.items?.tshirt) && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Items Provided
              </h3>
              <div className="flex flex-wrap gap-3">
                {event.items?.food && (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm font-medium">
                    <span className="text-lg">🍱</span>
                    <span>Meal / Refreshments Provided</span>
                  </div>
                )}
                {event.items?.tshirt && (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-sm font-medium">
                    <span className="text-lg">👕</span>
                    <span>Official Event T-Shirt</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Capacity Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div>
                <h4 className="text-base font-bold text-slate-800">Registration Capacity</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seats are assigned on a first-come, first-served basis via atomic transactions.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-slate-800">
                  {regCount} <span className="text-sm font-normal text-slate-500">/ {capacity}</span>
                </span>
                <span className="block text-xs font-semibold text-slate-500">{capacityPercent}% Filled</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-rose-500' : capacityPercent >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>

            {/* Registration Action */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                {!isApproved ? (
                  <span className="text-amber-600 font-medium">Registration is closed (event is pending review).</span>
                ) : isFull ? (
                  <span className="text-rose-600 font-semibold">Maximum capacity reached. Registrations are closed.</span>
                ) : (
                  <span className="text-emerald-700 font-medium">Registration is open! {capacity - regCount} seats remaining.</span>
                )}
              </div>

              {isApproved && !isFull && (
                <button
                  onClick={() => {
                    setRegError(null);
                    setIsModalOpen(true);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-md transition"
                >
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Event Registration</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{event.title}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {regError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-4">
              {/* Dynamic Guest Details if not logged in */}
              {!user && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Guest Attendee Information
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      required
                      value={formData.guestName}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="guestEmail"
                      required
                      value={formData.guestEmail}
                      onChange={handleInputChange}
                      placeholder="e.g. john@example.com"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="guestPhone"
                      required
                      value={formData.guestPhone}
                      onChange={handleInputChange}
                      placeholder="e.g. 01700000000"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* T-Shirt Size (if provided) */}
              {event.items?.tshirt && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select T-Shirt Size *
                  </label>
                  <select
                    name="tshirtSize"
                    value={formData.tshirtSize}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="S">Small (S)</option>
                    <option value="M">Medium (M)</option>
                    <option value="L">Large (L)</option>
                    <option value="XL">Extra Large (XL)</option>
                    <option value="XXL">Double Extra Large (XXL)</option>
                  </select>
                </div>
              )}

              {/* Food Type (if provided) */}
              {event.items?.food && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meal Preference *
                  </label>
                  <select
                    name="foodType"
                    value={formData.foodType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard Meal</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                    <option value="vegetarian">Vegetarian</option>
                  </select>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                      formData.paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <span>💵 Cash on Arrival</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                      formData.paymentMethod === 'bkash'
                        ? 'border-pink-600 bg-pink-50 text-pink-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bkash"
                      checked={formData.paymentMethod === 'bkash'}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <span>📱 bKash Payment</span>
                  </label>
                </div>
              </div>

              {/* bKash Transaction ID */}
              {formData.paymentMethod === 'bkash' && (
                <div className="p-3 bg-pink-50/60 border border-pink-200 rounded-lg space-y-2">
                  <label className="block text-xs font-semibold text-pink-900">
                    bKash Transaction ID (TrxID) *
                  </label>
                  <input
                    type="text"
                    name="trxId"
                    required
                    value={formData.trxId}
                    onChange={handleInputChange}
                    placeholder="e.g. 9J45K2L9OP"
                    className="w-full px-3 py-1.5 border border-pink-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase font-mono"
                  />
                  <p className="text-[11px] text-pink-800">
                    Send fee (৳ {event.fee}) to merchant bKash number 01700-000000 and enter the TrxID.
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {registering ? 'Processing...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

