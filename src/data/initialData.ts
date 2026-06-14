/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Family, ItineraryDay, Hotel, Expense, Transfer, UploadedDocument, Memory, SplitType } from "../types";

// 8 Members categorized into 3 Families
export const INITIAL_MEMBERS: Member[] = [
  // Family 1
  { id: "m-sanket", name: "Sanket", familyId: "f-1", avatar: "👨‍💻" },
  { id: "m-sneha", name: "Sneha", familyId: "f-1", avatar: "👩‍⚕️" },
  { id: "m-shripad", name: "Shripad", familyId: "f-1", avatar: "👴" },
  { id: "m-shruti", name: "Shruti", familyId: "f-1", avatar: "👵" },
  // Family 2
  { id: "m-milind", name: "Milind", familyId: "f-2", avatar: "👨‍💼" },
  { id: "m-vaishali", name: "Vaishali", familyId: "f-2", avatar: "👩‍💼" },
  // Family 3
  { id: "m-sharad", name: "Sharad", familyId: "f-3", avatar: "👨‍🔧" },
  { id: "m-sharayu", name: "Sharayu", familyId: "f-3", avatar: "👩‍🌾" }
];

export const INITIAL_FAMILIES: Family[] = [
  { id: "f-1", name: "Family 1 (Sanket, Sneha, Shripad, Shruti)", members: ["m-sanket", "m-sneha", "m-shripad", "m-shruti"] },
  { id: "f-2", name: "Family 2 (Milind, Vaishali)", members: ["m-milind", "m-vaishali"] },
  { id: "f-3", name: "Family 3 (Sharad, Sharayu)", members: ["m-sharad", "m-sharayu"] }
];

// Pre-defined stays as mentioned in prompt
export const INITIAL_HOTELS: Hotel[] = [
  {
    id: "h-kamini",
    name: "Kamini Homestay",
    location: "Dehradun, Uttarakhand",
    contact: "To be confirmed",
    roomAllocation: "3 Spacious Rooms (Family 1: 1 room, Family 2: 1 room, Family 3: 1 room)",
    checkIn: "20 Jun 2024",
    checkOut: "21 Jun 2024",
    bookingAmount: 4500,
    advancePaid: 2000,
    pendingAmount: 2500
  },
  {
    id: "h-hosteller",
    name: "The Hosteller Chakrata",
    location: "Chakrata, Uttarakhand",
    contact: "09358214531 / Customer Care",
    roomAllocation: "3 Premium Wooden Cottages (Family 1: Cottage A, Family 2: Cottage B, Family 3: Cottage C)",
    checkIn: "21 Jun 2024",
    checkOut: "23 Jun 2024",
    bookingAmount: 18000,
    advancePaid: 8000,
    pendingAmount: 10000
  },
  {
    id: "h-nautiyal",
    name: "Nautiyal Homestay Hanol",
    location: "Hanol (Near Mahasu Devta Temple)",
    contact: "9411171523",
    roomAllocation: "Traditional Homestay (Shared Family Suite & Bed-wise setups)",
    checkIn: "23 Jun 2024",
    checkOut: "24 Jun 2024",
    bookingAmount: 3500,
    advancePaid: 1500,
    pendingAmount: 2000
  },
  {
    id: "h-zostel",
    name: "Zostel Mussoorie",
    location: "Mussoorie, Uttarakhand",
    contact: "To be confirmed",
    roomAllocation: "1 Quad Private Room (Family 1) + 2 Double Rooms (Family 2, Family 3)",
    checkIn: "24 Jun 2024",
    checkOut: "25 Jun 2024",
    bookingAmount: 12500,
    advancePaid: 5000,
    pendingAmount: 7500
  },
  {
    id: "h-haridwar",
    name: "Haridwar Hotel",
    location: "Haridwar (Near Har Ki Pauri)",
    contact: "To be confirmed",
    roomAllocation: "To be confirmed",
    checkIn: "25 Jun 2024",
    checkOut: "26 Jun 2024",
    bookingAmount: 6000,
    advancePaid: 3000,
    pendingAmount: 3000
  }
];

// Exact physical trip scheduling itinerary
export const INITIAL_ITINERARY: ItineraryDay[] = [
  {
    id: "day-1",
    date: "19 Jun",
    route: "Mumbai → Delhi",
    details: "Overnight train Journey. Train name to be confirmed. Group gathers at Mumbai station.",
    stayName: "Train Bed",
    sightseeing: ["Train landscape viewing", "Board games in train", "Family chatter"],
    seniorCitizenSuitability: {
      suitable: true,
      reason: "Train travel is comfortable, but ensure berths are lower or middle. Shripad and Shruti will have lower berths."
    },
    notes: ["Pack home-cooked snacks for the 24-hour journey.", "Verify all Aadhaar/ID cards are in physical custody."],
    foodSuggestions: ["Mumbai-style snacks", "Home-cooked Poori Sabji"],
    photoSpots: ["Mumbai Central departure gate", "Sunset from train window"],
    completed: true
  },
  {
    id: "day-2",
    date: "20 Jun",
    route: "Delhi → Dehradun",
    details: "Vande Bharat 22457 from Anand Vihar (Delhi) to Dehradun. Group check-in at Dehradun homestay.",
    stayName: "Kamini Homestay",
    stayId: "h-kamini",
    sightseeing: ["Anand Vihar terminal setup", "Vande Bharat catering trail", "Dehradun local market evening stroll"],
    seniorCitizenSuitability: {
      suitable: true,
      reason: "High-speed AC chair car on Vande Bharat is extremely comfortable with minimal jerks and clean rest-stations."
    },
    notes: ["Train departs Anand Vihar early morning. Ensure timely cab arrivals in Delhi.", "Dehradun local markets are quite crowded in evening."],
    foodSuggestions: ["Vande Bharat onboard breakfast", "Garhwali traditional dinner at Dehradun"],
    photoSpots: ["Vande Bharat Express frontal selfie", "Kamini Homestay lawn under lanterns"],
    completed: true
  },
  {
    id: "day-3",
    date: "21 Jun",
    route: "Dehradun → Chakrata",
    details: "Collect Gocars Self-drive: Tata Altroz + Hyundai i20 (Contact: 9358214531). Drive up mountain curves via Kalsi.",
    stayName: "The Hosteller Chakrata",
    stayId: "h-hosteller",
    sightseeing: [
      "Ashoka Rock Edict (Kalsi)",
      "Tiger Falls",
      "Chakrata View Point",
      "Chilmiri Neck (Sunset point)",
      "Ramtal Horticulture Garden"
    ],
    seniorCitizenSuitability: {
      suitable: false,
      reason: "Tiger Falls requires a steep 1 km trek/slope. Senior citizens (Shripad & Shruti) should wait at the scenic view-point cafe instead of descending."
    },
    notes: [
      "Review Gocars tire pressures and check scratch sheets before sign-off.",
      "Kalsi to Chakrata road has winding double-lane turns. Drive slow & avoid overtaking on blind curves.",
      "Chilmiri neck gets very chilly after 5:30 PM. Carry shawls for Shripad and Shruti."
    ],
    foodSuggestions: ["Maggie & hot tea at Kalsi road-bends", "Local Pahadi chicken & Dal Tadka at The Hosteller Chakrata"],
    photoSpots: ["Historic Kalsi Ashoka edicts", "Tiger Falls roaring cascade", "Chilmiri Neck twilight skyline"],
    completed: false
  },
  {
    id: "day-4",
    date: "22 Jun",
    route: "Chakrata local",
    details: "Exploratory day trip across higher meadow belts.",
    stayName: "The Hosteller Chakrata",
    stayId: "h-hosteller",
    sightseeing: [
      "Moila Top (Meadows trek)",
      "Lokhandi Scenic Viewpoint",
      "Devban Valley (Dense pine forest wilderness)"
    ],
    seniorCitizenSuitability: {
      suitable: false,
      reason: "Moila top involves a 2 km uphill walk. Shripad and Shruti can relax around Lokhandi meadows with hot ginger tea."
    },
    notes: ["Carry plenty of water and standard woolens.", "No cellular coverage at Devban valley; keep cars in tight convoy."],
    foodSuggestions: ["Devban roadside local dumplings", "Hot Kadha milk at Lokhandi tea-stalls"],
    photoSpots: ["Budher Caves limestone entrance", "Snow peaks lining Lokhandi", "Moila green lush carpet valley"],
    completed: false
  },
  {
    id: "day-5",
    date: "23 Jun",
    route: "Chakrata → Hanol",
    details: "Drive alongside the Tons river to the historic village of Hanol. Devout temple visits.",
    stayName: "Nautiyal Homestay Hanol",
    stayId: "h-nautiyal",
    contact: "9411171523",
    sightseeing: [
      "Mahasu Devta Temple (9th-century architecture)",
      "Pawasi Maharaj Temple",
      "Bheem ke Kanche (Mythological stone marbles)",
      "Tons river valley stroll",
      "Mahaprasad Feast at Temple (8:15 PM – 8:30 PM)"
    ],
    seniorCitizenSuitability: {
      suitable: true,
      reason: "Temple steps are gradual and fitted with solid iron railings. Traditional wooden homestay offers ground-floor rooms."
    },
    notes: [
      "Maintain respectful traditional attire for the Mahasu Devta temple entry.",
      "Mahaprasad serves free delicious community dinner strictly between 8:15 PM and 8:30 PM."
    ],
    foodSuggestions: ["Temple Mahaprasad (highly recommended)", "Nautiyal Homestay hot home-style meals"],
    photoSpots: ["Mahasu Devta intricately carved wooden facade", "Sunset casting shadows on Tons riverbed"],
    completed: false
  },
  {
    id: "day-6",
    date: "24 Jun",
    route: "Hanol → Mussoorie",
    details: "Longest driving stretch of the trip. Stop at Lakha Mandal Shiv temple. Reach Mussoorie by evening.",
    stayName: "Zostel Mussoorie",
    stayId: "h-zostel",
    sightseeing: [
      "Lakha Mandal Shiv Temple (Ancient archaeological temples)",
      "Kempty Falls (On route)",
      "Mussoorie Mall Road evening stroll"
    ],
    seniorCitizenSuitability: {
      suitable: true,
      reason: "Mussoorie is a standard city. Lakha Mandal has soft flat walkways, perfect for elder exploration."
    },
    notes: [
      "Leave Hanol by 7:30 AM to beat the mid-day mountain traffic at Yamuna bridge.",
      "Car parking in Mussoorie is difficult. Coordinate with Zostel Mussoorie for reserved spots."
    ],
    foodSuggestions: ["Garhwali local snacks at Lakha Mandal", "Tibetan momos and Thukpa on Mussoorie Mall Road"],
    photoSpots: ["Lakha Mandal hundreds of small stone lingams", "Mussoorie valley lighting up like twinkling stars at dusk"],
    completed: false
  },
  {
    id: "day-7",
    date: "25 Jun",
    route: "Mussoorie → Dehradun → Haridwar",
    details: "Drive down to Dehradun. Return Gocars self-drives. Travel to Haridwar. Attend spectacular Ganga Aarti.",
    stayName: "Haridwar Hotel",
    stayId: "h-haridwar",
    sightseeing: [
      "Ganga Aarti at Har Ki Pauri ghats",
      "Haridwar local temples",
      "Moti Bazar spiritual shopping trail"
    ],
    seniorCitizenSuitability: {
      suitable: true,
      reason: "Wheelchairs can be rented at Har Ki Pauri with supportive helpers if required. Walking is flat on the river ghats."
    },
    notes: [
      "Ganga Aarti begins around 6:30 PM. Arrive at Har Ki Pauri by 5:00 PM to secure a proper sitting spot.",
      "Beware of local crowds and secure all pockets/wallets carefully."
    ],
    foodSuggestions: ["Legendary Chhole Bhature and Lassi at Haridwar", "Aloo Kachori at Mohan Ji Poori Wale"],
    photoSpots: ["Spiritual row of brass diwali torches at Har Ki Pauri", "Ganga river reflecting thousands of floating marigold candles"],
    completed: false
  },
  {
    id: "day-8",
    date: "26 Jun",
    route: "Haridwar → Delhi → Mumbai",
    details: "Early morning boarding of train or bus back to Delhi. Group boards overnight return train to Mumbai.",
    stayName: "Train Bed",
    sightseeing: ["Conversations about the trip", "Reviewing clicks and snaps", "Rest & unwinding"],
    seniorCitizenSuitability: {
      suitable: true,
      reason: "Train beds are comfortable. Ensure heavy bags are neatly stacked below the seat level."
    },
    notes: ["Double check that no charging cables/hotel keys are accidentally pocketed.", "Keep all train tickets handy inside PWA Wallet."],
    foodSuggestions: ["Railway station packing snacks", "Hot tea & mathri"],
    photoSpots: ["Haridwar railway junction group photo", "Sunset from moving railway coach"],
    completed: false
  },
  {
    id: "day-9",
    date: "27 Jun",
    route: "Mumbai arrival",
    details: "Train arrives in Mumbai in the morning. Return home safely, share final settlements, upload folders.",
    stayName: "Home Sweets Home",
    sightseeing: ["Homecoming hugs", "Unpacking local souvenirs"],
    seniorCitizenSuitability: {
      suitable: true,
      reason: "Home sweet home."
    },
    notes: ["Review expense splits on BharatBhraman App.", "Initiate instant GPay settlements via simple copy-message."],
    foodSuggestions: ["Home-made warm lunch"],
    photoSpots: ["Final terminal high-fives", "Family group photo with the Garhwali skull caps"],
    completed: false
  }
];

// Seed sample initial expenses for visual appeal and calculation proof
export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "e-1",
    title: "Vande Bharat Tickets (Delhi to Dehradun)",
    amount: 11200,
    paidBy: "m-sanket",
    date: "2024-06-20",
    category: "Transport",
    location: "Anand Vihar, Delhi",
    notes: "Vande Bharat CC tickets booked for 8 family members",
    splitType: SplitType.EQUAL,
    participants: INITIAL_MEMBERS.map(m => ({ memberId: m.id, amount: 1400 })),
    linkedDayId: "day-2"
  },
  {
    id: "e-2",
    title: "Kamini Homestay Booking Advance",
    amount: 2000,
    paidBy: "m-sanket",
    date: "2024-06-15",
    category: "Stay",
    location: "Dehradun",
    notes: "Initial advance paid via GPay",
    splitType: SplitType.ROOM_WISE, // Will allocate custom based on room count
    participants: [
      { memberId: "m-sanket", amount: 666.67 },
      { memberId: "m-sneha", amount: 0 },
      { memberId: "m-shripad", amount: 0 },
      { memberId: "m-shruti", amount: 0 }, // Family 1 takes 1 room, shares 666.67
      { memberId: "m-milind", amount: 333.33 },
      { memberId: "m-vaishali", amount: 333.34 }, // Family 2 takes 1 room
      { memberId: "m-sharad", amount: 333.33 },
      { memberId: "m-sharayu", amount: 333.33 }  // Family 3 takes 1 room
    ],
    linkedDayId: "day-2"
  },
  {
    id: "e-3",
    title: "Gocars Car Rentals (Altroz + i20)",
    amount: 16500,
    paidBy: "m-milind",
    date: "2024-06-21",
    category: "Transport",
    location: "Dehradun",
    splitType: SplitType.VEHICLE_WISE,
    notes: "Security deposit and initial rental fees",
    participants: INITIAL_MEMBERS.map(m => ({ memberId: m.id, amount: 2062.5 })),
    linkedDayId: "day-3"
  },
  {
    id: "e-4",
    title: "Dinner at Hosteller Chakrata",
    amount: 4200,
    paidBy: "m-sharad",
    date: "2014-06-21",
    category: "Food",
    location: "Chakrata",
    splitType: SplitType.EQUAL,
    participants: INITIAL_MEMBERS.map(m => ({ memberId: m.id, amount: 525 })),
    linkedDayId: "day-3"
  },
  {
    id: "e-5",
    title: "Fuel Refill Dehradun-Chakrata road",
    amount: 3200,
    paidBy: "m-milind",
    date: "2024-06-21",
    category: "Fuel",
    location: "Kalsi fuel station",
    splitType: SplitType.EQUAL,
    participants: INITIAL_MEMBERS.map(m => ({ memberId: m.id, amount: 400 })),
    linkedDayId: "day-3"
  }
];

// Seed sample initial personal transfers to represent settlements in action
export const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: "t-1",
    from: "m-sanket",
    to: "m-milind",
    amount: 4000,
    date: "2024-06-21",
    note: "Initial car rental advance pooling"
  },
  {
    id: "t-2",
    from: "m-sharayu",
    to: "m-sharad",
    amount: 1500,
    date: "2024-06-20",
    note: "Couple adjustment cash pool"
  }
];

// Seed Document Wallets
export const INITIAL_DOCUMENTS: UploadedDocument[] = [
  {
    id: "doc-1",
    name: "Vande Bharat E-Ticket.pdf",
    type: "ticket",
    url: "#",
    uploadedBy: "Sanket",
    date: "15 Jun 2024",
    size: "1.2 MB",
    linkedDayId: "day-2"
  },
  {
    id: "doc-2",
    name: "Gocars Rent Agreement.pdf",
    type: "car_doc",
    url: "#",
    uploadedBy: "Milind",
    date: "21 Jun 2024",
    size: "820 KB",
    linkedDayId: "day-3"
  },
  {
    id: "doc-3",
    name: "The Hosteller Booking.png",
    type: "voucher",
    url: "#",
    uploadedBy: "Sanket",
    date: "12 Jun 2024",
    size: "1.8 MB",
    linkedDayId: "day-3"
  }
];

export const INITIAL_MEMORIES: Memory[] = [
  {
    id: "mem-1",
    type: "photo",
    title: "Vande Bharat Departure",
    description: "Ready to explore Uttarakhand! Shripad and Shruti having breakfast onboard.",
    url: "https://images.unsplash.com/photo-1590642916589-592bca10dfbf?w=500&auto=format&fit=crop",
    location: "Anand Vihar, Delhi",
    date: "20 Jun 2024",
    loves: 5,
    authorId: "m-sanket"
  },
  {
    id: "mem-2",
    type: "photo",
    title: "Tiger Falls view",
    description: "The roaring majestic Tiger Falls cascade, breathtaking mountain weather around.",
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop",
    location: "Chakrata",
    date: "21 Jun 2024",
    loves: 8,
    authorId: "m-sneha"
  },
  {
    id: "mem-3",
    type: "diary",
    title: "Chakrata Evening Stroll Diary",
    description: "Enjoying the incredible misty sunset overlay at Chilmiri Neck. Shripad loved the calm evening air.",
    url: "",
    location: "Chilmiri Neck, Chakrata",
    date: "21 Jun 2024",
    loves: 4,
    authorId: "m-shruti"
  }
];
