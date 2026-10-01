import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NetworkStatusProvider, useNetworkStatus } from './context/NetworkStatusContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HomeView } from './views/HomeView.tsx';
import { ServicesView } from './views/ServicesView.tsx';
import { ExploreRoomsView } from './views/ExploreRoomsView.tsx';
import { RoomDetailView } from './views/RoomDetailView.tsx';
import { CheckoutView } from './views/CheckoutView.tsx';
import { BookingConfirmationView } from './views/BookingConfirmationView.tsx';
import { MyBookingsView } from './views/MyBookingsView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { AdminPortalView } from './views/AdminPortalView.tsx';
import { ReceptionView } from './views/ReceptionView.tsx';
import { Room, Booking, HotelSettings, ActiveView } from './types.ts';
import { ApiService } from './services/api.ts';
import { ClientStore } from './services/clientStore.ts';
import { Sparkles, Shield, Heart, Phone, Mail, MapPin } from 'lucide-react';

function MainApp() {
  const { user, profile, isAdmin } = useAuth();

  // Navigation state - defaults to Home showcase page
  const [currentView, setCurrentView] = useState<ActiveView>('home');

  // Active room and booking selection
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Global search & filter states (INR pricing range)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [guestsCount, setGuestsCount] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState(50000);
  const [specialRequests, setSpecialRequests] = useState('');

  // Data states - initializes with 34 luxurious rooms immediately so 0 rooms never occurs
  const [rooms, setRooms] = useState<Room[]>(() => ClientStore.getRooms());
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [settings, setSettings] = useState<HotelSettings>(() => ClientStore.getSettings());

  // Fetch rooms with live availability based on check-in & check-out
  const fetchRooms = async (retries = 1) => {
    try {
      const data = await ApiService.getRooms({
        category: selectedCategory,
        checkIn: checkInDate,
        checkOut: checkOutDate,
      });
      if (Array.isArray(data) && data.length > 0) {
        setRooms(data);
      }
    } catch (err) {
      console.warn('Rooms fetch fallback notice:', err);
      // Fallback to local store
      const local = ClientStore.getRooms();
      if (local && local.length > 0) {
        setRooms(local);
      }
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch settings & announcement banner
  const fetchSettings = async () => {
    try {
      const data = await ApiService.getSettings();
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Settings fetch notice (using defaults):', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [checkInDate, checkOutDate, selectedCategory]);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Multi-device real-time sync: poll database every 5 seconds so any changes made on other devices appear automatically
  useEffect(() => {
    const syncInterval = setInterval(() => {
      fetchRooms(0);
      fetchSettings();
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [checkInDate, checkOutDate, selectedCategory]);

  // Listen to manual and automatic network sync events
  useEffect(() => {
    const handleAppSync = () => {
      fetchRooms();
      fetchSettings();
    };
    window.addEventListener('app:sync-data', handleAppSync);
    return () => window.removeEventListener('app:sync-data', handleAppSync);
  }, []);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setPriceRange(50000);
    setGuestsCount(2);
    setCheckInDate(todayStr);
    setCheckOutDate(tomorrowStr);
  };

  // Handlers for navigating between pages
  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setCurrentView('room_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickBook = (
    room: Room,
    checkIn: string,
    checkOut: string,
    guests: number,
    requests: string = ''
  ) => {
    setSelectedRoom(room);
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setGuestsCount(guests);
    setSpecialRequests(requests);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingSuccess = (booking: Booking) => {
    setActiveBooking(booking);
    setCurrentView('confirmation');
    fetchRooms(); // refresh availability
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToBooking = (filters?: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    category?: string;
  }) => {
    if (filters) {
      if (filters.checkIn) setCheckInDate(filters.checkIn);
      if (filters.checkOut) setCheckOutDate(filters.checkOut);
      if (filters.guests) setGuestsCount(filters.guests);
      if (filters.category) setSelectedCategory(filters.category);
    }
    setCurrentView('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1916] flex flex-col font-sans selection:bg-[#1C1916] selection:text-[#FAF8F5]">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Page View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <HomeView
            rooms={rooms}
            onSelectRoom={handleSelectRoom}
            onQuickBookRoom={handleQuickBook}
            onNavigateToBooking={handleNavigateToBooking}
            onNavigateToServices={() => {
              setCurrentView('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            checkInDate={checkInDate}
            setCheckInDate={setCheckInDate}
            checkOutDate={checkOutDate}
            setCheckOutDate={setCheckOutDate}
            guestsCount={guestsCount}
            setGuestsCount={setGuestsCount}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}

        {currentView === 'services' && (
          <ServicesView
            onNavigateToBooking={() => {
              setCurrentView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'explore' && (
          <ExploreRoomsView
            rooms={rooms}
            loading={loadingRooms}
            onSelectRoom={handleSelectRoom}
            onBookRoom={(room, checkIn, checkOut, guests) =>
              handleQuickBook(room, checkIn, checkOut, guests)
            }
            checkInDate={checkInDate}
            setCheckInDate={setCheckInDate}
            checkOutDate={checkOutDate}
            setCheckOutDate={setCheckOutDate}
            guestsCount={guestsCount}
            setGuestsCount={setGuestsCount}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            resetFilters={resetFilters}
          />
        )}

        {currentView === 'room_detail' && selectedRoom && (
          <RoomDetailView
            room={selectedRoom}
            onBack={() => setCurrentView('explore')}
            onProceedToCheckout={(room, checkIn, checkOut, guests, requests) =>
              handleQuickBook(room, checkIn, checkOut, guests, requests)
            }
            initialCheckIn={checkInDate}
            initialCheckOut={checkOutDate}
            initialGuests={guestsCount}
          />
        )}

        {currentView === 'checkout' && selectedRoom && (
          <CheckoutView
            room={selectedRoom}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            guestsCount={guestsCount}
            initialSpecialRequests={specialRequests}
            onBackToRoom={() => setCurrentView('room_detail')}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {currentView === 'confirmation' && activeBooking && (
          <BookingConfirmationView
            booking={activeBooking}
            onViewMyBookings={() => setCurrentView('my_bookings')}
            onExploreMore={() => setCurrentView('explore')}
          />
        )}

        {currentView === 'my_bookings' && (
          <MyBookingsView
            onExploreRooms={() => setCurrentView('explore')}
            onViewBookingDetails={(booking) => {
              setActiveBooking(booking);
              setCurrentView('confirmation');
            }}
          />
        )}

        {currentView === 'profile' && <ProfileView />}

        {currentView === 'reception' && (
          (isAdmin || profile?.role === 'admin' || profile?.role === 'receptionist') ? (
            <ReceptionView
              rooms={rooms}
              onRefreshData={fetchRooms}
              onNavigateToExplore={() => {
                setCurrentView('explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateHome={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <AdminPortalView onRefreshRooms={fetchRooms} />
          )
        )}

        {currentView === 'admin' && (
          <AdminPortalView onRefreshRooms={fetchRooms} />
        )}
      </main>

      {/* Luxury Footer */}
      <footer className="bg-white border-t border-[#ECE5D8] text-[#665E55] text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-3 md:col-span-1">
              <div>
                <span className="font-serif font-bold text-[#1C1916] text-lg tracking-tight">
                  THE GRAND IMPERIAL
                </span>
                <p className="text-[10px] text-[#7B5C28] uppercase tracking-widest font-semibold mt-0.5">
                  Palace & Luxury Suites • Mumbai
                </p>
              </div>
              <p className="text-[11px] text-[#665E55] leading-relaxed font-light">
                An iconic Indian heritage landmark overlooking the Arabian Sea in Colaba, Mumbai. Offering 34 handcrafted suites, royal cuisine, Ayurvedic wellness, and bespoke concierge hospitality.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <p className="font-serif font-bold text-[#1C1916] text-sm">Palace Navigation</p>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#947139] cursor-pointer">
                    Palace Home & Heritage
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('explore'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#947139] cursor-pointer">
                    Rooms & Booking Engine (34 Rooms)
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('services'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#947139] cursor-pointer">
                    Palace Services, Dining & Spa
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('my_bookings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#947139] cursor-pointer">
                    My Active Reservations
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#947139] cursor-pointer">
                    VIP Privilege Club & Profile
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#947139] text-[#665E55] font-medium cursor-pointer">
                    {isAdmin ? 'Palace Admin Portal' : 'Palace Staff & Admin Access'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact details */}
            <div className="space-y-2">
              <p className="font-serif font-bold text-[#1C1916] text-sm">Palace Concierge & Reception</p>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-[#665E55]">
                  <MapPin className="w-3.5 h-3.5 text-[#947139] shrink-0" />
                  <span>{settings?.address || '108 Heritage Bay Promenade, Colaba, Mumbai, Maharashtra 400001'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#665E55]">
                  <Phone className="w-3.5 h-3.5 text-[#947139] shrink-0" />
                  <span>{settings?.contactPhone || '+91 22 6665 3300'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#665E55]">
                  <Mail className="w-3.5 h-3.5 text-[#947139] shrink-0" />
                  <span>{settings?.contactEmail || 'concierge@grandimperialpalace.in'}</span>
                </div>
              </div>
            </div>

            {/* Project tech badges */}
            <div className="space-y-2.5">
              <p className="font-serif font-bold text-[#1C1916] text-sm">System Architecture</p>
              <div className="bg-[#FAF8F5] border border-[#ECE5D8] p-3 rounded-xl space-y-1 text-[10px]">
                <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <Shield className="w-3 h-3 text-emerald-700" />
                  <span>PostgreSQL Cloud SQL Database (asia-southeast1)</span>
                </div>
                <p className="text-[#665E55]">
                  Real-time Drizzle ORM transactions • Firebase Authentication • INR Direct Gateway
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#ECE5D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[#948A7D]">
            <div>
              © {new Date().getFullYear()} {settings?.hotelName || 'The Grand Imperial Heritage Palace & Luxury Suites'}. All rights reserved.
            </div>
            <div>
              Academic Web Application Development Project • Hotel Room Booking System (INR ₹)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <NetworkStatusProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </NetworkStatusProvider>
  );
}

