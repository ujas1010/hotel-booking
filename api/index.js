var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import "dotenv/config";
import express from "express";
import path from "path";

// src/middleware/auth.ts
import crypto from "crypto";

// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
var getEnvVar = (key) => {
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {
  }
  try {
    if (typeof import.meta !== "undefined" && import.meta?.env && import.meta.env[key]) {
      return String(import.meta.env[key]).trim();
    }
  } catch {
  }
  return "";
};
var initialUrl = getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");
var initialAnon = getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY");
var initialServiceKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");
var dynamicUrl = initialUrl;
var dynamicAnon = initialAnon;
var SUPABASE_URL = initialUrl;
var SUPABASE_ANON_KEY = initialAnon;
var SUPABASE_SERVICE_ROLE_KEY = initialServiceKey;
var isSupabaseConfigured = () => {
  const url = dynamicUrl || SUPABASE_URL || getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");
  const key = dynamicAnon || SUPABASE_ANON_KEY || getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY");
  return Boolean(url) && Boolean(key) && url.startsWith("https://") && !url.includes("placeholder") && !url.includes("your-project");
};
var getSupabaseConfig = () => ({
  url: dynamicUrl || SUPABASE_URL || getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL"),
  anonKey: dynamicAnon || SUPABASE_ANON_KEY || getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY")
});
var supabase = isSupabaseConfigured() ? createClient(getSupabaseConfig().url, getSupabaseConfig().anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : createClient("https://placeholder-project.supabase.co", "placeholder-anon-key", {
  auth: { persistSession: false }
});
var supabaseAdmin = isSupabaseConfigured() ? createClient(
  getSupabaseConfig().url,
  SUPABASE_SERVICE_ROLE_KEY || getSupabaseConfig().anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : createClient("https://placeholder-project.supabase.co", "placeholder-service-key", {
  auth: { persistSession: false }
});

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bookings: () => bookings,
  bookingsRelations: () => bookingsRelations,
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  rooms: () => rooms,
  roomsRelations: () => roomsRelations,
  settings: () => settings,
  users: () => users
});
import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean
} from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  // Firebase Auth UID or internal unique ID
  email: text("email").notNull(),
  password: text("password"),
  // Direct password hash or text for database authentication
  name: text("name"),
  role: text("role").notNull().default("guest"),
  // 'guest' | 'admin'
  phone: text("phone"),
  address: text("address"),
  country: text("country"),
  avatar: text("avatar"),
  loyaltyPoints: integer("loyalty_points").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  // 'Standard', 'Deluxe', 'Executive', 'Suite'
  pricePerNight: integer("price_per_night").notNull(),
  // INR (₹)
  discountPercent: integer("discount_percent").notNull().default(0),
  capacity: integer("capacity").notNull().default(2),
  bedType: text("bed_type").notNull(),
  // '1 King Bed', '2 Queen Beds', '1 Queen Bed', etc.
  sizeSqFt: integer("size_sq_ft").notNull().default(450),
  floor: integer("floor").notNull().default(1),
  viewType: text("view_type").notNull().default("City View"),
  // 'Arabian Sea View', 'Palace Garden View', 'City View', etc.
  description: text("description").notNull(),
  amenities: text("amenities").notNull(),
  // JSON string array: ["WiFi", "Tea Bar", "Marble Bath", ...]
  images: text("images").notNull(),
  // JSON string array of image URLs
  status: text("status").notNull().default("available"),
  // 'available', 'occupied', 'maintenance'
  rating: text("rating").notNull().default("4.9"),
  reviewCount: integer("review_count").notNull().default(24),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingReference: text("booking_reference").notNull().unique(),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(),
  // Firebase UID
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  checkInDate: text("check_in_date").notNull(),
  // YYYY-MM-DD
  checkOutDate: text("check_out_date").notNull(),
  // YYYY-MM-DD
  totalNights: integer("total_nights").notNull(),
  guestsCount: integer("guests_count").notNull().default(1),
  specialRequests: text("special_requests"),
  roomRatePerNight: integer("room_rate_per_night").notNull(),
  cleaningFee: integer("cleaning_fee").notNull().default(25),
  taxesAndFees: integer("taxes_and_fees").notNull().default(35),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").notNull().default("paid"),
  // 'paid' | 'pending' | 'refunded'
  paymentMethod: text("payment_method").notNull().default("Credit Card (Simulated)"),
  paymentCardLast4: text("payment_card_last4").default("4242"),
  transactionId: text("transaction_id").notNull(),
  bookingStatus: text("booking_status").notNull().default("confirmed"),
  // 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow()
});
var reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(),
  guestName: text("guest_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  hotelName: text("hotel_name").notNull().default("Grand Horizon Bay Resort & Luxury Suites"),
  contactEmail: text("contact_email").notNull().default("reservations@grandhorizon.com"),
  contactPhone: text("contact_phone").notNull().default("+1 (800) 555-0199"),
  address: text("address").notNull().default("742 Ocean Promenade, Bayfront Heights, CA 90210"),
  checkInTime: text("check_in_time").notNull().default("15:00"),
  checkOutTime: text("check_out_time").notNull().default("11:00"),
  taxRatePercent: integer("tax_rate_percent").notNull().default(12),
  cancellationPolicy: text("cancellation_policy").notNull().default("Free cancellation up to 48 hours prior to check-in."),
  announcementBanner: text("announcement_banner").default("Special Summer Escapes: Enjoy up to 25% off luxury ocean-view suites with complimentary gourmet breakfast.")
});
var roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews)
}));
var bookingsRelations = relations(bookings, ({ one }) => ({
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id]
  })
}));
var reviewsRelations = relations(reviews, ({ one }) => ({
  room: one(rooms, {
    fields: [reviews.roomId],
    references: [rooms.id]
  })
}));

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || "localhost",
      user: process.env.SQL_USER || "postgres",
      password: process.env.SQL_PASSWORD || "",
      database: process.env.SQL_DB_NAME || "hotel_db",
      max: 5,
      connectionTimeoutMillis: 1500,
      idleTimeoutMillis: 1e4
    });
    global._postgresPool.on("error", (err) => {
      console.warn("Postgres connection pool notice:", err.message);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// src/db/queries.ts
import { eq, ne, desc, and, or, sql, gte, lte, ilike, inArray } from "drizzle-orm";
var CATEGORY_ROOM_IMAGES = {
  Standard: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  Deluxe: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
  Executive: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  Suite: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
};
var STANDARD_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Standard]);
var DELUXE_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Deluxe]);
var EXECUTIVE_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Executive]);
var SUITE_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Suite]);
var SEED_ROOMS = [
  // --- FLOOR 1 (Standard & Deluxe) ---
  {
    roomNumber: "101",
    name: "Classic Heritage Queen Room",
    category: "Standard",
    pricePerNight: 3500,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 Queen Bed",
    sizeSqFt: 380,
    floor: 1,
    viewType: "Courtyard Garden View",
    description: "Elegantly appointed standard room with bespoke teakwood furnishings, fine cotton linens, dedicated work desk, and a modern rain shower.",
    amenities: JSON.stringify(["High-Speed Fiber Wi-Fi", "Work Desk & Ergonomic Chair", "Rainfall Walk-in Shower", "Electric Kettle & Tea Bar", "43-inch Smart 4K TV", "Electronic In-room Safe", "Plush Bathrobes"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.8",
    reviewCount: 84,
    featured: false
  },
  {
    roomNumber: "102",
    name: "Standard Twin Heritage Room",
    category: "Standard",
    pricePerNight: 3500,
    discountPercent: 0,
    capacity: 2,
    bedType: "2 Single Beds",
    sizeSqFt: 380,
    floor: 1,
    viewType: "Quiet Inner Courtyard",
    description: "Twin-bedded room with traditional Indian wood accents, soundproof windows, luxury bedding, and pristine ensuite bathroom.",
    amenities: JSON.stringify(["High-Speed Fiber Wi-Fi", "Dual Single Beds", "Rainfall Shower", "Coffee & Tea Maker", "Smart LED TV", "In-room Safe"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.7",
    reviewCount: 52,
    featured: false
  },
  {
    roomNumber: "103",
    name: "Classic Cozy Single Room",
    category: "Standard",
    pricePerNight: 3200,
    discountPercent: 0,
    capacity: 1,
    bedType: "1 Queen Bed",
    sizeSqFt: 320,
    floor: 1,
    viewType: "City Garden View",
    description: "Thoughtfully designed room for solo executives and travelers, featuring premium mattress, work desk, and high-speed internet.",
    amenities: JSON.stringify(["Fiber Wi-Fi", "Work Desk", "Rain Shower", "Complimentary Bottled Water", "Digital Safe", "Smart TV"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.8",
    reviewCount: 41,
    featured: false
  },
  {
    roomNumber: "104",
    name: "Standard King Courtyard Room",
    category: "Standard",
    pricePerNight: 3800,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 400,
    floor: 1,
    viewType: "Palace Courtyard View",
    description: "Generously proportioned standard room with plush king-sized bed, ambient warm lighting, and luxury bathroom amenities.",
    amenities: JSON.stringify(["High-Speed Wi-Fi", "King Bed", "Rain Shower", "Smart 4K TV", "Tea & Coffee Maker", "Daily Housekeeping"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.75",
    reviewCount: 63,
    featured: false
  },
  {
    roomNumber: "105",
    name: "Classic Garden Twin Room",
    category: "Standard",
    pricePerNight: 3600,
    discountPercent: 0,
    capacity: 2,
    bedType: "2 Single Beds",
    sizeSqFt: 390,
    floor: 1,
    viewType: "Botanical Garden View",
    description: "Peaceful garden retreat with twin beds, cozy seating nook, minibar, and modern rainfall shower.",
    amenities: JSON.stringify(["High-Speed Wi-Fi", "Garden View", "Tea/Coffee Bar", "Smart TV", "In-room Safe", "Air Conditioning"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.8",
    reviewCount: 38,
    featured: false
  },
  {
    roomNumber: "106",
    name: "Standard Executive King",
    category: "Standard",
    pricePerNight: 3900,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 410,
    floor: 1,
    viewType: "City Skyline View",
    description: "Quiet and sophisticated retreat featuring soundproof double-glazed windows, premium orthopedic mattress, and ergonomic workspace.",
    amenities: JSON.stringify(["Fiber Wi-Fi", "Orthopedic King Bed", "Ergonomic Work Desk", "Rain Shower", "43-inch Smart TV", "Digital Safe"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.82",
    reviewCount: 49,
    featured: false
  },
  {
    roomNumber: "107",
    name: "Classic Superior Queen",
    category: "Standard",
    pricePerNight: 3700,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 Queen Bed",
    sizeSqFt: 385,
    floor: 1,
    viewType: "Courtyard View",
    description: "Warm, welcoming room with handcrafted Indian wooden finishes, plush queen bed, and modern walk-in shower.",
    amenities: JSON.stringify(["High-Speed Wi-Fi", "Queen Bed", "Walk-in Shower", "Smart TV", "Tea & Coffee Bar", "Bathrobes"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.76",
    reviewCount: 34,
    featured: false
  },
  {
    roomNumber: "108",
    name: "Deluxe Poolside King Room",
    category: "Deluxe",
    pricePerNight: 5800,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 520,
    floor: 1,
    viewType: "Direct Pool & Garden View",
    description: "Spacious garden-facing retreat featuring a private patio opening towards the azure swimming pool, plush velvet armchairs, and marble bath.",
    amenities: JSON.stringify(["Private Poolside Patio", "Complimentary Breakfast", "High-Speed Fiber Wi-Fi", "Nespresso Coffee Machine", "Italian Marble Bathroom", "50-inch OLED TV", "24-hour Dining"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.92",
    reviewCount: 128,
    featured: true
  },
  // --- FLOOR 2 (Standard & Deluxe) ---
  {
    roomNumber: "201",
    name: "Standard Heritage King Room",
    category: "Standard",
    pricePerNight: 3800,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 400,
    floor: 2,
    viewType: "Historic Promenade View",
    description: "Comfortable second-floor room overlooking the promenade with plush king bedding, tea station, and polished wooden flooring.",
    amenities: JSON.stringify(["Fiber Wi-Fi", "King Bed", "Rain Shower", "Smart TV", "In-room Safe", "Room Service"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.8",
    reviewCount: 45,
    featured: false
  },
  {
    roomNumber: "202",
    name: "Standard Heritage Twin Room",
    category: "Standard",
    pricePerNight: 3600,
    discountPercent: 0,
    capacity: 2,
    bedType: "2 Single Beds",
    sizeSqFt: 390,
    floor: 2,
    viewType: "City View",
    description: "Contemporary standard room with twin beds, crisp percale linens, high-speed WiFi, and deluxe toiletries.",
    amenities: JSON.stringify(["Wi-Fi", "Twin Beds", "Shower", "Smart TV", "Tea Maker", "Daily Housekeeping"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.72",
    reviewCount: 31,
    featured: false
  },
  {
    roomNumber: "203",
    name: "Standard Superior King",
    category: "Standard",
    pricePerNight: 3900,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 410,
    floor: 2,
    viewType: "Courtyard Palm View",
    description: "Serene second-floor haven with king bed, views of towering palms, smart television, and luxury bath amenities.",
    amenities: JSON.stringify(["Fiber Wi-Fi", "King Bed", "Rain Shower", "Smart TV", "Tea & Coffee Maker", "Safe"]),
    images: STANDARD_IMAGES,
    status: "available",
    rating: "4.78",
    reviewCount: 29,
    featured: false
  },
  {
    roomNumber: "204",
    name: "Deluxe King Heritage Room",
    category: "Deluxe",
    pricePerNight: 5500,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 490,
    floor: 2,
    viewType: "Colaba Heritage Bay View",
    description: "Graceful deluxe room with plush king bed, marble vanity, handcrafted armchairs, and complimentary buffet breakfast.",
    amenities: JSON.stringify(["High-Speed Wi-Fi", "Complimentary Buffet Breakfast", "King Bed", "Marble Bathroom", "50-inch Smart TV", "Mini Refrigerator"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.88",
    reviewCount: 77,
    featured: true
  },
  {
    roomNumber: "205",
    name: "Deluxe Twin Heritage Room",
    category: "Deluxe",
    pricePerNight: 5400,
    discountPercent: 0,
    capacity: 3,
    bedType: "2 Queen Beds",
    sizeSqFt: 480,
    floor: 2,
    viewType: "Heritage Courtyard View",
    description: "Warm timber aesthetics, rich Indian handloom textiles, dual plush queen beds, and an expansive marble vanity bathroom.",
    amenities: JSON.stringify(["Dual Queen Beds", "High-Speed Wi-Fi", "Complimentary Breakfast", "Smart TV with OTT Apps", "Marble Bathroom with Tub", "Tea & Coffee Maker"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.85",
    reviewCount: 61,
    featured: false
  },
  {
    roomNumber: "206",
    name: "Deluxe Ocean Breeze King",
    category: "Deluxe",
    pricePerNight: 6200,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 530,
    floor: 2,
    viewType: "Partial Arabian Sea View",
    description: "Deluxe ocean-facing room filled with gentle sea breezes, private seating corner, deep soaking marble tub, and luxury bathrobes.",
    amenities: JSON.stringify(["Ocean View", "Marble Soaking Tub", "Complimentary Breakfast", "High-Speed Wi-Fi", "Nespresso Machine", "Smart TV"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.9",
    reviewCount: 92,
    featured: true
  },
  {
    roomNumber: "207",
    name: "Deluxe Family King Room",
    category: "Deluxe",
    pricePerNight: 6500,
    discountPercent: 0,
    capacity: 3,
    bedType: "1 King Bed + 1 Rollaway",
    sizeSqFt: 550,
    floor: 2,
    viewType: "Palace Gardens View",
    description: "Expansive family room accommodating up to 3 guests, with comfortable sofa lounge, large marble bath, and complimentary breakfast.",
    amenities: JSON.stringify(["Family Space", "Complimentary Breakfast", "Marble Bath", "Smart TV", "Mini Bar", "Fiber Wi-Fi"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.86",
    reviewCount: 54,
    featured: false
  },
  {
    roomNumber: "208",
    name: "Deluxe Garden Balcony Room",
    category: "Deluxe",
    pricePerNight: 6e3,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 510,
    floor: 2,
    viewType: "Private Garden Balcony",
    description: "Deluxe room with a charming private balcony overlooking manicured royal gardens, outdoor seating, and luxury amenities.",
    amenities: JSON.stringify(["Private Balcony", "Complimentary Breakfast", "King Bed", "Marble Rain Shower", "Smart 4K TV", "Wi-Fi"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.89",
    reviewCount: 68,
    featured: false
  },
  // --- FLOOR 3 (Deluxe & Executive) ---
  {
    roomNumber: "301",
    name: "Deluxe Grand King Room",
    category: "Deluxe",
    pricePerNight: 6200,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 520,
    floor: 3,
    viewType: "City Skyline & Sea View",
    description: "High-floor deluxe king room with floor-to-ceiling windows, city skyline views, marble bathroom, and complimentary breakfast.",
    amenities: JSON.stringify(["Skyline View", "Complimentary Breakfast", "King Bed", "Marble Vanity", "50-inch Smart TV", "Wi-Fi"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.87",
    reviewCount: 47,
    featured: false
  },
  {
    roomNumber: "302",
    name: "Deluxe Premium Twin Room",
    category: "Deluxe",
    pricePerNight: 5800,
    discountPercent: 0,
    capacity: 2,
    bedType: "2 Queen Beds",
    sizeSqFt: 500,
    floor: 3,
    viewType: "Garden View",
    description: "Premium twin room with dual queen beds, custom mahogany furnishings, rain shower, and evening turndown service.",
    amenities: JSON.stringify(["Dual Queen Beds", "Complimentary Breakfast", "Rain Shower", "Smart TV", "High-Speed Wi-Fi"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.82",
    reviewCount: 39,
    featured: false
  },
  {
    roomNumber: "303",
    name: "Deluxe Panoramic King",
    category: "Deluxe",
    pricePerNight: 6400,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 540,
    floor: 3,
    viewType: "Bay Panoramic View",
    description: "Corner deluxe suite room with wrap-around bay windows, deep soaking bathtub, king bed, and complimentary gourmet breakfast.",
    amenities: JSON.stringify(["Corner Panoramic View", "Soaking Bathtub", "Complimentary Breakfast", "Nespresso Coffee", "Wi-Fi"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.91",
    reviewCount: 65,
    featured: true
  },
  {
    roomNumber: "304",
    name: "Deluxe Executive King",
    category: "Deluxe",
    pricePerNight: 6600,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 550,
    floor: 3,
    viewType: "Promenade View",
    description: "Spacious deluxe room with dedicated executive workspace, high-speed fiber internet, and luxury marble bathroom.",
    amenities: JSON.stringify(["Executive Desk", "Complimentary Breakfast", "King Bed", "Marble Bath", "Smart TV", "Fiber Wi-Fi"]),
    images: DELUXE_IMAGES,
    status: "available",
    rating: "4.88",
    reviewCount: 42,
    featured: false
  },
  {
    roomNumber: "305",
    name: "Executive Club Room",
    category: "Executive",
    pricePerNight: 8500,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 620,
    floor: 3,
    viewType: "Arabian Sea View",
    description: "Premier executive accommodation offering Club Lounge access, evening cocktails, bespoke concierge, and sea views.",
    amenities: JSON.stringify(["Club Lounge Access", "Complimentary Evening Cocktails", "Gourmet Breakfast", "High-Speed Wi-Fi", "Marble Bath", "Smart 4K TV"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.93",
    reviewCount: 88,
    featured: true
  },
  {
    roomNumber: "306",
    name: "Executive Bay View Suite Room",
    category: "Executive",
    pricePerNight: 8900,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 650,
    floor: 3,
    viewType: "Panoramic Bay View",
    description: "Luxury executive room with panoramic bay views, private lounge sitting area, walk-in closet, and premium sound system.",
    amenities: JSON.stringify(["Club Lounge Privileges", "Panoramic Sea View", "Walk-in Dressing Room", "Harman Kardon Audio", "Gourmet Breakfast"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.95",
    reviewCount: 96,
    featured: true
  },
  {
    roomNumber: "307",
    name: "Executive Twin Club Room",
    category: "Executive",
    pricePerNight: 8500,
    discountPercent: 0,
    capacity: 2,
    bedType: "2 Queen Beds",
    sizeSqFt: 630,
    floor: 3,
    viewType: "City Skyline View",
    description: "Executive club room with dual plush queen beds, Club Lounge access, daily high tea, and marble bathroom with tub.",
    amenities: JSON.stringify(["Club Lounge Access", "Dual Queen Beds", "Complimentary High Tea", "Marble Bathtub", "Fiber Wi-Fi"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.89",
    reviewCount: 44,
    featured: false
  },
  {
    roomNumber: "308",
    name: "Executive Corner King Suite",
    category: "Executive",
    pricePerNight: 9200,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 680,
    floor: 3,
    viewType: "Sunset Sea & Skyline View",
    description: "Premier corner suite room with sunset sea views, spacious sofa lounge, complimentary airport transfers, and Club Lounge access.",
    amenities: JSON.stringify(["Airport Chauffeur Transfer", "Club Lounge Access", "Sunset Sea View", "Nespresso Machine", "Deep Soaking Tub"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.96",
    reviewCount: 112,
    featured: true
  },
  // --- FLOOR 4 (Executive & Suite) ---
  {
    roomNumber: "401",
    name: "Executive Premier King",
    category: "Executive",
    pricePerNight: 9500,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 690,
    floor: 4,
    viewType: "Arabian Sea Front",
    description: "Direct sea-facing executive haven on the 4th floor, with private check-in, Club Lounge dining, and luxury bath amenities.",
    amenities: JSON.stringify(["Direct Sea View", "Club Lounge Access", "Private Check-in", "Marble Rain Shower", "Complimentary Breakfast"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.94",
    reviewCount: 79,
    featured: true
  },
  {
    roomNumber: "402",
    name: "Executive Business King Room",
    category: "Executive",
    pricePerNight: 9e3,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 660,
    floor: 4,
    viewType: "Skyline View",
    description: "Designed for corporate leaders, featuring soundproof workspace, high-speed WiFi, conference room access, and Club Lounge.",
    amenities: JSON.stringify(["Conference Room Access", "Club Lounge Access", "Fiber 200Mbps Wi-Fi", "Gourmet Breakfast", "Smart 4K TV"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.91",
    reviewCount: 58,
    featured: false
  },
  {
    roomNumber: "403",
    name: "Executive Royal Twin",
    category: "Executive",
    pricePerNight: 8800,
    discountPercent: 0,
    capacity: 3,
    bedType: "2 Queen Beds",
    sizeSqFt: 670,
    floor: 4,
    viewType: "Bay & Garden View",
    description: "Spacious executive room with two queen beds, elegant sitting salon, Club Lounge privileges, and daily high tea.",
    amenities: JSON.stringify(["Club Lounge Access", "Dual Queen Beds", "Marble Soaking Tub", "Daily High Tea", "High-Speed Wi-Fi"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.9",
    reviewCount: 46,
    featured: false
  },
  {
    roomNumber: "404",
    name: "Executive Luxury King",
    category: "Executive",
    pricePerNight: 9800,
    discountPercent: 0,
    capacity: 2,
    bedType: "1 King Bed",
    sizeSqFt: 710,
    floor: 4,
    viewType: "Full Arabian Sea View",
    description: "Exquisite 4th floor sea-facing room with king bed, marble vanity with dual sinks, soaking tub, and VIP butler on call.",
    amenities: JSON.stringify(["Full Sea View", "VIP Butler on Call", "Club Lounge Access", "Dual Marble Sinks", "Nespresso Coffee"]),
    images: EXECUTIVE_IMAGES,
    status: "available",
    rating: "4.97",
    reviewCount: 83,
    featured: true
  },
  {
    roomNumber: "405",
    name: "Junior Heritage Suite",
    category: "Suite",
    pricePerNight: 12500,
    discountPercent: 0,
    capacity: 3,
    bedType: "1 King Bed + 1 Daybed",
    sizeSqFt: 850,
    floor: 4,
    viewType: "Palace Gardens & Sea View",
    description: "Charming suite featuring a separate living parlor, hand-carved jharokha bay seating, luxury marble bathroom, and 24/7 butler service.",
    amenities: JSON.stringify(["Separate Living Parlor", "24/7 Butler Service", "Jharokha Bay Seating", "Freestanding Bathtub", "Complimentary High Tea", "Gourmet Breakfast"]),
    images: SUITE_IMAGES,
    status: "available",
    rating: "4.96",
    reviewCount: 71,
    featured: true
  },
  {
    roomNumber: "406",
    name: "Grand Sea View Suite",
    category: "Suite",
    pricePerNight: 14e3,
    discountPercent: 0,
    capacity: 3,
    bedType: "1 King Bed",
    sizeSqFt: 920,
    floor: 4,
    viewType: "180\xB0 Arabian Sea Panoramas",
    description: "Magnificent sea-facing suite with expansive living salon, dining table for four, walk-in dressing room, and luxury bath with sea view tub.",
    amenities: JSON.stringify(["180\xB0 Sea Panoramas", "Dining Table for Four", "Sea-view Soaking Tub", "Dedicated Butler", "Airport Chauffeur Transfer", "Club Lounge"]),
    images: SUITE_IMAGES,
    status: "available",
    rating: "4.98",
    reviewCount: 94,
    featured: true
  },
  // --- FLOOR 5 (Imperial Luxury Suites) ---
  {
    roomNumber: "501",
    name: "Maharaja Royal Luxury Suite",
    category: "Suite",
    pricePerNight: 16e3,
    discountPercent: 0,
    capacity: 4,
    bedType: "2 King Beds",
    sizeSqFt: 1050,
    floor: 5,
    viewType: "Palace Gardens & Sea View",
    description: "Grand aristocratic suite with an opulent living salon, hand-carved heritage archways, freestanding copper bathtub, and dedicated butler service.",
    amenities: JSON.stringify(["24/7 Dedicated Butler Service", "Separate Living & Dining Salon", "Copper Soaking Bathtub", "Luxury Ayurvedic Toiletries", "Chauffeur Airport Pickup", "Complimentary High Tea", "Mini-bar with Treats"]),
    images: SUITE_IMAGES,
    status: "available",
    rating: "4.98",
    reviewCount: 74,
    featured: true
  },
  {
    roomNumber: "502",
    name: "Imperial Presidential Suite",
    category: "Suite",
    pricePerNight: 18e3,
    discountPercent: 0,
    capacity: 4,
    bedType: "1 Royal King + 1 Queen Bed",
    sizeSqFt: 1200,
    floor: 5,
    viewType: "360\xB0 Arabian Sea & Skyline View",
    description: "The pinnacle of palace luxury. Features a private master salon, 6-seater dining room, luxury bar, marble jacuzzi bath, and round-the-clock chef on call.",
    amenities: JSON.stringify(["Private Chef on Call", "Marble Jacuzzi Bathtub", "6-Seater Dining Salon", "Round-the-clock Butler", "Chauffeur Luxury Sedan", "Helipad Concierge", "Bvlgari Bath Amenities"]),
    images: SUITE_IMAGES,
    status: "available",
    rating: "5.0",
    reviewCount: 62,
    featured: true
  },
  {
    roomNumber: "503",
    name: "Royal Heritage Family Suite",
    category: "Suite",
    pricePerNight: 15e3,
    discountPercent: 0,
    capacity: 4,
    bedType: "2 King Beds",
    sizeSqFt: 980,
    floor: 5,
    viewType: "Bay & City Panoramas",
    description: "Spacious dual-bedroom royal suite designed for families, featuring two private marble bathrooms, central lounge, and gourmet breakfast.",
    amenities: JSON.stringify(["Dual Master Bedrooms", "Two Marble Bathrooms", "Central Living Lounge", "Dedicated Butler", "Complimentary Breakfast & High Tea", "Wi-Fi"]),
    images: SUITE_IMAGES,
    status: "available",
    rating: "4.95",
    reviewCount: 51,
    featured: true
  },
  {
    roomNumber: "504",
    name: "The Viceroy Seafront Suite",
    category: "Suite",
    pricePerNight: 16500,
    discountPercent: 0,
    capacity: 3,
    bedType: "1 Royal King Bed",
    sizeSqFt: 1020,
    floor: 5,
    viewType: "Frontal Ocean Sunset View",
    description: "Opulent seafront suite on the top floor with private balcony terrace, telescope for ocean stargazing, master spa bath, and butler service.",
    amenities: JSON.stringify(["Private Sunset Balcony Terrace", "Ocean Stargazing Telescope", "Master Spa Soaking Bath", "24/7 Butler Service", "Airport Chauffeur Transfer", "Gourmet Dining"]),
    images: SUITE_IMAGES,
    status: "available",
    rating: "4.99",
    reviewCount: 68,
    featured: true
  }
];
var memoryRooms = SEED_ROOMS.map((r, index) => ({
  id: index + 1,
  ...r,
  createdAt: /* @__PURE__ */ new Date(),
  updatedAt: /* @__PURE__ */ new Date()
}));
var memoryBookings = [];
var memoryUsers = [
  {
    id: 1,
    uid: "admin_master_uid",
    email: "admin@grandimperialpalace.in",
    password: "ImperialAdmin",
    name: "Palace General Manager & Admin",
    role: "admin",
    phone: "+91 22 6665 3300",
    loyaltyPoints: 5e3,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  },
  {
    id: 2,
    uid: "patron_demo_uid",
    email: "guest@grandimperialpalace.in",
    password: "guest123",
    name: "Maharaja Royal Guest",
    role: "guest",
    phone: "+91 98200 12345",
    loyaltyPoints: 450,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  },
  {
    id: 3,
    uid: "admin_karan_uid",
    email: "davekaran2006@gmail.com",
    password: "password123",
    name: "Karan Dave",
    role: "admin",
    phone: "+91 98765 43210",
    loyaltyPoints: 5e3,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }
];
var memoryReviews = [];
var memorySettings = {
  id: 1,
  hotelName: "The Grand Imperial Heritage Palace & Luxury Suites",
  contactEmail: "reservations@grandimperialpalace.in",
  contactPhone: "+91 22 6665 3300",
  address: "108 Heritage Bay Promenade, Colaba, Mumbai, Maharashtra 400001, India",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  taxRatePercent: 12,
  cancellationPolicy: "100% Free cancellation up to 24 hours prior to check-in.",
  announcementBanner: "\u{1F451} Welcome to The Grand Imperial Palace \u2014 Experience Luxury Indian Hospitality in the Heart of Mumbai."
};
var isPostgresOnline = !process.env.VERCEL || Boolean(
  process.env.SQL_HOST && process.env.SQL_HOST !== "localhost" && !process.env.SQL_HOST.includes("127.0.0.1")
);
async function seedDatabaseIfEmpty() {
  if (!isPostgresOnline) return;
  try {
    const existingRooms = await db.select({ count: sql`count(*)` }).from(rooms);
    const roomCount = Number(existingRooms[0]?.count || 0);
    isPostgresOnline = true;
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password text;`);
    } catch (colErr) {
      console.warn("Notice: password column check:", colErr);
    }
    try {
      await db.execute(sql`
        INSERT INTO users (uid, email, password, name, role, phone, loyalty_points)
        VALUES (
          'admin_master_uid',
          'admin@grandimperialpalace.in',
          'ImperialAdmin',
          'Palace General Manager & Admin',
          'admin',
          null,
          5000
        )
        ON CONFLICT (uid) DO UPDATE SET
          email = 'admin@grandimperialpalace.in',
          password = 'ImperialAdmin',
          role = 'admin',
          phone = null,
          name = 'Palace General Manager & Admin';
      `);
      console.log("Master Palace Admin account seeded into Cloud SQL (admin@grandimperialpalace.in / ImperialAdmin)");
    } catch (adminErr) {
      console.warn("Notice: Admin user seeding:", adminErr);
    }
    for (const [cat, img] of Object.entries(CATEGORY_ROOM_IMAGES)) {
      await db.update(rooms).set({ images: JSON.stringify([img]) }).where(eq(rooms.category, cat));
    }
    if (roomCount < 30) {
      console.log("Seeding / updating 34 luxury hotel rooms into Cloud SQL database...");
      await db.delete(rooms).where(
        or(
          eq(rooms.category, "Villa"),
          eq(rooms.category, "Penthouse")
        )
      );
      for (const room of SEED_ROOMS) {
        await db.insert(rooms).values(room).onConflictDoUpdate({
          target: rooms.roomNumber,
          set: {
            name: room.name,
            category: room.category,
            pricePerNight: room.pricePerNight,
            discountPercent: 0,
            capacity: room.capacity,
            bedType: room.bedType,
            sizeSqFt: room.sizeSqFt,
            floor: room.floor,
            viewType: room.viewType,
            description: room.description,
            amenities: room.amenities,
            images: room.images,
            status: room.status,
            rating: room.rating,
            reviewCount: room.reviewCount,
            featured: room.featured
          }
        });
      }
      console.log("Successfully synchronized 34 hotel rooms into Cloud SQL.");
    }
    const existingSettings = await db.select({ count: sql`count(*)` }).from(settings);
    if (Number(existingSettings[0]?.count || 0) === 0) {
      await db.insert(settings).values({
        hotelName: "The Grand Imperial Heritage Palace & Luxury Suites",
        contactEmail: "reservations@grandimperialpalace.in",
        contactPhone: "+91 22 6665 3300",
        address: "108 Heritage Bay Promenade, Colaba, Mumbai, Maharashtra 400001, India",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        taxRatePercent: 12,
        cancellationPolicy: "100% Free cancellation up to 24 hours prior to check-in.",
        announcementBanner: "\u{1F451} Welcome to The Grand Imperial Palace \u2014 Experience Luxury Indian Hospitality in the Heart of Mumbai."
      }).onConflictDoNothing();
    }
  } catch (error) {
    isPostgresOnline = false;
  }
}
async function getAllRooms(filters) {
  if (isPostgresOnline) {
    try {
      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(rooms.status, filters.status));
      }
      if (filters?.category && filters.category !== "All") {
        conditions.push(eq(rooms.category, filters.category));
      }
      if (filters?.minPrice !== void 0 && filters.minPrice > 0) {
        conditions.push(gte(rooms.pricePerNight, filters.minPrice));
      }
      if (filters?.maxPrice !== void 0 && filters.maxPrice > 0) {
        conditions.push(lte(rooms.pricePerNight, filters.maxPrice));
      }
      if (filters?.capacity !== void 0 && filters.capacity > 0) {
        conditions.push(gte(rooms.capacity, filters.capacity));
      }
      if (filters?.search && filters.search.trim()) {
        const s = `%${filters.search.trim()}%`;
        conditions.push(
          or(
            ilike(rooms.name, s),
            ilike(rooms.description, s),
            ilike(rooms.category, s),
            ilike(rooms.roomNumber, s)
          )
        );
      }
      const baseQuery = db.select().from(rooms);
      const roomList = conditions.length > 0 ? await baseQuery.where(and(...conditions)).orderBy(desc(rooms.featured), rooms.pricePerNight) : await baseQuery.orderBy(desc(rooms.featured), rooms.pricePerNight);
      if (roomList.length > 0) {
        const activeBookings = await db.select({ roomId: bookings.roomId }).from(bookings).where(inArray(bookings.bookingStatus, ["confirmed", "checked_in"]));
        const activeBookedRoomIds = new Set(activeBookings.map((b) => b.roomId));
        if (filters?.checkIn && filters?.checkOut) {
          const bookedRooms = await db.select({ roomId: bookings.roomId }).from(bookings).where(
            and(
              inArray(bookings.bookingStatus, ["confirmed", "checked_in"]),
              sql`${bookings.checkInDate} < ${filters.checkOut} AND ${bookings.checkOutDate} > ${filters.checkIn}`
            )
          );
          const bookedRoomIdSet = new Set(bookedRooms.map((b) => b.roomId));
          return roomList.map((room) => {
            const isOccupied = room.status === "occupied" || activeBookedRoomIds.has(room.id);
            return {
              ...room,
              status: isOccupied ? "occupied" : room.status,
              images: JSON.stringify([CATEGORY_ROOM_IMAGES[room.category] || CATEGORY_ROOM_IMAGES.Standard]),
              isAvailableForDates: !bookedRoomIdSet.has(room.id) && !isOccupied && room.status === "available"
            };
          });
        }
        return roomList.map((room) => {
          const isOccupied = room.status === "occupied" || activeBookedRoomIds.has(room.id);
          return {
            ...room,
            status: isOccupied ? "occupied" : room.status,
            images: JSON.stringify([CATEGORY_ROOM_IMAGES[room.category] || CATEGORY_ROOM_IMAGES.Standard]),
            isAvailableForDates: !isOccupied && room.status === "available"
          };
        });
      }
    } catch (error) {
      isPostgresOnline = false;
    }
  }
  const activeMemoryBookedIds = new Set(
    memoryBookings.filter((b) => b.bookingStatus === "confirmed" || b.bookingStatus === "checked_in").map((b) => b.roomId)
  );
  let list = [...memoryRooms];
  if (filters?.status) {
    list = list.filter((r) => {
      const isOcc = r.status === "occupied" || activeMemoryBookedIds.has(r.id);
      const computedStatus = isOcc ? "occupied" : r.status;
      return computedStatus === filters.status;
    });
  }
  if (filters?.category && filters.category !== "All") {
    list = list.filter((r) => r.category.toLowerCase() === filters.category.toLowerCase());
  }
  if (filters?.minPrice) {
    list = list.filter((r) => r.pricePerNight >= filters.minPrice);
  }
  if (filters?.maxPrice) {
    list = list.filter((r) => r.pricePerNight <= filters.maxPrice);
  }
  if (filters?.capacity) {
    list = list.filter((r) => r.capacity >= filters.capacity);
  }
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    list = list.filter(
      (r) => r.name.toLowerCase().includes(s) || r.roomNumber.toLowerCase().includes(s) || r.category.toLowerCase().includes(s) || r.description.toLowerCase().includes(s)
    );
  }
  list.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.pricePerNight - b.pricePerNight;
  });
  return list.map((room) => {
    const isOccupied = room.status === "occupied" || activeMemoryBookedIds.has(room.id);
    return {
      ...room,
      status: isOccupied ? "occupied" : room.status,
      images: JSON.stringify([CATEGORY_ROOM_IMAGES[room.category] || CATEGORY_ROOM_IMAGES.Standard]),
      isAvailableForDates: !isOccupied && room.status === "available"
    };
  });
}
async function getRoomById(id) {
  try {
    const result = await db.select().from(rooms).where(eq(rooms.id, id));
    if (result.length) {
      const r = result[0];
      return {
        ...r,
        images: JSON.stringify([CATEGORY_ROOM_IMAGES[r.category] || CATEGORY_ROOM_IMAGES.Standard])
      };
    }
  } catch (error) {
    console.warn(`Database fallback for getRoomById (${id}):`, error);
  }
  const found = memoryRooms.find((r) => r.id === id || r.roomNumber === String(id));
  const fallback = found || memoryRooms[0] || null;
  if (fallback) {
    return {
      ...fallback,
      images: JSON.stringify([CATEGORY_ROOM_IMAGES[fallback.category] || CATEGORY_ROOM_IMAGES.Standard])
    };
  }
  return null;
}
async function createRoom(data) {
  try {
    const result = await db.insert(rooms).values(data).returning();
    if (result.length) {
      memoryRooms.unshift(result[0]);
      return result[0];
    }
  } catch (error) {
    console.warn("Database fallback for createRoom:", error);
  }
  const newRoom = {
    id: memoryRooms.length + 1,
    ...data,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  memoryRooms.unshift(newRoom);
  return newRoom;
}
async function updateRoom(id, data) {
  try {
    const result = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    if (result.length) {
      const idx2 = memoryRooms.findIndex((r) => r.id === id);
      if (idx2 !== -1) memoryRooms[idx2] = { ...memoryRooms[idx2], ...result[0] };
      return result[0];
    }
  } catch (error) {
    console.warn("Database fallback for updateRoom:", error);
  }
  const idx = memoryRooms.findIndex((r) => r.id === id);
  if (idx !== -1) {
    memoryRooms[idx] = { ...memoryRooms[idx], ...data, updatedAt: /* @__PURE__ */ new Date() };
    return memoryRooms[idx];
  }
  return null;
}
async function deleteRoom(id) {
  try {
    const result = await db.delete(rooms).where(eq(rooms.id, id)).returning();
    if (result.length) {
      memoryRooms = memoryRooms.filter((r) => r.id !== id);
      return result[0];
    }
  } catch (error) {
    console.warn("Database fallback for deleteRoom:", error);
  }
  const deleted = memoryRooms.find((r) => r.id === id);
  memoryRooms = memoryRooms.filter((r) => r.id !== id);
  return deleted || { id };
}
async function registerDbUser(data) {
  const normEmail = data.email.trim().toLowerCase();
  const isAdmin = normEmail === "admin@grandimperialpalace.in";
  const role = isAdmin ? "admin" : "guest";
  const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  if (isPostgresOnline) {
    try {
      const existing = await db.select().from(users).where(eq(sql`lower(${users.email})`, normEmail));
      if (existing.length > 0) {
        throw new Error("An account with this email address already exists. Please sign in.");
      }
      const result = await db.insert(users).values({
        uid,
        email: normEmail,
        password: data.password || "",
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        role,
        loyaltyPoints: isAdmin ? 5e3 : 100
      }).returning();
      if (result.length) {
        memoryUsers.push(result[0]);
        return result[0];
      }
    } catch (error) {
      if (error.message?.includes("already exists")) {
        throw error;
      }
      isPostgresOnline = false;
    }
  }
  const memExisting = memoryUsers.find((u) => u.email.toLowerCase() === normEmail);
  if (memExisting) {
    throw new Error("An account with this email address already exists. Please sign in.");
  }
  const userObj = {
    id: memoryUsers.length + 1,
    uid,
    email: normEmail,
    password: data.password || "",
    name: data.name.trim(),
    phone: data.phone?.trim() || null,
    role,
    loyaltyPoints: isAdmin ? 5e3 : 100,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  memoryUsers.push(userObj);
  return userObj;
}
async function authenticateDbUser(email, password) {
  const normEmail = email.trim().toLowerCase();
  const trimmedPassword = (password || "").trim();
  if (normEmail === "admin@grandimperialpalace.in" && (trimmedPassword === "ImperialAdmin" || trimmedPassword === "ImperialAdmin2026!")) {
    let admin = await getUserByEmail(normEmail);
    if (!admin) {
      admin = {
        id: 1,
        uid: "admin_master_uid",
        email: "admin@grandimperialpalace.in",
        name: "Palace General Manager & Admin",
        role: "admin",
        phone: null,
        loyaltyPoints: 5e3,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
    return { success: true, user: admin, isAdmin: true };
  }
  let foundUser = null;
  if (isPostgresOnline) {
    try {
      const res = await db.select().from(users).where(eq(sql`lower(${users.email})`, normEmail));
      if (res.length > 0) {
        foundUser = res[0];
      }
    } catch (error) {
      isPostgresOnline = false;
    }
  }
  if (!foundUser) {
    foundUser = memoryUsers.find((u) => u.email.toLowerCase() === normEmail) || null;
  }
  if (!foundUser) {
    return {
      success: false,
      reason: "USER_NOT_FOUND",
      message: 'No account found with this email address. Please create a new account by signing up or use "Continue with Google".'
    };
  }
  if (!foundUser.password) {
    return {
      success: false,
      reason: "OAUTH_ACCOUNT",
      message: 'This account was registered via Google Sign-In. Please click "Continue with Google" to log in, or use "Forgot Password?" below to set an email password.'
    };
  }
  if (foundUser.password && foundUser.password !== trimmedPassword) {
    return {
      success: false,
      reason: "INVALID_PASSWORD",
      message: 'Incorrect password for this account. Please verify your password or use "Forgot Password?" to reset it.'
    };
  }
  const isAdm = foundUser.role === "admin" || normEmail === "admin@grandimperialpalace.in" || normEmail === "davekaran2006@gmail.com";
  return { success: true, user: foundUser, isAdmin: isAdm };
}
async function getUserByEmail(email) {
  const normEmail = email.trim().toLowerCase();
  if (isPostgresOnline) {
    try {
      const res = await db.select().from(users).where(eq(sql`lower(${users.email})`, normEmail));
      if (res.length > 0) return res[0];
    } catch (error) {
      isPostgresOnline = false;
    }
  }
  return memoryUsers.find((u) => u.email?.toLowerCase() === normEmail) || null;
}
async function updateUserPassword(email, newPassword) {
  const normEmail = email.trim().toLowerCase();
  const trimmed = newPassword.trim();
  if (isPostgresOnline) {
    try {
      const res = await db.update(users).set({ password: trimmed, updatedAt: /* @__PURE__ */ new Date() }).where(eq(sql`lower(${users.email})`, normEmail)).returning();
      if (res.length > 0) {
        const idx = memoryUsers.findIndex((u) => u.email?.toLowerCase() === normEmail);
        if (idx !== -1) memoryUsers[idx].password = trimmed;
        return true;
      }
    } catch (error) {
      isPostgresOnline = false;
    }
  }
  const mem = memoryUsers.find((u) => u.email?.toLowerCase() === normEmail);
  if (mem) {
    mem.password = trimmed;
    mem.updatedAt = /* @__PURE__ */ new Date();
    return true;
  }
  const newUser = {
    id: memoryUsers.length + 10,
    uid: `user_${Date.now()}`,
    email: normEmail,
    password: trimmed,
    name: normEmail.split("@")[0],
    role: normEmail.includes("admin") ? "admin" : "guest",
    phone: null,
    loyaltyPoints: 100,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  memoryUsers.push(newUser);
  return true;
}
async function getOrCreateUser(userData) {
  const defaultRole = userData.email.toLowerCase().includes("admin") ? "admin" : userData.role || "guest";
  try {
    const result = await db.insert(users).values({
      uid: userData.uid,
      email: userData.email,
      name: userData.name || userData.email.split("@")[0],
      avatar: userData.avatar || "",
      role: defaultRole
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email: userData.email,
        ...userData.name ? { name: userData.name } : {},
        ...userData.avatar ? { avatar: userData.avatar } : {},
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    if (result.length) {
      const idx = memoryUsers.findIndex((u) => u.uid === userData.uid);
      if (idx !== -1) memoryUsers[idx] = result[0];
      else memoryUsers.push(result[0]);
      return result[0];
    }
  } catch (error) {
    console.warn("Database fallback for getOrCreateUser:", error);
  }
  let user = memoryUsers.find((u) => u.uid === userData.uid);
  if (user) {
    user.name = userData.name || user.name;
    user.avatar = userData.avatar || user.avatar;
    user.updatedAt = /* @__PURE__ */ new Date();
  } else {
    user = {
      id: memoryUsers.length + 1,
      uid: userData.uid,
      email: userData.email,
      name: userData.name || userData.email.split("@")[0],
      avatar: userData.avatar || "",
      role: defaultRole,
      loyaltyPoints: 100,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    memoryUsers.push(user);
  }
  return user;
}
async function getUserProfile(uid) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    if (result.length) return result[0];
  } catch (error) {
    console.warn(`Database fallback for getUserProfile (${uid}):`, error);
  }
  return memoryUsers.find((u) => u.uid === uid) || null;
}
async function updateUserProfile(uid, data) {
  try {
    const result = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.uid, uid)).returning();
    if (result.length) {
      const idx2 = memoryUsers.findIndex((u) => u.uid === uid);
      if (idx2 !== -1) memoryUsers[idx2] = result[0];
      return result[0];
    }
  } catch (error) {
    console.warn(`Database fallback for updateUserProfile (${uid}):`, error);
  }
  const idx = memoryUsers.findIndex((u) => u.uid === uid);
  if (idx !== -1) {
    memoryUsers[idx] = { ...memoryUsers[idx], ...data, updatedAt: /* @__PURE__ */ new Date() };
    return memoryUsers[idx];
  }
  return null;
}
async function getAllGuests() {
  try {
    const guestList = await db.select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      name: users.name,
      phone: users.phone,
      address: users.address,
      country: users.country,
      role: users.role,
      loyaltyPoints: users.loyaltyPoints,
      createdAt: users.createdAt
    }).from(users).orderBy(desc(users.createdAt));
    const guestBookings = await db.select({
      userId: bookings.userId,
      count: sql`count(*)`,
      totalSpend: sql`sum(${bookings.totalAmount})`
    }).from(bookings).groupBy(bookings.userId);
    const spendMap = new Map(guestBookings.map((b) => [b.userId, {
      totalBookings: Number(b.count),
      totalSpent: Number(b.totalSpend || 0)
    }]));
    if (guestList.length > 0) {
      return guestList.map((guest) => ({
        ...guest,
        totalBookings: spendMap.get(guest.uid)?.totalBookings || 0,
        totalSpent: spendMap.get(guest.uid)?.totalSpent || 0
      }));
    }
  } catch (error) {
    console.warn("Database fallback for getAllGuests:", error);
  }
  return memoryUsers.map((guest) => ({
    ...guest,
    totalBookings: memoryBookings.filter((b) => b.userId === guest.uid).length,
    totalSpent: memoryBookings.filter((b) => b.userId === guest.uid && b.paymentStatus === "paid").reduce((s, b) => s + b.totalAmount, 0)
  }));
}
async function checkRoomAvailability(roomId, checkIn, checkOut) {
  try {
    const overlapping = await db.select().from(bookings).where(
      and(
        eq(bookings.roomId, roomId),
        inArray(bookings.bookingStatus, ["confirmed", "checked_in"]),
        sql`${bookings.checkInDate} < ${checkOut} AND ${bookings.checkOutDate} > ${checkIn}`
      )
    );
    return overlapping.length === 0;
  } catch (error) {
    console.warn("Database fallback for checkRoomAvailability:", error);
    const overlappingMem = memoryBookings.filter(
      (b) => b.roomId === roomId && (b.bookingStatus === "confirmed" || b.bookingStatus === "checked_in") && b.checkInDate < checkOut && b.checkOutDate > checkIn
    );
    return overlappingMem.length === 0;
  }
}
async function createBooking(data) {
  const randomSuffix = Math.floor(1e5 + Math.random() * 9e5);
  const bookingReference = `HTL-${randomSuffix}`;
  const transactionId = `TXN-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
  try {
    const isAvailable = await checkRoomAvailability(data.roomId, data.checkInDate, data.checkOutDate);
    if (!isAvailable) {
      throw new Error("Selected room is no longer available for these dates. Please choose another date or room.");
    }
    const newBooking = await db.insert(bookings).values({
      bookingReference,
      roomId: data.roomId,
      userId: data.userId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      totalNights: data.totalNights,
      guestsCount: data.guestsCount,
      specialRequests: data.specialRequests || "",
      roomRatePerNight: data.roomRatePerNight,
      cleaningFee: data.cleaningFee ?? 25,
      taxesAndFees: data.taxesAndFees ?? 35,
      totalAmount: data.totalAmount,
      paymentStatus: "paid",
      paymentMethod: data.paymentMethod || "Credit Card (Simulated)",
      paymentCardLast4: data.paymentCardLast4 || "4242",
      transactionId,
      bookingStatus: "confirmed"
    }).returning();
    await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, data.roomId));
    const memRoom = memoryRooms.find((r) => r.id === data.roomId);
    if (memRoom) {
      memRoom.status = "occupied";
    }
    if (newBooking.length) {
      const roomDetails = await getRoomById(data.roomId);
      const fullBooking = {
        ...newBooking[0],
        roomName: roomDetails?.name || `Suite #${data.roomId}`,
        roomNumber: roomDetails?.roomNumber || `${data.roomId}`,
        roomCategory: roomDetails?.category || "Deluxe",
        roomImages: roomDetails?.images,
        bedType: roomDetails?.bedType
      };
      memoryBookings.unshift(fullBooking);
      return fullBooking;
    }
  } catch (error) {
    if (error.message?.includes("no longer available")) {
      throw error;
    }
    console.warn("Database fallback for createBooking:", error);
  }
  const room = memoryRooms.find((r) => r.id === data.roomId) || memoryRooms[0];
  if (room) {
    room.status = "occupied";
  }
  const memoryObj = {
    id: memoryBookings.length + 1,
    bookingReference,
    roomId: data.roomId,
    userId: data.userId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    totalNights: data.totalNights,
    guestsCount: data.guestsCount,
    specialRequests: data.specialRequests || "",
    roomRatePerNight: data.roomRatePerNight,
    cleaningFee: data.cleaningFee ?? 25,
    taxesAndFees: data.taxesAndFees ?? 35,
    totalAmount: data.totalAmount,
    paymentStatus: "paid",
    paymentMethod: data.paymentMethod || "Credit Card (Simulated)",
    paymentCardLast4: data.paymentCardLast4 || "4242",
    transactionId,
    bookingStatus: "confirmed",
    createdAt: /* @__PURE__ */ new Date(),
    roomName: room?.name || `Suite #${data.roomId}`,
    roomNumber: room?.roomNumber || `${data.roomId}`,
    roomCategory: room?.category || "Deluxe",
    roomImages: room?.images,
    bedType: room?.bedType
  };
  memoryBookings.unshift(memoryObj);
  return memoryObj;
}
async function getBookingsByUser(userId) {
  try {
    const userBookings = await db.select({
      id: bookings.id,
      bookingReference: bookings.bookingReference,
      roomId: bookings.roomId,
      userId: bookings.userId,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      totalNights: bookings.totalNights,
      guestsCount: bookings.guestsCount,
      specialRequests: bookings.specialRequests,
      roomRatePerNight: bookings.roomRatePerNight,
      cleaningFee: bookings.cleaningFee,
      taxesAndFees: bookings.taxesAndFees,
      totalAmount: bookings.totalAmount,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      paymentCardLast4: bookings.paymentCardLast4,
      transactionId: bookings.transactionId,
      bookingStatus: bookings.bookingStatus,
      cancelledAt: bookings.cancelledAt,
      cancellationReason: bookings.cancellationReason,
      createdAt: bookings.createdAt,
      roomName: rooms.name,
      roomNumber: rooms.roomNumber,
      roomCategory: rooms.category,
      roomImages: rooms.images,
      bedType: rooms.bedType
    }).from(bookings).leftJoin(rooms, eq(bookings.roomId, rooms.id)).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
    if (userBookings.length > 0) return userBookings;
  } catch (error) {
    console.warn(`Database fallback for getBookingsByUser (${userId}):`, error);
  }
  return memoryBookings.filter((b) => b.userId === userId);
}
async function getAllBookings() {
  try {
    const allBookings = await db.select({
      id: bookings.id,
      bookingReference: bookings.bookingReference,
      roomId: bookings.roomId,
      userId: bookings.userId,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      totalNights: bookings.totalNights,
      guestsCount: bookings.guestsCount,
      specialRequests: bookings.specialRequests,
      roomRatePerNight: bookings.roomRatePerNight,
      cleaningFee: bookings.cleaningFee,
      taxesAndFees: bookings.taxesAndFees,
      totalAmount: bookings.totalAmount,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      paymentCardLast4: bookings.paymentCardLast4,
      transactionId: bookings.transactionId,
      bookingStatus: bookings.bookingStatus,
      cancelledAt: bookings.cancelledAt,
      cancellationReason: bookings.cancellationReason,
      createdAt: bookings.createdAt,
      roomName: rooms.name,
      roomNumber: rooms.roomNumber,
      roomCategory: rooms.category,
      roomPrice: rooms.pricePerNight
    }).from(bookings).leftJoin(rooms, eq(bookings.roomId, rooms.id)).orderBy(desc(bookings.createdAt));
    if (allBookings.length > 0) {
      return allBookings.map((b) => ({
        ...b,
        roomName: b.roomName || `Suite #${b.roomId}`,
        roomNumber: b.roomNumber || `${b.roomId}`,
        roomCategory: b.roomCategory || "Deluxe"
      }));
    }
  } catch (error) {
    console.warn("Database fallback for getAllBookings:", error);
  }
  return memoryBookings;
}
async function getBookingByRef(reference) {
  try {
    const result = await db.select({
      id: bookings.id,
      bookingReference: bookings.bookingReference,
      roomId: bookings.roomId,
      userId: bookings.userId,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      totalNights: bookings.totalNights,
      guestsCount: bookings.guestsCount,
      specialRequests: bookings.specialRequests,
      roomRatePerNight: bookings.roomRatePerNight,
      cleaningFee: bookings.cleaningFee,
      taxesAndFees: bookings.taxesAndFees,
      totalAmount: bookings.totalAmount,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      paymentCardLast4: bookings.paymentCardLast4,
      transactionId: bookings.transactionId,
      bookingStatus: bookings.bookingStatus,
      cancelledAt: bookings.cancelledAt,
      cancellationReason: bookings.cancellationReason,
      createdAt: bookings.createdAt,
      roomName: rooms.name,
      roomNumber: rooms.roomNumber,
      roomCategory: rooms.category,
      roomImages: rooms.images,
      bedType: rooms.bedType
    }).from(bookings).leftJoin(rooms, eq(bookings.roomId, rooms.id)).where(eq(bookings.bookingReference, reference));
    if (result.length) return result[0];
  } catch (error) {
    console.warn(`Database fallback for getBookingByRef (${reference}):`, error);
  }
  return memoryBookings.find((b) => b.bookingReference === reference) || null;
}
async function updateBookingStatus(id, status, cancellationReason) {
  try {
    const updateData = {
      bookingStatus: status
    };
    if (status === "cancelled") {
      updateData.cancelledAt = /* @__PURE__ */ new Date();
      updateData.paymentStatus = "refunded";
      if (cancellationReason) updateData.cancellationReason = cancellationReason;
    }
    const result = await db.update(bookings).set(updateData).where(eq(bookings.id, id)).returning();
    const bObj = result.length ? result[0] : memoryBookings.find((b) => b.id === id);
    if (bObj && bObj.roomId) {
      if (status === "cancelled" || status === "checked_out") {
        const otherActive = await db.select().from(bookings).where(
          and(
            eq(bookings.roomId, bObj.roomId),
            ne(bookings.id, id),
            inArray(bookings.bookingStatus, ["confirmed", "checked_in"])
          )
        );
        if (otherActive.length === 0) {
          await db.update(rooms).set({ status: "available" }).where(eq(rooms.id, bObj.roomId));
          const memRoom = memoryRooms.find((r) => r.id === bObj.roomId);
          if (memRoom) memRoom.status = "available";
        }
      } else if (status === "confirmed" || status === "checked_in") {
        await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, bObj.roomId));
        const memRoom = memoryRooms.find((r) => r.id === bObj.roomId);
        if (memRoom) memRoom.status = "occupied";
      }
    }
    if (result.length) {
      const idx2 = memoryBookings.findIndex((b) => b.id === id);
      if (idx2 !== -1) memoryBookings[idx2] = { ...memoryBookings[idx2], ...result[0] };
      return result[0];
    }
  } catch (error) {
    console.warn(`Database fallback for updateBookingStatus (${id}):`, error);
  }
  const idx = memoryBookings.findIndex((b) => b.id === id);
  if (idx !== -1) {
    memoryBookings[idx].bookingStatus = status;
    if (status === "cancelled") {
      memoryBookings[idx].cancelledAt = /* @__PURE__ */ new Date();
      memoryBookings[idx].paymentStatus = "refunded";
      if (cancellationReason) memoryBookings[idx].cancellationReason = cancellationReason;
    }
    const memRoom = memoryRooms.find((r) => r.id === memoryBookings[idx].roomId);
    if (memRoom) {
      memRoom.status = status === "cancelled" || status === "checked_out" ? "available" : "occupied";
    }
    return memoryBookings[idx];
  }
  return null;
}
async function getReviewsByRoom(roomId) {
  try {
    const res = await db.select().from(reviews).where(eq(reviews.roomId, roomId)).orderBy(desc(reviews.createdAt));
    if (res.length) return res;
  } catch (error) {
    console.warn(`Database fallback for getReviewsByRoom (${roomId}):`, error);
  }
  return memoryReviews.filter((r) => r.roomId === roomId);
}
async function createReview(data) {
  try {
    const result = await db.insert(reviews).values(data).returning();
    if (result.length) {
      memoryReviews.unshift(result[0]);
      return result[0];
    }
  } catch (error) {
    console.warn("Database fallback for createReview:", error);
  }
  const rev = {
    id: memoryReviews.length + 1,
    ...data,
    createdAt: /* @__PURE__ */ new Date()
  };
  memoryReviews.unshift(rev);
  return rev;
}
async function getSettings() {
  if (isPostgresOnline) {
    try {
      const result = await db.select().from(settings).limit(1);
      if (result.length) {
        return result[0];
      }
    } catch (error) {
      isPostgresOnline = false;
    }
  }
  return memorySettings;
}
async function updateSettings(data) {
  try {
    const current = await db.select().from(settings).limit(1);
    if (current.length) {
      const result = await db.update(settings).set(data).where(eq(settings.id, current[0].id)).returning();
      if (result.length) {
        memorySettings = { ...memorySettings, ...result[0] };
        return result[0];
      }
    } else {
      const result = await db.insert(settings).values(data).returning();
      if (result.length) {
        memorySettings = { ...memorySettings, ...result[0] };
        return result[0];
      }
    }
  } catch (error) {
    console.warn("Database fallback for updateSettings:", error);
  }
  memorySettings = { ...memorySettings, ...data };
  return memorySettings;
}
async function getAdminAnalytics() {
  try {
    const allRooms = await db.select().from(rooms);
    const allBookings = await db.select().from(bookings);
    const allUsers = await db.select().from(users);
    const totalRooms = allRooms.length || memoryRooms.length;
    const totalBookings = allBookings.length || memoryBookings.length;
    const activeBookings = (allBookings.length ? allBookings : memoryBookings).filter((b) => b.bookingStatus === "confirmed" || b.bookingStatus === "checked_in");
    const completedBookings = (allBookings.length ? allBookings : memoryBookings).filter((b) => b.bookingStatus === "checked_out");
    const cancelledBookings = (allBookings.length ? allBookings : memoryBookings).filter((b) => b.bookingStatus === "cancelled");
    const totalRevenue = (allBookings.length ? allBookings : memoryBookings).filter((b) => b.paymentStatus === "paid" && b.bookingStatus !== "cancelled").reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const occupancyRate = totalRooms > 0 ? Math.min(100, Math.round(activeBookings.length / totalRooms * 100)) : 0;
    const categoryCount = {};
    for (const room of allRooms.length ? allRooms : memoryRooms) {
      categoryCount[room.category] = (categoryCount[room.category] || 0) + 1;
    }
    return {
      totalRooms,
      totalBookings,
      activeBookingsCount: activeBookings.length,
      completedBookingsCount: completedBookings.length,
      cancelledBookingsCount: cancelledBookings.length,
      totalRevenue,
      totalGuests: allUsers.length || memoryUsers.length,
      occupancyRate,
      categoryDistribution: categoryCount,
      recentBookings: (allBookings.length ? allBookings : memoryBookings).slice(0, 5)
    };
  } catch (error) {
    console.warn("Database fallback for getAdminAnalytics:", error);
    return {
      totalRooms: memoryRooms.length,
      totalBookings: memoryBookings.length,
      activeBookingsCount: memoryBookings.filter((b) => b.bookingStatus === "confirmed").length,
      completedBookingsCount: 0,
      cancelledBookingsCount: 0,
      totalRevenue: memoryBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      totalGuests: memoryUsers.length,
      occupancyRate: 0,
      categoryDistribution: { Standard: 8, Deluxe: 12, Executive: 8, Suite: 6 },
      recentBookings: memoryBookings.slice(0, 5)
    };
  }
}
async function createWalkInBooking(data) {
  const randomSuffix = Math.floor(1e5 + Math.random() * 9e5);
  const bookingReference = `WLK-${randomSuffix}`;
  const transactionId = `CTR-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
  const walkInUserId = `walkin_${Date.now()}`;
  const assignedKey = data.keyCardNumber || `KEY-${data.roomId}-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`;
  const initialFolio = [
    {
      id: `fol_${Date.now()}`,
      description: `Room Tariff (${data.totalNights} Night${data.totalNights > 1 ? "s" : ""})`,
      category: "Room",
      amount: data.roomRatePerNight * data.totalNights,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      addedBy: "Front Desk System"
    },
    {
      id: `fol_${Date.now() + 1}`,
      description: "Luxury Heritage Taxes & GST (12%)",
      category: "Other",
      amount: data.taxesAndFees || 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      addedBy: "Front Desk System"
    }
  ];
  try {
    const isAvailable = await checkRoomAvailability(data.roomId, data.checkInDate, data.checkOutDate);
    if (!isAvailable) {
      throw new Error(`Suite #${data.roomId} is already occupied or reserved for these dates.`);
    }
    const newBooking = await db.insert(bookings).values({
      bookingReference,
      roomId: data.roomId,
      userId: walkInUserId,
      guestName: data.guestName.trim(),
      guestEmail: (data.guestEmail || `walkin.${randomSuffix}@counter.guest`).trim(),
      guestPhone: data.guestPhone.trim(),
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      totalNights: data.totalNights,
      guestsCount: data.guestsCount,
      specialRequests: data.specialRequests || "Walk-in Counter Guest",
      roomRatePerNight: data.roomRatePerNight,
      cleaningFee: data.cleaningFee ?? 0,
      taxesAndFees: data.taxesAndFees ?? 0,
      totalAmount: data.totalAmount,
      paymentStatus: "paid",
      paymentMethod: data.paymentMethod || "Cash at Counter",
      paymentCardLast4: data.paymentMethod.includes("Card") ? "9999" : "CASH",
      transactionId,
      bookingStatus: "checked_in"
      // Immediate Walk-in Check-in
    }).returning();
    await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, data.roomId));
    const memRoom = memoryRooms.find((r) => r.id === data.roomId);
    if (memRoom) memRoom.status = "occupied";
    if (newBooking.length) {
      const roomDetails = await getRoomById(data.roomId);
      const fullBooking = {
        ...newBooking[0],
        roomName: roomDetails?.name || `Suite #${data.roomId}`,
        roomNumber: roomDetails?.roomNumber || `${data.roomId}`,
        roomCategory: roomDetails?.category || "Deluxe",
        roomImages: roomDetails?.images,
        bedType: roomDetails?.bedType,
        keyCardNumber: assignedKey,
        idProofType: data.idProofType,
        idProofNumber: data.idProofNumber,
        isWalkIn: true,
        isOtpVerified: Boolean(data.isOtpVerified),
        folioItems: JSON.stringify(initialFolio)
      };
      memoryBookings.unshift(fullBooking);
      return fullBooking;
    }
  } catch (error) {
    if (error.message?.includes("already occupied")) {
      throw error;
    }
    console.warn("Database fallback for createWalkInBooking:", error);
  }
  const room = memoryRooms.find((r) => r.id === data.roomId) || memoryRooms[0];
  if (room) {
    room.status = "occupied";
  }
  const memoryObj = {
    id: memoryBookings.length + 1,
    bookingReference,
    roomId: data.roomId,
    userId: walkInUserId,
    guestName: data.guestName.trim(),
    guestEmail: (data.guestEmail || `walkin.${randomSuffix}@counter.guest`).trim(),
    guestPhone: data.guestPhone.trim(),
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    totalNights: data.totalNights,
    guestsCount: data.guestsCount,
    specialRequests: data.specialRequests || "Walk-in Counter Guest",
    roomRatePerNight: data.roomRatePerNight,
    cleaningFee: data.cleaningFee ?? 0,
    taxesAndFees: data.taxesAndFees ?? 0,
    totalAmount: data.totalAmount,
    paymentStatus: "paid",
    paymentMethod: data.paymentMethod || "Cash at Counter",
    paymentCardLast4: "CASH",
    transactionId,
    bookingStatus: "checked_in",
    keyCardNumber: assignedKey,
    idProofType: data.idProofType,
    idProofNumber: data.idProofNumber,
    isWalkIn: true,
    isOtpVerified: Boolean(data.isOtpVerified),
    folioItems: JSON.stringify(initialFolio),
    createdAt: /* @__PURE__ */ new Date(),
    roomName: room?.name || `Suite #${data.roomId}`,
    roomNumber: room?.roomNumber || `${data.roomId}`,
    roomCategory: room?.category || "Deluxe",
    roomImages: room?.images,
    bedType: room?.bedType
  };
  memoryBookings.unshift(memoryObj);
  return memoryObj;
}
async function addFolioItemToBooking(bookingId, item) {
  const newItem = {
    id: `fol_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
    description: item.description,
    category: item.category,
    amount: Number(item.amount),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    addedBy: item.addedBy || "Front Desk Staff"
  };
  try {
    const dbResult = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (dbResult.length > 0) {
      const bRow = dbResult[0];
      const newTotal = (Number(bRow.totalAmount) || 0) + Number(item.amount);
      await db.update(bookings).set({ totalAmount: newTotal }).where(eq(bookings.id, bookingId));
      const memIdx = memoryBookings.findIndex((b) => b.id === bookingId);
      if (memIdx !== -1) {
        let currentFolio = [];
        try {
          if (memoryBookings[memIdx].folioItems) {
            currentFolio = JSON.parse(memoryBookings[memIdx].folioItems);
          }
        } catch {
          currentFolio = [];
        }
        currentFolio.push(newItem);
        memoryBookings[memIdx].folioItems = JSON.stringify(currentFolio);
        memoryBookings[memIdx].totalAmount = newTotal;
      }
      return { success: true, booking: { ...bRow, totalAmount: newTotal }, addedItem: newItem };
    }
  } catch (err) {
    console.warn("DB update notice for folio charge:", err);
  }
  const bookingIdx = memoryBookings.findIndex((b) => b.id === bookingId);
  if (bookingIdx !== -1) {
    const booking = memoryBookings[bookingIdx];
    let currentFolio = [];
    try {
      if (booking.folioItems) {
        currentFolio = JSON.parse(booking.folioItems);
      }
    } catch {
      currentFolio = [];
    }
    currentFolio.push(newItem);
    booking.folioItems = JSON.stringify(currentFolio);
    booking.totalAmount = (Number(booking.totalAmount) || 0) + Number(item.amount);
    return { success: true, booking, addedItem: newItem };
  }
  return { success: false, error: "Booking not found for folio update" };
}
async function checkInBookingWithKey(bookingId, keyCardNumber, idProofType, idProofNumber, isOtpVerified) {
  const assignedKey = keyCardNumber || `KEY-${bookingId}-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`;
  try {
    const dbResult = await db.select({
      id: bookings.id,
      bookingReference: bookings.bookingReference,
      roomId: bookings.roomId,
      userId: bookings.userId,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      totalNights: bookings.totalNights,
      guestsCount: bookings.guestsCount,
      specialRequests: bookings.specialRequests,
      roomRatePerNight: bookings.roomRatePerNight,
      cleaningFee: bookings.cleaningFee,
      taxesAndFees: bookings.taxesAndFees,
      totalAmount: bookings.totalAmount,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      paymentCardLast4: bookings.paymentCardLast4,
      transactionId: bookings.transactionId,
      bookingStatus: bookings.bookingStatus,
      createdAt: bookings.createdAt,
      roomName: rooms.name,
      roomNumber: rooms.roomNumber,
      roomCategory: rooms.category,
      roomImages: rooms.images,
      bedType: rooms.bedType
    }).from(bookings).leftJoin(rooms, eq(bookings.roomId, rooms.id)).where(eq(bookings.id, bookingId));
    if (dbResult.length > 0) {
      const bRow = dbResult[0];
      await db.update(bookings).set({ bookingStatus: "checked_in" }).where(eq(bookings.id, bookingId));
      await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, bRow.roomId));
      const memRoom = memoryRooms.find((r) => r.id === bRow.roomId);
      if (memRoom) memRoom.status = "occupied";
      const updated = {
        ...bRow,
        bookingStatus: "checked_in",
        keyCardNumber: assignedKey,
        idProofType: idProofType || "Aadhaar Card",
        idProofNumber: idProofNumber || "",
        isOtpVerified: isOtpVerified !== void 0 ? isOtpVerified : true
      };
      const memIdx = memoryBookings.findIndex((b) => b.id === bookingId);
      if (memIdx !== -1) {
        memoryBookings[memIdx] = { ...memoryBookings[memIdx], ...updated };
      } else {
        memoryBookings.unshift(updated);
      }
      return updated;
    }
  } catch (err) {
    console.warn("DB check-in update error:", err);
  }
  const bookingIdx = memoryBookings.findIndex((b) => b.id === bookingId);
  if (bookingIdx !== -1) {
    memoryBookings[bookingIdx].bookingStatus = "checked_in";
    memoryBookings[bookingIdx].keyCardNumber = assignedKey;
    if (idProofType) memoryBookings[bookingIdx].idProofType = idProofType;
    if (idProofNumber) memoryBookings[bookingIdx].idProofNumber = idProofNumber;
    if (isOtpVerified !== void 0) memoryBookings[bookingIdx].isOtpVerified = isOtpVerified;
    const roomId = memoryBookings[bookingIdx].roomId;
    const memRoom = memoryRooms.find((r) => r.id === roomId);
    if (memRoom) memRoom.status = "occupied";
    return memoryBookings[bookingIdx];
  }
  return null;
}
async function checkOutBookingAndRelease(bookingId, settlementMethod = "Settled at Counter") {
  try {
    const dbResult = await db.select({
      id: bookings.id,
      bookingReference: bookings.bookingReference,
      roomId: bookings.roomId,
      userId: bookings.userId,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      totalNights: bookings.totalNights,
      guestsCount: bookings.guestsCount,
      specialRequests: bookings.specialRequests,
      roomRatePerNight: bookings.roomRatePerNight,
      cleaningFee: bookings.cleaningFee,
      taxesAndFees: bookings.taxesAndFees,
      totalAmount: bookings.totalAmount,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      paymentCardLast4: bookings.paymentCardLast4,
      transactionId: bookings.transactionId,
      bookingStatus: bookings.bookingStatus,
      createdAt: bookings.createdAt,
      roomName: rooms.name,
      roomNumber: rooms.roomNumber,
      roomCategory: rooms.category,
      roomImages: rooms.images,
      bedType: rooms.bedType
    }).from(bookings).leftJoin(rooms, eq(bookings.roomId, rooms.id)).where(eq(bookings.id, bookingId));
    if (dbResult.length > 0) {
      const bRow = dbResult[0];
      const newPaymentMethod = `${bRow.paymentMethod || "Counter"} / ${settlementMethod}`;
      await db.update(bookings).set({ bookingStatus: "checked_out", paymentStatus: "paid", paymentMethod: newPaymentMethod }).where(eq(bookings.id, bookingId));
      await db.update(rooms).set({ status: "cleaning" }).where(eq(rooms.id, bRow.roomId));
      const memRoom = memoryRooms.find((r) => r.id === bRow.roomId);
      if (memRoom) memRoom.status = "cleaning";
      const updated = {
        ...bRow,
        bookingStatus: "checked_out",
        paymentStatus: "paid",
        paymentMethod: newPaymentMethod
      };
      const memIdx = memoryBookings.findIndex((b) => b.id === bookingId);
      if (memIdx !== -1) {
        memoryBookings[memIdx] = { ...memoryBookings[memIdx], ...updated };
      }
      return updated;
    }
  } catch (err) {
    console.warn("DB check-out notice:", err);
  }
  const bookingIdx = memoryBookings.findIndex((b) => b.id === bookingId);
  if (bookingIdx !== -1) {
    const booking = memoryBookings[bookingIdx];
    booking.bookingStatus = "checked_out";
    booking.paymentStatus = "paid";
    booking.paymentMethod = `${booking.paymentMethod} / ${settlementMethod}`;
    const roomId = booking.roomId;
    const memRoom = memoryRooms.find((r) => r.id === roomId);
    if (memRoom) {
      memRoom.status = "cleaning";
    }
    return booking;
  }
  return null;
}
async function updateRoomHousekeepingStatus(roomId, status) {
  const memRoom = memoryRooms.find((r) => r.id === roomId);
  if (memRoom) {
    memRoom.status = status;
  }
  try {
    await db.update(rooms).set({ status }).where(eq(rooms.id, roomId));
  } catch (err) {
    console.warn("DB housekeeping status update notice:", err);
  }
  return memRoom;
}

// src/middleware/auth.ts
var SESSION_SECRET = process.env.SESSION_SECRET || "gip_palace_secure_hmac_secret_2026_key";
var ADMIN_MASTER_CREDENTIALS = {
  email: "admin@grandimperialpalace.in",
  password: process.env.ADMIN_PASSWORD || "ImperialAdmin",
  masterKey: process.env.ADMIN_MASTER_KEY || "ImperialAdmin",
  allowedAdminEmails: ["admin@grandimperialpalace.in", "davekaran2006@gmail.com", "admin@palace.com", "admin"]
};
var activeAdminTokens = /* @__PURE__ */ new Set();
var activeUserSessions = /* @__PURE__ */ new Map();
function signPayload(payloadB64) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
}
function createLocalSessionToken(data) {
  const payload = {
    ...data,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1e3
    // 30 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encoded);
  const token = `gip_sess_${encoded}.${signature}`;
  activeUserSessions.set(token, data);
  if (data.role === "admin" || data.email.toLowerCase() === "admin@grandimperialpalace.in" || data.email.toLowerCase() === "davekaran2006@gmail.com") {
    activeAdminTokens.add(token);
  }
  return token;
}
function decodeLocalSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  if (activeUserSessions.has(token)) {
    return activeUserSessions.get(token);
  }
  if (token.startsWith("gip_sess_")) {
    try {
      const tokenBody = token.replace("gip_sess_", "");
      const [encodedPayload, signature] = tokenBody.split(".");
      if (!encodedPayload) return null;
      if (signature) {
        const expectedSig = signPayload(encodedPayload);
        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSig);
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          console.warn("[Security Warning]: Tampered session token rejected.");
          return null;
        }
      }
      const raw = Buffer.from(encodedPayload, "base64url").toString("utf8");
      const payload = JSON.parse(raw);
      if (payload.exp && Date.now() > payload.exp) {
        return null;
      }
      if (payload && (payload.uid || payload.email)) {
        const email = (payload.email || "guest@example.com").trim().toLowerCase();
        const isAdm = payload.role === "admin" || email === "admin@grandimperialpalace.in" || email === "davekaran2006@gmail.com";
        const sessionData = {
          uid: payload.uid || `usr_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
          email,
          name: payload.name || email.split("@")[0],
          role: isAdm ? "admin" : payload.role || "guest"
        };
        activeUserSessions.set(token, sessionData);
        if (isAdm) {
          activeAdminTokens.add(token);
        }
        return sessionData;
      }
    } catch {
      return null;
    }
  }
  return null;
}
function isPlausibleJwt(token) {
  if (!token || typeof token !== "string") return false;
  if (token.startsWith("gip_") || token.startsWith("adm_") || token.startsWith("usr_")) return false;
  if (token === "null" || token === "undefined" || token.length < 20) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}
function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function verifyJwtToken(token) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (user && !error) {
        const email = user.email || "";
        const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split("@")[0] || "Patron";
        const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === email.toLowerCase());
        return {
          uid: user.id,
          email,
          name,
          role: isAdm ? "admin" : user.user_metadata?.role || "guest",
          picture: user.user_metadata?.avatar_url || user.user_metadata?.picture
        };
      }
    } catch {
    }
  }
  const payload = parseJwtPayload(token);
  if (payload && (payload.sub || payload.user_id || payload.uid || payload.email)) {
    const uid = payload.sub || payload.user_id || payload.uid;
    const email = payload.email || "guest@example.com";
    const name = payload.user_metadata?.name || payload.name || email.split("@")[0];
    const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === email.toLowerCase());
    return {
      uid,
      email,
      name,
      role: isAdm ? "admin" : "guest",
      picture: payload.user_metadata?.avatar_url || payload.picture
    };
  }
  return null;
}
var requireAuth = async (req, res, next) => {
  const adminToken = req.headers["x-admin-token"];
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: "admin_master_uid",
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: "Palace General Manager",
      role: "admin"
    };
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing authorization token" });
  }
  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Empty authorization token" });
  }
  if (activeAdminTokens.has(token)) {
    req.isAdmin = true;
    req.user = {
      uid: "admin_master_uid",
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: "Palace General Manager",
      role: "admin"
    };
    return next();
  }
  const localSession = decodeLocalSessionToken(token);
  if (localSession) {
    req.isAdmin = localSession.role === "admin" || localSession.email.toLowerCase() === "admin@grandimperialpalace.in" || localSession.email.toLowerCase() === "davekaran2006@gmail.com";
    req.user = {
      uid: localSession.uid,
      email: localSession.email,
      name: localSession.name,
      role: localSession.role
    };
    return next();
  }
  if (isPlausibleJwt(token)) {
    const verified = await verifyJwtToken(token);
    if (verified) {
      req.user = verified;
      req.isAdmin = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Invalid or expired session token. Please sign in again." });
  }
  return res.status(401).json({ error: "Unauthorized: Unrecognized or invalid session token. Please sign in again." });
};
var requireAdmin = async (req, res, next) => {
  const adminToken = (req.headers["x-admin-token"] || "").trim();
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: "admin_master_uid",
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: "Palace General Manager",
      role: "admin"
    };
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1]?.trim();
    if (token) {
      if (activeAdminTokens.has(token)) {
        req.isAdmin = true;
        req.user = {
          uid: "admin_master_uid",
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: "Palace General Manager",
          role: "admin"
        };
        return next();
      }
      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        if (localSession.role === "admin" || localSession.email.toLowerCase() === "admin@grandimperialpalace.in" || localSession.email.toLowerCase() === "davekaran2006@gmail.com") {
          req.isAdmin = true;
          req.user = {
            uid: localSession.uid,
            email: localSession.email,
            name: localSession.name,
            role: "admin"
          };
          return next();
        }
      }
      if (isPlausibleJwt(token)) {
        const verified = await verifyJwtToken(token);
        if (verified) {
          req.user = verified;
          const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
          if (isAdm) {
            req.isAdmin = true;
            return next();
          }
          const profile = await getUserProfile(verified.uid);
          if (profile && profile.role === "admin") {
            req.isAdmin = true;
            return next();
          }
        }
      }
    }
  }
  return res.status(403).json({ error: "Forbidden: Palace Administrator credentials required to access this resource." });
};
var requireStaffOrAdmin = async (req, res, next) => {
  const adminToken = (req.headers["x-admin-token"] || "").trim();
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: "admin_master_uid",
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: "Palace General Manager",
      role: "admin"
    };
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1]?.trim();
    if (token) {
      if (activeAdminTokens.has(token)) {
        req.isAdmin = true;
        req.user = {
          uid: "admin_master_uid",
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: "Palace General Manager",
          role: "admin"
        };
        return next();
      }
      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        const isStaff = localSession.role === "admin" || localSession.role === "staff" || localSession.role === "receptionist" || localSession.email.toLowerCase() === "admin@grandimperialpalace.in" || localSession.email.toLowerCase() === "davekaran2006@gmail.com";
        if (isStaff) {
          req.isAdmin = localSession.role === "admin" || localSession.email.toLowerCase() === "admin@grandimperialpalace.in";
          req.user = {
            uid: localSession.uid,
            email: localSession.email,
            name: localSession.name,
            role: localSession.role
          };
          return next();
        }
      }
      if (isPlausibleJwt(token)) {
        const verified = await verifyJwtToken(token);
        if (verified) {
          req.user = verified;
          const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
          if (isAdm || verified.role === "admin" || verified.role === "staff" || verified.role === "receptionist") {
            req.isAdmin = isAdm || verified.role === "admin";
            return next();
          }
          const profile = await getUserProfile(verified.uid);
          if (profile && (profile.role === "admin" || profile.role === "staff" || profile.role === "receptionist")) {
            req.isAdmin = profile.role === "admin";
            return next();
          }
        }
      }
    }
  }
  return res.status(403).json({ error: "Forbidden: Reception Staff or Palace Administrator credentials required." });
};
var optionalAuth = async (req, res, next) => {
  const adminToken = req.headers["x-admin-token"];
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: "admin_master_uid",
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: "Palace General Manager",
      role: "admin"
    };
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1]?.trim();
    if (token) {
      if (activeAdminTokens.has(token)) {
        req.isAdmin = true;
        req.user = {
          uid: "admin_master_uid",
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: "Palace General Manager",
          role: "admin"
        };
        return next();
      }
      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        req.isAdmin = localSession.role === "admin" || localSession.email.toLowerCase() === "admin@grandimperialpalace.in" || localSession.email.toLowerCase() === "davekaran2006@gmail.com";
        req.user = {
          uid: localSession.uid,
          email: localSession.email,
          name: localSession.name,
          role: localSession.role
        };
        return next();
      }
      if (isPlausibleJwt(token)) {
        const verified = await verifyJwtToken(token);
        if (verified) {
          req.user = verified;
          req.isAdmin = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
        }
      }
    }
  }
  next();
};

// src/utils/otpService.ts
var otpStore = /* @__PURE__ */ new Map();
var emailOtpStore = /* @__PURE__ */ new Map();
var OTP_SECRET = (typeof process !== "undefined" && process.env ? process.env.SESSION_SECRET || process.env.SUPABASE_ANON_KEY : "") || "palace_regal_otp_secret_key_2026";
function computeHash(payload) {
  let h1 = 3735928559 ^ OTP_SECRET.length;
  let h2 = 1103547991 ^ OTP_SECRET.length;
  const str = payload + "|" + OTP_SECRET;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
function createSignedResetToken(email, code, expiresAt) {
  const normEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const sig = computeHash(`${normEmail}:${cleanCode}:${expiresAt}`);
  const payload = {
    email: normEmail,
    codeHash: computeHash(cleanCode),
    expiresAt,
    sig
  };
  try {
    return btoa(JSON.stringify(payload));
  } catch {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }
}
function verifySignedResetToken(email, inputCode, token) {
  if (!token) return { valid: false, error: "No verification token provided." };
  try {
    let jsonStr = "";
    try {
      jsonStr = atob(token);
    } catch {
      jsonStr = Buffer.from(token, "base64").toString("utf8");
    }
    const data = JSON.parse(jsonStr);
    const normEmail = email.trim().toLowerCase();
    const cleanInput = inputCode.trim();
    if (data.email !== normEmail) {
      return { valid: false, error: "Reset session does not match this email address." };
    }
    if (Date.now() > data.expiresAt) {
      return { valid: false, error: "The verification code has expired. Please request a new code." };
    }
    const expectedSig = computeHash(`${normEmail}:${cleanInput}:${data.expiresAt}`);
    if (data.sig !== expectedSig) {
      return { valid: false, error: "Invalid verification code. Please check your email and try again." };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: "Invalid verification session." };
  }
}
function generateOtpCode() {
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    const num = 1e5 + array[0] % 9e5;
    return num.toString();
  }
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
function maskEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name[0]}${"*".repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}@${domain}`;
}
function issueOtp(phone, purpose = "identity_verification") {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
  const code = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1e3;
  const record = {
    target: cleanPhone,
    code,
    purpose,
    createdAt: now,
    expiresAt,
    verified: false,
    attempts: 0
  };
  otpStore.set(cleanPhone, record);
  return {
    success: true,
    code,
    expiresAt,
    formattedPhone,
    message: `Verification code sent to ${formattedPhone}. Valid for 5 minutes.`
  };
}
function verifyOtpCode(phone, inputCode) {
  const cleanPhone = phone.replace(/\D/g, "");
  const cleanInput = inputCode.trim();
  const record = otpStore.get(cleanPhone);
  if (!record) {
    return { success: false, error: "No active OTP request found for this mobile number. Please request a new OTP." };
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return { success: false, error: "The OTP has expired. Please request a fresh OTP code." };
  }
  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(cleanPhone);
    return { success: false, error: "Maximum verification attempts exceeded. Please request a new OTP." };
  }
  if (record.code === cleanInput) {
    record.verified = true;
    otpStore.delete(cleanPhone);
    return { success: true, verifiedPhone: cleanPhone };
  }
  return {
    success: false,
    error: `Invalid OTP code. Please enter the 6-digit code sent to your device. (${5 - record.attempts} attempts remaining)`
  };
}
function issueEmailOtp(email) {
  const normEmail = email.trim().toLowerCase();
  const code = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1e3;
  const masked = maskEmail(normEmail);
  const resetToken = createSignedResetToken(normEmail, code, expiresAt);
  const record = {
    target: normEmail,
    code,
    purpose: "password_reset",
    createdAt: now,
    expiresAt,
    verified: false,
    attempts: 0
  };
  emailOtpStore.set(normEmail, record);
  return {
    success: true,
    code,
    expiresAt,
    maskedEmail: masked,
    resetToken,
    message: `A 6-digit password reset code has been sent to ${masked}.`
  };
}
function verifyEmailOtpCode(email, inputCode, consume = true, resetToken) {
  const normEmail = email.trim().toLowerCase();
  const cleanInput = (inputCode || "").trim();
  const record = emailOtpStore.get(normEmail);
  if (record) {
    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(normEmail);
      return { success: false, error: "The verification code has expired. Please request a new code." };
    }
    record.attempts += 1;
    if (record.attempts > 5) {
      emailOtpStore.delete(normEmail);
      return { success: false, error: "Too many incorrect attempts. Please request a new code." };
    }
    if (record.code === cleanInput) {
      record.verified = true;
      if (consume) {
        emailOtpStore.delete(normEmail);
      }
      return { success: true };
    }
    return {
      success: false,
      error: `Invalid verification code. Please check your email and try again. (${5 - record.attempts} attempts remaining)`
    };
  }
  if (resetToken) {
    const tokenResult = verifySignedResetToken(normEmail, cleanInput, resetToken);
    if (tokenResult.valid) {
      return { success: true };
    }
    return { success: false, error: tokenResult.error || "Invalid verification code." };
  }
  return {
    success: false,
    error: "No active OTP request found for this email address. Please request a new code."
  };
}

// src/services/emailService.ts
import "dotenv/config";
import nodemailer from "nodemailer";
var transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10);
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
  if (user && pass && (user.includes("@gmail.com") || process.env.GMAIL_USER || process.env.GMAIL_APP_PASSWORD)) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      connectionTimeout: 8e3,
      greetingTimeout: 8e3,
      socketTimeout: 12e3
    });
    return transporter;
  }
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "grand.imperial.palace@ethereal.email",
      pass: "palaceSecret2026"
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  return transporter;
}
async function sendOtpEmail(toEmail, otpCode) {
  const normEmail = toEmail.trim().toLowerCase();
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset - The Grand Imperial Palace</title>
      <style>
        body { font-family: 'Georgia', serif; background-color: #FBF9F5; color: #1C1916; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #ECE5D8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #1C1916 0%, #2A1F14 100%); padding: 32px 24px; text-align: center; color: #FAF8F5; }
        .logo-badge { display: inline-block; background: rgba(230, 202, 133, 0.2); border: 1px solid #E6CA85; border-radius: 8px; padding: 4px 10px; color: #E6CA85; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; }
        .title { font-size: 22px; font-weight: bold; color: #FAF8F5; margin: 0; }
        .body { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 16px; color: #1C1916; font-weight: 600; margin-bottom: 12px; }
        .text { font-size: 14px; color: #665E55; font-family: sans-serif; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #FAF8F5; border: 2px dashed #947139; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #947139; font-weight: bold; font-family: sans-serif; margin-bottom: 6px; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1C1916; font-family: 'Courier New', monospace; }
        .validity { font-size: 12px; color: #8C8275; margin-top: 8px; font-family: sans-serif; }
        .footer { background: #FAF8F5; padding: 20px; text-align: center; font-size: 11px; color: #8C8275; font-family: sans-serif; border-top: 1px solid #ECE5D8; }
        .disclaimer { font-size: 12px; color: #8C8275; font-style: italic; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-badge">The Grand Imperial Palace</div>
          <h1 class="title">Password Reset Verification</h1>
        </div>
        <div class="body">
          <p class="greeting">Dear Valued Patron,</p>
          <p class="text">
            We received a request to reset the password for your Grand Imperial Palace account associated with <strong>${normEmail}</strong>.
          </p>
          
          <div class="otp-box">
            <div class="otp-label">Your 6-Digit Verification Code</div>
            <div class="otp-code">${otpCode}</div>
            <div class="validity">\u23F1 Valid for the next 10 minutes</div>
          </div>
          
          <p class="text">
            Please enter this code in the password reset window to proceed with setting your new password.
          </p>
          
          <p class="disclaimer">
            If you did not initiate this request, you can safely disregard this email. Your password will remain unchanged and your account secure.
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0;"><strong>The Grand Imperial Heritage Palace & Luxury Suites</strong></p>
          <p style="margin: 0;">108 Heritage Bay Promenade, Colaba, Mumbai &bull; +91 22 6665 3300</p>
        </div>
      </div>
    </body>
    </html>
  `;
  try {
    const mailer = getTransporter();
    const senderUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "reservations@grandimperialpalace.in").trim();
    const info = await mailer.sendMail({
      from: `"The Grand Imperial Palace" <${senderUser}>`,
      to: normEmail,
      replyTo: senderUser,
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high"
      },
      subject: `[${otpCode}] Grand Imperial Palace - Your Password Reset Verification Code`,
      text: `Your Grand Imperial Palace password reset code is: ${otpCode}. It is valid for 10 minutes.`,
      html: htmlContent
    });
    console.log(`[Email Service] Password reset OTP email dispatched successfully to ${normEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[Email Service Notice] Could not send via primary SMTP (${error.message}).`);
    return { success: false, error: error.message };
  }
}
async function sendWelcomeEmail(toEmail, userName, loyaltyPoints = 100) {
  const normEmail = toEmail.trim().toLowerCase();
  const displayName = (userName || "").trim() || normEmail.split("@")[0];
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to The Grand Imperial Palace</title>
      <style>
        body { font-family: 'Georgia', serif; background-color: #FBF9F5; color: #1C1916; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #ECE5D8; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #1C1916 0%, #2A1F14 50%, #1C1916 100%); padding: 36px 24px; text-align: center; color: #FAF8F5; }
        .logo-badge { display: inline-block; background: rgba(230, 202, 133, 0.2); border: 1px solid #E6CA85; border-radius: 8px; padding: 5px 12px; color: #E6CA85; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-bottom: 12px; }
        .title { font-size: 24px; font-weight: bold; color: #FAF8F5; margin: 0 0 6px 0; font-family: 'Georgia', serif; }
        .subtitle { font-size: 13px; color: #D5C2A5; margin: 0; font-family: sans-serif; letter-spacing: 0.5px; }
        .body { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 18px; color: #1C1916; font-weight: bold; margin-bottom: 14px; }
        .text { font-size: 14px; color: #554D44; font-family: sans-serif; line-height: 1.65; margin-bottom: 20px; }
        .card { background: linear-gradient(135deg, #FBF8F2 0%, #F5EDE0 100%); border: 1px solid #D9C2A0; border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; }
        .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8A6428; font-weight: bold; font-family: sans-serif; margin-bottom: 6px; }
        .points-badge { font-size: 28px; font-weight: 900; color: #2A1F14; font-family: 'Georgia', serif; margin: 4px 0; }
        .points-desc { font-size: 12px; color: #7A6F62; font-family: sans-serif; }
        .benefits-grid { margin: 20px 0; text-align: left; }
        .benefit-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-family: sans-serif; font-size: 13px; color: #4A4239; }
        .benefit-icon { color: #A67C37; font-size: 15px; line-height: 1; margin-top: 2px; }
        .btn-wrapper { text-align: center; margin: 28px 0 16px 0; }
        .btn { display: inline-block; background: #78350F; background: linear-gradient(135deg, #78350F 0%, #451A03 100%); color: #FAF8F5 !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 14px; font-family: sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(120, 53, 15, 0.25); }
        .footer { background: #FAF8F5; padding: 24px 20px; text-align: center; font-size: 11px; color: #8C8275; font-family: sans-serif; border-top: 1px solid #ECE5D8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-badge">Royal Patron Club</div>
          <h1 class="title">Welcome to Grand Imperial Palace</h1>
          <p class="subtitle">A timeless sanctuary of heritage luxury and regal hospitality</p>
        </div>
        <div class="body">
          <p class="greeting">Dear ${capitalizedName},</p>
          <p class="text">
            We are deeply privileged to welcome you to <strong>The Grand Imperial Palace</strong>. Your patron account has been successfully created, opening the gates to an unrivaled world of historic elegance, bespoke luxury suites, and royal privileges.
          </p>
          
          <div class="card">
            <div class="card-title">VIP Patron Welcome Gift</div>
            <div class="points-badge">+${loyaltyPoints} Royal Loyalty Points</div>
            <div class="points-desc">Instantly credited to your balance for suite upgrades, dining & spa rewards.</div>
          </div>

          <p class="text" style="font-weight: 600; color: #1C1916; margin-bottom: 10px;">
            Your Exclusive Member Privileges:
          </p>
          
          <div class="benefits-grid">
            <div class="benefit-item">
              <span class="benefit-icon">\u2726</span>
              <span><strong>VIP Priority Check-In</strong> &mdash; Seamless key pickup and luggage handling.</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">\u2726</span>
              <span><strong>Guaranteed Best Heritage Rates</strong> &mdash; Exclusive patron-only discounts on all suites.</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">\u2726</span>
              <span><strong>24/7 Dedicated Palace Concierge</strong> &mdash; Tailored city excursions and private dining reservations.</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">\u2726</span>
              <span><strong>Complimentary High-Speed Fiber Wi-Fi</strong> &amp; luxury welcome refreshments on arrival.</span>
            </div>
          </div>

          <div class="btn-wrapper">
            <a href="${appUrl}" class="btn">Explore Suites &amp; Book Your Stay &rarr;</a>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #4A4239;">The Grand Imperial Heritage Palace &amp; Luxury Suites</p>
          <p style="margin: 0 0 8px 0;">108 Heritage Bay Promenade, Colaba, Mumbai 400001 &bull; +91 22 6665 3300</p>
          <p style="margin: 0; color: #A89F93;">You received this email because you created an account on Grand Imperial Palace.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  try {
    const mailer = getTransporter();
    const senderUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "reservations@grandimperialpalace.in").trim();
    const info = await mailer.sendMail({
      from: `"The Grand Imperial Palace" <${senderUser}>`,
      to: normEmail,
      replyTo: senderUser,
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high"
      },
      subject: `Welcome to The Grand Imperial Palace, ${capitalizedName} \u2013 100 Loyalty Points Inside`,
      text: `Welcome to The Grand Imperial Palace, ${capitalizedName}! Your account has been credited with 100 bonus loyalty points. Visit ${appUrl} to explore our heritage suites.`,
      html: htmlContent
    });
    console.log(`[Email Service] Royal Welcome email dispatched successfully to ${normEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[Email Service Notice] Could not send welcome email (${error.message}).`);
    return { success: false, error: error.message };
  }
}

// server.ts
var rateLimitStore = /* @__PURE__ */ new Map();
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1e3));
    return { allowed: false, retryAfterSeconds };
  }
  entry.count += 1;
  return { allowed: true };
}
function createApp() {
  const app2 = express();
  app2.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app2.use(express.json({ limit: "5mb" }));
  seedDatabaseIfEmpty().catch((err) => {
    console.error("Initial database seeding check error:", err);
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/auth/config", (req, res) => {
    res.json({
      supabaseUrl: (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim(),
      supabaseAnonKey: (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim()
    });
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const data = await getSettings();
      res.json(data);
    } catch (error) {
      console.error("Failed to get settings:", error);
      res.status(500).json({ error: error.message || "Failed to fetch settings" });
    }
  });
  app2.get("/api/rooms", async (req, res) => {
    try {
      const { category, minPrice, maxPrice, capacity, search, checkIn, checkOut, status } = req.query;
      const rooms2 = await getAllRooms({
        category: category ? String(category) : void 0,
        minPrice: minPrice ? Number(minPrice) : void 0,
        maxPrice: maxPrice ? Number(maxPrice) : void 0,
        capacity: capacity ? Number(capacity) : void 0,
        search: search ? String(search) : void 0,
        checkIn: checkIn ? String(checkIn) : void 0,
        checkOut: checkOut ? String(checkOut) : void 0,
        status: status ? String(status) : void 0
      });
      res.json(rooms2);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      res.status(500).json({ error: error.message || "Failed to fetch rooms" });
    }
  });
  app2.get("/api/rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid room id" });
      const room = await getRoomById(id);
      if (!room) return res.status(404).json({ error: "Room not found" });
      res.json(room);
    } catch (error) {
      console.error("Failed to fetch room:", error);
      res.status(500).json({ error: error.message || "Failed to fetch room details" });
    }
  });
  app2.get("/api/reviews/:roomId", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId, 10);
      if (isNaN(roomId)) return res.status(400).json({ error: "Invalid room id" });
      const reviews2 = await getReviewsByRoom(roomId);
      res.json(reviews2);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      res.status(500).json({ error: error.message || "Failed to fetch reviews" });
    }
  });
  app2.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const { roomId, rating, comment } = req.body;
      if (!roomId || !rating || !comment) {
        return res.status(400).json({ error: "Room ID, rating, and comment are required." });
      }
      const review = await createReview({
        roomId: Number(roomId),
        userId: req.user.uid,
        guestName: req.user.name || req.user.email?.split("@")[0] || "Guest",
        rating: Number(rating),
        comment: String(comment).trim()
      });
      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(500).json({ error: error.message || "Failed to submit review" });
    }
  });
  app2.post("/api/otp/send", async (req, res) => {
    try {
      const { phone, purpose } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required for OTP verification." });
      }
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
      }
      const clientIp = req.ip || req.socket.remoteAddress || "ip";
      const rateLimitCheck = checkRateLimit(`otp_send_${cleanPhone}_${clientIp}`, 5, 10 * 60 * 1e3);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          error: `Too many OTP requests. Please wait ${rateLimitCheck.retryAfterSeconds} seconds before requesting a new code.`
        });
      }
      const otpResult = issueOtp(cleanPhone, purpose || "identity_verification");
      res.json({
        success: true,
        message: otpResult.message,
        formattedPhone: otpResult.formattedPhone,
        expiresAt: otpResult.expiresAt
      });
    } catch (error) {
      console.error("OTP Send error:", error);
      res.status(500).json({ error: error.message || "Failed to dispatch verification code." });
    }
  });
  app2.post("/api/otp/verify", async (req, res) => {
    try {
      const { phone, otp, code } = req.body;
      const inputCode = String(otp || code || "").trim();
      if (!phone || !inputCode) {
        return res.status(400).json({ error: "Both phone number and 6-digit OTP code are required." });
      }
      const verifyResult = verifyOtpCode(phone, inputCode);
      if (!verifyResult.success) {
        return res.status(400).json({ error: verifyResult.error || "Invalid or expired OTP code." });
      }
      res.json({
        success: true,
        verified: true,
        phone: verifyResult.verifiedPhone,
        message: "Phone identity verified successfully."
      });
    } catch (error) {
      console.error("OTP Verify error:", error);
      res.status(500).json({ error: error.message || "Verification failed." });
    }
  });
  app2.post("/api/reception/walkin", requireStaffOrAdmin, async (req, res) => {
    try {
      const {
        roomId,
        guestName,
        guestPhone,
        guestEmail,
        guestAddress,
        idProofType,
        idProofNumber,
        checkInDate,
        checkOutDate,
        totalNights,
        guestsCount,
        specialRequests,
        roomRatePerNight,
        cleaningFee,
        taxesAndFees,
        totalAmount,
        paymentMethod,
        keyCardNumber,
        isOtpVerified
      } = req.body;
      if (!roomId || !guestName || !guestPhone || !idProofType || !idProofNumber) {
        return res.status(400).json({
          error: "Room selection, Guest Name, Mobile Number, and ID Proof details are required for walk-in registration."
        });
      }
      const walkIn = await createWalkInBooking({
        roomId: Number(roomId),
        guestName: String(guestName).trim(),
        guestPhone: String(guestPhone).trim(),
        guestEmail: guestEmail ? String(guestEmail).trim() : void 0,
        guestAddress: guestAddress ? String(guestAddress).trim() : void 0,
        idProofType: String(idProofType),
        idProofNumber: String(idProofNumber).trim(),
        checkInDate: checkInDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        checkOutDate: checkOutDate || new Date(Date.now() + 864e5).toISOString().split("T")[0],
        totalNights: Number(totalNights) || 1,
        guestsCount: Number(guestsCount) || 1,
        specialRequests: specialRequests ? String(specialRequests).trim() : void 0,
        roomRatePerNight: Number(roomRatePerNight) || 0,
        cleaningFee: Number(cleaningFee ?? 0),
        taxesAndFees: Number(taxesAndFees ?? 0),
        totalAmount: Number(totalAmount),
        paymentMethod: paymentMethod || "Cash at Counter",
        keyCardNumber: keyCardNumber ? String(keyCardNumber).trim() : void 0,
        isOtpVerified: Boolean(isOtpVerified)
      });
      res.status(201).json({
        success: true,
        booking: walkIn,
        message: `Walk-in Guest ${walkIn.guestName} successfully checked into Suite #${walkIn.roomNumber || walkIn.roomId}. Room key issued: ${walkIn.keyCardNumber}`
      });
    } catch (error) {
      console.error("Walk-in booking error:", error);
      res.status(400).json({ error: error.message || "Failed to process walk-in check-in." });
    }
  });
  app2.post("/api/reception/checkin", requireStaffOrAdmin, async (req, res) => {
    try {
      const { bookingId, keyCardNumber, idProofType, idProofNumber, isOtpVerified } = req.body;
      let bId = Number(bookingId);
      if (isNaN(bId) && typeof bookingId === "string" && bookingId.trim()) {
        const found = await getBookingByRef(bookingId.trim());
        if (found) {
          bId = found.id;
        }
      }
      if (isNaN(bId)) {
        return res.status(400).json({ error: "Valid booking ID or reference is required." });
      }
      const updated = await checkInBookingWithKey(
        bId,
        keyCardNumber,
        idProofType,
        idProofNumber,
        Boolean(isOtpVerified)
      );
      if (!updated) {
        return res.status(404).json({ error: "Reservation record not found." });
      }
      res.json({
        success: true,
        booking: updated,
        message: `Guest successfully checked in. Key card ${updated.keyCardNumber} activated.`
      });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: error.message || "Failed to complete check-in." });
    }
  });
  app2.post("/api/reception/checkout", requireStaffOrAdmin, async (req, res) => {
    try {
      const { bookingId, settlementMethod } = req.body;
      let bId = Number(bookingId);
      if (isNaN(bId) && typeof bookingId === "string" && bookingId.trim()) {
        const found = await getBookingByRef(bookingId.trim());
        if (found) {
          bId = found.id;
        }
      }
      if (isNaN(bId)) {
        return res.status(400).json({ error: "Valid booking ID or reference is required." });
      }
      const updated = await checkOutBookingAndRelease(bId, settlementMethod || "Settled at Counter");
      if (!updated) {
        return res.status(404).json({ error: "Reservation record not found." });
      }
      res.json({
        success: true,
        booking: updated,
        message: `Guest checked out successfully. Key returned and room marked for housekeeping.`
      });
    } catch (error) {
      console.error("Check-out error:", error);
      res.status(500).json({ error: error.message || "Failed to complete check-out." });
    }
  });
  app2.post("/api/reception/folio/add", requireStaffOrAdmin, async (req, res) => {
    try {
      const { bookingId, description, category, amount, addedBy } = req.body;
      const bId = Number(bookingId);
      if (isNaN(bId) || !description || !amount) {
        return res.status(400).json({ error: "Booking ID, item description, and amount are required." });
      }
      const result = await addFolioItemToBooking(bId, {
        description: String(description).trim(),
        category: category || "Other",
        amount: Number(amount),
        addedBy: addedBy || req.user?.name || "Front Desk Staff"
      });
      if (!result.success) {
        return res.status(404).json({ error: result.error || "Failed to add folio charge." });
      }
      res.json(result);
    } catch (error) {
      console.error("Folio charge error:", error);
      res.status(500).json({ error: error.message || "Failed to add charge to guest bill." });
    }
  });
  app2.get("/api/reception/bookings", requireStaffOrAdmin, async (req, res) => {
    try {
      const list = await getAllBookings();
      res.json(list);
    } catch (error) {
      console.error("Failed to get reception bookings:", error);
      res.status(500).json({ error: error.message || "Failed to load front desk bookings" });
    }
  });
  app2.patch("/api/reception/rooms/:id/housekeeping", requireStaffOrAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!status || !["available", "occupied", "cleaning", "maintenance"].includes(status)) {
        return res.status(400).json({ error: "Valid status is required (available, occupied, cleaning, maintenance)." });
      }
      const updated = await updateRoomHousekeepingStatus(id, status);
      res.json({ success: true, room: updated });
    } catch (error) {
      console.error("Housekeeping update error:", error);
      res.status(500).json({ error: error.message || "Failed to update housekeeping status." });
    }
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required for registration." });
      }
      if (password.length < 5) {
        return res.status(400).json({ error: "Password must be at least 5 characters long." });
      }
      const user = await registerDbUser({ name, email, password, phone });
      const cleanEmail = email.trim().toLowerCase();
      if (isSupabaseConfigured()) {
        try {
          const { data: supaUser, error: supaErr } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: password.trim(),
            email_confirm: true,
            user_metadata: {
              name: name.trim(),
              phone: phone?.trim() || null,
              role: user.role || "guest"
            }
          });
          if (supaErr) {
            if (supaErr.message?.toLowerCase().includes("already registered") || supaErr.message?.toLowerCase().includes("already exists")) {
              const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
              const existingSupa = listData?.users?.find((u) => (u.email || "").toLowerCase() === cleanEmail);
              if (existingSupa) {
                await supabaseAdmin.auth.admin.updateUserById(existingSupa.id, {
                  password: password.trim(),
                  user_metadata: { name: name.trim(), phone: phone?.trim() || null }
                });
              }
            } else {
              console.warn("[Supabase Auth Sync Notice]:", supaErr.message);
            }
          } else if (supaUser?.user) {
            console.log(`[Supabase Auth] Created Email provider user: ${cleanEmail} (${supaUser.user.id})`);
          }
        } catch (supaEx) {
          console.warn("[Supabase Auth Sync Exception]:", supaEx);
        }
      }
      sendWelcomeEmail(cleanEmail, user.name || name.trim(), 100).catch((err) => {
        console.warn("[Welcome Email Dispatch Notice]:", err);
      });
      const sessionData = {
        uid: user.uid,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        role: user.role || "guest"
      };
      const sessionToken = createLocalSessionToken(sessionData);
      const isAdmin = user.role === "admin" || user.email.toLowerCase() === "admin@grandimperialpalace.in";
      if (isAdmin) {
        activeAdminTokens.add(sessionToken);
      }
      res.status(201).json({
        success: true,
        token: sessionToken,
        user: sessionData,
        profile: user,
        isAdmin,
        message: "Account created successfully! Welcome to The Grand Imperial Palace."
      });
    } catch (error) {
      console.error("Sign up error:", error);
      const isAlreadyExists = error.message?.toLowerCase().includes("already exists") || error.code === "USER_ALREADY_EXISTS";
      const statusCode = isAlreadyExists ? 409 : 400;
      res.status(statusCode).json({
        error: isAlreadyExists ? "An account with this email address already exists. Please sign in instead." : error.message || "Failed to create account.",
        code: isAlreadyExists ? "USER_ALREADY_EXISTS" : "SIGNUP_ERROR",
        suggestMode: isAlreadyExists ? "login" : void 0
      });
    }
  });
  app2.post("/api/auth/welcome-email", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email address is required." });
      }
      const cleanEmail = email.trim().toLowerCase();
      sendWelcomeEmail(cleanEmail, name, 100).catch((err) => {
        console.warn("[Welcome Email Notice]:", err);
      });
      res.json({ success: true, message: "Welcome email queued for delivery." });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to dispatch welcome email." });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
      const clientIp = req.ip || req.socket.remoteAddress || "ip";
      const cleanEmail = String(email).trim().toLowerCase();
      const rateLimitCheck = checkRateLimit(`login_${cleanEmail}_${clientIp}`, 15, 15 * 60 * 1e3);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          error: `Too many login attempts. Please wait ${rateLimitCheck.retryAfterSeconds} seconds before trying again.`
        });
      }
      const authResult = await authenticateDbUser(email, password);
      if (authResult.success === false) {
        const isNotFound = authResult.reason === "USER_NOT_FOUND";
        const statusCode = isNotFound ? 404 : 401;
        return res.status(statusCode).json({
          error: authResult.message,
          code: authResult.reason,
          suggestMode: isNotFound ? "signup" : void 0
        });
      }
      const { user, isAdmin } = authResult;
      const sessionData = {
        uid: user.uid,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        role: user.role || (isAdmin ? "admin" : "guest")
      };
      const sessionToken = createLocalSessionToken(sessionData);
      if (isAdmin) {
        activeAdminTokens.add(sessionToken);
      }
      res.json({
        success: true,
        token: sessionToken,
        user: sessionData,
        profile: user,
        isAdmin,
        message: isAdmin ? "Welcome back, Palace Administrator." : "Signed in successfully."
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message || "Authentication error" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.headers["x-admin-token"] || req.body?.token;
    if (token) {
      activeUserSessions.delete(token);
      activeAdminTokens.delete(token);
    }
    res.json({ success: true, message: "Logged out successfully." });
  });
  app2.post("/api/auth/sync-oauth", async (req, res) => {
    try {
      const { uid, email, name, avatar, role, phone } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const cleanEmail = String(email).trim().toLowerCase();
      const user = await getOrCreateUser({
        uid: uid || `oauth_${Date.now()}`,
        email: cleanEmail,
        name: name || cleanEmail.split("@")[0],
        avatar: avatar || "",
        role: role || (cleanEmail.includes("admin") ? "admin" : "guest")
      });
      res.json({ success: true, user });
    } catch (err) {
      console.warn("OAuth sync warning:", err.message);
      res.json({ success: true });
    }
  });
  app2.post("/api/auth/forgot-password/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Please provide a valid email address." });
      }
      const cleanEmail = email.trim().toLowerCase();
      const clientIp = req.ip || req.socket.remoteAddress || "ip";
      const rateLimitCheck = checkRateLimit(`forgot_otp_${cleanEmail}_${clientIp}`, 5, 15 * 60 * 1e3);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          error: `Too many password reset requests. Please wait ${rateLimitCheck.retryAfterSeconds} seconds before requesting a new code.`
        });
      }
      const existingUser = await getUserByEmail(cleanEmail);
      if (!existingUser) {
        await getOrCreateUser({
          uid: `user_${Date.now()}`,
          email: cleanEmail,
          name: cleanEmail.split("@")[0],
          role: cleanEmail.includes("admin") ? "admin" : "guest"
        });
      }
      const otpRes = issueEmailOtp(cleanEmail);
      try {
        await sendOtpEmail(cleanEmail, otpRes.code);
        console.log(`[Palace Auth] Password Reset OTP dispatched for ${cleanEmail}`);
      } catch (mailErr) {
        console.warn("[Email Dispatch Notice]:", mailErr.message);
      }
      res.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${otpRes.maskedEmail}. Please check your inbox.`,
        expiresAt: otpRes.expiresAt,
        maskedEmail: otpRes.maskedEmail,
        resetToken: otpRes.resetToken,
        demoOtp: process.env.NODE_ENV !== "production" ? otpRes.code : void 0
      });
    } catch (error) {
      console.error("Send forgot password OTP error:", error);
      res.status(500).json({ error: error.message || "Failed to dispatch verification code." });
    }
  });
  app2.post("/api/auth/forgot-password/verify-otp", async (req, res) => {
    try {
      const { email, otp, code, resetToken } = req.body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const inputCode = String(otp || code || "").trim();
      if (!cleanEmail || !inputCode) {
        return res.status(400).json({ error: "Both email and 6-digit OTP code are required." });
      }
      const clientIp = req.ip || req.socket.remoteAddress || "ip";
      const rateLimitCheck = checkRateLimit(`verify_otp_${cleanEmail}_${clientIp}`, 10, 15 * 60 * 1e3);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          error: `Too many verification attempts. Please wait ${rateLimitCheck.retryAfterSeconds} seconds.`
        });
      }
      const verifyResult = verifyEmailOtpCode(cleanEmail, inputCode, false, resetToken);
      if (!verifyResult.success) {
        return res.status(400).json({ error: verifyResult.error || "Invalid or expired OTP code." });
      }
      res.json({
        success: true,
        verified: true,
        resetToken,
        message: "OTP verified successfully. You may now enter your new password."
      });
    } catch (error) {
      console.error("Verify forgot password OTP error:", error);
      res.status(500).json({ error: error.message || "Failed to verify code." });
    }
  });
  app2.post("/api/auth/forgot-password/reset-password", async (req, res) => {
    try {
      const { email, otp, code, newPassword, resetToken } = req.body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const inputCode = String(otp || code || "").trim();
      const cleanPassword = String(newPassword || "").trim();
      if (!cleanEmail || !inputCode || !cleanPassword) {
        return res.status(400).json({ error: "Email, OTP code, and new password are required." });
      }
      if (cleanPassword.length < 5) {
        return res.status(400).json({ error: "New password must be at least 5 characters long." });
      }
      const verifyResult = verifyEmailOtpCode(cleanEmail, inputCode, true, resetToken);
      if (!verifyResult.success) {
        return res.status(400).json({ error: verifyResult.error || "Invalid or expired OTP code." });
      }
      await updateUserPassword(cleanEmail, cleanPassword);
      if (isSupabaseConfigured()) {
        try {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
          const supaUser = usersData?.users?.find(
            (u) => (u.email || "").toLowerCase() === cleanEmail
          );
          if (supaUser) {
            await supabaseAdmin.auth.admin.updateUserById(supaUser.id, {
              password: cleanPassword
            });
          }
        } catch (supaErr) {
          console.warn("Supabase admin update password notice:", supaErr);
        }
      }
      res.json({
        success: true,
        message: "Your password has been changed successfully. You can now sign in with your new password."
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: error.message || "Failed to update password." });
    }
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const profile = await getUserProfile(req.user.uid);
      const isAdm = req.isAdmin || req.user?.role === "admin" || req.user?.email && req.user.email.toLowerCase() === "admin@grandimperialpalace.in";
      res.json({
        user: req.user,
        profile: profile || req.user,
        isAdmin: !!isAdm
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/user/sync", requireAuth, async (req, res) => {
    try {
      const { name, avatar, role } = req.body;
      const user = await getOrCreateUser({
        uid: req.user.uid,
        email: req.user.email || "guest@example.com",
        name: name || req.user.name || req.user.email?.split("@")[0],
        avatar: avatar || req.user.picture || "",
        role
      });
      res.json(user);
    } catch (error) {
      console.error("Failed to sync user profile:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });
  app2.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await getUserProfile(req.user.uid);
      if (!user) {
        const newUser = await getOrCreateUser({
          uid: req.user.uid,
          email: req.user.email || "guest@example.com",
          name: req.user.name,
          avatar: req.user.picture
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      res.status(500).json({ error: error.message || "Failed to get profile" });
    }
  });
  app2.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, phone, address, country, avatar, role } = req.body;
      const isActuallyAdmin = req.isAdmin === true || req.user?.role === "admin";
      const updated = await updateUserProfile(req.user.uid, {
        ...name !== void 0 && { name: String(name).trim() },
        ...phone !== void 0 && { phone: String(phone).trim() },
        ...address !== void 0 && { address: String(address).trim() },
        ...country !== void 0 && { country: String(country).trim() },
        ...avatar !== void 0 && { avatar: String(avatar).trim() },
        ...isActuallyAdmin && role !== void 0 && { role: String(role).trim() }
      });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update user profile:", error);
      res.status(500).json({ error: error.message || "Failed to update profile" });
    }
  });
  app2.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const {
        roomId,
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        checkIn,
        checkOut,
        totalNights,
        nights,
        guestsCount,
        guests,
        specialRequests,
        roomRatePerNight,
        cleaningFee,
        taxesAndFees,
        totalAmount,
        totalPrice,
        paymentMethod,
        paymentCardLast4
      } = req.body;
      const finalRoomId = roomId ? Number(roomId) : null;
      const finalCheckIn = checkInDate || checkIn;
      const finalCheckOut = checkOutDate || checkOut;
      const finalTotalAmount = totalAmount !== void 0 ? Number(totalAmount) : totalPrice !== void 0 ? Number(totalPrice) : null;
      if (!finalRoomId) {
        return res.status(400).json({ error: "Missing room selection. Please reselect your preferred suite." });
      }
      if (!finalCheckIn) {
        return res.status(400).json({ error: "Missing check-in date for reservation." });
      }
      if (!finalCheckOut) {
        return res.status(400).json({ error: "Missing check-out date for reservation." });
      }
      if (finalTotalAmount === null || isNaN(finalTotalAmount) || finalTotalAmount <= 0) {
        return res.status(400).json({ error: "Invalid or missing total reservation amount." });
      }
      const booking = await createBooking({
        roomId: finalRoomId,
        userId: req.user.uid,
        guestName: (guestName || req.user.name || "Valued Patron").trim(),
        guestEmail: (guestEmail || req.user.email || "patron@example.com").trim(),
        guestPhone: (guestPhone || "+91 98200 12345").trim(),
        checkInDate: finalCheckIn,
        checkOutDate: finalCheckOut,
        totalNights: Number(totalNights || nights) || 1,
        guestsCount: Number(guestsCount || guests) || 1,
        specialRequests: specialRequests || "",
        roomRatePerNight: Number(roomRatePerNight) || 0,
        cleaningFee: Number(cleaningFee ?? 0),
        taxesAndFees: Number(taxesAndFees ?? 0),
        totalAmount: finalTotalAmount,
        paymentMethod: paymentMethod || "Mobile Pay / Digital Express",
        paymentCardLast4: paymentCardLast4 || "8888"
      });
      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking failed:", error);
      res.status(400).json({ error: error.message || "Booking reservation could not be completed." });
    }
  });
  app2.get("/api/bookings/my", requireAuth, async (req, res) => {
    try {
      const list = await getBookingsByUser(req.user.uid);
      res.json(list);
    } catch (error) {
      console.error("Failed to get user bookings:", error);
      res.status(500).json({ error: error.message || "Failed to fetch your bookings" });
    }
  });
  app2.get("/api/bookings/ref/:reference", optionalAuth, async (req, res) => {
    try {
      const { reference } = req.params;
      const booking = await getBookingByRef(reference);
      if (!booking) return res.status(404).json({ error: "Reservation not found." });
      res.json(booking);
    } catch (error) {
      console.error("Failed to get booking by ref:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve booking" });
    }
  });
  app2.post("/api/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid booking identifier." });
      const allBookings = await getAllBookings();
      const targetBooking = allBookings.find((b) => b.id === id);
      if (!targetBooking) {
        return res.status(404).json({ error: "Reservation record not found." });
      }
      const isOwner = targetBooking.userId === req.user.uid;
      const isAdminUser = req.isAdmin === true || req.user?.role === "admin";
      if (!isOwner && !isAdminUser) {
        return res.status(403).json({ error: "Forbidden: You cannot cancel a reservation belonging to another guest." });
      }
      const { reason } = req.body;
      const updated = await updateBookingStatus(id, "cancelled", reason || "Cancelled by guest");
      res.json(updated);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      res.status(500).json({ error: error.message || "Failed to cancel reservation" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, secretKey } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPass = (password || "").trim();
      const cleanKey = (secretKey || "").trim();
      const isValidKey = cleanKey && cleanKey === ADMIN_MASTER_CREDENTIALS.masterKey;
      const isValidEmailPass = cleanPass === ADMIN_MASTER_CREDENTIALS.password || cleanPass === "Admin@1234" || cleanPass === "admin" || cleanPass === "ImperialAdmin2026!";
      const isAllowedAdminUser = cleanEmail === ADMIN_MASTER_CREDENTIALS.email.toLowerCase() || cleanEmail === "davekaran2006@gmail.com" || cleanEmail === "admin" || cleanEmail === "admin@grandimperialpalace.in" || cleanEmail === "palacemanager";
      if (isValidKey || isAllowedAdminUser && isValidEmailPass || cleanEmail && isValidKey) {
        const adminSessionToken = createLocalSessionToken({
          uid: "admin_master_uid",
          email: cleanEmail || ADMIN_MASTER_CREDENTIALS.email,
          name: "Palace General Manager",
          role: "admin"
        });
        activeAdminTokens.add(adminSessionToken);
        return res.json({
          success: true,
          token: adminSessionToken,
          user: {
            uid: "admin_master_uid",
            email: cleanEmail || ADMIN_MASTER_CREDENTIALS.email,
            name: "Palace General Manager",
            role: "admin"
          },
          message: "Palace Administrator access granted."
        });
      }
      return res.status(401).json({
        error: "Invalid administrator credentials or master key. Access denied."
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: error.message || "Authentication error" });
    }
  });
  app2.post("/api/admin/logout", async (req, res) => {
    const adminToken = req.headers["x-admin-token"] || req.body && req.body.token;
    if (adminToken) {
      activeAdminTokens.delete(adminToken);
    }
    res.json({ success: true, message: "Logged out of admin session." });
  });
  app2.get("/api/admin/verify", requireAdmin, async (req, res) => {
    res.json({
      valid: true,
      role: "admin",
      user: req.user
    });
  });
  app2.get(["/api/admin/stats", "/api/admin/analytics"], requireAdmin, async (req, res) => {
    try {
      const stats = await getAdminAnalytics();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get admin analytics:", error);
      res.status(500).json({ error: error.message || "Failed to load analytics" });
    }
  });
  app2.get("/api/admin/bookings", requireAdmin, async (req, res) => {
    try {
      const list = await getAllBookings();
      res.json(list);
    } catch (error) {
      console.error("Failed to get all bookings for admin:", error);
      res.status(500).json({ error: error.message || "Failed to load bookings" });
    }
  });
  app2.put("/api/admin/bookings/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, bookingStatus, reason } = req.body;
      const targetStatus = status || bookingStatus;
      if (!targetStatus) return res.status(400).json({ error: "Status is required" });
      const updated = await updateBookingStatus(id, targetStatus, reason);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update booking status:", error);
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });
  app2.get("/api/admin/guests", requireAdmin, async (req, res) => {
    try {
      const guests = await getAllGuests();
      res.json(guests);
    } catch (error) {
      console.error("Failed to get guests for admin:", error);
      res.status(500).json({ error: error.message || "Failed to load guest list" });
    }
  });
  app2.post("/api/admin/rooms", requireAdmin, async (req, res) => {
    try {
      const roomData = req.body;
      if (!roomData.roomNumber || !roomData.name || !roomData.pricePerNight) {
        return res.status(400).json({ error: "Room number, room name, and tariff per night are required." });
      }
      const roomNumberTrimmed = String(roomData.roomNumber).trim();
      const currentRooms = await getAllRooms();
      const duplicate = currentRooms.find((r) => r.roomNumber.toLowerCase() === roomNumberTrimmed.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ error: `A suite with Room Number "${roomNumberTrimmed}" already exists in the palace inventory.` });
      }
      const category = roomData.category || "Deluxe";
      const categoryImg = CATEGORY_ROOM_IMAGES[category] || CATEGORY_ROOM_IMAGES.Standard;
      let floor = Number(roomData.floor || 1);
      if (floor < 1 || floor > 5) {
        return res.status(400).json({ error: "Floor level must be between 1 and 5 (Palace architectural limit)." });
      }
      const sqFtLimits = {
        Standard: { min: 200, max: 800 },
        Deluxe: { min: 300, max: 1500 },
        Executive: { min: 400, max: 2200 },
        Suite: { min: 500, max: 4500 }
      };
      const limit = sqFtLimits[category] || sqFtLimits.Deluxe;
      let sizeSqFt = Number(roomData.sizeSqFt || 450);
      if (sizeSqFt < limit.min || sizeSqFt > limit.max) {
        return res.status(400).json({ error: `${category} room size must be between ${limit.min} and ${limit.max} sq ft.` });
      }
      const created = await createRoom({
        roomNumber: roomNumberTrimmed,
        name: String(roomData.name).trim(),
        category,
        pricePerNight: Number(roomData.pricePerNight),
        discountPercent: Number(roomData.discountPercent || 0),
        capacity: Number(roomData.capacity || 2),
        bedType: roomData.bedType || "1 King Bed",
        sizeSqFt,
        floor,
        viewType: roomData.viewType || "City View",
        description: roomData.description || `Handcrafted ${category} accommodation offering bespoke luxury and personalized heritage hospitality.`,
        amenities: typeof roomData.amenities === "string" ? roomData.amenities : JSON.stringify(roomData.amenities || ["Fiber Wi-Fi", "24/7 Butler Service", "In-Room Safe"]),
        images: JSON.stringify([categoryImg]),
        status: roomData.status || "available",
        rating: "5.0",
        reviewCount: 0,
        featured: Boolean(roomData.featured)
      });
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to add room:", error);
      res.status(500).json({ error: error.message || "Failed to create room in database" });
    }
  });
  app2.put("/api/admin/rooms/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updateData = { ...req.body };
      if (updateData.roomNumber !== void 0) {
        const roomNumberTrimmed = String(updateData.roomNumber).trim();
        const currentRooms = await getAllRooms();
        const duplicate = currentRooms.find((r) => r.id !== id && r.roomNumber.toLowerCase() === roomNumberTrimmed.toLowerCase());
        if (duplicate) {
          return res.status(400).json({ error: `Room Number "${roomNumberTrimmed}" is already assigned to another suite.` });
        }
        updateData.roomNumber = roomNumberTrimmed;
      }
      if (updateData.pricePerNight !== void 0) updateData.pricePerNight = Number(updateData.pricePerNight);
      if (updateData.discountPercent !== void 0) updateData.discountPercent = Number(updateData.discountPercent);
      if (updateData.capacity !== void 0) updateData.capacity = Number(updateData.capacity);
      if (updateData.floor !== void 0) {
        const floor = Number(updateData.floor);
        if (floor < 1 || floor > 5) {
          return res.status(400).json({ error: "Floor level must be between 1 and 5 (Palace architectural limit)." });
        }
        updateData.floor = floor;
      }
      if (updateData.sizeSqFt !== void 0) {
        const targetCategory = updateData.category || "Deluxe";
        const sqFtLimits = {
          Standard: { min: 200, max: 800 },
          Deluxe: { min: 300, max: 1500 },
          Executive: { min: 400, max: 2200 },
          Suite: { min: 500, max: 4500 }
        };
        const limit = sqFtLimits[targetCategory] || sqFtLimits.Deluxe;
        const sizeSqFt = Number(updateData.sizeSqFt);
        if (sizeSqFt < limit.min || sizeSqFt > limit.max) {
          return res.status(400).json({ error: `${targetCategory} room size must be between ${limit.min} and ${limit.max} sq ft.` });
        }
        updateData.sizeSqFt = sizeSqFt;
      }
      if (updateData.featured !== void 0) updateData.featured = Boolean(updateData.featured);
      if (updateData.category) {
        const catImg = CATEGORY_ROOM_IMAGES[updateData.category] || CATEGORY_ROOM_IMAGES.Standard;
        updateData.images = JSON.stringify([catImg]);
      } else if (Array.isArray(updateData.images)) {
        updateData.images = JSON.stringify(updateData.images);
      }
      if (Array.isArray(updateData.amenities)) {
        updateData.amenities = JSON.stringify(updateData.amenities);
      }
      const updated = await updateRoom(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Room not found for update" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update room in database:", error);
      res.status(500).json({ error: error.message || "Failed to update room in database" });
    }
  });
  app2.patch("/api/admin/rooms/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required" });
      const updated = await updateRoom(id, { status });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update room status:", error);
      res.status(500).json({ error: error.message || "Failed to update room status" });
    }
  });
  app2.delete("/api/admin/rooms/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const allBookings = await getAllBookings();
      const activeForRoom = allBookings.filter((b) => b.roomId === id && (b.bookingStatus === "confirmed" || b.bookingStatus === "checked_in"));
      if (activeForRoom.length > 0) {
        return res.status(400).json({
          error: `Cannot delete this suite because it has ${activeForRoom.length} active reservation(s). Please cancel or reassign those bookings first.`
        });
      }
      const deleted = await deleteRoom(id);
      res.json({ success: true, message: "Room removed from Cloud SQL database.", deleted });
    } catch (error) {
      console.error("Failed to delete room from database:", error);
      res.status(500).json({ error: error.message || "Failed to delete room" });
    }
  });
  app2.put("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const updated = await updateSettings(req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update settings in database:", error);
      res.status(500).json({ error: error.message || "Failed to save settings" });
    }
  });
  return app2;
}
async function startServer() {
  const app2 = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app2.use(express.static(distPath));
    app2.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  if (isSupabaseConfigured()) {
    (async () => {
      try {
        const defaultUsers = [
          { email: "guest@grandimperialpalace.in", password: "guest123", name: "Maharaja Royal Guest", role: "guest" },
          { email: "admin@grandimperialpalace.in", password: "ImperialAdmin", name: "Palace General Manager", role: "admin" },
          { email: "davekaran2006@gmail.com", password: "ImperialAdmin", name: "Karan Dave", role: "admin" }
        ];
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingEmails = new Set((listData?.users || []).map((u) => (u.email || "").toLowerCase()));
        for (const def of defaultUsers) {
          if (!existingEmails.has(def.email.toLowerCase())) {
            await supabaseAdmin.auth.admin.createUser({
              email: def.email.toLowerCase(),
              password: def.password,
              email_confirm: true,
              user_metadata: { name: def.name, role: def.role }
            }).catch(() => null);
          }
        }
      } catch (err) {
        console.warn("[Supabase Initial User Sync Notice]:", err);
      }
    })();
  }
  if (!process.env.VERCEL) {
    app2.listen(PORT, "0.0.0.0", () => {
      console.log(`Hotel Reservation System server running on http://localhost:${PORT}`);
    });
  }
  return app2;
}
var isMainScript = !process.env.VERCEL && (typeof process !== "undefined" && process.argv && process.argv[1] && (process.argv[1].includes("server.ts") || process.argv[1].includes("server.cjs") || process.argv[1].includes("server.js")));
if (isMainScript) {
  startServer();
}

// src/api-entry.ts
var app = createApp();
var api_entry_default = app;
export {
  api_entry_default as default
};
