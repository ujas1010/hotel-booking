import React, { useState, useEffect } from 'react';
import { Booking } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ApiService } from '../services/api.ts';
import { ClientStore } from '../services/clientStore.ts';
import {
  Calendar,
  BedDouble,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  RotateCcw,
  LogIn,
  Search,
  Ban,
  ShieldCheck,
  Printer,
  Receipt,
} from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal.tsx';

interface MyBookingsViewProps {
  onExploreRooms: () => void;
  onViewBookingDetails: (booking: Booking) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  onExploreRooms,
  onViewBookingDetails,
}) => {
  const { user, token, apiFetch, loginWithGoogle } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'confirmed' | 'checked_in' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Change of travel plans');
  const [cancellingLoading, setCancellingLoading] = useState(false);

  // Dedicated Printable Invoice Modal State
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getBookings(user?.uid, user?.email || undefined, token);
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
      const local = ClientStore.getBookingsByUser(user?.uid, user?.email || undefined);
      setBookings(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancellingLoading(true);
    try {
      await ApiService.updateBookingStatus(cancellingBooking.id, 'cancelled', {
        cancellationReason,
        cancelledAt: new Date().toISOString(),
      });
      await fetchUserBookings();
      setCancellingBooking(null);
    } catch (err) {
      console.error('Cancellation error:', err);
    } finally {
      setCancellingLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredList = bookings.filter((b) => {
    const isPastStay = b.checkOutDate < todayStr || b.bookingStatus === 'checked_out';
    if (filterTab === 'past') {
      return isPastStay && b.bookingStatus !== 'cancelled';
    }
    if (filterTab === 'confirmed') {
      return b.bookingStatus === 'confirmed' && !isPastStay;
    }
    if (filterTab === 'checked_in') {
      return b.bookingStatus === 'checked_in';
    }
    if (filterTab === 'cancelled') {
      return b.bookingStatus === 'cancelled';
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = b.bookingReference.toLowerCase().includes(q);
      const matchRoom = (b.roomName || '').toLowerCase().includes(q);
      const matchGuest = b.guestName.toLowerCase().includes(q);
      if (!matchRef && !matchRoom && !matchGuest) return false;
    }
    return true;
  });

  if (!user) {
    return (
      <div className="max-w-lg mx-auto bg-white border border-[#E8E1D5] rounded-3xl p-8 text-center space-y-6 shadow-sm my-12">
        <div className="w-16 h-16 rounded-full bg-[#FAF3E8] border border-[#DFCEAF] flex items-center justify-center mx-auto text-[#785116]">
          <LogIn className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-[#1C1917]">Sign In to View Your Reservations</h2>
          <p className="text-xs text-[#7A7265] leading-relaxed">
            Sign in to retrieve your stay history, access verified invoice vouchers, and manage your palace reservations.
          </p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="px-6 py-3 bg-[#966A28] hover:bg-[#7A5116] text-[#FDF6EE] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer uppercase tracking-wider border border-[#DFCEAF]"
        >
          <LogIn className="w-4 h-4 stroke-[2.5]" />
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1917] tracking-tight">
            My Reservations & Palace Stays
          </h1>
          <p className="text-xs text-[#7A7265] mt-1">
            Real-time status synchronization and verified palace vouchers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ref # or Suite..."
              className="w-full bg-white border border-[#DFCEAF] text-[#1C1917] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#966A28] placeholder:text-[#8C8275]"
            />
            <Search className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 top-2.5" />
          </div>

          <button
            onClick={fetchUserBookings}
            className="p-2 bg-white border border-[#E8E1D5] hover:bg-[#FAF7F2] text-[#5E564D] rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
            title="Refresh Bookings"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E8E1D5]">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-white text-[#785116] border-t-2 border-[#966A28] shadow-xs'
              : 'text-[#7A7265] hover:text-[#1C1917]'
          }`}
        >
          All Stays ({bookings.length})
        </button>
        <button
          onClick={() => setFilterTab('confirmed')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            filterTab === 'confirmed'
              ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-xs'
              : 'text-[#7A7265] hover:text-[#1C1917]'
          }`}
        >
          Confirmed ({bookings.filter((b) => b.bookingStatus === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilterTab('checked_in')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            filterTab === 'checked_in'
              ? 'bg-white text-[#966A28] border-t-2 border-[#966A28] shadow-xs'
              : 'text-[#7A7265] hover:text-[#1C1917]'
          }`}
        >
          Checked-In ({bookings.filter((b) => b.bookingStatus === 'checked_in').length})
        </button>
        <button
          onClick={() => setFilterTab('past')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            filterTab === 'past'
              ? 'bg-white text-[#5E564D] border-t-2 border-[#5E564D] shadow-xs'
              : 'text-[#7A7265] hover:text-[#1C1917]'
          }`}
        >
          Past Stays ({bookings.filter((b) => (b.checkOutDate < todayStr || b.bookingStatus === 'checked_out') && b.bookingStatus !== 'cancelled').length})
        </button>
        <button
          onClick={() => setFilterTab('cancelled')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            filterTab === 'cancelled'
              ? 'bg-white text-rose-800 border-t-2 border-rose-700 shadow-xs'
              : 'text-[#7A7265] hover:text-[#1C1917]'
          }`}
        >
          Cancelled ({bookings.filter((b) => b.bookingStatus === 'cancelled').length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-[#E8E1D5] rounded-3xl h-44 animate-pulse p-6 shadow-xs" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white border border-[#E8E1D5] rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <Calendar className="w-12 h-12 text-[#8C8275]/40 mx-auto" />
          <h3 className="text-lg font-bold text-[#1C1917] font-serif">No Reservations Found</h3>
          <p className="text-xs text-[#7A7265] leading-relaxed">
            {filterTab === 'all'
              ? "You haven't made any hotel reservations yet. Explore our royal heritage suites and reserve your stay!"
              : `No reservations found under "${filterTab}".`}
          </p>
          <button
            onClick={onExploreRooms}
            className="px-5 py-2.5 bg-[#966A28] hover:bg-[#7A5116] text-[#FDF6EE] font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider border border-[#DFCEAF]"
          >
            Explore Palace Accommodations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((booking) => {
            let images: string[] = [];
            try {
              images = typeof booking.roomImages === 'string' ? JSON.parse(booking.roomImages) : [];
            } catch {
              images = [];
            }
            const fallbackImg = images[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={booking.id}
                id={`booking-card-${booking.id}`}
                className="bg-white border border-[#E8E1D5] rounded-3xl p-5 sm:p-6 shadow-xs hover:border-[#DFCEAF] hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
              >
                {/* Left: Thumbnail & Room Details */}
                <div className="flex gap-4 items-start sm:items-center">
                  <img
                    src={fallbackImg}
                    alt={booking.roomName || 'Room'}
                    className="w-24 h-20 sm:w-28 sm:h-24 rounded-2xl object-cover border border-[#DFCEAF] shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#785116] bg-[#FAF3E8] px-2 py-0.5 rounded-lg border border-[#DFCEAF]">
                        {booking.bookingReference}
                      </span>
                      {booking.bookingStatus === 'confirmed' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Confirmed
                        </span>
                      )}
                      {booking.bookingStatus === 'checked_in' && (
                        <span className="bg-[#FAF3E8] text-[#785116] border border-[#DFCEAF] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#966A28]" />
                          Checked In
                        </span>
                      )}
                      {booking.bookingStatus === 'cancelled' && (
                        <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-700" />
                          Cancelled & Refunded
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#1C1917] font-serif">
                      {booking.roomName || `Suite #${booking.roomNumber}`}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5E564D]">
                      <span>Suite #{booking.roomNumber}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#966A28]" />
                        {booking.checkInDate} → {booking.checkOutDate} ({booking.totalNights} nights)
                      </span>
                    </div>

                    <div className="text-[11px] text-[#7A7265]">
                      Patron: <span className="text-[#1C1917] font-medium">{booking.guestName}</span> ({booking.guestsCount} Guests)
                    </div>
                  </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#F2ECE1] gap-3 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-[#7A7265] block">Total Amount Paid</span>
                    <span className="text-xl font-bold font-serif text-[#1C1917]">
                      ₹{booking.totalAmount.toLocaleString('en-IN')} INR
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedInvoiceBooking(booking)}
                      className="px-3.5 py-2 bg-[#966A28] hover:bg-[#7A5116] text-[#FDF6EE] text-xs font-semibold rounded-xl border border-[#DFCEAF] transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider shadow-2xs"
                      title="View & Print Official GST Tax Invoice"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Tax Invoice
                    </button>

                    <button
                      onClick={() => onViewBookingDetails(booking)}
                      className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#1C1917] text-xs font-semibold rounded-xl border border-[#DFCEAF] transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#966A28]" />
                      Voucher
                    </button>

                    {booking.bookingStatus === 'confirmed' && (
                      <button
                        onClick={() => setCancellingBooking(booking)}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Printable GST Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceBooking}
        booking={selectedInvoiceBooking}
        onClose={() => setSelectedInvoiceBooking(null)}
      />

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E1D5] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold font-serif text-[#1C1917]">Cancel Reservation?</h3>
            </div>

            <p className="text-xs text-[#5E564D] leading-relaxed">
              Are you sure you want to cancel reservation <strong className="text-[#785116] font-mono">{cancellingBooking.bookingReference}</strong> for{' '}
              <strong className="text-[#1C1917]">{cancellingBooking.roomName || 'Palace Suite'}</strong>?
            </p>

            <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E1D5] text-xs space-y-1.5">
              <div className="flex justify-between text-[#5E564D]">
                <span>Refund Amount:</span>
                <strong className="text-emerald-700 font-serif font-bold">₹{cancellingBooking.totalAmount.toLocaleString('en-IN')} INR</strong>
              </div>
              <p className="text-[10px] text-[#7A7265]">
                100% refund will be processed and logged to your account.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5E564D]">Reason for Cancellation</label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#DFCEAF] text-[#1C1917] text-xs rounded-xl p-2.5 focus:outline-none focus:border-[#966A28]"
              >
                <option>Change of travel plans</option>
                <option>Found alternative accommodation</option>
                <option>Emergency / rescheduling</option>
                <option>Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2.5 bg-[#FAF7F2] text-[#5E564D] text-xs font-semibold rounded-xl hover:bg-[#F2ECE1] cursor-pointer"
              >
                Keep Reservation
              </button>

              <button
                type="button"
                disabled={cancellingLoading}
                onClick={handleCancelBooking}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                {cancellingLoading ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
