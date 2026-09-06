import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { Booking, UserProfile, Room } from '../types.ts';

export const FirestoreService = {
  // Save or update user profile
  async saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      if (!db || !uid) return;
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore: Could not save user profile:', err);
    }
  },

  // Get user profile by UID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      if (!db || !uid) return null;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      console.warn('Firestore: Could not get user profile:', err);
      return null;
    }
  },

  // Save guest booking reservation
  async saveBooking(booking: Booking): Promise<void> {
    try {
      if (!db || !booking) return;
      const bookingId = booking.bookingReference || `b_${booking.id || Date.now()}`;
      const bookingRef = doc(db, 'bookings', bookingId);
      await setDoc(
        bookingRef,
        {
          ...booking,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore: Could not save booking:', err);
    }
  },

  // Get bookings for a user or guest email
  async getBookingsByUser(uid?: string, email?: string): Promise<Booking[]> {
    try {
      if (!db) return [];
      const bookingsRef = collection(db, 'bookings');
      const resultsMap = new Map<string, Booking>();

      if (uid) {
        try {
          const q = query(bookingsRef, where('userId', '==', uid));
          const docsSnap = await getDocs(q);
          docsSnap.forEach((docSnap) => {
            const b = docSnap.data() as Booking;
            resultsMap.set(b.bookingReference || docSnap.id, b);
          });
        } catch (e) {
          console.warn('Query by uid warning:', e);
        }
      }

      if (email) {
        try {
          const cleanEmail = email.toLowerCase().trim();
          const q = query(bookingsRef, where('guestEmail', '==', cleanEmail));
          const docsSnap = await getDocs(q);
          docsSnap.forEach((docSnap) => {
            const b = docSnap.data() as Booking;
            resultsMap.set(b.bookingReference || docSnap.id, b);
          });
        } catch (e) {
          console.warn('Query by email warning:', e);
        }
      }

      return Array.from(resultsMap.values());
    } catch (err) {
      console.warn('Firestore: Could not fetch user bookings:', err);
      return [];
    }
  },

  // Get all bookings (admin view)
  async getAllBookings(): Promise<Booking[]> {
    try {
      if (!db) return [];
      const bookingsRef = collection(db, 'bookings');
      const docsSnap = await getDocs(bookingsRef);
      const results: Booking[] = [];
      docsSnap.forEach((docSnap) => {
        results.push(docSnap.data() as Booking);
      });
      return results;
    } catch (err) {
      console.warn('Firestore: Could not fetch all bookings:', err);
      return [];
    }
  },

  // Update booking status
  async updateBookingStatus(bookingReference: string, status: string): Promise<void> {
    try {
      if (!db || !bookingReference) return;
      const bookingRef = doc(db, 'bookings', bookingReference);
      await setDoc(
        bookingRef,
        {
          bookingStatus: status,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore: Could not update booking status:', err);
    }
  },
};
