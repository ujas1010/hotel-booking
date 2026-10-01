import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AuthModal } from './AuthModal.tsx';
import {
  Hotel,
  BedDouble,
  CalendarCheck,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronDown,
  UtensilsCrossed,
  Sparkles,
  Crown,
  Building,
} from 'lucide-react';
import { NetworkStatusIndicator } from './NetworkStatusIndicator.tsx';

interface NavbarProps {
  currentView?: string;
  onNavigate?: (view: any) => void;
  activeView?: string;
  setActiveView?: (view: any) => void;
  hotelSettings?: any;
  activeBookingsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeView: legacyActiveView,
  setActiveView: legacySetActiveView,
  hotelSettings,
  activeBookingsCount = 0,
}) => {
  const active = currentView || legacyActiveView || 'home';
  const handleNav = (v: string) => {
    if (onNavigate) onNavigate(v);
    else if (legacySetActiveView) legacySetActiveView(v);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const { user, profile, isAdmin, logout, loading } = useAuth();
  const isStaffOrAdmin = Boolean(isAdmin || profile?.role === 'admin' || profile?.role === 'receptionist');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="relative z-40 bg-[#FBF9F5] border-b border-[#ECE5D8] text-[#1C1916]">
        {/* Main navigation header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo */}
            <div
              id="nav-brand-logo"
              onClick={() => handleNav('home')}
              className="cursor-pointer group select-none py-2"
            >
              <span className="text-lg sm:text-2xl font-normal tracking-[0.14em] font-serif text-[#1C1916] group-hover:text-[#947139] transition-colors">
                THE GRAND IMPERIAL
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                id="nav-home-btn"
                onClick={() => handleNav('home')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  active === 'home'
                    ? 'bg-white text-[#1C1916] font-bold shadow-xs border border-[#ECE5D8]'
                    : 'text-[#665E55] hover:text-[#1C1916] hover:bg-[#FAF8F5]'
                }`}
              >
                <Hotel className="w-3.5 h-3.5 text-[#947139]" />
                Home
              </button>

              <button
                id="nav-explore-btn"
                onClick={() => handleNav('explore')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  active === 'explore' || active === 'room_detail' || active === 'checkout'
                    ? 'bg-white text-[#1C1916] font-bold shadow-xs border border-[#ECE5D8]'
                    : 'text-[#665E55] hover:text-[#1C1916] hover:bg-[#FAF8F5]'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5 text-[#947139]" />
                Accommodations
              </button>

              <button
                id="nav-services-btn"
                onClick={() => handleNav('services')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  active === 'services'
                    ? 'bg-white text-[#1C1916] font-bold shadow-xs border border-[#ECE5D8]'
                    : 'text-[#665E55] hover:text-[#1C1916] hover:bg-[#FAF8F5]'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#947139]" />
                Dining & Experiences
              </button>

              <button
                id="nav-my-bookings-btn"
                onClick={() => handleNav('my_bookings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 relative cursor-pointer ${
                  active === 'my_bookings' || active === 'confirmation'
                    ? 'bg-white text-[#1C1916] font-bold shadow-xs border border-[#ECE5D8]'
                    : 'text-[#665E55] hover:text-[#1C1916] hover:bg-[#FAF8F5]'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#947139]" />
                My Stays
                {activeBookingsCount > 0 && (
                  <span className="bg-[#947139] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                    {activeBookingsCount}
                  </span>
                )}
              </button>

              <button
                id="nav-profile-btn"
                onClick={() => handleNav('profile')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  active === 'profile'
                    ? 'bg-white text-[#1C1916] font-bold shadow-xs border border-[#ECE5D8]'
                    : 'text-[#665E55] hover:text-[#1C1916] hover:bg-[#FAF8F5]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#947139]" />
                VIP Club
              </button>

              {isStaffOrAdmin && (
                <button
                  id="nav-reception-portal-btn"
                  onClick={() => handleNav('reception')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    active === 'reception'
                      ? 'bg-white text-[#1C1916] font-bold shadow-xs border border-[#ECE5D8]'
                      : 'text-[#665E55] hover:text-[#1C1916] hover:bg-[#FAF8F5]'
                  }`}
                  title="Reception & Front Desk"
                >
                  <Building className="w-3.5 h-3.5 text-[#947139]" />
                  Reception
                </button>
              )}

              {isAdmin && (
                <button
                  id="nav-admin-portal-btn"
                  onClick={() => handleNav('admin')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    active === 'admin'
                      ? 'bg-[#1C1916] text-[#FAF8F5] shadow-xs'
                      : 'text-[#1C1916] hover:bg-white border border-[#ECE5D8]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E6CA85]" />
                  Palace Console
                </button>
              )}
            </nav>

            {/* Desktop Right Auth Controls & Network Status */}
            <div className="hidden md:flex items-center space-x-2.5">
              <NetworkStatusIndicator compact />

              {loading ? (
                <div className="w-7 h-7 rounded-full border-2 border-[#947139]/30 border-t-[#947139] animate-spin" />
              ) : user ? (
                <div className="relative">
                  <button
                    id="nav-user-menu-btn"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#ECE5D8] transition-all text-left shadow-xs cursor-pointer"
                  >
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'Guest')}&background=1C1916&color=fff`}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover border border-[#ECE5D8]"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-[#1C1916] truncate max-w-[120px]">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-[#7B5C28] font-medium flex items-center gap-1">
                        {isAdmin ? 'Palace Admin' : 'Valued Patron'}
                        {profile?.loyaltyPoints ? (
                          <span className="text-[9px] bg-[#F6F1E7] text-[#7B5C28] border border-[#ECE5D8] px-1 rounded font-bold">
                            {profile.loyaltyPoints} pts
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#948A7D]" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#ECE5D8] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-[#F3ECE1] text-xs">
                        <p className="text-[#948A7D]">Signed in as</p>
                        <p className="font-medium text-[#1C1916] truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleNav('profile')}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#665E55] hover:bg-[#FAF8F5] hover:text-[#1C1916] flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#948A7D]" />
                        Guest Profile & Rewards
                      </button>
                      <button
                        onClick={() => handleNav('my_bookings')}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#665E55] hover:bg-[#FAF8F5] hover:text-[#1C1916] flex items-center gap-2 cursor-pointer"
                      >
                        <CalendarCheck className="w-4 h-4 text-[#948A7D]" />
                        My Reservations
                      </button>
                      {isStaffOrAdmin && (
                        <button
                          onClick={() => handleNav('reception')}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-[#7B5C28] hover:bg-[#F6F1E7] flex items-center gap-2 cursor-pointer"
                        >
                          <Building className="w-4 h-4 text-[#947139]" />
                          Grand Reception
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleNav('admin')}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-[#7B5C28] hover:bg-[#F6F1E7] flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#947139]" />
                          Palace Console
                        </button>
                      )}
                      <div className="border-t border-[#F3ECE1] my-1" />
                      <button
                        id="nav-logout-btn"
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    id="nav-login-btn"
                    onClick={() => openAuth('login')}
                    className="px-3.5 py-2 rounded-xl text-[#665E55] hover:text-[#1C1916] hover:bg-white border border-[#ECE5D8] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#947139]" />
                    <span>Sign In</span>
                  </button>

                  <button
                    id="nav-signup-btn"
                    onClick={() => openAuth('signup')}
                    className="px-4 py-2 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-[#947139]/40"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#E6CA85]" />
                    <span>Register</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {user && (
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1C1916&color=fff`}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-[#ECE5D8]"
                />
              )}
              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-white text-[#1C1916] border border-[#ECE5D8] hover:bg-[#FAF8F5] cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-b border-[#ECE5D8] px-4 pt-2 pb-6 space-y-2 shadow-lg">
            <button
              onClick={() => handleNav('home')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold uppercase tracking-wider flex items-center justify-between cursor-pointer ${
                active === 'home' ? 'bg-white text-[#1C1916] font-bold border border-[#ECE5D8]' : 'text-[#665E55] hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Hotel className="w-4 h-4 text-[#947139]" />
                Home
              </span>
            </button>

            <button
              onClick={() => handleNav('explore')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold uppercase tracking-wider flex items-center justify-between cursor-pointer ${
                active === 'explore' ? 'bg-white text-[#1C1916] font-bold border border-[#ECE5D8]' : 'text-[#665E55] hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <BedDouble className="w-4 h-4 text-[#947139]" />
                Accommodations
              </span>
            </button>

            <button
              onClick={() => handleNav('services')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold uppercase tracking-wider flex items-center justify-between cursor-pointer ${
                active === 'services' ? 'bg-white text-[#1C1916] font-bold border border-[#ECE5D8]' : 'text-[#665E55] hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <UtensilsCrossed className="w-4 h-4 text-[#947139]" />
                Dining & Experiences
              </span>
            </button>

            <button
              onClick={() => handleNav('my_bookings')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold uppercase tracking-wider flex items-center justify-between cursor-pointer ${
                active === 'my_bookings' ? 'bg-white text-[#1C1916] font-bold border border-[#ECE5D8]' : 'text-[#665E55] hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-[#947139]" />
                My Stays
              </span>
              {activeBookingsCount > 0 && (
                <span className="bg-[#947139] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeBookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('profile')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold uppercase tracking-wider flex items-center gap-3 cursor-pointer ${
                active === 'profile' ? 'bg-white text-[#1C1916] font-bold border border-[#ECE5D8]' : 'text-[#665E55] hover:bg-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#947139]" />
              VIP Club & Rewards
            </button>

            {isStaffOrAdmin && (
              <button
                onClick={() => handleNav('reception')}
                className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold uppercase tracking-wider flex items-center gap-3 cursor-pointer ${
                  active === 'reception' ? 'bg-white text-[#1C1916] font-bold border border-[#ECE5D8]' : 'text-[#665E55] hover:bg-white'
                }`}
              >
                <Building className="w-4 h-4 text-[#947139]" />
                Reception
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold uppercase tracking-wider flex items-center gap-3 cursor-pointer ${
                  active === 'admin' ? 'bg-[#1C1916] text-white' : 'text-[#1C1916] hover:bg-white border border-[#ECE5D8]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#E6CA85]" />
                Palace Management Console
              </button>
            )}

            <div className="pt-2">
              <NetworkStatusIndicator />
            </div>

            <div className="pt-3 border-t border-[#ECE5D8]">
              {user ? (
                <div className="space-y-2">
                  <div className="text-xs text-[#948A7D] px-2">
                    Signed in as <span className="text-[#1C1916] font-semibold">{user.displayName || user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-200 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openAuth('login')}
                    className="py-2.5 rounded-xl bg-white border border-[#ECE5D8] text-[#1C1916] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <LogIn className="w-4 h-4 text-[#947139]" />
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuth('signup')}
                    className="py-2.5 rounded-xl bg-[#1C1916] text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <UserPlus className="w-4 h-4 text-[#E6CA85]" />
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Database & Google Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setAuthModalOpen(false);
        }}
      />
    </>
  );
};
