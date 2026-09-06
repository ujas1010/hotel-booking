import React, { useState, useEffect } from 'react';
import { Room, Review } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ApiService } from '../services/api.ts';
import {
  ArrowLeft,
  Star,
  Users,
  Bed,
  Maximize,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Coffee,
  Wifi,
  Clock,
  MessageSquarePlus,
  Send,
  MapPin,
  HelpCircle,
} from 'lucide-react';

interface RoomDetailViewProps {
  room: Room;
  onBack: () => void;
  onProceedToCheckout: (
    room: Room,
    checkIn: string,
    checkOut: string,
    guests: number,
    specialRequests?: string
  ) => void;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
}

const CATEGORY_IMAGES: Record<string, string> = {
  Standard: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  Deluxe: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  Executive: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  Suite: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
};

export const RoomDetailView: React.FC<RoomDetailViewProps> = ({
  room,
  onBack,
  onProceedToCheckout,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}) => {
  const { user, token, apiFetch } = useAuth();

  const [checkInDate, setCheckInDate] = useState(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
  const [guestsCount, setGuestsCount] = useState(initialGuests || 2);
  const [specialRequests, setSpecialRequests] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  let images: string[] = [];
  try {
    images = typeof room.images === 'string' ? JSON.parse(room.images) : room.images;
  } catch {
    images = [];
  }
  const roomImage = (images && images.length > 0 && images[0])
    ? images[0]
    : (CATEGORY_IMAGES[room.category] || CATEGORY_IMAGES.Standard);

  let amenities: string[] = [];
  try {
    amenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
  } catch {
    amenities = ['Fiber Wi-Fi', 'Room Service', 'Heritage Palace View'];
  }

  // Calculate nights
  const calcNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const totalNights = calcNights();
  const discountPercent = room.discountPercent || 0;
  const effectiveNightlyRate = Math.round(room.pricePerNight * (1 - discountPercent / 100));
  const rawSubtotal = room.pricePerNight * totalNights;
  const roomSubtotal = effectiveNightlyRate * totalNights;
  const discountSavings = rawSubtotal - roomSubtotal;
  const cleaningFee = 500; // INR
  const taxesAndFees = Math.round(roomSubtotal * 0.12); // 12% GST
  const grandTotal = roomSubtotal + cleaningFee + taxesAndFees;

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews/${room.id}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [room.id]);

  // Submit review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    setReviewErrorMsg('');
    setReviewSuccessMsg('');
    try {
      const created = await ApiService.createReview({
        roomId: room.id,
        rating: newRating,
        comment: newComment.trim(),
        guestName: user?.displayName || user?.email?.split('@')[0] || 'Palace Guest',
      }, token);

      setReviews([created, ...reviews]);
      setNewComment('');
      setReviewSuccessMsg('Dhanyavaad! Your review was recorded successfully.');
      setTimeout(() => setReviewSuccessMsg(''), 4500);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setReviewErrorMsg(err.message || 'Failed to post review. Please ensure you are signed in.');
      setTimeout(() => setReviewErrorMsg(''), 5000);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button */}
      <button
        id="room-detail-back-btn"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5E564D] hover:text-[#1C1917] bg-white border border-[#E8E1D5] px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 text-[#966A28]" />
        Back to Accommodations
      </button>

      {/* Main Grid: Gallery & Specifications on Left, Calculator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Photos & Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#E8E1D5] shadow-md">
              <img
                src={roomImage}
                alt={room.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-white/95 text-[#1C1917] border border-[#DFCEAF] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-xs">
                  {room.category}
                </span>
                {room.featured && (
                  <span className="bg-[#785116] text-[#FDF6EE] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs border border-[#DFCEAF]/40">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Signature Suite
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="font-mono bg-black/60 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/10 text-[#FAF7F2]">
                  Suite #{room.roomNumber} • Floor {room.floor}
                </span>
                <span className="bg-black/60 px-3 py-1 rounded-lg backdrop-blur-xs text-[#D4AF37] border border-white/10 font-medium">
                  {room.viewType}
                </span>
              </div>
            </div>
          </div>

          {/* Room Title & Key Attributes */}
          <div className="bg-white border border-[#E8E1D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_2px_16px_rgba(40,30,20,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F2ECE1] pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1917] tracking-tight">
                  {room.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#7A7265] mt-1 font-light">
                  Floor {room.floor} • {room.viewType} • The Imperial {room.category} Collection
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#FAF3E8] border border-[#DFCEAF] px-3.5 py-2 rounded-2xl shrink-0">
                <Star className="w-5 h-5 text-[#B58232] fill-[#B58232]" />
                <div>
                  <div className="text-sm font-bold text-[#785116]">{room.rating} / 5.0</div>
                  <div className="text-[10px] text-[#8C8275]">{room.reviewCount} Verified Patron Reviews</div>
                </div>
              </div>
            </div>

            {/* Specs Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#FAF7F2] border border-[#E8E1D5] p-4 rounded-2xl space-y-1">
                <Users className="w-5 h-5 text-[#966A28]" />
                <p className="text-[10px] text-[#7A7265] uppercase tracking-wider font-semibold">Occupancy</p>
                <p className="text-sm font-bold text-[#1C1917]">Up to {room.capacity} Guests</p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8E1D5] p-4 rounded-2xl space-y-1">
                <Bed className="w-5 h-5 text-[#966A28]" />
                <p className="text-[10px] text-[#7A7265] uppercase tracking-wider font-semibold">Bed Configuration</p>
                <p className="text-sm font-bold text-[#1C1917] truncate">{room.bedType}</p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8E1D5] p-4 rounded-2xl space-y-1">
                <Maximize className="w-5 h-5 text-[#966A28]" />
                <p className="text-[10px] text-[#7A7265] uppercase tracking-wider font-semibold">Suite Area</p>
                <p className="text-sm font-bold text-[#1C1917]">{room.sizeSqFt} sq. ft</p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8E1D5] p-4 rounded-2xl space-y-1">
                <Clock className="w-5 h-5 text-[#966A28]" />
                <p className="text-[10px] text-[#7A7265] uppercase tracking-wider font-semibold">Timings</p>
                <p className="text-sm font-bold text-[#1C1917]">14:00 In / 11:00 Out</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-base font-bold text-[#1C1917] font-serif">Suite Overview & Architectural Highlights</h2>
              <p className="text-sm text-[#5E564D] leading-relaxed font-light">
                {room.description}
              </p>
            </div>

            {/* Luxury Amenities */}
            <div className="space-y-3 pt-4 border-t border-[#F2ECE1]">
              <h2 className="text-base font-bold text-[#1C1917] font-serif">Palace Inclusions & Bespoke Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 bg-[#FAF7F2] border border-[#E8E1D5] px-3.5 py-2.5 rounded-xl text-xs text-[#5E564D] font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#966A28] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Guest Reviews Section */}
          <div className="bg-white border border-[#E8E1D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_2px_16px_rgba(40,30,20,0.02)]">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#1C1917]">Verified Guest Reviews</h2>
                <p className="text-xs text-[#7A7265] font-light">Live ratings synchronized in PostgreSQL</p>
              </div>
              <div className="flex items-center gap-1.5 text-[#785116] text-sm font-bold bg-[#FAF3E8] px-3 py-1.5 rounded-xl border border-[#DFCEAF]">
                <Star className="w-4 h-4 text-[#B58232] fill-[#B58232]" />
                {room.rating} Out of 5
              </div>
            </div>

            {/* Write a review form */}
            <form onSubmit={handleReviewSubmit} className="bg-[#FAF7F2] border border-[#E8E1D5] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <MessageSquarePlus className="w-3.5 h-3.5 text-[#966A28]" />
                  Leave a Patron Review
                </label>
                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= newRating
                            ? 'text-[#B58232] fill-[#B58232]'
                            : 'text-[#D8CEBE]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your stay experience, hospitality impressions, view quality..."
                rows={2}
                className="w-full bg-white border border-[#E8E1D5] text-[#1C1917] rounded-xl p-3 text-xs focus:outline-none focus:border-[#966A28] focus:ring-1 focus:ring-[#966A28] transition-colors placeholder:text-[#8C8275] resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#7A7265]">
                  {user ? `Posting as ${user.displayName || user.email}` : 'Sign in to record your verified review'}
                </span>
                <button
                  type="submit"
                  disabled={submittingReview || !newComment.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-[#966A28] to-[#785116] text-[#FDFBF7] font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs uppercase tracking-wider cursor-pointer border border-[#DFCEAF]"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>

              {reviewSuccessMsg && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                  {reviewSuccessMsg}
                </p>
              )}

              {reviewErrorMsg && (
                <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                  {reviewErrorMsg}
                </p>
              )}
            </form>

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="text-center py-6 text-xs text-[#7A7265]">Loading verified reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#7A7265]">
                Be the first to review Suite #{room.roomNumber}!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-[#FAF7F2] border border-[#E8E1D5] rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#785116] text-[#FDF6EE] flex items-center justify-center text-xs font-bold font-serif">
                          {rev.guestName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-[#1C1917]">
                          {rev.guestName}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-[#B58232] fill-[#B58232]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#5E564D] leading-relaxed pl-9 font-light">
                      "{rev.comment}"
                    </p>
                    <div className="text-[10px] text-[#8C8275] pl-9">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Reservation Calculator & Booking Box (Sticky) */}
        <div className="lg:col-span-1 sticky top-28 space-y-6">
          <div className="bg-white border border-[#E8E1D5] rounded-3xl p-6 shadow-[0_4px_24px_rgba(40,30,20,0.04)] space-y-6">
            {/* Header Rate */}
            <div className="flex items-baseline justify-between border-b border-[#F2ECE1] pb-4">
              <div>
                <span className="text-xs text-[#7A7265] uppercase tracking-wider block font-semibold">Nightly Tariff</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-[#1C1917] font-serif tracking-tight">
                    ₹{effectiveNightlyRate.toLocaleString('en-IN')}
                  </span>
                  {discountPercent > 0 && (
                    <span className="text-xs text-[#8C8275] line-through">
                      ₹{room.pricePerNight.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-xs text-[#7A7265]">/ night</span>
                  {discountPercent > 0 && (
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Date Pickers */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#785116] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#966A28]" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newIn = e.target.value;
                      setCheckInDate(newIn);
                      if (newIn && (!checkOutDate || checkOutDate <= newIn)) {
                        const nextDay = new Date(newIn + 'T00:00:00');
                        nextDay.setDate(nextDay.getDate() + 1);
                        const pad = (n: number) => n.toString().padStart(2, '0');
                        setCheckOutDate(`${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`);
                      }
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#E8E1D5] text-[#1C1917] text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#966A28]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#785116] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#966A28]" />
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    min={
                      checkInDate
                        ? (() => {
                            const d = new Date(checkInDate + 'T00:00:00');
                            d.setDate(d.getDate() + 1);
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                          })()
                        : new Date().toISOString().split('T')[0]
                    }
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E1D5] text-[#1C1917] text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#966A28]"
                  />
                </div>
              </div>

              {/* Guests Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#785116] flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#966A28]" />
                  Guests Count
                </label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] border border-[#E8E1D5] text-[#1C1917] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#966A28]"
                >
                  {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'} (Max {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Requests Optional Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#785116]">
                  Special Stay Requests (Optional)
                </label>
                <input
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Sea-facing high floor, extra towels, early check-in"
                  className="w-full bg-[#FAF7F2] border border-[#E8E1D5] text-[#1C1917] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#966A28] placeholder:text-[#8C8275]"
                />
              </div>
            </div>

            {/* Price Breakdown Calculation in INR */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 space-y-2.5 border border-[#E8E1D5] text-xs">
              <div className="flex justify-between text-[#5E564D]">
                <span>
                  ₹{effectiveNightlyRate.toLocaleString('en-IN')} × {totalNights} {totalNights === 1 ? 'night' : 'nights'}
                </span>
                <span className="font-semibold text-[#1C1917]">₹{roomSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountSavings > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Special Privilege Savings ({discountPercent}%)</span>
                  <span>-₹{discountSavings.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-[#7A7265]">
                <span>Hotel Sanitization & Linens</span>
                <span>₹{cleaningFee.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-[#7A7265]">
                <span>Goods & Services Tax (12% GST)</span>
                <span>₹{taxesAndFees.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-[#E8E1D5] pt-2.5 flex justify-between items-baseline font-bold">
                <span className="text-[#1C1917] text-sm">Estimated Total (INR)</span>
                <span className="text-[#785116] text-xl font-serif">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Proceed CTA */}
            <button
              id="proceed-to-checkout-btn"
              onClick={() =>
                onProceedToCheckout(
                  room,
                  checkInDate,
                  checkOutDate,
                  guestsCount,
                  specialRequests
                )
              }
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#966A28] to-[#785116] hover:from-[#855D21] hover:to-[#6E4710] text-[#FDFBF7] font-bold text-xs uppercase tracking-wider shadow-md transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-[#DFCEAF]"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              Proceed to Guest Details & Payment
            </button>

            <div className="text-center space-y-1">
              <p className="text-[11px] text-[#7A7265]">
                🔒 Simulated checkout demo • No real money charged
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">
                ✓ 100% Free cancellation up to 24h prior to check-in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
