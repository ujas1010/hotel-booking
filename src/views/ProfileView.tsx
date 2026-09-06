import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AuthModal } from '../components/AuthModal.tsx';
import { FirestoreService } from '../services/firestoreService.ts';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  ShieldCheck,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  Bed,
  Lock,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, profile, updateLocalProfile, apiFetch, isAdmin } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Preference toggles
  const [prefHighFloor, setPrefHighFloor] = useState(true);
  const [prefQuietRoom, setPrefQuietRoom] = useState(true);
  const [prefExtraPillows, setPrefExtraPillows] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.displayName || '');
      setPhone(profile.phone ? profile.phone.replace(/\D/g, '').slice(-10) : '');
      setAddress(profile.address || '');
      setCountry(profile.country || 'India');
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (phone.trim()) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const profileData = {
        name: name.trim(),
        phone: phone.trim() ? `+91 ${phone.replace(/\D/g, '')}` : '',
        address: address.trim(),
        country: country.trim(),
      };

      // 1. Save directly to Cloud Firestore
      await FirestoreService.saveUserProfile(user.uid, profileData);

      // 2. Also sync to backend API if available
      try {
        const res = await apiFetch('/api/user/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData),
        });

        if (res.ok) {
          const updated = await res.json();
          updateLocalProfile(updated);
        } else {
          updateLocalProfile(profileData);
        }
      } catch {
        updateLocalProfile(profileData);
      }

      setSuccessMessage('Profile and stay preferences successfully saved.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setErrorMessage(err.message || 'Error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <>
        <div className="max-w-lg mx-auto bg-white border border-[#E8E1D5] rounded-3xl p-8 text-center space-y-6 shadow-sm my-12">
          <div className="w-16 h-16 rounded-full bg-[#FAF3E8] border border-[#DFCEAF] flex items-center justify-center mx-auto text-[#785116]">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-serif text-[#1C1917]">Patron Profile & Rewards</h2>
            <p className="text-xs text-[#7A7265] leading-relaxed">
              Sign in or create an account to manage your guest profile, view loyalty points, and personalize your palace stay preferences.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }}
              className="px-5 py-2.5 bg-white border border-[#DFCEAF] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <LogIn className="w-4 h-4 text-[#966A28]" />
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthModalMode('signup');
                setAuthModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#966A28] hover:bg-[#7A5116] text-[#FDF6EE] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider border border-[#DFCEAF]"
            >
              <UserPlus className="w-4 h-4 text-[#FDF6EE]" />
              Create Account
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1917] tracking-tight">
          Patron Profile & Account Settings
        </h1>
        <p className="text-xs text-[#7A7265] mt-1">
          Manage your personal details, imperial loyalty tier, and stay preferences.
        </p>
      </div>

      {/* Loyalty & Rewards Status Card */}
      <div className="bg-[#FAF3E8] border border-[#DFCEAF] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#DFCEAF] flex items-center justify-center text-[#785116] shrink-0 shadow-xs">
            <Award className="w-8 h-8 text-[#966A28]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-serif text-[#1C1917]">
                {isAdmin ? 'Palace Administrator Profile' : 'Imperial Crown Privilege Club'}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#966A28] text-white px-2.5 py-0.5 rounded-full font-mono">
                {isAdmin ? 'ADMINISTRATOR' : 'ROYAL TIER'}
              </span>
            </div>
            <p className="text-xs text-[#5E564D] mt-0.5">
              Patron ID: <span className="font-mono text-[#785116] font-semibold">{profile?.uid ? profile.uid.slice(0, 12) + '...' : user.uid.slice(0, 12) + '...'}</span>
            </p>
            <p className="text-[11px] text-[#7A7265]">Enjoy complimentary breakfast, 10% point accrual & spa privileges</p>
          </div>
        </div>

        <div className="bg-white border border-[#DFCEAF] px-6 py-3.5 rounded-2xl text-center shrink-0 w-full sm:w-auto shadow-xs">
          <span className="text-[10px] text-[#7A7265] uppercase tracking-widest block font-medium">
            Crown Points Balance
          </span>
          <span className="text-3xl font-black text-[#785116] font-serif">
            {profile?.loyaltyPoints || 2500}
          </span>
          <span className="text-[10px] text-emerald-700 block font-semibold">Points Ready to Redeem</span>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-[#E8E1D5] rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs">
        {/* Personal Details Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold font-serif text-[#1C1917] border-b border-[#F2ECE1] pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#966A28]" />
            Personal Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5E564D]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-[#FAF7F2] border border-[#DFCEAF] text-[#1C1917] text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#966A28]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5E564D] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#8C8275]" />
                Email Address (Account Identifier)
              </label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full bg-[#F2ECE1] border border-[#E8E1D5] text-[#7A7265] text-sm rounded-xl px-3.5 py-2.5 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#5E564D] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#8C8275]" />
                  Mobile Number
                </label>
                <span className="text-[10px] text-[#8C8275]">10 Digits</span>
              </div>
              <div className="flex rounded-xl border border-[#DFCEAF] bg-[#FAF7F2] focus-within:border-[#966A28] focus-within:bg-white overflow-hidden transition-colors">
                <span className="inline-flex items-center px-3 text-xs font-medium text-[#7A7265] bg-[#EFE8DC] border-r border-[#DFCEAF] select-none">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full bg-transparent text-[#1C1917] text-sm px-3.5 py-2.5 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5E564D] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#8C8275]" />
                Country of Residence
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className="w-full bg-[#FAF7F2] border border-[#DFCEAF] text-[#1C1917] text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#966A28]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#5E564D] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8C8275]" />
                Billing / Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street or residential address"
                className="w-full bg-[#FAF7F2] border border-[#DFCEAF] text-[#1C1917] text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#966A28]"
              />
            </div>
          </div>
        </div>

        {/* Stay Preferences */}
        <div className="space-y-4 pt-4 border-t border-[#F2ECE1]">
          <h2 className="text-base font-bold font-serif text-[#1C1917] flex items-center gap-2">
            <Bed className="w-4 h-4 text-[#966A28]" />
            Palace Stay Preferences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] cursor-pointer hover:border-[#DFCEAF] transition-colors">
              <input
                type="checkbox"
                checked={prefHighFloor}
                onChange={(e) => setPrefHighFloor(e.target.checked)}
                className="w-4 h-4 accent-[#966A28] rounded"
              />
              <span className="text-xs font-medium text-[#1C1917]">High Floor Suite Preference</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] cursor-pointer hover:border-[#DFCEAF] transition-colors">
              <input
                type="checkbox"
                checked={prefQuietRoom}
                onChange={(e) => setPrefQuietRoom(e.target.checked)}
                className="w-4 h-4 accent-[#966A28] rounded"
              />
              <span className="text-xs font-medium text-[#1C1917]">Quiet Heritage Garden Facing</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] cursor-pointer hover:border-[#DFCEAF] transition-colors">
              <input
                type="checkbox"
                checked={prefExtraPillows}
                onChange={(e) => setPrefExtraPillows(e.target.checked)}
                className="w-4 h-4 accent-[#966A28] rounded"
              />
              <span className="text-xs font-medium text-[#1C1917]">Extra Silk Feather Pillows</span>
            </label>
          </div>
        </div>

        {/* Account Security Information */}
        <div className="space-y-3 pt-4 border-t border-[#F2ECE1]">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#966A28]" />
              <div>
                <h3 className="text-xs font-bold text-[#1C1917]">Account Security & Privilege Status</h3>
                <p className="text-[11px] text-[#7A7265]">
                  {isAdmin
                    ? 'Verified Palace Administrator with access to the Palace Console.'
                    : 'Authenticated Guest Patron account. Access to management portals requires verified admin credentials.'}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isAdmin ? 'bg-[#966A28] text-white' : 'bg-[#E8E1D5] text-[#5E564D]'
            }`}>
              {isAdmin ? 'ADMINISTRATOR' : 'GUEST PATRON'}
            </span>
          </div>
        </div>

        {/* Success / Error Messages */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end pt-4 border-t border-[#F2ECE1]">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[#966A28] hover:bg-[#7A5116] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 uppercase tracking-wider border border-[#DFCEAF]"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
