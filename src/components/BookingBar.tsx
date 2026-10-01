import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Users,
  Search,
  Crown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  X,
} from 'lucide-react';

interface BookingBarProps {
  checkInDate: string;
  setCheckInDate: (date: string) => void;
  checkOutDate: string;
  setCheckOutDate: (date: string) => void;
  guestsCount: number;
  setGuestsCount: (guests: number) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onSearch: (filters?: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    category?: string;
  }) => void;
  variant?: 'floating' | 'embedded' | 'compact';
}

const CATEGORIES = [
  { id: 'All', label: 'All Suites (34)', desc: '34 Available Chambers' },
  { id: 'Standard', label: 'Standard Heritage', desc: 'Courtyard & City View' },
  { id: 'Deluxe', label: 'Deluxe Heritage', desc: 'Garden & Pool View' },
  { id: 'Executive', label: 'Executive Club', desc: 'Private Lounge Access' },
  { id: 'Suite', label: 'Maharaja Luxury Suite', desc: 'Panoramic Sea Front' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BookingBar: React.FC<BookingBarProps> = ({
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guestsCount,
  setGuestsCount,
  selectedCategory,
  setSelectedCategory,
  onSearch,
  variant = 'floating',
}) => {
  // Calendar picker state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [viewMonth, setViewMonth] = useState(() => {
    const d = checkInDate ? new Date(checkInDate + 'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const checkInInputRef = useRef<HTMLInputElement>(null);
  const checkOutInputRef = useRef<HTMLInputElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarContainerRef.current &&
        !calendarContainerRef.current.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarOpen]);

  // Format dates for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return { day: '--', monthYear: 'Select date', weekday: '' };
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const weekday = d.toLocaleString('en-US', { weekday: 'short' });
      return {
        day: day.toString().padStart(2, '0'),
        monthYear: `${month} ${year}`,
        weekday: weekday.toUpperCase(),
      };
    } catch {
      return { day: '--', monthYear: dateStr, weekday: '' };
    }
  };

  // Calculate nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    try {
      const d1 = new Date(checkInDate + 'T00:00:00');
      const d2 = new Date(checkOutDate + 'T00:00:00');
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const totalNights = calculateNights();
  const checkInFormatted = formatDateDisplay(checkInDate);
  const checkOutFormatted = formatDateDisplay(checkOutDate);

  // Quick preset shortcuts
  const setQuickPreset = (type: 'tonight' | 'tomorrow' | 'weekend' | '3nights' | '5nights') => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (type === 'tonight') {
      const inDate = new Date(today);
      const outDate = new Date(today);
      outDate.setDate(outDate.getDate() + 1);
      setCheckInDate(toYMD(inDate));
      setCheckOutDate(toYMD(outDate));
    } else if (type === 'tomorrow') {
      const inDate = new Date(today);
      inDate.setDate(inDate.getDate() + 1);
      const outDate = new Date(inDate);
      outDate.setDate(outDate.getDate() + 1);
      setCheckInDate(toYMD(inDate));
      setCheckOutDate(toYMD(outDate));
    } else if (type === 'weekend') {
      const friday = new Date(today);
      const dayOfWeek = today.getDay();
      const distanceToFriday = (5 - dayOfWeek + 7) % 7;
      friday.setDate(today.getDate() + (distanceToFriday === 0 ? 7 : distanceToFriday));
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      setCheckInDate(toYMD(friday));
      setCheckOutDate(toYMD(sunday));
    } else if (type === '3nights') {
      const inDate = new Date(today);
      const outDate = new Date(today);
      outDate.setDate(outDate.getDate() + 3);
      setCheckInDate(toYMD(inDate));
      setCheckOutDate(toYMD(outDate));
    } else if (type === '5nights') {
      const inDate = new Date(today);
      const outDate = new Date(today);
      outDate.setDate(outDate.getDate() + 5);
      setCheckInDate(toYMD(inDate));
      setCheckOutDate(toYMD(outDate));
    }
  };

  const handleOpenCalendar = (field: 'checkIn' | 'checkOut') => {
    setActiveDateField(field);
    setCalendarOpen(true);
    const targetDate = field === 'checkIn' ? checkInDate : checkOutDate;
    if (targetDate) {
      const d = new Date(targetDate + 'T00:00:00');
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  // Calendar day click (Single date selection mode)
  const handleDaySelect = (dayDateStr: string) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (activeDateField === 'checkIn') {
      setCheckInDate(dayDateStr);
      // If current checkOut is on or before selected checkIn, bump checkOut by 1 day
      if (checkOutDate <= dayDateStr) {
        const nextDay = new Date(dayDateStr + 'T00:00:00');
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(toYMD(nextDay));
      }
      setCalendarOpen(false);
    } else {
      // Selecting checkOut date
      if (dayDateStr <= checkInDate) {
        const prevDay = new Date(dayDateStr + 'T00:00:00');
        prevDay.setDate(prevDay.getDate() - 1);
        setCheckInDate(toYMD(prevDay));
      }
      setCheckOutDate(dayDateStr);
      setCalendarOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCalendarOpen(false);
    onSearch({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guestsCount,
      category: selectedCategory,
    });
  };

  // Generate calendar grid for viewMonth (Single date marked)
  const generateMonthDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const days = [];

    // Empty lead slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    const currentActiveDate = activeDateField === 'checkIn' ? checkInDate : checkOutDate;

    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(year, month, d);
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isPast = current < today;
      const isSelected = dateStr === currentActiveDate;

      days.push({
        type: 'day',
        dayNumber: d,
        dateStr,
        isPast,
        isSelected,
        key: dateStr,
      });
    }

    return days;
  };

  const monthDays = generateMonthDays(viewMonth);
  const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  const nextMonthDays = generateMonthDays(nextMonth);

  return (
    <div
      ref={calendarContainerRef}
      className={`w-full ${
        variant === 'floating'
          ? 'bg-white rounded-3xl border border-[#E5DAC6] shadow-[0_20px_50px_rgba(28,25,22,0.08)]'
          : 'bg-white rounded-2xl border border-[#ECE5D8] shadow-xs'
      } p-4 sm:p-6 transition-all relative z-30`}
    >
      {/* Top Header & Fast Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#F3ECE1]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#947139] shadow-xs" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#665E55]">
            Direct Palace Reservation Engine
          </span>
          <span className="text-[10px] text-[#7B5C28] bg-[#F6F1E7] px-2.5 py-0.5 rounded-full font-semibold border border-[#E5DAC6]">
            Best Rate in ₹ INR
          </span>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#948A7D] hidden sm:inline-block mr-1">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => setQuickPreset('tonight')}
            className="text-[11px] font-medium px-3 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#665E55] hover:text-[#1C1916] border border-[#ECE5D8] transition-colors cursor-pointer"
          >
            Tonight (1N)
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset('tomorrow')}
            className="text-[11px] font-medium px-3 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#665E55] hover:text-[#1C1916] border border-[#ECE5D8] transition-colors cursor-pointer"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset('weekend')}
            className="text-[11px] font-medium px-3 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#665E55] hover:text-[#1C1916] border border-[#ECE5D8] transition-colors cursor-pointer"
          >
            Weekend
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset('3nights')}
            className="text-[11px] font-medium px-3 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#665E55] hover:text-[#1C1916] border border-[#ECE5D8] transition-colors cursor-pointer"
          >
            3 Nights
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 items-stretch">
        {/* Check-In Column (3 cols) */}
        <div
          id="booking-bar-checkin-container"
          onClick={() => handleOpenCalendar('checkIn')}
          className={`md:col-span-3 rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer relative group ${
            calendarOpen && activeDateField === 'checkIn'
              ? 'bg-[#F6F1E7] border-[#947139] shadow-md ring-1 ring-[#947139]'
              : 'bg-[#FAF8F5] hover:bg-[#F6F1E7]/70 border-[#ECE5D8] hover:border-[#947139]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#947139] flex items-center gap-1.5 cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-[#947139]" />
              Check-In Date
            </label>
            <span className="text-[10px] font-mono text-[#7B5C28] bg-white px-2 py-0.5 rounded border border-[#ECE5D8] font-bold">
              {checkInFormatted.weekday || 'SELECT'}
            </span>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1916] tracking-tight">
              {checkInFormatted.day}
            </span>
            <div className="text-xs text-[#665E55] font-medium leading-tight">
              <span className="font-semibold text-[#1C1916] block">{checkInFormatted.monthYear}</span>
              <span className="text-[10px] text-[#948A7D]">From 14:00 PM</span>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-[#947139] font-medium flex items-center gap-1">
            <span>Click to change date</span>
            <ChevronDown className="w-3 h-3 text-[#947139]" />
          </div>          {/* Native Hidden Date Input */}
          <input
            ref={checkInInputRef}
            id="booking-bar-checkin"
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
            className="sr-only"
          />
        </div>

        {/* Check-Out Column (3 cols) */}
        <div
          id="booking-bar-checkout-container"
          onClick={() => handleOpenCalendar('checkOut')}
          className={`md:col-span-3 rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer relative group ${
            calendarOpen && activeDateField === 'checkOut'
              ? 'bg-[#F6F1E7] border-[#947139] shadow-md ring-1 ring-[#947139]'
              : 'bg-[#FAF8F5] hover:bg-[#F6F1E7]/70 border-[#ECE5D8] hover:border-[#947139]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#947139] flex items-center gap-1.5 cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-[#947139]" />
              Check-Out Date
            </label>
            <span className="text-[10px] font-semibold text-[#7B5C28] bg-[#F6F1E7] px-2 py-0.5 rounded-full border border-[#ECE5D8]">
              {totalNights} {totalNights === 1 ? 'Night' : 'Nights'}
            </span>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917] tracking-tight">
              {checkOutFormatted.day}
            </span>
            <div className="text-xs text-[#665E55] font-medium leading-tight">
              <span className="font-semibold text-[#1C1916] block">{checkOutFormatted.monthYear}</span>
              <span className="text-[10px] text-[#948A7D]">Until 11:00 AM</span>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-[#947139] font-medium flex items-center gap-1">
            <span>Click to change date</span>
            <ChevronDown className="w-3 h-3 text-[#947139]" />
          </div>

          <input
            ref={checkOutInputRef}
            id="booking-bar-checkout"
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
            className="sr-only"
          />
        </div>

        {/* Guests & Category Column (3 cols) */}
        <div className="md:col-span-3 grid grid-cols-2 gap-2">
          {/* Guests */}
          <div className="bg-[#FAF8F5] hover:bg-[#F6F1E7]/40 border border-[#ECE5D8] rounded-2xl p-3 sm:p-3.5 transition-colors flex flex-col justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#947139] flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-[#947139]" />
              Patrons
            </label>
            <select
              id="booking-bar-guests"
              value={guestsCount}
              onChange={(e) => setGuestsCount(Number(e.target.value))}
              className="w-full bg-transparent text-[#1C1916] text-xs sm:text-sm font-bold focus:outline-none cursor-pointer py-1"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
            </select>
            <span className="text-[10px] text-[#948A7D] block truncate">1 Royal Chamber</span>
          </div>

          {/* Category */}
          <div className="bg-[#FAF8F5] hover:bg-[#F6F1E7]/40 border border-[#ECE5D8] rounded-2xl p-3 sm:p-3.5 transition-colors flex flex-col justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#947139] flex items-center gap-1 mb-1">
              <Crown className="w-3 h-3 text-[#947139]" />
              Suite Tier
            </label>
            <select
              id="booking-bar-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent text-[#1C1916] text-xs sm:text-sm font-bold focus:outline-none cursor-pointer py-1 truncate"
            >
              <option value="All">All Suites</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Executive">Executive</option>
              <option value="Suite">Maharaja</option>
            </select>
            <span className="text-[10px] text-[#948A7D] block truncate">34 Chambers</span>
          </div>
        </div>

        {/* CTA Search Button (3 cols) */}
        <div className="md:col-span-3 flex items-center">
          <button
            type="submit"
            id="booking-bar-search-btn"
            className="w-full h-full min-h-[64px] bg-[#1C1916] hover:bg-[#2C2723] active:bg-[#141210] text-[#FAF8F5] rounded-2xl p-3.5 transition-all shadow-md hover:shadow-xl flex items-center justify-between px-5 group cursor-pointer border border-[#947139]/40"
          >
            <div className="text-left">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#FAF8F5] block font-serif">
                Check Availability
              </span>
              <span className="text-[10px] text-[#D8CEBE] block font-light mt-0.5">
                Explore Rooms in ₹ INR
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#947139] flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </form>

      {/* LUXURY INTERACTIVE CALENDAR POPOVER */}
      {calendarOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl border border-[#E5DAC6] shadow-[0_25px_60px_rgba(28,25,22,0.18)] p-4 sm:p-6 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
          {/* Header of Calendar Modal */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F3ECE1]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F6F1E7] border border-[#E5DAC6] flex items-center justify-center text-[#947139]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-serif text-[#1C1916]">
                  {activeDateField === 'checkIn' ? 'Select Check-In Date' : 'Select Check-Out Date'}
                </h4>
                <p className="text-[11px] text-[#665E55]">
                  Click on any date to set your {activeDateField === 'checkIn' ? 'arrival' : 'departure'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#FAF8F5] border border-[#ECE5D8] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(viewMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setViewMonth(prev);
                  }}
                  className="p-1.5 hover:bg-white rounded-lg text-[#665E55] transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(viewMonth);
                    next.setMonth(next.getMonth() + 1);
                    setViewMonth(next);
                  }}
                  className="p-1.5 hover:bg-white rounded-lg text-[#665E55] transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="p-2 text-[#948A7D] hover:text-[#1C1916] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Months Display (1 Month on Mobile, 2 Months on Desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Month View */}
            <div className="space-y-3">
              <div className="text-center font-serif font-bold text-sm text-[#1C1916] py-1 bg-[#FAF8F5] rounded-xl border border-[#ECE5D8]">
                {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </div>

              {/* Day Name Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#948A7D] uppercase tracking-wider">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((item) => {
                  if (item.type === 'empty') {
                    return <div key={item.key} className="h-8 sm:h-9" />;
                  }

                  const isSelected = item.isSelected;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={item.isPast}
                      onClick={() => item.dateStr && handleDaySelect(item.dateStr)}
                      className={`h-8 sm:h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                        item.isPast
                          ? 'text-[#C9C2B5] cursor-not-allowed opacity-40'
                          : isSelected
                          ? 'bg-[#1C1916] text-[#FAF8F5] font-bold shadow-md scale-105 border border-[#947139]'
                          : 'hover:bg-[#FAF8F5] text-[#1C1916] hover:border hover:border-[#ECE5D8]'
                      }`}
                    >
                      {item.dayNumber}
                      {isSelected && (
                        <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#E6CA85]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Second Month View (Visible on tablet/desktop) */}
            <div className="hidden md:block space-y-3">
              <div className="text-center font-serif font-bold text-sm text-[#1C1916] py-1 bg-[#FAF8F5] rounded-xl border border-[#ECE5D8]">
                {MONTH_NAMES[nextMonth.getMonth()]} {nextMonth.getFullYear()}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#948A7D] uppercase tracking-wider">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {nextMonthDays.map((item) => {
                  if (item.type === 'empty') {
                    return <div key={item.key} className="h-8 sm:h-9" />;
                  }

                  const isSelected = item.isSelected;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={item.isPast}
                      onClick={() => item.dateStr && handleDaySelect(item.dateStr)}
                      className={`h-8 sm:h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                        item.isPast
                          ? 'text-[#C9C2B5] cursor-not-allowed opacity-40'
                          : isSelected
                          ? 'bg-[#1C1916] text-[#FAF8F5] font-bold shadow-md scale-105 border border-[#947139]'
                          : 'hover:bg-[#FAF8F5] text-[#1C1916] hover:border hover:border-[#ECE5D8]'
                      }`}
                    >
                      {item.dayNumber}
                      {isSelected && (
                        <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#E6CA85]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Actions of Calendar */}
          <div className="mt-5 pt-4 border-t border-[#F3ECE1] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeDateField === 'checkIn' ? 'bg-[#947139]' : 'bg-[#C9C2B5]'}`} />
                <span className="text-[#665E55]">
                  Check-in: <strong className="text-[#1C1916]">{checkInFormatted.day} {checkInFormatted.monthYear}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeDateField === 'checkOut' ? 'bg-[#947139]' : 'bg-[#C9C2B5]'}`} />
                <span className="text-[#665E55]">
                  Check-out: <strong className="text-[#1C1916]">{checkOutFormatted.day} {checkOutFormatted.monthYear}</strong>
                </span>
              </div>
              <span className="text-[#947139] font-bold bg-[#F6F1E7] px-2.5 py-0.5 rounded-full border border-[#ECE5D8]">
                {totalNights} {totalNights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCalendarOpen(false)}
              className="px-5 py-2 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs border border-[#947139]/40"
            >
              Close Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
