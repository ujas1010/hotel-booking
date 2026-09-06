import React, { useState } from 'react';
import { Room, Booking } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AuthModal } from '../components/AuthModal.tsx';
import { ApiService } from '../services/api.ts';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  Calendar,
  Users,
  CheckCircle2,
  Car,
  Wine,
  Waves,
  Clock,
  QrCode,
  Smartphone,
  Building2,
  AlertCircle,
  Check,
} from 'lucide-react';

interface CheckoutViewProps {
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  initialSpecialRequests?: string;
  onBackToRoom: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  room,
  checkInDate,
  checkOutDate,
  guestsCount,
  initialSpecialRequests = '',
  onBackToRoom,
  onBookingSuccess,
}) => {
  const { user, profile, token, apiFetch } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Step Tracker: 1: Guest Info, 2: Luxury Addons, 3: Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Guest Details (clean, no dummy hardcoded values)
  const [guestName, setGuestName] = useState(profile?.name || user?.displayName || '');
  const [guestEmail, setGuestEmail] = useState(profile?.email || user?.email || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCity, setGuestCity] = useState(profile?.city || '');
  const [specialRequests, setSpecialRequests] = useState(initialSpecialRequests);

  // Step 2: Add-on Perks (INR)
  const [selectedAddons, setSelectedAddons] = useState<{
    chauffeur: boolean;
    hamper: boolean;
    spaPass: boolean;
    lateCheckout: boolean;
  }>({
    chauffeur: false,
    hamper: false,
    spaPass: false,
    lateCheckout: false,
  });

  // Step 3: Payment Gateway (clean, strict validation)
  const [paymentMethodTab, setPaymentMethodTab] = useState<'upi' | 'card' | 'netbanking' | 'applepay'>('card');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(guestName || profile?.name || user?.displayName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('');
  const [promoErrorMsg, setPromoErrorMsg] = useState('');

  // Formatter helpers
  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setGuestPhone(digitsOnly);
  };

  const handleCardNumberChange = (val: string) => {
    const rawDigits = val.replace(/\D/g, '').slice(0, 16);
    const formatted = rawDigits.match(/.{1,4}/g)?.join(' ') || rawDigits;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  const handleCvvChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setCardCvv(digits);
  };

  // Promo verification
  const handleApplyPromo = () => {
    setPromoErrorMsg('');
    setPromoSuccessMsg('');
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoErrorMsg('Please enter a voucher code.');
      return;
    }
    if (code === 'IMPERIAL10') {
      setAppliedPromo('IMPERIAL10');
      setPromoSuccessMsg('👑 Imperial Privileges: 10% discount applied to suite base rate!');
    } else if (code === 'ROYALPALACE' || code === 'ROYAL15') {
      setAppliedPromo('ROYALPALACE');
      setPromoSuccessMsg('✨ Royal Patron Code: 15% discount applied to suite base rate!');
    } else if (code === 'NAMASTE1000' || code === 'WELCOME1000') {
      setAppliedPromo('NAMASTE1000');
      setPromoSuccessMsg('🙏 Welcome Privilege: ₹1,000 flat discount applied!');
    } else {
      setPromoErrorMsg('Invalid or expired palace privilege code. Try IMPERIAL10 or ROYALPALACE.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoSuccessMsg('');
    setPromoErrorMsg('');
    setPromoInput('');
  };

  // Calculations
  const calcNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const totalNights = calcNights();
  const roomDiscountPercent = room.discountPercent || 0;
  const effectiveNightlyRate = Math.round(room.pricePerNight * (1 - roomDiscountPercent / 100));
  const rawRoomSubtotal = room.pricePerNight * totalNights;
  const roomSubtotal = effectiveNightlyRate * totalNights;
  const roomDiscountSavings = rawRoomSubtotal - roomSubtotal;

  // Calculate promo discount on suite subtotal
  let promoDiscount = 0;
  if (appliedPromo === 'IMPERIAL10') {
    promoDiscount = Math.round(roomSubtotal * 0.10);
  } else if (appliedPromo === 'ROYALPALACE' || appliedPromo === 'ROYAL15') {
    promoDiscount = Math.round(roomSubtotal * 0.15);
  } else if (appliedPromo === 'NAMASTE1000' || appliedPromo === 'WELCOME1000') {
    promoDiscount = Math.min(roomSubtotal, 1000);
  }

  const discountedRoomSubtotal = Math.max(0, roomSubtotal - promoDiscount);
  const cleaningFee = 500; // INR

  // Addons total in INR
  let addonsCost = 0;
  if (selectedAddons.chauffeur) addonsCost += 1800;
  if (selectedAddons.hamper) addonsCost += 1400;
  if (selectedAddons.spaPass) addonsCost += 2000 * guestsCount;
  if (selectedAddons.lateCheckout) addonsCost += 999;

  // 12% GST calculated on net taxable room subtotal + addons
  const taxesAndFees = Math.round((discountedRoomSubtotal + addonsCost) * 0.12);

  const finalTotalAmount = discountedRoomSubtotal + cleaningFee + taxesAndFees + addonsCost;

  let roomImages: string[] = [];
  try {
    roomImages = typeof room.images === 'string' ? JSON.parse(room.images) : room.images;
  } catch {
    roomImages = [];
  }
  const displayRoomImg = (roomImages && roomImages.length > 0 && roomImages[0])
    ? roomImages[0]
    : ({
        Standard: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        Deluxe: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        Executive: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        Suite: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      }[room.category] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80');

  const validateGuestDetails = () => {
    if (!guestName.trim() || guestName.trim().length < 2) {
      setErrorMessage('Please enter a valid full name for the primary guest (at least 2 characters).');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail.trim() || !emailRegex.test(guestEmail.trim())) {
      setErrorMessage('Please enter a valid email address (e.g. patron@domain.com).');
      return false;
    }
    if (!guestPhone || guestPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for booking confirmations.');
      return false;
    }
    return true;
  };

  const handleCompleteBooking = async () => {
    if (!validateGuestDetails()) {
      setCurrentStep(1);
      return;
    }

    let methodDescription = 'Credit / Debit Card';
    let last4 = '4242';

    if (paymentMethodTab === 'card') {
      const rawDigits = cardNumber.replace(/\s/g, '');
      if (rawDigits.length !== 16) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardHolder.trim() || cardHolder.trim().length < 2) {
        setErrorMessage('Please enter the cardholder name as printed on the card.');
        return;
      }
      if (!cardExpiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        setErrorMessage('Please enter a valid card expiry date in MM/YY format (e.g. 08/28).');
        return;
      }
      const [expMonth, expYear] = cardExpiry.split('/').map(Number);
      const now = new Date();
      const currentYear = Number(now.getFullYear().toString().slice(-2));
      const currentMonth = now.getMonth() + 1;
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        setErrorMessage('The card expiry date cannot be in the past.');
        return;
      }
      if (!cardCvv || !/^\d{3,4}$/.test(cardCvv)) {
        setErrorMessage('Please enter a valid 3 or 4 digit CVV security code.');
        return;
      }
      methodDescription = 'Credit / Debit Card';
      last4 = rawDigits.slice(-4);
    } else if (paymentMethodTab === 'upi') {
      if (!upiId.trim() || !upiId.includes('@') || upiId.trim().length < 4) {
        setErrorMessage('Please enter a valid UPI ID (e.g. yourname@upi or mobile@okhdfcbank).');
        return;
      }
      methodDescription = `UPI Instant (${upiId.trim()})`;
      last4 = upiId.replace(/\D/g, '').slice(-4) || '8888';
    } else if (paymentMethodTab === 'applepay') {
      methodDescription = 'Mobile Pay / Express Digital Wallet';
      last4 = '0000';
    } else if (paymentMethodTab === 'netbanking') {
      methodDescription = `NetBanking (${selectedBank || 'HDFC Bank'})`;
      last4 = '1234';
    }

    if (!room?.id) {
      setErrorMessage('Room details are missing. Please return and select a suite.');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setErrorMessage('Check-in and Check-out dates are required. Please select your reservation dates.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Build special requests string including addons
      const addonNotes: string[] = [];
      if (selectedAddons.chauffeur) addonNotes.push('Luxury Airport Chauffeur Transfer (+₹1,800)');
      if (selectedAddons.hamper) addonNotes.push('Royal Mithai & Wine Hamper (+₹1,400)');
      if (selectedAddons.spaPass) addonNotes.push(`Spa Hydrothermal Pass for ${guestsCount} (+₹${2000 * guestsCount})`);
      if (selectedAddons.lateCheckout) addonNotes.push('Late Departure (15:00 PM) (+₹999)');

      const combinedNotes = [specialRequests, addonNotes.join(' • ')].filter(Boolean).join('\nPerks: ');

      const bookingPayload = {
        roomId: room.id,
        userId: user?.uid || (guestEmail ? `guest_${guestEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : `guest_${Date.now()}`),
        checkInDate,
        checkOutDate,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalNights,
        nights: totalNights,
        guestsCount,
        guests: guestsCount,
        roomRatePerNight: effectiveNightlyRate,
        cleaningFee,
        taxesAndFees,
        totalAmount: finalTotalAmount,
        totalPrice: finalTotalAmount,
        paymentMethod: methodDescription,
        paymentCardLast4: last4,
        specialRequests: combinedNotes,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: `+91 ${guestPhone.trim()}`,
      };

      const confirmedBooking = await ApiService.createBooking(bookingPayload, token);
      onBookingSuccess(confirmedBooking);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Payment could not be processed. Please verify your details and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToRoom}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#665E55] hover:text-[#1C1916] bg-white border border-[#ECE5D8] px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#947139]" />
          Back to Suite Details
        </button>

        <div className="flex items-center gap-2 text-xs text-[#7B5C28] bg-[#F6F1E7] border border-[#E5DAC6] px-3.5 py-1.5 rounded-xl font-medium">
          <Lock className="w-3.5 h-3.5 text-[#947139]" />
          <span>256-Bit SSL Encrypted Palace Reservation</span>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white border border-[#ECE5D8] rounded-2xl p-4 flex items-center justify-between max-w-2xl mx-auto shadow-xs">
        <button
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            currentStep >= 1 ? 'text-[#1C1916]' : 'text-[#948A7D]'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === 1
                ? 'bg-[#1C1916] text-[#FAF8F5] font-bold'
                : 'bg-[#F6F1E7] text-[#7B5C28] border border-[#ECE5D8]'
            }`}
          >
            1
          </span>
          <span>Guest Details</span>
        </button>

        <div className={`h-0.5 flex-1 mx-3 ${currentStep >= 2 ? 'bg-[#947139]' : 'bg-[#ECE5D8]'}`} />

        <button
          onClick={() => setCurrentStep(2)}
          className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            currentStep >= 2 ? 'text-[#1C1916]' : 'text-[#948A7D]'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === 2
                ? 'bg-[#1C1916] text-[#FAF8F5] font-bold'
                : currentStep > 2
                ? 'bg-[#F6F1E7] text-[#7B5C28]'
                : 'bg-[#FAF8F5] text-[#948A7D]'
            }`}
          >
            2
          </span>
          <span>Palace Perks</span>
        </button>

        <div className={`h-0.5 flex-1 mx-3 ${currentStep === 3 ? 'bg-[#947139]' : 'bg-[#ECE5D8]'}`} />

        <button
          onClick={() => setCurrentStep(3)}
          className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            currentStep === 3 ? 'text-[#1C1916]' : 'text-[#948A7D]'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === 3
                ? 'bg-[#1C1916] text-[#FAF8F5] font-bold'
                : 'bg-[#FAF8F5] text-[#948A7D]'
            }`}
          >
            3
          </span>
          <span>Payment & Guarantee</span>
        </button>
      </div>

      {/* Main Grid: Form on Left, Summary Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Multi-step Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: GUEST DETAILS */}
          {currentStep === 1 && (
            <div className="bg-white border border-[#E5DAC6] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_20px_rgba(28,25,22,0.03)] animate-in fade-in duration-200">
              <div className="border-b border-[#F3ECE1] pb-4">
                <h2 className="text-xl font-bold font-serif text-[#1C1916]">Primary Guest Information</h2>
                <p className="text-xs text-[#665E55] mt-0.5 font-light">
                  Please provide the primary guest details for your reservation registration and palace confirmation voucher.
                </p>
              </div>

              {!user && (
                <div className="bg-[#FAF8F5] border border-[#ECE5D8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-bold text-[#1C1916]">Have a Grand Imperial VIP Account?</p>
                    <p className="text-[#665E55]">Sign in to auto-populate your details and earn 10% Imperial Privilege points.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="px-4 py-2 bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] text-xs font-semibold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider shrink-0 border border-[#947139]/40"
                  >
                    Sign In
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (!cardHolder) setCardHolder(e.target.value.toUpperCase());
                    }}
                    placeholder="Enter primary guest full name"
                    className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#947139] focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="patron@domain.com"
                    className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#947139] focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Mobile Number *</label>
                    <span className="text-[10px] text-[#786E64] font-medium">10 Digits</span>
                  </div>
                  <div className="flex rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus-within:border-[#947139] focus-within:bg-white transition-colors overflow-hidden">
                    <span className="inline-flex items-center px-3 text-xs font-semibold text-[#786E64] bg-[#F3ECE1] border-r border-[#ECE5D8] select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      value={guestPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full bg-transparent text-[#1C1916] text-xs px-3.5 py-3 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">City & Country of Residence</label>
                  <input
                    type="text"
                    value={guestCity}
                    onChange={(e) => setGuestCity(e.target.value)}
                    placeholder="e.g. Mumbai, New Delhi, London, New York"
                    className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#947139] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">
                  Arrival Time & Special Stay Preferences
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Estimated check-in hour, dietary preferences (e.g. Jain / Vegetarian / Halal), high floor or quiet suite preference..."
                  className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl p-3.5 focus:outline-none focus:border-[#947139] focus:bg-white placeholder:text-[#948A7D] resize-none transition-colors"
                />
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-[#F3ECE1]">
                <button
                  type="button"
                  onClick={() => {
                    if (validateGuestDetails()) {
                      setErrorMessage('');
                      setCurrentStep(2);
                    }
                  }}
                  className="px-7 py-3.5 bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-[0.16em] border border-[#947139]/40"
                >
                  Continue to Palace Perks →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LUXURY ADDONS */}
          {currentStep === 2 && (
            <div className="bg-white border border-[#E5DAC6] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_20px_rgba(28,25,22,0.03)] animate-in fade-in duration-200">
              <div className="border-b border-[#F3ECE1] pb-4">
                <h2 className="text-xl font-bold font-serif text-[#1C1916]">Curated Palace Enhancements (Optional)</h2>
                <p className="text-xs text-[#665E55] mt-0.5 font-light">
                  Enhance your stay with private chauffeur transfers, welcome cellar baskets, and rejuvenating spa passes.
                </p>
              </div>

              <div className="space-y-3">
                {/* Chauffeur */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedAddons.chauffeur
                      ? 'bg-[#F6F1E7] border-[#947139] text-[#1C1916]'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:border-[#947139]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedAddons.chauffeur}
                      onChange={(e) =>
                        setSelectedAddons({ ...selectedAddons, chauffeur: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#947139] rounded cursor-pointer"
                    />
                    <Car className="w-5 h-5 text-[#947139]" />
                    <div>
                      <p className="text-xs font-bold text-[#1C1916]">Luxury Airport Chauffeur Transfer</p>
                      <p className="text-[11px] text-[#665E55]">Mercedes-Benz / BMW private pickup from Mumbai CSIA Airport (BOM)</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#7B5C28]">+₹1,800</span>
                </label>

                {/* Hamper */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedAddons.hamper
                      ? 'bg-[#F6F1E7] border-[#947139] text-[#1C1916]'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:border-[#947139]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedAddons.hamper}
                      onChange={(e) =>
                        setSelectedAddons({ ...selectedAddons, hamper: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#947139] rounded cursor-pointer"
                    />
                    <Wine className="w-5 h-5 text-[#947139]" />
                    <div>
                      <p className="text-xs font-bold text-[#1C1916]">Royal Mithai & Wine Cellar Hamper</p>
                      <p className="text-[11px] text-[#665E55]">Artisan Indian sweets, roasted dry fruits & chilled estate wine in-suite</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#7B5C28]">+₹1,400</span>
                </label>

                {/* Spa Pass */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedAddons.spaPass
                      ? 'bg-[#F6F1E7] border-[#947139] text-[#1C1916]'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:border-[#947139]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedAddons.spaPass}
                      onChange={(e) =>
                        setSelectedAddons({ ...selectedAddons, spaPass: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#947139] rounded cursor-pointer"
                    />
                    <Waves className="w-5 h-5 text-[#947139]" />
                    <div>
                      <p className="text-xs font-bold text-[#1C1916]">Jiva Ayurvedic Spa & Hydrothermal Plunge Pass</p>
                      <p className="text-[11px] text-[#665E55]">Daily aromatic herbal steam, Himalayan salt sauna & plunge pools</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#7B5C28]">
                    +₹{(2000 * guestsCount).toLocaleString('en-IN')} (₹2,000/guest)
                  </span>
                </label>

                {/* Late Checkout */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedAddons.lateCheckout
                      ? 'bg-[#F6F1E7] border-[#947139] text-[#1C1916]'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:border-[#947139]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedAddons.lateCheckout}
                      onChange={(e) =>
                        setSelectedAddons({ ...selectedAddons, lateCheckout: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#947139] rounded cursor-pointer"
                    />
                    <Clock className="w-5 h-5 text-[#947139]" />
                    <div>
                      <p className="text-xs font-bold text-[#1C1916]">Guaranteed Late Departure (15:00 PM)</p>
                      <p className="text-[11px] text-[#665E55]">Extended suite comfort and pool access beyond standard 11:00 AM checkout</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#7B5C28]">+₹999</span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[#F3ECE1]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-[#665E55] hover:text-[#1C1916] cursor-pointer uppercase tracking-wider"
                >
                  ← Back to Details
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-7 py-3.5 bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-[0.16em] border border-[#947139]/40"
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#E5DAC6] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_20px_rgba(28,25,22,0.03)] animate-in fade-in duration-200">
              <div className="border-b border-[#F3ECE1] pb-4">
                <h2 className="text-xl font-bold font-serif text-[#1C1916]">Payment & Reservation Guarantee</h2>
                <p className="text-xs text-[#665E55] mt-0.5 font-light">
                  Select your preferred payment method. All transactions are securely processed with end-to-end encryption.
                </p>
              </div>

              {/* Payment Methods Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('card')}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'card'
                      ? 'bg-[#1C1916] text-[#FAF8F5] border-[#947139] shadow-sm'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:text-[#1C1916] hover:bg-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#947139]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Credit / Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('upi')}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'upi'
                      ? 'bg-[#1C1916] text-[#FAF8F5] border-[#947139] shadow-sm'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:text-[#1C1916] hover:bg-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-[#947139]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('netbanking')}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'netbanking'
                      ? 'bg-[#1C1916] text-[#FAF8F5] border-[#947139] shadow-sm'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:text-[#1C1916] hover:bg-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-[#947139]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">NetBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('applepay')}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'applepay'
                      ? 'bg-[#1C1916] text-[#FAF8F5] border-[#947139] shadow-sm'
                      : 'bg-[#FAF8F5] border-[#ECE5D8] text-[#665E55] hover:text-[#1C1916] hover:bg-white'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-[#947139]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Mobile Pay</span>
                </button>
              </div>

              {/* CARD VISUALIZER & INPUT FORM */}
              {paymentMethodTab === 'card' && (
                <div className="space-y-5">
                  {/* Luxury Metallic Card Preview */}
                  <div className="relative w-full max-w-sm mx-auto aspect-[1.586] rounded-2xl p-5 bg-[#161412] border border-[#947139]/50 shadow-xl text-white flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[11px] font-serif font-bold tracking-widest text-[#E6CA85]">
                        THE GRAND IMPERIAL PALACE
                      </span>
                      <span className="text-[10px] font-bold text-[#EAE4D9] uppercase tracking-wider">
                        VISA / Mastercard / RuPay
                      </span>
                    </div>

                    {/* Chip */}
                    <div className="w-10 h-7 rounded-md bg-[#E6CA85]/80 my-1 shadow-xs border border-[#947139]" />

                    <div className="z-10 space-y-2">
                      <div className="font-mono text-base sm:text-lg tracking-widest text-[#FAF8F5] font-semibold">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end text-[10px] text-[#C9C2B5] uppercase tracking-wider">
                        <div>
                          <p className="text-[8px] text-[#948A7D]">Primary Patron</p>
                          <p className="text-[#FAF8F5] font-semibold truncate max-w-[170px]">
                            {cardHolder ? cardHolder.toUpperCase() : 'VALUED PATRON'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-[#948A7D]">Expires</p>
                          <p className="text-[#FAF8F5] font-semibold">{cardExpiry || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Card Number *</label>
                        <span className="text-[10px] text-[#786E64] font-medium">16 Digits</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="•••• •••• •••• •••• (16 digits)"
                        className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] font-mono text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#947139] focus:bg-white tracking-widest transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Cardholder Name *</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Full name as printed on card"
                        className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#947139] focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Expiry Date *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl px-3 py-3 focus:outline-none focus:border-[#947139] focus:bg-white text-center font-mono transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Security CVV *</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => handleCvvChange(e.target.value)}
                          placeholder="3 or 4 digits"
                          className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl px-3 py-3 focus:outline-none focus:border-[#947139] focus:bg-white text-center font-mono transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Tab */}
              {paymentMethodTab === 'upi' && (
                <div className="bg-[#FAF8F5] border border-[#ECE5D8] rounded-2xl p-6 text-center space-y-4">
                  <div className="w-36 h-36 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center border border-[#ECE5D8] shadow-xs">
                    <QrCode className="w-32 h-32 text-[#1C1916]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C1916]">Scan & Pay with Any UPI App</p>
                    <p className="text-xs text-[#665E55] mt-1 font-mono">Google Pay, PhonePe, Paytm, or BHIM</p>
                  </div>
                  <div className="max-w-xs mx-auto text-left space-y-1 pt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Or Enter Your UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@upi or mobile@okhdfcbank"
                      className="w-full bg-white border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#947139]"
                    />
                  </div>
                </div>
              )}

              {paymentMethodTab === 'applepay' && (
                <div className="bg-[#FAF8F5] border border-[#ECE5D8] rounded-2xl p-8 text-center space-y-3">
                  <Smartphone className="w-10 h-10 text-[#947139] mx-auto" />
                  <p className="text-sm font-bold text-[#1C1916]">One-Touch Biometric Express Checkout</p>
                  <p className="text-xs text-[#665E55]">
                    Authorize reservation with Touch ID, Face ID, or your device wallet.
                  </p>
                </div>
              )}

              {paymentMethodTab === 'netbanking' && (
                <div className="bg-[#FAF8F5] border border-[#ECE5D8] rounded-2xl p-5 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#947139]">Select Indian Banking Partner</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-white border border-[#ECE5D8] text-[#1C1916] text-xs rounded-xl p-3 focus:outline-none focus:border-[#947139]"
                  >
                    <option>HDFC Bank</option>
                    <option>State Bank of India (SBI)</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                    <option>Punjab National Bank</option>
                    <option>Bank of Baroda</option>
                  </select>
                </div>
              )}

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-[#F3ECE1]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-[#665E55] hover:text-[#1C1916] cursor-pointer uppercase tracking-wider"
                >
                  ← Back to Perks
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteBooking}
                  className="px-8 py-3.5 bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-bold text-xs uppercase tracking-[0.16em] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 border border-[#947139]/40"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#E6CA85] stroke-[2.2]" />
                      <span>Pay ₹{finalTotalAmount.toLocaleString('en-IN')} & Confirm Stay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Stay Summary Card (Sticky) */}
        <div className="lg:col-span-1 sticky top-28 space-y-4">
          <div className="bg-white border border-[#E5DAC6] rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(28,25,22,0.03)] space-y-5">
            <h3 className="text-base font-bold font-serif text-[#1C1916] border-b border-[#F3ECE1] pb-3">
              Reservation Summary
            </h3>

            {/* Room mini card */}
            <div className="flex gap-3.5 items-center">
              <img
                src={displayRoomImg}
                alt={room.name}
                className="w-20 h-16 rounded-xl object-cover border border-[#ECE5D8] shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#1C1916] truncate font-serif">{room.name}</p>
                <p className="text-[11px] text-[#665E55]">
                  Suite #{room.roomNumber} • {room.category}
                </p>
                <p className="text-[10px] text-[#7B5C28] font-medium">{room.viewType}</p>
              </div>
            </div>

            {/* Stay Dates */}
            <div className="bg-[#FAF8F5] rounded-xl p-3.5 space-y-2 border border-[#ECE5D8] text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#665E55] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#947139]" />
                  Check-in
                </span>
                <span className="font-semibold text-[#1C1916]">{checkInDate} (14:00)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#665E55] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#947139]" />
                  Check-out
                </span>
                <span className="font-semibold text-[#1C1916]">{checkOutDate} (11:00)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#ECE5D8] text-[11px]">
                <span className="text-[#948A7D]">Duration</span>
                <span className="text-[#7B5C28] font-bold">{totalNights} {totalNights === 1 ? 'Night' : 'Nights'} • {guestsCount} {guestsCount === 1 ? 'Guest' : 'Guests'}</span>
              </div>
            </div>

            {/* Itemized Calculation in INR (₹) */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#665E55]">
                <span>
                  Suite Base (₹{effectiveNightlyRate.toLocaleString('en-IN')} × {totalNights}n)
                </span>
                <span className="font-semibold text-[#1C1916]">₹{roomSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {roomDiscountSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Suite Privilege ({roomDiscountPercent}% OFF)</span>
                  <span>-₹{roomDiscountSavings.toLocaleString('en-IN')}</span>
                </div>
              )}

              {appliedPromo && promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <span>Privilege Voucher ({appliedPromo})</span>
                  </span>
                  <span>-₹{promoDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {addonsCost > 0 && (
                <div className="flex justify-between text-[#7B5C28] font-medium">
                  <span>Palace Enhancements</span>
                  <span>+₹{addonsCost.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-[#665E55]">
                <span>Sanitization & Linens</span>
                <span>₹{cleaningFee.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-[#665E55]">
                <span>12% Goods & Services Tax (GST)</span>
                <span>₹{taxesAndFees.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-[#ECE5D8] pt-3 flex justify-between items-baseline font-bold">
                <span className="text-[#1C1916] text-sm">Total Payable</span>
                <span className="text-[#7B5C28] text-2xl font-serif">₹{finalTotalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Promo Voucher Code Box */}
            <div className="pt-2 border-t border-[#F3ECE1] space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#947139]">
                Palace Privilege / Voucher Code
              </label>
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-mono font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{appliedPromo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="e.g. IMPERIAL10"
                    className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] text-xs uppercase font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-[#947139]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-3 py-2 bg-[#FAF8F5] hover:bg-[#F6F1E7] border border-[#ECE5D8] hover:border-[#947139] text-[#7B5C28] font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0 uppercase tracking-wider"
                  >
                    Apply
                  </button>
                </div>
              )}
              {promoSuccessMsg && (
                <p className="text-[10px] text-emerald-700 font-medium">{promoSuccessMsg}</p>
              )}
              {promoErrorMsg && (
                <p className="text-[10px] text-rose-600 font-medium">{promoErrorMsg}</p>
              )}
            </div>

            {/* Loyalty points note */}
            <div className="bg-[#FAF8F5] border border-[#ECE5D8] rounded-xl p-2.5 text-[11px] text-[#7B5C28] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#947139] shrink-0" />
              <span>
                Earn <strong>+{Math.floor(finalTotalAmount * 0.05)} Privilege Points</strong> on this stay
              </span>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
