import { ClientStore } from './clientStore.ts';
import { FirestoreService } from './firestoreService.ts';
import { Room, Booking, Review, HotelSettings } from '../types.ts';

// Helper to check if response is valid JSON (not HTML fallback from static host)
async function tryParseJson(res: Response): Promise<any | null> {
  if (!res.ok) return null;
  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const ApiService = {
  // Get all rooms with optional filtering
  async getRooms(params: {
    category?: string;
    checkIn?: string;
    checkOut?: string;
    minPrice?: number;
    maxPrice?: number;
    capacity?: number;
    search?: string;
  } = {}): Promise<Room[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params.category && params.category !== 'All') searchParams.set('category', params.category);
      if (params.checkIn) searchParams.set('checkIn', params.checkIn);
      if (params.checkOut) searchParams.set('checkOut', params.checkOut);

      const url = `/api/rooms${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      const res = await fetch(url);
      const data = await tryParseJson(res);
      if (Array.isArray(data) && data.length > 0) {
        // Sync local client store with latest server data
        ClientStore.saveRooms(data);
        return data;
      }
    } catch {
      // Backend not running (e.g. on Vercel static deployment)
    }

    // Resilient fallback: return from ClientStore
    const localRooms = ClientStore.getRooms();
    return localRooms.filter((r) => {
      if (params.category && params.category !== 'All' && r.category !== params.category) return false;
      if (params.capacity && r.capacity < params.capacity) return false;
      if (params.search && !r.name.toLowerCase().includes(params.search.toLowerCase()) && !r.category.toLowerCase().includes(params.search.toLowerCase())) return false;
      return true;
    });
  },

  // Get hotel settings
  async getSettings(): Promise<HotelSettings> {
    try {
      const res = await fetch('/api/settings');
      const data = await tryParseJson(res);
      if (data && typeof data === 'object') {
        ClientStore.updateSettings(data);
        return data;
      }
    } catch {
      // Backend not running
    }
    return ClientStore.getSettings();
  },

  // Create booking
  async createBooking(bookingData: any, token?: string | null): Promise<Booking> {
    let created: Booking | null = null;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData),
      });

      const data = await tryParseJson(res);
      if (data && data.id) {
        // Also cache locally
        const current = ClientStore.getBookings();
        if (!current.some((b) => b.id === data.id)) {
          current.unshift(data);
          ClientStore.saveBookings(current);
        }
        created = data;
      }
    } catch {
      // Backend not running
    }

    if (!created) {
      created = ClientStore.createBooking(bookingData);
    }

    // Persist to Cloud Firestore
    try {
      await FirestoreService.saveBooking(created);
    } catch (err) {
      console.warn('Firestore booking save notification:', err);
    }

    return created;
  },

  // Get bookings by user or all bookings
  async getBookings(userId?: string, email?: string, token?: string | null, isAdmin?: boolean): Promise<Booking[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (isAdmin) headers['x-admin-token'] = token || 'admin_secret';

      const url = isAdmin ? '/api/admin/bookings' : '/api/bookings/my';
      const res = await fetch(url, { headers });
      const data = await tryParseJson(res);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Backend not running
    }

    // Next try Firestore
    try {
      const firestoreBookings = isAdmin 
        ? await FirestoreService.getAllBookings()
        : await FirestoreService.getBookingsByUser(userId, email);
      if (Array.isArray(firestoreBookings) && firestoreBookings.length > 0) {
        return firestoreBookings;
      }
    } catch {
      // Firestore not connected or offline
    }

    return ClientStore.getBookingsByUser(userId, email);
  },

  // Update room housekeeping / status
  async updateRoom(id: number, updates: Partial<Room>, token?: string | null): Promise<Room | null> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-admin-token'] = token;

      const res = await fetch(`/api/admin/rooms/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const data = await tryParseJson(res);
      if (data && data.id) return data;
    } catch {
      // Backend not running
    }
    return ClientStore.updateRoom(id, updates);
  },

  // Update booking status (Check-in, Check-out, Folio, Cancel)
  async updateBookingStatus(id: number, status: any, extras: any = {}, token?: string | null): Promise<Booking | null> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-admin-token'] = token;

      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, ...extras }),
      });
      const data = await tryParseJson(res);
      if (data && data.id) return data;
    } catch {
      // Backend not running
    }
    const updated = ClientStore.updateBookingStatus(id, status, extras);
    if (updated?.bookingReference) {
      try {
        FirestoreService.updateBookingStatus(updated.bookingReference, status);
      } catch (e) {
        console.warn('Firestore update status notice:', e);
      }
    }
    return updated;
  },

  // Submit Review
  async createReview(reviewData: any, token?: string | null): Promise<Review> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewData),
      });
      const data = await tryParseJson(res);
      if (data && data.id) return data;
    } catch {
      // Backend not running
    }
    return ClientStore.createReview(reviewData);
  },
};
