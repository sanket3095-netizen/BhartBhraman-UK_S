/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from "pg";
import { Expense, Hotel, PackingItem, Memory } from "../types.ts";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let databaseInitialized = false;

/**
 * Lazily retrieves the database connection pool.
 * Falls back to check both DATABASE_URL (standard) and POSTGRES_URL (Vercel-specific).
 */
export function getPool(): pg.Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("CRITICAL: DATABASE_URL or POSTGRES_URL environment variable is missing.");
    throw new Error(
      "Database URL not configured. Please add DATABASE_URL or POSTGRES_URL in your Secrets/Environment variables."
    );
  }

  // Neon serverless postgres requires SSL configured for general safety
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Prevents certificate self-signed check failures on Serverless setups
    },
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL pool client:", err);
  });

  return pool;
}

/**
 * Initializes the database tables if they do not exist.
 * Ensures the 'expenses' table matches our React state Expense interface.
 */
export async function initDatabase(): Promise<void> {
  if (databaseInitialized) {
    return;
  }

  try {
    const dbPool = getPool();
    console.log("Initializing PostgreSQL database and verifying tables...");

    // 1. Create expenses table
    const createExpensesQuery = `
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        paid_by VARCHAR(50) NOT NULL,
        multiple_payers TEXT,
        date VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        notes TEXT,
        split_type VARCHAR(50) NOT NULL,
        participants TEXT NOT NULL,
        linked_day_id VARCHAR(50),
        bill_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await dbPool.query(createExpensesQuery);

    // 2. Create hotels table
    const createHotelsQuery = `
      CREATE TABLE IF NOT EXISTS hotels (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        contact VARCHAR(100),
        map_link TEXT,
        room_allocation TEXT,
        check_in VARCHAR(55) NOT NULL,
        check_out VARCHAR(55) NOT NULL,
        booking_status VARCHAR(50) DEFAULT 'Confirmed',
        booking_amount NUMERIC(12, 2) DEFAULT 0,
        advance_paid NUMERIC(12, 2) DEFAULT 0,
        pending_amount NUMERIC(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await dbPool.query(createHotelsQuery);

    // 3. Create packing_items table
    const createPackingQuery = `
      CREATE TABLE IF NOT EXISTS packing_items (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        status BOOLEAN DEFAULT FALSE,
        packed_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await dbPool.query(createPackingQuery);

    // Seed default hotels if missing
    const hotelCheck = await dbPool.query("SELECT COUNT(*) FROM hotels;");
    if (parseInt(hotelCheck.rows[0].count) === 0) {
      console.log("Seeding default hotels into PostgreSQL...");
      const insertHotelQuery = `
        INSERT INTO hotels (id, name, location, contact, room_allocation, check_in, check_out, booking_status, booking_amount, advance_paid, pending_amount)
        VALUES 
        ('h-kamini', 'Kamini Homestay', 'Dehradun, Uttarakhand', 'To be confirmed', '3 Spacious Rooms (Family 1: 1 room, Family 2: 1 room, Family 3: 1 room)', '20 Jun 2024', '21 Jun 2024', 'Confirmed', 4500, 2000, 2500),
        ('h-hosteller', 'The Hosteller Chakrata', 'Chakrata, Uttarakhand', '09358214531 / Customer Care', '3 Premium Wooden Cottages (Family 1: Cottage A, Family 2: Cottage B, Family 3: Cottage C)', '21 Jun 2024', '23 Jun 2024', 'Confirmed', 18000, 8000, 10000),
        ('h-nautiyal', 'Nautiyal Homestay Hanol', 'Hanol (Near Mahasu Devta Temple)', '9411171523', 'Traditional Homestay (Shared Family Suite & Bed-wise setups)', '23 Jun 2024', '24 Jun 2024', 'Confirmed', 3500, 1500, 2000),
        ('h-zostel', 'Zostel Mussoorie', 'Mussoorie, Uttarakhand', 'To be confirmed', '1 Quad Private Room (Family 1) + 2 Double Rooms (Family 2, Family 3)', '24 Jun 2024', '25 Jun 2024', 'Confirmed', 12500, 5000, 7500),
        ('h-haridwar', 'Haridwar Hotel', 'Haridwar (Near Har Ki Pauri)', 'To be confirmed', 'To be confirmed', '25 Jun 2024', '26 Jun 2024', 'Confirmed', 6000, 3000, 3000);
      `;
      await dbPool.query(insertHotelQuery);
    }

    // Seed default packing items if missing
    const packingCheck = await dbPool.query("SELECT COUNT(*) FROM packing_items;");
    if (parseInt(packingCheck.rows[0].count) === 0) {
      console.log("Seeding high-altitude Uttarakhand family packing checklist...");
      const insertPackingQuery = `
        INSERT INTO packing_items (id, title, category, status, packed_by)
        VALUES
        ('p-1', 'Woolen sweaters and windproof jacket', 'Clothing', FALSE, NULL),
        ('p-2', 'Raincoat / compact umbrella for mountain showers', 'Clothing', FALSE, NULL),
        ('p-3', 'Comfortable trekking / walking shoes with grip', 'Clothing', FALSE, NULL),
        ('p-4', 'Warm socks & thermal wear', 'Clothing', FALSE, NULL),
        ('p-5', 'Power bank (20000mAh for travel)', 'Electronics', FALSE, NULL),
        ('p-6', 'Mobile chargers & multiple port socket', 'Electronics', FALSE, NULL),
        ('p-7', 'Universal adapter and car mobile mounts', 'Electronics', FALSE, NULL),
        ('p-8', 'Flashlight / headlight with extra batteries', 'Electronics', FALSE, NULL),
        ('p-9', 'Original Aadhar Cards / Government Identity Proofs', 'Documents', FALSE, NULL),
        ('p-10', 'Hotel booking vouchers & cab details', 'Documents', FALSE, NULL),
        ('p-11', 'Printed physical itinerary copy for safety', 'Documents', FALSE, NULL),
        ('p-12', 'Motion sickness pills (must-have for hill roads)', 'Health & Toiletries', FALSE, NULL),
        ('p-13', 'Sunscreen SPF 50+ & bug repellent', 'Health & Toiletries', FALSE, NULL),
        ('p-14', 'First aid kit (Painkillers, Bandages, ORS sachets)', 'Health & Toiletries', FALSE, NULL),
        ('p-15', 'Lip balm, cold cream, and basic toiletries', 'Health & Toiletries', FALSE, NULL);
      `;
      await dbPool.query(insertPackingQuery);
    }

    // 4. Create memories (shared group photo albums and travel logs) table
    const createMemoriesQuery = `
      CREATE TABLE IF NOT EXISTS memories (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        date VARCHAR(100) NOT NULL,
        loves INTEGER DEFAULT 0,
        author_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await dbPool.query(createMemoriesQuery);

    // Safely upgrade existing old schema if there's any pre-existing custom memories table
    try {
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'photo';`);
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '';`);
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS description TEXT;`);
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS url TEXT DEFAULT '';`);
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT '';`);
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS date VARCHAR(100) DEFAULT '';`);
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS loves INTEGER DEFAULT 0;`);
      await dbPool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS author_id VARCHAR(100) DEFAULT '';`);
    } catch (alterErr) {
      console.warn("Could not alter tables (columns might already match perfectly):", alterErr);
    }

    // Seed default memories if missing
    const memoriesCheck = await dbPool.query("SELECT COUNT(*) FROM memories;");
    if (parseInt(memoriesCheck.rows[0].count) === 0) {
      console.log("Seeding default memories into PostgreSQL...");
      const insertMemoriesQuery = `
        INSERT INTO memories (id, type, title, description, url, location, date, loves, author_id)
        VALUES 
        ('mem-1', 'photo', 'Vande Bharat Departure', 'Ready to explore Uttarakhand! Shripad and Shruti having breakfast onboard.', 'https://images.unsplash.com/photo-1590642916589-592bca10dfbf?w=500&auto=format&fit=crop', 'Anand Vihar, Delhi', '20 Jun 2024', 5, 'm-sanket'),
        ('mem-2', 'photo', 'Tiger Falls view', 'The roaring majestic Tiger Falls cascade, breathtaking mountain weather around.', 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop', 'Chakrata', '21 Jun 2024', 8, 'm-sneha'),
        ('mem-3', 'diary', 'Chakrata Evening Stroll Diary', 'Enjoying the incredible misty sunset overlay at Chilmiri Neck. Shripad loved the calm evening air.', '', 'Chilmiri Neck, Chakrata', '21 Jun 2024', 4, 'm-shruti');
      `;
      await dbPool.query(insertMemoriesQuery);
    }

    console.log("PostgreSQL 'expenses', 'hotels', 'packing_items', and 'memories' tables verified successfully.");
    databaseInitialized = true;
  } catch (error: any) {
    console.error("Database initialization failed:", error);
    throw new Error(`Database initialization failed: ${error.message}`, { cause: error });
  }
}

/**
 * Fetches all expenses from the database, sorted by date/creation descending.
 */
export async function getExpenses(): Promise<Expense[]> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      SELECT id, title, amount, paid_by as "paidBy", multiple_payers as "multiplePayers",
             date, category, location, notes, split_type as "splitType",
             participants, linked_day_id as "linkedDayId", bill_url as "billUrl"
      FROM expenses
      ORDER BY date DESC, created_at DESC;
    `;

    const result = await dbPool.query(query);

    // Map database snake_case representation back to matching frontend TypeScript types
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      amount: Number(row.amount),
      paidBy: row.paidBy,
      multiplePayers: row.multiplePayers ? JSON.parse(row.multiplePayers) : undefined,
      date: row.date,
      category: row.category,
      location: row.location,
      notes: row.notes || undefined,
      splitType: row.splitType,
      participants: row.participants ? JSON.parse(row.participants) : [],
      linkedDayId: row.linkedDayId || undefined,
      billUrl: row.billUrl || undefined,
    }));
  } catch (error: any) {
    console.error("Failed to query expenses from PostgreSQL:", error);
    throw new Error(`Failed to query expenses: ${error.message}`, { cause: error });
  }
}

/**
 * Inserts a new expense or replaces an existing one (upsert).
 */
export async function saveExpense(expense: Expense): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      INSERT INTO expenses (
        id, title, amount, paid_by, multiple_payers, date, category,
        location, notes, split_type, participants, linked_day_id, bill_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        amount = EXCLUDED.amount,
        paid_by = EXCLUDED.paid_by,
        multiple_payers = EXCLUDED.multiple_payers,
        date = EXCLUDED.date,
        category = EXCLUDED.category,
        location = EXCLUDED.location,
        notes = EXCLUDED.notes,
        split_type = EXCLUDED.split_type,
        participants = EXCLUDED.participants,
        linked_day_id = EXCLUDED.linked_day_id,
        bill_url = EXCLUDED.bill_url;
    `;

    const values = [
      expense.id,
      expense.title,
      expense.amount,
      expense.paidBy,
      expense.multiplePayers ? JSON.stringify(expense.multiplePayers) : null,
      expense.date,
      expense.category,
      expense.location,
      expense.notes || null,
      expense.splitType,
      expense.participants ? JSON.stringify(expense.participants) : "[]",
      expense.linkedDayId || null,
      expense.billUrl || null,
    ];

    await dbPool.query(query, values);
    console.log(`Expense '${expense.title}' saved to PostgreSQL database.`);
  } catch (error: any) {
    console.error(`Failed to save expense '${expense.title}':`, error);
    throw new Error(`Failed to save expense: ${error.message}`, { cause: error });
  }
}

/**
 * Deletes an expense by its ID.
 */
export async function deleteExpense(id: string): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = "DELETE FROM expenses WHERE id = $1;";
    await dbPool.query(query, [id]);
    console.log(`Expense with ID '${id}' deleted from PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to delete expense with ID '${id}':`, error);
    throw new Error(`Failed to delete expense: ${error.message}`, { cause: error });
  }
}

/**
 * Fetches all hotels from the database, sorted by check_in date ascending.
 */
export async function getHotels(): Promise<Hotel[]> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      SELECT id, name, location, contact, map_link as "mapLink",
             room_allocation as "roomAllocation", check_in as "checkIn",
             check_out as "checkOut", booking_status as "bookingStatus",
             booking_amount as "bookingAmount", advance_paid as "advancePaid",
             pending_amount as "pendingAmount"
      FROM hotels
      ORDER BY check_in ASC, name ASC;
    `;

    const result = await dbPool.query(query);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      contact: row.contact || undefined,
      mapLink: row.mapLink || undefined,
      roomAllocation: row.roomAllocation || "",
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      bookingStatus: row.bookingStatus || "Confirmed",
      bookingAmount: row.bookingAmount ? Number(row.bookingAmount) : 0,
      advancePaid: row.advancePaid ? Number(row.advancePaid) : 0,
      pendingAmount: row.pendingAmount ? Number(row.pendingAmount) : 0,
    }));
  } catch (error: any) {
    console.error("Failed to query hotels from PostgreSQL:", error);
    throw new Error(`Failed to query hotels: ${error.message}`, { cause: error });
  }
}

/**
 * Saves/updates a hotel (upsert).
 */
export async function saveHotel(hotel: Hotel): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      INSERT INTO hotels (
        id, name, location, contact, map_link, room_allocation,
        check_in, check_out, booking_status, booking_amount, advance_paid, pending_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        location = EXCLUDED.location,
        contact = EXCLUDED.contact,
        map_link = EXCLUDED.map_link,
        room_allocation = EXCLUDED.room_allocation,
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        booking_status = EXCLUDED.booking_status,
        booking_amount = EXCLUDED.booking_amount,
        advance_paid = EXCLUDED.advance_paid,
        pending_amount = EXCLUDED.pending_amount;
    `;

    const values = [
      hotel.id,
      hotel.name,
      hotel.location,
      hotel.contact || null,
      hotel.mapLink || null,
      hotel.roomAllocation || "",
      hotel.checkIn,
      hotel.checkOut,
      hotel.bookingStatus || "Confirmed",
      hotel.bookingAmount || 0,
      hotel.advancePaid || 0,
      hotel.pendingAmount || 0,
    ];

    await dbPool.query(query, values);
    console.log(`Hotel '${hotel.name}' saved to PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to save hotel '${hotel.name}':`, error);
    throw new Error(`Failed to save hotel: ${error.message}`, { cause: error });
  }
}

/**
 * Deletes a hotel from the database.
 */
export async function deleteHotel(id: string): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = "DELETE FROM hotels WHERE id = $1;";
    await dbPool.query(query, [id]);
    console.log(`Hotel with ID '${id}' deleted from PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to delete hotel with ID '${id}':`, error);
    throw new Error(`Failed to delete hotel: ${error.message}`, { cause: error });
  }
}

/**
 * Fetches all packing items from the database.
 */
export async function getPackingItems(): Promise<PackingItem[]> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      SELECT id, title, category, status, packed_by as "packedBy"
      FROM packing_items
      ORDER BY category ASC, title ASC;
    `;

    const result = await dbPool.query(query);

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      status: !!row.status,
      packedBy: row.packedBy || undefined,
    }));
  } catch (error: any) {
    console.error("Failed to query packing items from PostgreSQL:", error);
    throw new Error(`Failed to query packing items: ${error.message}`, { cause: error });
  }
}

/**
 * Saves/updates a packing item (upsert).
 */
export async function savePackingItem(item: PackingItem): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      INSERT INTO packing_items (id, title, category, status, packed_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        packed_by = EXCLUDED.packed_by;
    `;

    const values = [
      item.id,
      item.title,
      item.category,
      item.status,
      item.packedBy || null,
    ];

    await dbPool.query(query, values);
    console.log(`Packing item '${item.title}' saved to PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to save packing item '${item.title}':`, error);
    throw new Error(`Failed to save packing item: ${error.message}`, { cause: error });
  }
}

/**
 * Deletes a packing item from the database.
 */
export async function deletePackingItem(id: string): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = "DELETE FROM packing_items WHERE id = $1;";
    await dbPool.query(query, [id]);
    console.log(`Packing item with ID '${id}' deleted from PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to delete packing item with ID '${id}':`, error);
    throw new Error(`Failed to delete packing item: ${error.message}`, { cause: error });
  }
}

/**
 * Fetches all memories from the database.
 */
export async function getMemories(): Promise<Memory[]> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      SELECT id, type, title, description, url, location, date, loves, author_id as "authorId"
      FROM memories
      ORDER BY created_at DESC;
    `;

    const result = await dbPool.query(query);

    return result.rows.map((row) => ({
      id: row.id,
      type: (row.type || "photo") as "photo" | "diary" | "video",
      title: row.title || "Untitled",
      description: row.description || undefined,
      url: row.url || "",
      location: row.location || "Uttarakhand",
      date: row.date || "",
      loves: Number(row.loves) || 0,
      authorId: row.authorId || row.author_id || "",
    }));
  } catch (error: any) {
    console.error("Failed to query memories from PostgreSQL:", error);
    throw new Error(`Failed to query memories: ${error.message}`, { cause: error });
  }
}

/**
 * Saves/updates a memory (upsert).
 */
export async function saveMemory(memory: Memory): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      INSERT INTO memories (id, type, title, description, url, location, date, loves, author_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        location = EXCLUDED.location,
        date = EXCLUDED.date,
        loves = EXCLUDED.loves,
        author_id = EXCLUDED.author_id;
    `;

    const values = [
      memory.id,
      memory.type,
      memory.title,
      memory.description || null,
      memory.url || "",
      memory.location,
      memory.date,
      memory.loves || 0,
      memory.authorId,
    ];

    await dbPool.query(query, values);
    console.log(`Memory '${memory.title}' saved to PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to save memory '${memory.title}':`, error);
    throw new Error(`Failed to save memory: ${error.message}`, { cause: error });
  }
}

/**
 * Increments the love count of a memory by its ID.
 */
export async function loveMemory(id: string): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = `
      UPDATE memories
      SET loves = loves + 1
      WHERE id = $1;
    `;

    await dbPool.query(query, [id]);
    console.log(`Memory with ID '${id}' loved in PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to love memory with ID '${id}':`, error);
    throw new Error(`Failed to love memory: ${error.message}`, { cause: error });
  }
}

/**
 * Deletes a memory from the database.
 */
export async function deleteMemory(id: string): Promise<void> {
  await initDatabase();
  const dbPool = getPool();

  try {
    const query = "DELETE FROM memories WHERE id = $1;";
    await dbPool.query(query, [id]);
    console.log(`Memory with ID '${id}' deleted from PostgreSQL.`);
  } catch (error: any) {
    console.error(`Failed to delete memory with ID '${id}':`, error);
    throw new Error(`Failed to delete memory: ${error.message}`, { cause: error });
  }
}
