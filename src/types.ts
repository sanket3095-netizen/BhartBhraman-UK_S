/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Family {
  id: string;
  name: string;
  members: string[]; // Member IDs
}

export interface Member {
  id: string;
  name: string;
  familyId: string;
  avatar: string; // Emoji or initial
}

export interface ItineraryDay {
  id: string; // e.g., "day-19-jun"
  date: string; // e.g., "19 Jun"
  route: string; // e.g., "Mumbai → Delhi"
  details: string; // e.g., "Overnight train"
  stayName: string;
  stayId?: string;
  contact?: string;
  sightseeing: string[];
  seniorCitizenSuitability: {
    suitable: boolean;
    reason: string;
  };
  notes: string[];
  foodSuggestions?: string[];
  photoSpots?: string[];
  completed?: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  contact?: string;
  mapLink?: string;
  roomAllocation: string;
  checkIn: string;
  checkOut: string;
  bookingAmount?: number;
  advancePaid?: number;
  pendingAmount?: number;
}

export enum SplitType {
  EQUAL = "EQUAL",
  SELECTED_PEOPLE = "SELECTED_PEOPLE",
  FAMILY_WISE = "FAMILY_WISE",
  COUPLE_WISE = "COUPLE_WISE",
  ROOM_WISE = "ROOM_WISE",
  EXACT_AMOUNT = "EXACT_AMOUNT",
  PERCENTAGE = "PERCENTAGE",
  WEIGHTED = "WEIGHTED",
  VEHICLE_WISE = "VEHICLE_WISE"
}

export interface ExpenseParticipant {
  memberId: string;
  amount: number; // calculated sharing
  percentage?: number; // for percentage split
  weight?: number; // for weighted split
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // Member ID of the main payer
  multiplePayers?: Record<string, number>; // memberId -> amount paid, for multiple payers
  date: string;
  category: "Stay" | "Food" | "Transport" | "Sightseeing" | "Fuel" | "Miscellaneous" | "Toll";
  location: string;
  notes?: string;
  splitType: SplitType;
  participants: ExpenseParticipant[];
  linkedDayId?: string;
  billUrl?: string; // base64 or placeholder url
}

export interface Transfer {
  id: string;
  from: string; // Member ID
  to: string; // Member ID
  amount: number;
  date: string;
  note?: string;
  proofUrl?: string; // base64 receipt
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: "bill" | "ticket" | "voucher" | "fuel" | "car_doc" | "id_proof" | "screenshot";
  url: string; // file base64 or link
  uploadedBy: string; // Member name
  date: string;
  size?: string;
  linkedExpenseId?: string;
  linkedDayId?: string;
}

export interface Memory {
  id: string;
  type: "photo" | "video" | "diary";
  title: string;
  description?: string;
  url: string; // url or base64 photo
  location: string;
  date: string;
  loves: number;
  authorId: string; // Member ID
}

export interface Settlement {
  from: string; // Member ID
  to: string; // Member ID
  amount: number;
  reason: string;
  status: "pending" | "completed";
}

// Net balances for debt calculations
export interface MemberBalance {
  memberId: string;
  paid: number;
  owed: number;
  net: number; // positive means they get money back, negative means they owe
}

export interface FamilyBalance {
  familyId: string;
  familyName: string;
  paid: number;
  owed: number;
  net: number;
}
