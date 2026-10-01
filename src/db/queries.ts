import { db } from './index.ts';
import { users, rooms, bookings, reviews, settings } from './schema.ts';
import { eq, ne, desc, and, or, sql, gte, lte, ilike, inArray } from 'drizzle-orm';

// Category-consistent curated hotel room images (one single distinct image per room type)
export const CATEGORY_ROOM_IMAGES: Record<string, string> = {
  Standard: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  Deluxe: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  Executive: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  Suite: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
};

const STANDARD_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Standard]);
const DELUXE_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Deluxe]);
const EXECUTIVE_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Executive]);
const SUITE_IMAGES = JSON.stringify([CATEGORY_ROOM_IMAGES.Suite]);

// 34 Clean Hotel Rooms across Standard, Deluxe, Executive, Suite
const SEED_ROOMS = [
  // --- FLOOR 1 (Standard & Deluxe) ---
  {
    roomNumber: '101',
    name: 'Classic Heritage Queen Room',
    category: 'Standard',
    pricePerNight: 3500,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 Queen Bed',
    sizeSqFt: 380,
    floor: 1,
    viewType: 'Courtyard Garden View',
    description: 'Elegantly appointed standard room with bespoke teakwood furnishings, fine cotton linens, dedicated work desk, and a modern rain shower.',
    amenities: JSON.stringify(['High-Speed Fiber Wi-Fi', 'Work Desk & Ergonomic Chair', 'Rainfall Walk-in Shower', 'Electric Kettle & Tea Bar', '43-inch Smart 4K TV', 'Electronic In-room Safe', 'Plush Bathrobes']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.8',
    reviewCount: 84,
    featured: false,
  },
  {
    roomNumber: '102',
    name: 'Standard Twin Heritage Room',
    category: 'Standard',
    pricePerNight: 3500,
    discountPercent: 0,
    capacity: 2,
    bedType: '2 Single Beds',
    sizeSqFt: 380,
    floor: 1,
    viewType: 'Quiet Inner Courtyard',
    description: 'Twin-bedded room with traditional Indian wood accents, soundproof windows, luxury bedding, and pristine ensuite bathroom.',
    amenities: JSON.stringify(['High-Speed Fiber Wi-Fi', 'Dual Single Beds', 'Rainfall Shower', 'Coffee & Tea Maker', 'Smart LED TV', 'In-room Safe']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.7',
    reviewCount: 52,
    featured: false,
  },
  {
    roomNumber: '103',
    name: 'Classic Cozy Single Room',
    category: 'Standard',
    pricePerNight: 3200,
    discountPercent: 0,
    capacity: 1,
    bedType: '1 Queen Bed',
    sizeSqFt: 320,
    floor: 1,
    viewType: 'City Garden View',
    description: 'Thoughtfully designed room for solo executives and travelers, featuring premium mattress, work desk, and high-speed internet.',
    amenities: JSON.stringify(['Fiber Wi-Fi', 'Work Desk', 'Rain Shower', 'Complimentary Bottled Water', 'Digital Safe', 'Smart TV']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.8',
    reviewCount: 41,
    featured: false,
  },
  {
    roomNumber: '104',
    name: 'Standard King Courtyard Room',
    category: 'Standard',
    pricePerNight: 3800,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 400,
    floor: 1,
    viewType: 'Palace Courtyard View',
    description: 'Generously proportioned standard room with plush king-sized bed, ambient warm lighting, and luxury bathroom amenities.',
    amenities: JSON.stringify(['High-Speed Wi-Fi', 'King Bed', 'Rain Shower', 'Smart 4K TV', 'Tea & Coffee Maker', 'Daily Housekeeping']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.75',
    reviewCount: 63,
    featured: false,
  },
  {
    roomNumber: '105',
    name: 'Classic Garden Twin Room',
    category: 'Standard',
    pricePerNight: 3600,
    discountPercent: 0,
    capacity: 2,
    bedType: '2 Single Beds',
    sizeSqFt: 390,
    floor: 1,
    viewType: 'Botanical Garden View',
    description: 'Peaceful garden retreat with twin beds, cozy seating nook, minibar, and modern rainfall shower.',
    amenities: JSON.stringify(['High-Speed Wi-Fi', 'Garden View', 'Tea/Coffee Bar', 'Smart TV', 'In-room Safe', 'Air Conditioning']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.8',
    reviewCount: 38,
    featured: false,
  },
  {
    roomNumber: '106',
    name: 'Standard Executive King',
    category: 'Standard',
    pricePerNight: 3900,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 410,
    floor: 1,
    viewType: 'City Skyline View',
    description: 'Quiet and sophisticated retreat featuring soundproof double-glazed windows, premium orthopedic mattress, and ergonomic workspace.',
    amenities: JSON.stringify(['Fiber Wi-Fi', 'Orthopedic King Bed', 'Ergonomic Work Desk', 'Rain Shower', '43-inch Smart TV', 'Digital Safe']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.82',
    reviewCount: 49,
    featured: false,
  },
  {
    roomNumber: '107',
    name: 'Classic Superior Queen',
    category: 'Standard',
    pricePerNight: 3700,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 Queen Bed',
    sizeSqFt: 385,
    floor: 1,
    viewType: 'Courtyard View',
    description: 'Warm, welcoming room with handcrafted Indian wooden finishes, plush queen bed, and modern walk-in shower.',
    amenities: JSON.stringify(['High-Speed Wi-Fi', 'Queen Bed', 'Walk-in Shower', 'Smart TV', 'Tea & Coffee Bar', 'Bathrobes']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.76',
    reviewCount: 34,
    featured: false,
  },
  {
    roomNumber: '108',
    name: 'Deluxe Poolside King Room',
    category: 'Deluxe',
    pricePerNight: 5800,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 520,
    floor: 1,
    viewType: 'Direct Pool & Garden View',
    description: 'Spacious garden-facing retreat featuring a private patio opening towards the azure swimming pool, plush velvet armchairs, and marble bath.',
    amenities: JSON.stringify(['Private Poolside Patio', 'Complimentary Breakfast', 'High-Speed Fiber Wi-Fi', 'Nespresso Coffee Machine', 'Italian Marble Bathroom', '50-inch OLED TV', '24-hour Dining']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.92',
    reviewCount: 128,
    featured: true,
  },

  // --- FLOOR 2 (Standard & Deluxe) ---
  {
    roomNumber: '201',
    name: 'Standard Heritage King Room',
    category: 'Standard',
    pricePerNight: 3800,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 400,
    floor: 2,
    viewType: 'Historic Promenade View',
    description: 'Comfortable second-floor room overlooking the promenade with plush king bedding, tea station, and polished wooden flooring.',
    amenities: JSON.stringify(['Fiber Wi-Fi', 'King Bed', 'Rain Shower', 'Smart TV', 'In-room Safe', 'Room Service']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.8',
    reviewCount: 45,
    featured: false,
  },
  {
    roomNumber: '202',
    name: 'Standard Heritage Twin Room',
    category: 'Standard',
    pricePerNight: 3600,
    discountPercent: 0,
    capacity: 2,
    bedType: '2 Single Beds',
    sizeSqFt: 390,
    floor: 2,
    viewType: 'City View',
    description: 'Contemporary standard room with twin beds, crisp percale linens, high-speed WiFi, and deluxe toiletries.',
    amenities: JSON.stringify(['Wi-Fi', 'Twin Beds', 'Shower', 'Smart TV', 'Tea Maker', 'Daily Housekeeping']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.72',
    reviewCount: 31,
    featured: false,
  },
  {
    roomNumber: '203',
    name: 'Standard Superior King',
    category: 'Standard',
    pricePerNight: 3900,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 410,
    floor: 2,
    viewType: 'Courtyard Palm View',
    description: 'Serene second-floor haven with king bed, views of towering palms, smart television, and luxury bath amenities.',
    amenities: JSON.stringify(['Fiber Wi-Fi', 'King Bed', 'Rain Shower', 'Smart TV', 'Tea & Coffee Maker', 'Safe']),
    images: STANDARD_IMAGES,
    status: 'available',
    rating: '4.78',
    reviewCount: 29,
    featured: false,
  },
  {
    roomNumber: '204',
    name: 'Deluxe King Heritage Room',
    category: 'Deluxe',
    pricePerNight: 5500,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 490,
    floor: 2,
    viewType: 'Colaba Heritage Bay View',
    description: 'Graceful deluxe room with plush king bed, marble vanity, handcrafted armchairs, and complimentary buffet breakfast.',
    amenities: JSON.stringify(['High-Speed Wi-Fi', 'Complimentary Buffet Breakfast', 'King Bed', 'Marble Bathroom', '50-inch Smart TV', 'Mini Refrigerator']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.88',
    reviewCount: 77,
    featured: true,
  },
  {
    roomNumber: '205',
    name: 'Deluxe Twin Heritage Room',
    category: 'Deluxe',
    pricePerNight: 5400,
    discountPercent: 0,
    capacity: 3,
    bedType: '2 Queen Beds',
    sizeSqFt: 480,
    floor: 2,
    viewType: 'Heritage Courtyard View',
    description: 'Warm timber aesthetics, rich Indian handloom textiles, dual plush queen beds, and an expansive marble vanity bathroom.',
    amenities: JSON.stringify(['Dual Queen Beds', 'High-Speed Wi-Fi', 'Complimentary Breakfast', 'Smart TV with OTT Apps', 'Marble Bathroom with Tub', 'Tea & Coffee Maker']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.85',
    reviewCount: 61,
    featured: false,
  },
  {
    roomNumber: '206',
    name: 'Deluxe Ocean Breeze King',
    category: 'Deluxe',
    pricePerNight: 6200,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 530,
    floor: 2,
    viewType: 'Partial Arabian Sea View',
    description: 'Deluxe ocean-facing room filled with gentle sea breezes, private seating corner, deep soaking marble tub, and luxury bathrobes.',
    amenities: JSON.stringify(['Ocean View', 'Marble Soaking Tub', 'Complimentary Breakfast', 'High-Speed Wi-Fi', 'Nespresso Machine', 'Smart TV']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.9',
    reviewCount: 92,
    featured: true,
  },
  {
    roomNumber: '207',
    name: 'Deluxe Family King Room',
    category: 'Deluxe',
    pricePerNight: 6500,
    discountPercent: 0,
    capacity: 3,
    bedType: '1 King Bed + 1 Rollaway',
    sizeSqFt: 550,
    floor: 2,
    viewType: 'Palace Gardens View',
    description: 'Expansive family room accommodating up to 3 guests, with comfortable sofa lounge, large marble bath, and complimentary breakfast.',
    amenities: JSON.stringify(['Family Space', 'Complimentary Breakfast', 'Marble Bath', 'Smart TV', 'Mini Bar', 'Fiber Wi-Fi']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.86',
    reviewCount: 54,
    featured: false,
  },
  {
    roomNumber: '208',
    name: 'Deluxe Garden Balcony Room',
    category: 'Deluxe',
    pricePerNight: 6000,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 510,
    floor: 2,
    viewType: 'Private Garden Balcony',
    description: 'Deluxe room with a charming private balcony overlooking manicured royal gardens, outdoor seating, and luxury amenities.',
    amenities: JSON.stringify(['Private Balcony', 'Complimentary Breakfast', 'King Bed', 'Marble Rain Shower', 'Smart 4K TV', 'Wi-Fi']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.89',
    reviewCount: 68,
    featured: false,
  },

  // --- FLOOR 3 (Deluxe & Executive) ---
  {
    roomNumber: '301',
    name: 'Deluxe Grand King Room',
    category: 'Deluxe',
    pricePerNight: 6200,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 520,
    floor: 3,
    viewType: 'City Skyline & Sea View',
    description: 'High-floor deluxe king room with floor-to-ceiling windows, city skyline views, marble bathroom, and complimentary breakfast.',
    amenities: JSON.stringify(['Skyline View', 'Complimentary Breakfast', 'King Bed', 'Marble Vanity', '50-inch Smart TV', 'Wi-Fi']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.87',
    reviewCount: 47,
    featured: false,
  },
  {
    roomNumber: '302',
    name: 'Deluxe Premium Twin Room',
    category: 'Deluxe',
    pricePerNight: 5800,
    discountPercent: 0,
    capacity: 2,
    bedType: '2 Queen Beds',
    sizeSqFt: 500,
    floor: 3,
    viewType: 'Garden View',
    description: 'Premium twin room with dual queen beds, custom mahogany furnishings, rain shower, and evening turndown service.',
    amenities: JSON.stringify(['Dual Queen Beds', 'Complimentary Breakfast', 'Rain Shower', 'Smart TV', 'High-Speed Wi-Fi']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.82',
    reviewCount: 39,
    featured: false,
  },
  {
    roomNumber: '303',
    name: 'Deluxe Panoramic King',
    category: 'Deluxe',
    pricePerNight: 6400,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 540,
    floor: 3,
    viewType: 'Bay Panoramic View',
    description: 'Corner deluxe suite room with wrap-around bay windows, deep soaking bathtub, king bed, and complimentary gourmet breakfast.',
    amenities: JSON.stringify(['Corner Panoramic View', 'Soaking Bathtub', 'Complimentary Breakfast', 'Nespresso Coffee', 'Wi-Fi']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.91',
    reviewCount: 65,
    featured: true,
  },
  {
    roomNumber: '304',
    name: 'Deluxe Executive King',
    category: 'Deluxe',
    pricePerNight: 6600,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 550,
    floor: 3,
    viewType: 'Promenade View',
    description: 'Spacious deluxe room with dedicated executive workspace, high-speed fiber internet, and luxury marble bathroom.',
    amenities: JSON.stringify(['Executive Desk', 'Complimentary Breakfast', 'King Bed', 'Marble Bath', 'Smart TV', 'Fiber Wi-Fi']),
    images: DELUXE_IMAGES,
    status: 'available',
    rating: '4.88',
    reviewCount: 42,
    featured: false,
  },
  {
    roomNumber: '305',
    name: 'Executive Club Room',
    category: 'Executive',
    pricePerNight: 8500,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 620,
    floor: 3,
    viewType: 'Arabian Sea View',
    description: 'Premier executive accommodation offering Club Lounge access, evening cocktails, bespoke concierge, and sea views.',
    amenities: JSON.stringify(['Club Lounge Access', 'Complimentary Evening Cocktails', 'Gourmet Breakfast', 'High-Speed Wi-Fi', 'Marble Bath', 'Smart 4K TV']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.93',
    reviewCount: 88,
    featured: true,
  },
  {
    roomNumber: '306',
    name: 'Executive Bay View Suite Room',
    category: 'Executive',
    pricePerNight: 8900,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 650,
    floor: 3,
    viewType: 'Panoramic Bay View',
    description: 'Luxury executive room with panoramic bay views, private lounge sitting area, walk-in closet, and premium sound system.',
    amenities: JSON.stringify(['Club Lounge Privileges', 'Panoramic Sea View', 'Walk-in Dressing Room', 'Harman Kardon Audio', 'Gourmet Breakfast']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.95',
    reviewCount: 96,
    featured: true,
  },
  {
    roomNumber: '307',
    name: 'Executive Twin Club Room',
    category: 'Executive',
    pricePerNight: 8500,
    discountPercent: 0,
    capacity: 2,
    bedType: '2 Queen Beds',
    sizeSqFt: 630,
    floor: 3,
    viewType: 'City Skyline View',
    description: 'Executive club room with dual plush queen beds, Club Lounge access, daily high tea, and marble bathroom with tub.',
    amenities: JSON.stringify(['Club Lounge Access', 'Dual Queen Beds', 'Complimentary High Tea', 'Marble Bathtub', 'Fiber Wi-Fi']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.89',
    reviewCount: 44,
    featured: false,
  },
  {
    roomNumber: '308',
    name: 'Executive Corner King Suite',
    category: 'Executive',
    pricePerNight: 9200,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 680,
    floor: 3,
    viewType: 'Sunset Sea & Skyline View',
    description: 'Premier corner suite room with sunset sea views, spacious sofa lounge, complimentary airport transfers, and Club Lounge access.',
    amenities: JSON.stringify(['Airport Chauffeur Transfer', 'Club Lounge Access', 'Sunset Sea View', 'Nespresso Machine', 'Deep Soaking Tub']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.96',
    reviewCount: 112,
    featured: true,
  },

  // --- FLOOR 4 (Executive & Suite) ---
  {
    roomNumber: '401',
    name: 'Executive Premier King',
    category: 'Executive',
    pricePerNight: 9500,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 690,
    floor: 4,
    viewType: 'Arabian Sea Front',
    description: 'Direct sea-facing executive haven on the 4th floor, with private check-in, Club Lounge dining, and luxury bath amenities.',
    amenities: JSON.stringify(['Direct Sea View', 'Club Lounge Access', 'Private Check-in', 'Marble Rain Shower', 'Complimentary Breakfast']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.94',
    reviewCount: 79,
    featured: true,
  },
  {
    roomNumber: '402',
    name: 'Executive Business King Room',
    category: 'Executive',
    pricePerNight: 9000,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 660,
    floor: 4,
    viewType: 'Skyline View',
    description: 'Designed for corporate leaders, featuring soundproof workspace, high-speed WiFi, conference room access, and Club Lounge.',
    amenities: JSON.stringify(['Conference Room Access', 'Club Lounge Access', 'Fiber 200Mbps Wi-Fi', 'Gourmet Breakfast', 'Smart 4K TV']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.91',
    reviewCount: 58,
    featured: false,
  },
  {
    roomNumber: '403',
    name: 'Executive Royal Twin',
    category: 'Executive',
    pricePerNight: 8800,
    discountPercent: 0,
    capacity: 3,
    bedType: '2 Queen Beds',
    sizeSqFt: 670,
    floor: 4,
    viewType: 'Bay & Garden View',
    description: 'Spacious executive room with two queen beds, elegant sitting salon, Club Lounge privileges, and daily high tea.',
    amenities: JSON.stringify(['Club Lounge Access', 'Dual Queen Beds', 'Marble Soaking Tub', 'Daily High Tea', 'High-Speed Wi-Fi']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.9',
    reviewCount: 46,
    featured: false,
  },
  {
    roomNumber: '404',
    name: 'Executive Luxury King',
    category: 'Executive',
    pricePerNight: 9800,
    discountPercent: 0,
    capacity: 2,
    bedType: '1 King Bed',
    sizeSqFt: 710,
    floor: 4,
    viewType: 'Full Arabian Sea View',
    description: 'Exquisite 4th floor sea-facing room with king bed, marble vanity with dual sinks, soaking tub, and VIP butler on call.',
    amenities: JSON.stringify(['Full Sea View', 'VIP Butler on Call', 'Club Lounge Access', 'Dual Marble Sinks', 'Nespresso Coffee']),
    images: EXECUTIVE_IMAGES,
    status: 'available',
    rating: '4.97',
    reviewCount: 83,
    featured: true,
  },
  {
    roomNumber: '405',
    name: 'Junior Heritage Suite',
    category: 'Suite',
    pricePerNight: 12500,
    discountPercent: 0,
    capacity: 3,
    bedType: '1 King Bed + 1 Daybed',
    sizeSqFt: 850,
    floor: 4,
    viewType: 'Palace Gardens & Sea View',
    description: 'Charming suite featuring a separate living parlor, hand-carved jharokha bay seating, luxury marble bathroom, and 24/7 butler service.',
    amenities: JSON.stringify(['Separate Living Parlor', '24/7 Butler Service', 'Jharokha Bay Seating', 'Freestanding Bathtub', 'Complimentary High Tea', 'Gourmet Breakfast']),
    images: SUITE_IMAGES,
    status: 'available',
    rating: '4.96',
    reviewCount: 71,
    featured: true,
  },
  {
    roomNumber: '406',
    name: 'Grand Sea View Suite',
    category: 'Suite',
    pricePerNight: 14000,
    discountPercent: 0,
    capacity: 3,
    bedType: '1 King Bed',
    sizeSqFt: 920,
    floor: 4,
    viewType: '180° Arabian Sea Panoramas',
    description: 'Magnificent sea-facing suite with expansive living salon, dining table for four, walk-in dressing room, and luxury bath with sea view tub.',
    amenities: JSON.stringify(['180° Sea Panoramas', 'Dining Table for Four', 'Sea-view Soaking Tub', 'Dedicated Butler', 'Airport Chauffeur Transfer', 'Club Lounge']),
    images: SUITE_IMAGES,
    status: 'available',
    rating: '4.98',
    reviewCount: 94,
    featured: true,
  },

  // --- FLOOR 5 (Imperial Luxury Suites) ---
  {
    roomNumber: '501',
    name: 'Maharaja Royal Luxury Suite',
    category: 'Suite',
    pricePerNight: 16000,
    discountPercent: 0,
    capacity: 4,
    bedType: '2 King Beds',
    sizeSqFt: 1050,
    floor: 5,
    viewType: 'Palace Gardens & Sea View',
    description: 'Grand aristocratic suite with an opulent living salon, hand-carved heritage archways, freestanding copper bathtub, and dedicated butler service.',
    amenities: JSON.stringify(['24/7 Dedicated Butler Service', 'Separate Living & Dining Salon', 'Copper Soaking Bathtub', 'Luxury Ayurvedic Toiletries', 'Chauffeur Airport Pickup', 'Complimentary High Tea', 'Mini-bar with Treats']),
    images: SUITE_IMAGES,
    status: 'available',
    rating: '4.98',
    reviewCount: 74,
    featured: true,
  },
  {
    roomNumber: '502',
    name: 'Imperial Presidential Suite',
    category: 'Suite',
    pricePerNight: 18000,
    discountPercent: 0,
    capacity: 4,
    bedType: '1 Royal King + 1 Queen Bed',
    sizeSqFt: 1200,
    floor: 5,
    viewType: '360° Arabian Sea & Skyline View',
    description: 'The pinnacle of palace luxury. Features a private master salon, 6-seater dining room, luxury bar, marble jacuzzi bath, and round-the-clock chef on call.',
    amenities: JSON.stringify(['Private Chef on Call', 'Marble Jacuzzi Bathtub', '6-Seater Dining Salon', 'Round-the-clock Butler', 'Chauffeur Luxury Sedan', 'Helipad Concierge', 'Bvlgari Bath Amenities']),
    images: SUITE_IMAGES,
    status: 'available',
    rating: '5.0',
    reviewCount: 62,
    featured: true,
  },
  {
    roomNumber: '503',
    name: 'Royal Heritage Family Suite',
    category: 'Suite',
    pricePerNight: 15000,
    discountPercent: 0,
    capacity: 4,
    bedType: '2 King Beds',
    sizeSqFt: 980,
    floor: 5,
    viewType: 'Bay & City Panoramas',
    description: 'Spacious dual-bedroom royal suite designed for families, featuring two private marble bathrooms, central lounge, and gourmet breakfast.',
    amenities: JSON.stringify(['Dual Master Bedrooms', 'Two Marble Bathrooms', 'Central Living Lounge', 'Dedicated Butler', 'Complimentary Breakfast & High Tea', 'Wi-Fi']),
    images: SUITE_IMAGES,
    status: 'available',
    rating: '4.95',
    reviewCount: 51,
    featured: true,
  },
  {
    roomNumber: '504',
    name: 'The Viceroy Seafront Suite',
    category: 'Suite',
    pricePerNight: 16500,
    discountPercent: 0,
    capacity: 3,
    bedType: '1 Royal King Bed',
    sizeSqFt: 1020,
    floor: 5,
    viewType: 'Frontal Ocean Sunset View',
    description: 'Opulent seafront suite on the top floor with private balcony terrace, telescope for ocean stargazing, master spa bath, and butler service.',
    amenities: JSON.stringify(['Private Sunset Balcony Terrace', 'Ocean Stargazing Telescope', 'Master Spa Soaking Bath', '24/7 Butler Service', 'Airport Chauffeur Transfer', 'Gourmet Dining']),
    images: SUITE_IMAGES,
    status: 'available',
    rating: '4.99',
    reviewCount: 68,
    featured: true,
  },
];

// In-memory fallback dataset for seamless offline/transition resilience
let memoryRooms: any[] = SEED_ROOMS.map((r, index) => ({
  id: index + 1,
  ...r,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

let memoryBookings: any[] = [];
let memoryUsers: any[] = [
  {
    id: 1,
    uid: 'admin_master_uid',
    email: 'admin@grandimperialpalace.in',
    password: 'ImperialAdmin',
    name: 'Palace General Manager & Admin',
    role: 'admin',
    phone: '+91 22 6665 3300',
    loyaltyPoints: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    uid: 'patron_demo_uid',
    email: 'guest@grandimperialpalace.in',
    password: 'guest123',
    name: 'Maharaja Royal Guest',
    role: 'guest',
    phone: '+91 98200 12345',
    loyaltyPoints: 450,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    uid: 'admin_karan_uid',
    email: 'davekaran2006@gmail.com',
    password: 'password123',
    name: 'Karan Dave',
    role: 'admin',
    phone: '+91 98765 43210',
    loyaltyPoints: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
let memoryReviews: any[] = [];
let memorySettings: any = {
  id: 1,
  hotelName: 'The Grand Imperial Heritage Palace & Luxury Suites',
  contactEmail: 'reservations@grandimperialpalace.in',
  contactPhone: '+91 22 6665 3300',
  address: '108 Heritage Bay Promenade, Colaba, Mumbai, Maharashtra 400001, India',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  taxRatePercent: 12,
  cancellationPolicy: '100% Free cancellation up to 24 hours prior to check-in.',
  announcementBanner: '👑 Welcome to The Grand Imperial Palace — Experience Luxury Indian Hospitality in the Heart of Mumbai.',
};

export let isPostgresOnline = !process.env.VERCEL || Boolean(
  process.env.SQL_HOST &&
  process.env.SQL_HOST !== 'localhost' &&
  !process.env.SQL_HOST.includes('127.0.0.1')
);

// Check and seed default data (ensures at least 30 clean rooms in Cloud SQL)
export async function seedDatabaseIfEmpty() {
  if (!isPostgresOnline) return;
  try {
    // Quick probe to check if SQL database connection is alive
    const existingRooms = await db.select({ count: sql<number>`count(*)` }).from(rooms);
    const roomCount = Number(existingRooms[0]?.count || 0);
    isPostgresOnline = true;

    // Ensure password column exists on users table in Cloud SQL
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password text;`);
    } catch (colErr) {
      console.warn('Notice: password column check:', colErr);
    }

    // Seed master Admin user directly into Cloud SQL database
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
      console.log('Master Palace Admin account seeded into Cloud SQL (admin@grandimperialpalace.in / ImperialAdmin)');
    } catch (adminErr) {
      console.warn('Notice: Admin user seeding:', adminErr);
    }

    // Synchronize category images across any existing rooms
    for (const [cat, img] of Object.entries(CATEGORY_ROOM_IMAGES)) {
      await db.update(rooms).set({ images: JSON.stringify([img]) }).where(eq(rooms.category, cat as any));
    }

    // If fewer than 30 rooms or empty, seed / refresh the rooms catalog
    if (roomCount < 30) {
      console.log('Seeding / updating 34 luxury hotel rooms into Cloud SQL database...');
      // Remove any legacy unwanted categories if any exist
      await db.delete(rooms).where(
        or(
          eq(rooms.category, 'Villa'),
          eq(rooms.category, 'Penthouse')
        )
      );

      for (const room of SEED_ROOMS) {
        await db.insert(rooms)
          .values(room)
          .onConflictDoUpdate({
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
              featured: room.featured,
            },
          });
      }
      console.log('Successfully synchronized 34 hotel rooms into Cloud SQL.');
    }

    const existingSettings = await db.select({ count: sql<number>`count(*)` }).from(settings);
    if (Number(existingSettings[0]?.count || 0) === 0) {
      await db.insert(settings).values({
        hotelName: 'The Grand Imperial Heritage Palace & Luxury Suites',
        contactEmail: 'reservations@grandimperialpalace.in',
        contactPhone: '+91 22 6665 3300',
        address: '108 Heritage Bay Promenade, Colaba, Mumbai, Maharashtra 400001, India',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        taxRatePercent: 12,
        cancellationPolicy: '100% Free cancellation up to 24 hours prior to check-in.',
        announcementBanner: '👑 Welcome to The Grand Imperial Palace — Experience Luxury Indian Hospitality in the Heart of Mumbai.',
      }).onConflictDoNothing();
    }
  } catch (error) {
    isPostgresOnline = false;
  }
}

// ----------------- ROOMS -----------------
export async function getAllRooms(filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  search?: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
}) {
  if (isPostgresOnline) {
    try {
      const conditions = [];

    if (filters?.status) {
      conditions.push(eq(rooms.status, filters.status));
    }
    if (filters?.category && filters.category !== 'All') {
      conditions.push(eq(rooms.category, filters.category));
    }
    if (filters?.minPrice !== undefined && filters.minPrice > 0) {
      conditions.push(gte(rooms.pricePerNight, filters.minPrice));
    }
    if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
      conditions.push(lte(rooms.pricePerNight, filters.maxPrice));
    }
    if (filters?.capacity !== undefined && filters.capacity > 0) {
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
    const roomList = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(desc(rooms.featured), rooms.pricePerNight)
      : await baseQuery.orderBy(desc(rooms.featured), rooms.pricePerNight);

    if (roomList.length > 0) {
      // Find all rooms with active confirmed or checked-in reservations
      const activeBookings = await db.select({ roomId: bookings.roomId })
        .from(bookings)
        .where(inArray(bookings.bookingStatus, ['confirmed', 'checked_in']));
      const activeBookedRoomIds = new Set(activeBookings.map(b => b.roomId));

      // If checkIn and checkOut are provided, filter out rooms with overlapping active bookings
      if (filters?.checkIn && filters?.checkOut) {
        const bookedRooms = await db.select({ roomId: bookings.roomId })
          .from(bookings)
          .where(
            and(
              inArray(bookings.bookingStatus, ['confirmed', 'checked_in']),
              sql`${bookings.checkInDate} < ${filters.checkOut} AND ${bookings.checkOutDate} > ${filters.checkIn}`
            )
          );

        const bookedRoomIdSet = new Set(bookedRooms.map(b => b.roomId));
        return roomList.map(room => {
          const isOccupied = room.status === 'occupied' || activeBookedRoomIds.has(room.id);
          return {
            ...room,
            status: isOccupied ? 'occupied' : room.status,
            images: JSON.stringify([CATEGORY_ROOM_IMAGES[room.category] || CATEGORY_ROOM_IMAGES.Standard]),
            isAvailableForDates: !bookedRoomIdSet.has(room.id) && !isOccupied && room.status === 'available',
          };
        });
      }

      return roomList.map(room => {
        const isOccupied = room.status === 'occupied' || activeBookedRoomIds.has(room.id);
        return {
          ...room,
          status: isOccupied ? 'occupied' : room.status,
          images: JSON.stringify([CATEGORY_ROOM_IMAGES[room.category] || CATEGORY_ROOM_IMAGES.Standard]),
          isAvailableForDates: !isOccupied && room.status === 'available',
        };
      });
    }
  } catch (error) {
    isPostgresOnline = false;
  }
}

  // Resilient memory store filter
  const activeMemoryBookedIds = new Set(
    memoryBookings
      .filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in')
      .map(b => b.roomId)
  );

  let list = [...memoryRooms];
  if (filters?.status) {
    list = list.filter(r => {
      const isOcc = r.status === 'occupied' || activeMemoryBookedIds.has(r.id);
      const computedStatus = isOcc ? 'occupied' : r.status;
      return computedStatus === filters.status;
    });
  }
  if (filters?.category && filters.category !== 'All') {
    list = list.filter(r => r.category.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters?.minPrice) {
    list = list.filter(r => r.pricePerNight >= filters.minPrice!);
  }
  if (filters?.maxPrice) {
    list = list.filter(r => r.pricePerNight <= filters.maxPrice!);
  }
  if (filters?.capacity) {
    list = list.filter(r => r.capacity >= filters.capacity!);
  }
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(s) ||
      r.roomNumber.toLowerCase().includes(s) ||
      r.category.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s)
    );
  }

  list.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.pricePerNight - b.pricePerNight;
  });

  return list.map(room => {
    const isOccupied = room.status === 'occupied' || activeMemoryBookedIds.has(room.id);
    return {
      ...room,
      status: isOccupied ? 'occupied' : room.status,
      images: JSON.stringify([CATEGORY_ROOM_IMAGES[room.category] || CATEGORY_ROOM_IMAGES.Standard]),
      isAvailableForDates: !isOccupied && room.status === 'available',
    };
  });
}

export async function getRoomById(id: number) {
  try {
    const result = await db.select().from(rooms).where(eq(rooms.id, id));
    if (result.length) {
      const r = result[0];
      return {
        ...r,
        images: JSON.stringify([CATEGORY_ROOM_IMAGES[r.category] || CATEGORY_ROOM_IMAGES.Standard]),
      };
    }
  } catch (error) {
    console.warn(`Database fallback for getRoomById (${id}):`, error);
  }
  const found = memoryRooms.find(r => r.id === id || r.roomNumber === String(id));
  const fallback = found || memoryRooms[0] || null;
  if (fallback) {
    return {
      ...fallback,
      images: JSON.stringify([CATEGORY_ROOM_IMAGES[fallback.category] || CATEGORY_ROOM_IMAGES.Standard]),
    };
  }
  return null;
}

export async function createRoom(data: typeof rooms.$inferInsert) {
  try {
    const result = await db.insert(rooms).values(data).returning();
    if (result.length) {
      memoryRooms.unshift(result[0]);
      return result[0];
    }
  } catch (error) {
    console.warn('Database fallback for createRoom:', error);
  }
  const newRoom = {
    id: memoryRooms.length + 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryRooms.unshift(newRoom);
  return newRoom;
}

export async function updateRoom(id: number, data: Partial<typeof rooms.$inferInsert>) {
  try {
    const result = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    if (result.length) {
      const idx = memoryRooms.findIndex(r => r.id === id);
      if (idx !== -1) memoryRooms[idx] = { ...memoryRooms[idx], ...result[0] };
      return result[0];
    }
  } catch (error) {
    console.warn('Database fallback for updateRoom:', error);
  }
  const idx = memoryRooms.findIndex(r => r.id === id);
  if (idx !== -1) {
    memoryRooms[idx] = { ...memoryRooms[idx], ...data, updatedAt: new Date() };
    return memoryRooms[idx];
  }
  return null;
}

export async function deleteRoom(id: number) {
  try {
    const result = await db.delete(rooms).where(eq(rooms.id, id)).returning();
    if (result.length) {
      memoryRooms = memoryRooms.filter(r => r.id !== id);
      return result[0];
    }
  } catch (error) {
    console.warn('Database fallback for deleteRoom:', error);
  }
  const deleted = memoryRooms.find(r => r.id === id);
  memoryRooms = memoryRooms.filter(r => r.id !== id);
  return deleted || { id };
}

// ----------------- USERS / GUEST PROFILES -----------------
export async function registerDbUser(data: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}) {
  const normEmail = data.email.trim().toLowerCase();
  const isAdmin = normEmail === 'admin@grandimperialpalace.in';
  const role = isAdmin ? 'admin' : 'guest';
  const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (isPostgresOnline) {
    try {
      // Check if user already exists
      const existing = await db.select().from(users).where(eq(sql`lower(${users.email})`, normEmail));
      if (existing.length > 0) {
        throw new Error('An account with this email address already exists. Please sign in.');
      }

      const result = await db.insert(users).values({
        uid,
        email: normEmail,
        password: data.password || '',
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        role,
        loyaltyPoints: isAdmin ? 5000 : 100,
      }).returning();

      if (result.length) {
        memoryUsers.push(result[0]);
        return result[0];
      }
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw error;
      }
      isPostgresOnline = false;
    }
  }

  // Memory fallback
  const memExisting = memoryUsers.find(u => u.email.toLowerCase() === normEmail);
  if (memExisting) {
    throw new Error('An account with this email address already exists. Please sign in.');
  }

  const userObj = {
    id: memoryUsers.length + 1,
    uid,
    email: normEmail,
    password: data.password || '',
    name: data.name.trim(),
    phone: data.phone?.trim() || null,
    role,
    loyaltyPoints: isAdmin ? 5000 : 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryUsers.push(userObj);
  return userObj;
}

export type AuthResult = 
  | { success: true; user: any; isAdmin: boolean }
  | { success: false; reason: 'USER_NOT_FOUND' | 'INVALID_PASSWORD'; message: string };

export async function authenticateDbUser(email: string, password?: string): Promise<AuthResult> {
  const normEmail = email.trim().toLowerCase();
  const trimmedPassword = (password || '').trim();

  // Special Master Admin check (admin@grandimperialpalace.in with ImperialAdmin or ImperialAdmin2026!)
  if (
    normEmail === 'admin@grandimperialpalace.in' &&
    (trimmedPassword === 'ImperialAdmin' || trimmedPassword === 'ImperialAdmin2026!')
  ) {
    let admin = await getUserByEmail(normEmail);
    if (!admin) {
      admin = {
        id: 1,
        uid: 'admin_master_uid',
        email: 'admin@grandimperialpalace.in',
        name: 'Palace General Manager & Admin',
        role: 'admin',
        phone: null,
        loyaltyPoints: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return { success: true, user: admin, isAdmin: true };
  }

  let foundUser: any = null;

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
    foundUser = memoryUsers.find(u => u.email.toLowerCase() === normEmail) || null;
  }

  if (!foundUser) {
    return {
      success: false,
      reason: 'USER_NOT_FOUND',
      message: 'No account found with this email address. Please create a new account by signing up.',
    };
  }

  if (foundUser.password && foundUser.password !== trimmedPassword) {
    return {
      success: false,
      reason: 'INVALID_PASSWORD',
      message: 'Incorrect password for this account. Please verify your password or use "Forgot Password?" to reset it.',
    };
  }

  const isAdm = foundUser.role === 'admin' || normEmail === 'admin@grandimperialpalace.in' || normEmail === 'davekaran2006@gmail.com';
  return { success: true, user: foundUser, isAdmin: isAdm };
}

export async function getUserByEmail(email: string) {
  const normEmail = email.trim().toLowerCase();
  if (isPostgresOnline) {
    try {
      const res = await db.select().from(users).where(eq(sql`lower(${users.email})`, normEmail));
      if (res.length > 0) return res[0];
    } catch (error) {
      isPostgresOnline = false;
    }
  }
  return memoryUsers.find(u => u.email?.toLowerCase() === normEmail) || null;
}

export async function updateUserPassword(email: string, newPassword: string): Promise<boolean> {
  const normEmail = email.trim().toLowerCase();
  const trimmed = newPassword.trim();
  if (isPostgresOnline) {
    try {
      const res = await db.update(users)
        .set({ password: trimmed, updatedAt: new Date() })
        .where(eq(sql`lower(${users.email})`, normEmail))
        .returning();
      if (res.length > 0) {
        const idx = memoryUsers.findIndex(u => u.email?.toLowerCase() === normEmail);
        if (idx !== -1) memoryUsers[idx].password = trimmed;
        return true;
      }
    } catch (error) {
      isPostgresOnline = false;
    }
  }

  const mem = memoryUsers.find(u => u.email?.toLowerCase() === normEmail);
  if (mem) {
    mem.password = trimmed;
    mem.updatedAt = new Date();
    return true;
  }
  return false;
}

export async function getOrCreateUser(userData: {
  uid: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
}) {
  const defaultRole = userData.email.toLowerCase().includes('admin') ? 'admin' : (userData.role || 'guest');

  try {
    const result = await db.insert(users)
      .values({
        uid: userData.uid,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        avatar: userData.avatar || '',
        role: defaultRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: userData.email,
          ...(userData.name ? { name: userData.name } : {}),
          ...(userData.avatar ? { avatar: userData.avatar } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    if (result.length) {
      const idx = memoryUsers.findIndex(u => u.uid === userData.uid);
      if (idx !== -1) memoryUsers[idx] = result[0];
      else memoryUsers.push(result[0]);
      return result[0];
    }
  } catch (error) {
    console.warn('Database fallback for getOrCreateUser:', error);
  }

  let user = memoryUsers.find(u => u.uid === userData.uid);
  if (user) {
    user.name = userData.name || user.name;
    user.avatar = userData.avatar || user.avatar;
    user.updatedAt = new Date();
  } else {
    user = {
      id: memoryUsers.length + 1,
      uid: userData.uid,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      avatar: userData.avatar || '',
      role: defaultRole,
      loyaltyPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.push(user);
  }
  return user;
}

export async function getUserProfile(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    if (result.length) return result[0];
  } catch (error) {
    console.warn(`Database fallback for getUserProfile (${uid}):`, error);
  }
  return memoryUsers.find(u => u.uid === uid) || null;
}

export async function updateUserProfile(uid: string, data: Partial<typeof users.$inferInsert>) {
  try {
    const result = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.uid, uid))
      .returning();
    if (result.length) {
      const idx = memoryUsers.findIndex(u => u.uid === uid);
      if (idx !== -1) memoryUsers[idx] = result[0];
      return result[0];
    }
  } catch (error) {
    console.warn(`Database fallback for updateUserProfile (${uid}):`, error);
  }
  const idx = memoryUsers.findIndex(u => u.uid === uid);
  if (idx !== -1) {
    memoryUsers[idx] = { ...memoryUsers[idx], ...data, updatedAt: new Date() };
    return memoryUsers[idx];
  }
  return null;
}

export async function getAllGuests() {
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
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    const guestBookings = await db.select({
      userId: bookings.userId,
      count: sql<number>`count(*)`,
      totalSpend: sql<number>`sum(${bookings.totalAmount})`,
    }).from(bookings).groupBy(bookings.userId);

    const spendMap = new Map(guestBookings.map(b => [b.userId, {
      totalBookings: Number(b.count),
      totalSpent: Number(b.totalSpend || 0)
    }]));

    if (guestList.length > 0) {
      return guestList.map(guest => ({
        ...guest,
        totalBookings: spendMap.get(guest.uid)?.totalBookings || 0,
        totalSpent: spendMap.get(guest.uid)?.totalSpent || 0,
      }));
    }
  } catch (error) {
    console.warn('Database fallback for getAllGuests:', error);
  }

  return memoryUsers.map(guest => ({
    ...guest,
    totalBookings: memoryBookings.filter(b => b.userId === guest.uid).length,
    totalSpent: memoryBookings.filter(b => b.userId === guest.uid && b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0),
  }));
}

// ----------------- BOOKINGS -----------------
export async function checkRoomAvailability(roomId: number, checkIn: string, checkOut: string) {
  try {
    const overlapping = await db.select().from(bookings).where(
      and(
        eq(bookings.roomId, roomId),
        inArray(bookings.bookingStatus, ['confirmed', 'checked_in']),
        sql`${bookings.checkInDate} < ${checkOut} AND ${bookings.checkOutDate} > ${checkIn}`
      )
    );
    return overlapping.length === 0;
  } catch (error) {
    console.warn('Database fallback for checkRoomAvailability:', error);
    const overlappingMem = memoryBookings.filter(b =>
      b.roomId === roomId &&
      (b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in') &&
      b.checkInDate < checkOut &&
      b.checkOutDate > checkIn
    );
    return overlappingMem.length === 0;
  }
}

export async function createBooking(data: {
  roomId: number;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guestsCount: number;
  specialRequests?: string;
  roomRatePerNight: number;
  cleaningFee?: number;
  taxesAndFees?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentCardLast4?: string;
}) {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const bookingReference = `HTL-${randomSuffix}`;
  const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const isAvailable = await checkRoomAvailability(data.roomId, data.checkInDate, data.checkOutDate);
    if (!isAvailable) {
      throw new Error('Selected room is no longer available for these dates. Please choose another date or room.');
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
      specialRequests: data.specialRequests || '',
      roomRatePerNight: data.roomRatePerNight,
      cleaningFee: data.cleaningFee ?? 25,
      taxesAndFees: data.taxesAndFees ?? 35,
      totalAmount: data.totalAmount,
      paymentStatus: 'paid',
      paymentMethod: data.paymentMethod || 'Credit Card (Simulated)',
      paymentCardLast4: data.paymentCardLast4 || '4242',
      transactionId,
      bookingStatus: 'confirmed',
    }).returning();

    // Mark room as occupied in DB
    await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, data.roomId));

    // Update memory room status as well
    const memRoom = memoryRooms.find(r => r.id === data.roomId);
    if (memRoom) {
      memRoom.status = 'occupied';
    }

    if (newBooking.length) {
      const roomDetails = await getRoomById(data.roomId);
      const fullBooking = {
        ...newBooking[0],
        roomName: roomDetails?.name || `Suite #${data.roomId}`,
        roomNumber: roomDetails?.roomNumber || `${data.roomId}`,
        roomCategory: roomDetails?.category || 'Deluxe',
        roomImages: roomDetails?.images,
        bedType: roomDetails?.bedType,
      };
      memoryBookings.unshift(fullBooking);
      return fullBooking;
    }
  } catch (error: any) {
    if (error.message?.includes('no longer available')) {
      throw error;
    }
    console.warn('Database fallback for createBooking:', error);
  }

  const room = memoryRooms.find(r => r.id === data.roomId) || memoryRooms[0];
  if (room) {
    room.status = 'occupied';
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
    specialRequests: data.specialRequests || '',
    roomRatePerNight: data.roomRatePerNight,
    cleaningFee: data.cleaningFee ?? 25,
    taxesAndFees: data.taxesAndFees ?? 35,
    totalAmount: data.totalAmount,
    paymentStatus: 'paid',
    paymentMethod: data.paymentMethod || 'Credit Card (Simulated)',
    paymentCardLast4: data.paymentCardLast4 || '4242',
    transactionId,
    bookingStatus: 'confirmed',
    createdAt: new Date(),
    roomName: room?.name || `Suite #${data.roomId}`,
    roomNumber: room?.roomNumber || `${data.roomId}`,
    roomCategory: room?.category || 'Deluxe',
    roomImages: room?.images,
    bedType: room?.bedType,
  };
  memoryBookings.unshift(memoryObj);
  return memoryObj;
}

export async function getBookingsByUser(userId: string) {
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
      bedType: rooms.bedType,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));

    if (userBookings.length > 0) return userBookings;
  } catch (error) {
    console.warn(`Database fallback for getBookingsByUser (${userId}):`, error);
  }

  return memoryBookings.filter(b => b.userId === userId);
}

export async function getAllBookings() {
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
      roomPrice: rooms.pricePerNight,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .orderBy(desc(bookings.createdAt));

    if (allBookings.length > 0) {
      return allBookings.map(b => ({
        ...b,
        roomName: b.roomName || `Suite #${b.roomId}`,
        roomNumber: b.roomNumber || `${b.roomId}`,
        roomCategory: b.roomCategory || 'Deluxe',
      }));
    }
  } catch (error) {
    console.warn('Database fallback for getAllBookings:', error);
  }

  return memoryBookings;
}

export async function getBookingByRef(reference: string) {
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
      bedType: rooms.bedType,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.bookingReference, reference));

    if (result.length) return result[0];
  } catch (error) {
    console.warn(`Database fallback for getBookingByRef (${reference}):`, error);
  }

  return memoryBookings.find(b => b.bookingReference === reference) || null;
}

export async function updateBookingStatus(id: number, status: string, cancellationReason?: string) {
  try {
    const updateData: any = {
      bookingStatus: status,
    };
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.paymentStatus = 'refunded';
      if (cancellationReason) updateData.cancellationReason = cancellationReason;
    }
    const result = await db.update(bookings).set(updateData).where(eq(bookings.id, id)).returning();
    
    // Manage room status according to booking lifecycle
    const bObj = result.length ? result[0] : memoryBookings.find(b => b.id === id);
    if (bObj && bObj.roomId) {
      if (status === 'cancelled' || status === 'checked_out') {
        // Check if any other active booking exists for this room
        const otherActive = await db.select().from(bookings).where(
          and(
            eq(bookings.roomId, bObj.roomId),
            ne(bookings.id, id),
            inArray(bookings.bookingStatus, ['confirmed', 'checked_in'])
          )
        );
        if (otherActive.length === 0) {
          await db.update(rooms).set({ status: 'available' }).where(eq(rooms.id, bObj.roomId));
          const memRoom = memoryRooms.find(r => r.id === bObj.roomId);
          if (memRoom) memRoom.status = 'available';
        }
      } else if (status === 'confirmed' || status === 'checked_in') {
        await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, bObj.roomId));
        const memRoom = memoryRooms.find(r => r.id === bObj.roomId);
        if (memRoom) memRoom.status = 'occupied';
      }
    }

    if (result.length) {
      const idx = memoryBookings.findIndex(b => b.id === id);
      if (idx !== -1) memoryBookings[idx] = { ...memoryBookings[idx], ...result[0] };
      return result[0];
    }
  } catch (error) {
    console.warn(`Database fallback for updateBookingStatus (${id}):`, error);
  }

  const idx = memoryBookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    memoryBookings[idx].bookingStatus = status;
    if (status === 'cancelled') {
      memoryBookings[idx].cancelledAt = new Date();
      memoryBookings[idx].paymentStatus = 'refunded';
      if (cancellationReason) memoryBookings[idx].cancellationReason = cancellationReason;
    }
    const memRoom = memoryRooms.find(r => r.id === memoryBookings[idx].roomId);
    if (memRoom) {
      memRoom.status = (status === 'cancelled' || status === 'checked_out') ? 'available' : 'occupied';
    }
    return memoryBookings[idx];
  }
  return null;
}

// ----------------- REVIEWS -----------------
export async function getReviewsByRoom(roomId: number) {
  try {
    const res = await db.select().from(reviews).where(eq(reviews.roomId, roomId)).orderBy(desc(reviews.createdAt));
    if (res.length) return res;
  } catch (error) {
    console.warn(`Database fallback for getReviewsByRoom (${roomId}):`, error);
  }
  return memoryReviews.filter(r => r.roomId === roomId);
}

export async function createReview(data: {
  roomId: number;
  userId: string;
  guestName: string;
  rating: number;
  comment: string;
}) {
  try {
    const result = await db.insert(reviews).values(data).returning();
    if (result.length) {
      memoryReviews.unshift(result[0]);
      return result[0];
    }
  } catch (error) {
    console.warn('Database fallback for createReview:', error);
  }

  const rev = {
    id: memoryReviews.length + 1,
    ...data,
    createdAt: new Date(),
  };
  memoryReviews.unshift(rev);
  return rev;
}

// ----------------- SETTINGS & ANALYTICS -----------------
export async function getSettings() {
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

export async function updateSettings(data: Partial<typeof settings.$inferInsert>) {
  try {
    const current = await db.select().from(settings).limit(1);
    if (current.length) {
      const result = await db.update(settings).set(data).where(eq(settings.id, current[0].id)).returning();
      if (result.length) {
        memorySettings = { ...memorySettings, ...result[0] };
        return result[0];
      }
    } else {
      const result = await db.insert(settings).values(data as any).returning();
      if (result.length) {
        memorySettings = { ...memorySettings, ...result[0] };
        return result[0];
      }
    }
  } catch (error) {
    console.warn('Database fallback for updateSettings:', error);
  }
  memorySettings = { ...memorySettings, ...data };
  return memorySettings;
}

export async function getAdminAnalytics() {
  try {
    const allRooms = await db.select().from(rooms);
    const allBookings = await db.select().from(bookings);
    const allUsers = await db.select().from(users);

    const totalRooms = allRooms.length || memoryRooms.length;
    const totalBookings = allBookings.length || memoryBookings.length;
    const activeBookings = (allBookings.length ? allBookings : memoryBookings).filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in');
    const completedBookings = (allBookings.length ? allBookings : memoryBookings).filter(b => b.bookingStatus === 'checked_out');
    const cancelledBookings = (allBookings.length ? allBookings : memoryBookings).filter(b => b.bookingStatus === 'cancelled');

    const totalRevenue = (allBookings.length ? allBookings : memoryBookings)
      .filter(b => b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const occupancyRate = totalRooms > 0 
      ? Math.min(100, Math.round((activeBookings.length / totalRooms) * 100))
      : 0;

    const categoryCount: Record<string, number> = {};
    for (const room of (allRooms.length ? allRooms : memoryRooms)) {
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
      recentBookings: (allBookings.length ? allBookings : memoryBookings).slice(0, 5),
    };
  } catch (error) {
    console.warn('Database fallback for getAdminAnalytics:', error);
    return {
      totalRooms: memoryRooms.length,
      totalBookings: memoryBookings.length,
      activeBookingsCount: memoryBookings.filter(b => b.bookingStatus === 'confirmed').length,
      completedBookingsCount: 0,
      cancelledBookingsCount: 0,
      totalRevenue: memoryBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      totalGuests: memoryUsers.length,
      occupancyRate: 0,
      categoryDistribution: { Standard: 8, Deluxe: 12, Executive: 8, Suite: 6 },
      recentBookings: memoryBookings.slice(0, 5),
    };
  }
}

// ----------------- FRONT DESK & RECEPTION (OFFLINE WALK-IN & FOLIO) -----------------

export async function createWalkInBooking(data: {
  roomId: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestAddress?: string;
  idProofType: string;
  idProofNumber: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guestsCount: number;
  specialRequests?: string;
  roomRatePerNight: number;
  cleaningFee?: number;
  taxesAndFees?: number;
  totalAmount: number;
  paymentMethod: string;
  keyCardNumber?: string;
  isOtpVerified?: boolean;
}) {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const bookingReference = `WLK-${randomSuffix}`;
  const transactionId = `CTR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const walkInUserId = `walkin_${Date.now()}`;
  const assignedKey = data.keyCardNumber || `KEY-${data.roomId}-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`;

  const initialFolio = [
    {
      id: `fol_${Date.now()}`,
      description: `Room Tariff (${data.totalNights} Night${data.totalNights > 1 ? 's' : ''})`,
      category: 'Room',
      amount: data.roomRatePerNight * data.totalNights,
      timestamp: new Date().toISOString(),
      addedBy: 'Front Desk System',
    },
    {
      id: `fol_${Date.now() + 1}`,
      description: 'Luxury Heritage Taxes & GST (12%)',
      category: 'Other',
      amount: data.taxesAndFees || 0,
      timestamp: new Date().toISOString(),
      addedBy: 'Front Desk System',
    },
  ];

  try {
    const isAvailable = await checkRoomAvailability(data.roomId, data.checkInDate, data.checkOutDate);
    if (!isAvailable) {
      throw new Error(`Suite #${data.roomId} is already occupied or reserved for these dates.`);
    }

    // Try DB insertion
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
      specialRequests: data.specialRequests || 'Walk-in Counter Guest',
      roomRatePerNight: data.roomRatePerNight,
      cleaningFee: data.cleaningFee ?? 0,
      taxesAndFees: data.taxesAndFees ?? 0,
      totalAmount: data.totalAmount,
      paymentStatus: 'paid',
      paymentMethod: data.paymentMethod || 'Cash at Counter',
      paymentCardLast4: data.paymentMethod.includes('Card') ? '9999' : 'CASH',
      transactionId,
      bookingStatus: 'checked_in', // Immediate Walk-in Check-in
    }).returning();

    // Mark room occupied
    await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, data.roomId));
    const memRoom = memoryRooms.find(r => r.id === data.roomId);
    if (memRoom) memRoom.status = 'occupied';

    if (newBooking.length) {
      const roomDetails = await getRoomById(data.roomId);
      const fullBooking = {
        ...newBooking[0],
        roomName: roomDetails?.name || `Suite #${data.roomId}`,
        roomNumber: roomDetails?.roomNumber || `${data.roomId}`,
        roomCategory: roomDetails?.category || 'Deluxe',
        roomImages: roomDetails?.images,
        bedType: roomDetails?.bedType,
        keyCardNumber: assignedKey,
        idProofType: data.idProofType,
        idProofNumber: data.idProofNumber,
        isWalkIn: true,
        isOtpVerified: Boolean(data.isOtpVerified),
        folioItems: JSON.stringify(initialFolio),
      };
      memoryBookings.unshift(fullBooking as any);
      return fullBooking;
    }
  } catch (error: any) {
    if (error.message?.includes('already occupied')) {
      throw error;
    }
    console.warn('Database fallback for createWalkInBooking:', error);
  }

  const room = memoryRooms.find(r => r.id === data.roomId) || memoryRooms[0];
  if (room) {
    room.status = 'occupied';
  }

  const memoryObj: any = {
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
    specialRequests: data.specialRequests || 'Walk-in Counter Guest',
    roomRatePerNight: data.roomRatePerNight,
    cleaningFee: data.cleaningFee ?? 0,
    taxesAndFees: data.taxesAndFees ?? 0,
    totalAmount: data.totalAmount,
    paymentStatus: 'paid',
    paymentMethod: data.paymentMethod || 'Cash at Counter',
    paymentCardLast4: 'CASH',
    transactionId,
    bookingStatus: 'checked_in',
    keyCardNumber: assignedKey,
    idProofType: data.idProofType,
    idProofNumber: data.idProofNumber,
    isWalkIn: true,
    isOtpVerified: Boolean(data.isOtpVerified),
    folioItems: JSON.stringify(initialFolio),
    createdAt: new Date(),
    roomName: room?.name || `Suite #${data.roomId}`,
    roomNumber: room?.roomNumber || `${data.roomId}`,
    roomCategory: room?.category || 'Deluxe',
    roomImages: room?.images,
    bedType: room?.bedType,
  };

  memoryBookings.unshift(memoryObj);
  return memoryObj;
}

export async function addFolioItemToBooking(bookingId: number, item: {
  description: string;
  category: 'Room' | 'Dining' | 'Spa' | 'Laundry' | 'Transport' | 'Minibar' | 'Other';
  amount: number;
  addedBy?: string;
}) {
  const newItem = {
    id: `fol_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    description: item.description,
    category: item.category,
    amount: Number(item.amount),
    timestamp: new Date().toISOString(),
    addedBy: item.addedBy || 'Front Desk Staff',
  };

  try {
    const dbResult = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (dbResult.length > 0) {
      const bRow = dbResult[0];
      const newTotal = (Number(bRow.totalAmount) || 0) + Number(item.amount);

      await db.update(bookings)
        .set({ totalAmount: newTotal })
        .where(eq(bookings.id, bookingId));

      const memIdx = memoryBookings.findIndex(b => b.id === bookingId);
      if (memIdx !== -1) {
        let currentFolio: any[] = [];
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
    console.warn('DB update notice for folio charge:', err);
  }

  const bookingIdx = memoryBookings.findIndex(b => b.id === bookingId);
  if (bookingIdx !== -1) {
    const booking = memoryBookings[bookingIdx];
    let currentFolio: any[] = [];
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

  return { success: false, error: 'Booking not found for folio update' };
}

export async function checkInBookingWithKey(
  bookingId: number,
  keyCardNumber?: string,
  idProofType?: string,
  idProofNumber?: string,
  isOtpVerified?: boolean
) {
  const assignedKey = keyCardNumber || `KEY-${bookingId}-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`;

  // 1. Check DB first
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
      bedType: rooms.bedType,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.id, bookingId));

    if (dbResult.length > 0) {
      const bRow = dbResult[0];
      await db.update(bookings)
        .set({ bookingStatus: 'checked_in' })
        .where(eq(bookings.id, bookingId));

      await db.update(rooms)
        .set({ status: 'occupied' })
        .where(eq(rooms.id, bRow.roomId));

      const memRoom = memoryRooms.find(r => r.id === bRow.roomId);
      if (memRoom) memRoom.status = 'occupied';

      const updated = {
        ...bRow,
        bookingStatus: 'checked_in',
        keyCardNumber: assignedKey,
        idProofType: idProofType || 'Aadhaar Card',
        idProofNumber: idProofNumber || '',
        isOtpVerified: isOtpVerified !== undefined ? isOtpVerified : true,
      };

      const memIdx = memoryBookings.findIndex(b => b.id === bookingId);
      if (memIdx !== -1) {
        memoryBookings[memIdx] = { ...memoryBookings[memIdx], ...updated };
      } else {
        memoryBookings.unshift(updated as any);
      }

      return updated;
    }
  } catch (err) {
    console.warn('DB check-in update error:', err);
  }

  // 2. Memory fallback
  const bookingIdx = memoryBookings.findIndex(b => b.id === bookingId);
  if (bookingIdx !== -1) {
    memoryBookings[bookingIdx].bookingStatus = 'checked_in';
    memoryBookings[bookingIdx].keyCardNumber = assignedKey;
    if (idProofType) memoryBookings[bookingIdx].idProofType = idProofType;
    if (idProofNumber) memoryBookings[bookingIdx].idProofNumber = idProofNumber;
    if (isOtpVerified !== undefined) memoryBookings[bookingIdx].isOtpVerified = isOtpVerified;

    const roomId = memoryBookings[bookingIdx].roomId;
    const memRoom = memoryRooms.find(r => r.id === roomId);
    if (memRoom) memRoom.status = 'occupied';

    return memoryBookings[bookingIdx];
  }

  return null;
}

export async function checkOutBookingAndRelease(
  bookingId: number,
  settlementMethod: string = 'Settled at Counter'
) {
  // 1. Check DB first
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
      bedType: rooms.bedType,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.id, bookingId));

    if (dbResult.length > 0) {
      const bRow = dbResult[0];
      const newPaymentMethod = `${bRow.paymentMethod || 'Counter'} / ${settlementMethod}`;

      await db.update(bookings)
        .set({ bookingStatus: 'checked_out', paymentStatus: 'paid', paymentMethod: newPaymentMethod })
        .where(eq(bookings.id, bookingId));

      await db.update(rooms)
        .set({ status: 'cleaning' as any })
        .where(eq(rooms.id, bRow.roomId));

      const memRoom = memoryRooms.find(r => r.id === bRow.roomId);
      if (memRoom) memRoom.status = 'cleaning';

      const updated = {
        ...bRow,
        bookingStatus: 'checked_out',
        paymentStatus: 'paid',
        paymentMethod: newPaymentMethod,
      };

      const memIdx = memoryBookings.findIndex(b => b.id === bookingId);
      if (memIdx !== -1) {
        memoryBookings[memIdx] = { ...memoryBookings[memIdx], ...updated };
      }

      return updated;
    }
  } catch (err) {
    console.warn('DB check-out notice:', err);
  }

  // 2. Memory fallback
  const bookingIdx = memoryBookings.findIndex(b => b.id === bookingId);
  if (bookingIdx !== -1) {
    const booking = memoryBookings[bookingIdx];
    booking.bookingStatus = 'checked_out';
    booking.paymentStatus = 'paid';
    booking.paymentMethod = `${booking.paymentMethod} / ${settlementMethod}`;

    const roomId = booking.roomId;
    const memRoom = memoryRooms.find(r => r.id === roomId);
    if (memRoom) {
      memRoom.status = 'cleaning'; // Marked for housekeeping
    }

    return booking;
  }

  return null;
}

export async function updateRoomHousekeepingStatus(roomId: number, status: 'available' | 'occupied' | 'cleaning' | 'maintenance') {
  const memRoom = memoryRooms.find(r => r.id === roomId);
  if (memRoom) {
    memRoom.status = status;
  }

  try {
    await db.update(rooms).set({ status: status as any }).where(eq(rooms.id, roomId));
  } catch (err) {
    console.warn('DB housekeeping status update notice:', err);
  }

  return memRoom;
}

