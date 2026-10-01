import React, { useState } from 'react';
import { Room } from '../types.ts';
import { RoomCard } from '../components/RoomCard.tsx';
import { BookingBar } from '../components/BookingBar.tsx';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Coffee,
  Wifi,
  Utensils,
  Filter,
  CheckCircle2,
  BedDouble,
} from 'lucide-react';

interface ExploreRoomsViewProps {
  rooms: Room[];
  loading: boolean;
  onSelectRoom: (room: Room) => void;
  onBookRoom: (room: Room, checkIn: string, checkOut: string, guests: number) => void;
  checkInDate: string;
  setCheckInDate: (date: string) => void;
  checkOutDate: string;
  setCheckOutDate: (date: string) => void;
  guestsCount: number;
  setGuestsCount: (guests: number) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priceRange: number;
  setPriceRange: (price: number) => void;
  resetFilters: () => void;
}

const CATEGORIES = ['All', 'Standard', 'Deluxe', 'Executive', 'Suite'];

export const ExploreRoomsView: React.FC<ExploreRoomsViewProps> = ({
  rooms,
  loading,
  onSelectRoom,
  onBookRoom,
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guestsCount,
  setGuestsCount,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  priceRange,
  setPriceRange,
  resetFilters,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating'>('recommended');

  // Filter and sort rooms based on search, category, max price (after discount), capacity, and user sorting preference
  const filteredRooms = rooms
    .filter((room) => {
      if (selectedCategory !== 'All' && room.category !== selectedCategory) {
        return false;
      }
      const effectivePrice = Math.round(room.pricePerNight * (1 - (room.discountPercent || 0) / 100));
      if (effectivePrice > priceRange) {
        return false;
      }
      if (guestsCount > room.capacity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = room.name.toLowerCase().includes(q);
        const matchDesc = room.description.toLowerCase().includes(q);
        const matchCat = room.category.toLowerCase().includes(q);
        const matchNum = room.roomNumber.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat && !matchNum) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = Math.round(a.pricePerNight * (1 - (a.discountPercent || 0) / 100));
      const priceB = Math.round(b.pricePerNight * (1 - (b.discountPercent || 0) / 100));
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  return (
    <div className="space-y-8 sm:space-y-10 pb-20">
      {/* Top Header Banner with Palatial Ambience */}
      <section className="relative rounded-3xl overflow-hidden bg-[#161412] text-white p-6 sm:p-10 lg:p-12 border border-[#ECE5D8]/25 shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80"
            alt="Heritage Palace Exterior"
            className="w-full h-full object-cover opacity-35 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#161412] via-[#161412]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[#FAF8F5] text-[11px] font-medium uppercase tracking-[0.16em]">
            <Sparkles className="w-3.5 h-3.5 text-[#E6CA85]" />
            Imperial Accommodations
          </div>

          <h1 className="text-3xl sm:text-5xl font-normal font-serif text-[#FAF8F5] tracking-tight leading-tight">
            Chambers & Luxury Suites
          </h1>

          <p className="text-xs sm:text-sm text-[#DCD5C9] max-w-2xl leading-relaxed font-light">
            Select from our 34 meticulously restored heritage rooms and suites. All reservations include daily royal breakfast, 24/7 butler service, and complimentary high-speed fiber connectivity.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#EAE4D9]">
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Free Cancellation
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 text-[11px]">
              <Utensils className="w-3.5 h-3.5 text-[#E6CA85]" />
              Royal Indian Breakfast
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 text-[11px]">
              <Wifi className="w-3.5 h-3.5 text-cyan-300" />
              Fiber High-Speed WiFi
            </span>
          </div>
        </div>
      </section>

      {/* Embedded Aesthetic Booking Bar */}
      <section className="-mt-4 relative z-20">
        <BookingBar
          checkInDate={checkInDate}
          setCheckInDate={setCheckInDate}
          checkOutDate={checkOutDate}
          setCheckOutDate={setCheckOutDate}
          guestsCount={guestsCount}
          setGuestsCount={setGuestsCount}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onSearch={() => {}}
          variant="embedded"
        />
      </section>

      {/* Filter Chips & Keyword Search Bar */}
      <section className="bg-white border border-[#ECE5D8] rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(28,25,22,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Categories Pill Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`category-filter-btn-${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1C1916] text-[#FAF8F5] shadow-xs border border-[#947139]'
                    : 'bg-[#FAF8F5] text-[#665E55] hover:bg-[#F3ECE1] border border-[#ECE5D8]'
                }`}
              >
                {cat === 'All' ? 'All Suites (34)' : cat}
              </button>
            ))}
          </div>

          {/* Keyword Search & Price Toggle */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 min-w-[180px] sm:w-64">
              <input
                id="search-keyword-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suite, sea view, 101..."
                className="w-full bg-[#FAF8F5] border border-[#ECE5D8] text-[#1C1916] rounded-xl pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:border-[#947139] focus:bg-white transition-colors placeholder:text-[#948A7D]"
              />
              <Search className="w-3.5 h-3.5 text-[#948A7D] absolute left-3 top-2.5" />
            </div>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#665E55] border border-[#ECE5D8] px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:border-[#947139] cursor-pointer"
            >
              <option value="recommended">Featured Suites</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Guest Rating</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-1.5 text-xs text-[#665E55] hover:text-[#1C1917] bg-[#FAF8F5] hover:bg-[#F3ECE1] px-3.5 py-2 rounded-xl border border-[#ECE5D8] transition-colors font-medium cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#947139]" />
              <span className="hidden sm:inline">Tariff Filter</span>
              <span className="sm:hidden">Tariff</span>
            </button>

            <button
              id="reset-filters-btn"
              onClick={resetFilters}
              className="text-xs text-[#948A7D] hover:text-[#1C1916] p-2 rounded-lg transition-colors cursor-pointer bg-[#FAF8F5] border border-[#ECE5D8]"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Price Range Slider */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-[#F3ECE1] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex-1 w-full space-y-1.5">
              <div className="flex justify-between text-xs text-[#665E55]">
                <span>Maximum Nightly Tariff (₹ INR)</span>
                <span className="text-[#947139] font-bold text-sm font-serif">₹{priceRange.toLocaleString('en-IN')} INR</span>
              </div>
              <input
                id="price-range-slider"
                type="range"
                min={2000}
                max={50000}
                step={500}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#947139] bg-[#ECE5D8] h-2 rounded-lg cursor-pointer"
              />
            </div>
            <div className="text-xs text-[#948A7D] shrink-0">
              Showing suites up to <strong className="text-[#1C1916]">₹{priceRange.toLocaleString('en-IN')}</strong> / night
            </div>
          </div>
        )}
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-normal font-serif text-[#1C1916] tracking-tight">
            Available Luxury Accommodations
          </h2>
          <p className="text-xs text-[#665E55] mt-0.5 font-light">
            Displaying {filteredRooms.length} of {rooms.length} curated rooms & suites in Mumbai
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-Time Cloud SQL Sync</span>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#ECE5D8] rounded-2xl h-96 animate-pulse p-4 space-y-4 shadow-xs">
              <div className="h-48 bg-[#FAF8F5] rounded-xl" />
              <div className="h-6 bg-[#FAF8F5] rounded w-3/4" />
              <div className="h-4 bg-[#FAF8F5] rounded w-1/2" />
              <div className="h-10 bg-[#FAF8F5] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white border border-[#ECE5D8] rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <Filter className="w-12 h-12 text-[#948A7D] mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-[#1C1916] font-serif">No Rooms Match Your Selected Filters</h3>
          <p className="text-xs text-[#665E55] font-light leading-relaxed">
            Please adjust your guest count, price range, or category filter to view other available palace suites.
          </p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-semibold text-xs rounded-xl transition-all shadow-xs uppercase tracking-wider cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onSelect={onSelectRoom}
              onQuickBook={(selectedRoom) =>
                onBookRoom(selectedRoom, checkInDate, checkOutDate, guestsCount)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
