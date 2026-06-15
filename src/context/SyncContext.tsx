/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, 
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc,
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { db, auth, OperationType, handleFirestoreError } from "../firebase";
import { 
  Member, 
  Family, 
  ItineraryDay, 
  Hotel, 
  Expense, 
  Transfer, 
  UploadedDocument, 
  Memory, 
  PackingItem 
} from "../types";
import { 
  INITIAL_MEMBERS, 
  INITIAL_FAMILIES, 
  INITIAL_HOTELS, 
  INITIAL_ITINERARY, 
  INITIAL_EXPENSES, 
  INITIAL_TRANSFERS, 
  INITIAL_DOCUMENTS, 
  INITIAL_MEMORIES, 
  INITIAL_PACKING_ITEMS 
} from "../data/initialData";

export type SyncStatusType = 
  | "Online & Synced"
  | "Syncing"
  | "Offline - pending changes"
  | "Firebase not configured";

interface SyncContextProps {
  syncStatus: SyncStatusType;
  activeUser: Member | null;
  setActiveUser: (member: Member | null) => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isPasscodeVerified: boolean;
  loginError: string | null;
  attemptLogin: (memberId: string, passcode: string) => Promise<boolean>;
  logout: () => void;
  firebaseError: string | null;
  tryEnableFirebase: () => Promise<boolean>;

  // Live Trip Metadata
  tripStartDate: string;
  tripEndDate: string;
  updateTripDates: (start: string, end: string) => Promise<void>;

  // Data collections
  members: Member[];
  families: Family[];
  itinerary: ItineraryDay[];
  expenses: Expense[];
  transfers: Transfer[];
  documents: UploadedDocument[];
  memories: Memory[];
  packing: PackingItem[];
  hotels: Hotel[];

  // Mutators
  saveExpense: (expense: Omit<Expense, "id"> & { id?: string }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  saveTransfer: (transfer: Omit<Transfer, "id"> & { id?: string }) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
  
  saveDocument: (doc: Omit<UploadedDocument, "id"> & { id?: string }) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  saveMemory: (memory: Omit<Memory, "id"> & { id?: string }) => Promise<void>;
  loveMemory: (id: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  
  savePackingItem: (item: Omit<PackingItem, "id"> & { id?: string }) => Promise<void>;
  deletePackingItem: (id: string) => Promise<void>;
  togglePackingItem: (item: PackingItem) => Promise<void>;
  
  saveHotel: (hotel: Omit<Hotel, "id"> & { id?: string }) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
  
  toggleItineraryComplete: (dayId: string) => Promise<void>;
  addItineraryNote: (dayId: string, noteText: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

const TRIP_ID = "uttarakhand-2026-family-trip";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>("Syncing");
  const [activeUser, setActiveUserState] = useState<Member | null>(null);
  const [isPasscodeVerified, setIsPasscodeVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem("bb_passcode_verified") === "true";
    } catch {
      return false;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // States
  const [tripStartDate, setTripStartDate] = useState<string>("2026-06-19");
  const [tripEndDate, setTripEndDate] = useState<string>("2026-06-27");
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [families] = useState<Family[]>(INITIAL_FAMILIES);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [packing, setPacking] = useState<PackingItem[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  // Track map of collections with pending writes to calculate aggregate sync state
  const [pendingCollections, setPendingCollections] = useState<Record<string, boolean>>({});

  // Local storage caching fallbacks loaded synchronously on first boot
  useEffect(() => {
    try {
      const activeUserCached = localStorage.getItem("bb_active_user");
      if (activeUserCached) {
        setActiveUserState(JSON.parse(activeUserCached));
      }

      const cachedItinerary = localStorage.getItem("bb_itinerary");
      if (cachedItinerary) setItinerary(JSON.parse(cachedItinerary));
      else setItinerary(INITIAL_ITINERARY);

      const cachedExpenses = localStorage.getItem("bb_expenses");
      if (cachedExpenses) setExpenses(JSON.parse(cachedExpenses));
      else setExpenses(INITIAL_EXPENSES);

      const cachedTransfers = localStorage.getItem("bb_transfers");
      if (cachedTransfers) setTransfers(JSON.parse(cachedTransfers));
      else setTransfers(INITIAL_TRANSFERS);

      const cachedDocuments = localStorage.getItem("bb_documents");
      if (cachedDocuments) setDocuments(JSON.parse(cachedDocuments));
      else setDocuments(INITIAL_DOCUMENTS);

      const cachedMemories = localStorage.getItem("bb_memories");
      if (cachedMemories) setMemories(JSON.parse(cachedMemories));
      else setMemories(INITIAL_MEMORIES);

      const cachedPacking = localStorage.getItem("bb_packing");
      if (cachedPacking) setPacking(JSON.parse(cachedPacking));
      else setPacking(INITIAL_PACKING_ITEMS);

      const cachedHotels = localStorage.getItem("bb_hotels");
      if (cachedHotels) setHotels(JSON.parse(cachedHotels));
      else setHotels(INITIAL_HOTELS);

      const cachedStart = localStorage.getItem("bb_trip_start");
      const cachedEnd = localStorage.getItem("bb_trip_end");
      if (cachedStart) setTripStartDate(cachedStart);
      if (cachedEnd) setTripEndDate(cachedEnd);
    } catch (e) {
      console.warn("Storage read error on initialization:", e);
    }
  }, []);

  const setActiveUser = (member: Member | null) => {
    setActiveUserState(member);
    if (member) {
      localStorage.setItem("bb_active_user", JSON.stringify(member));
    } else {
      localStorage.removeItem("bb_active_user");
    }
  };

  // Auth Listener
  useEffect(() => {
    if (!isPasscodeVerified) {
      setIsAuthenticated(false);
      setIsInitializing(false);
      return;
    }

    let authUnsubscribed = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (authUnsubscribed) return;

      if (user) {
        setIsAuthenticated(true);
        setFirebaseError(null);
        setIsInitializing(false);
      } else {
        const activeUserCached = localStorage.getItem("bb_active_user");
        if (activeUserCached) {
          // Attempt silent auto-reconnect of anonymous session
          try {
            await signInAnonymously(auth);
            // This will trigger onAuthStateChanged again with user
          } catch (err: any) {
            console.error("Auto anonymous sign-in failed:", err);
            if (
              err.code === "auth/admin-restricted-operation" ||
              err.message?.includes("admin-restricted-operation") ||
              err.code?.includes("restricted-operation") ||
              err?.message?.includes("configuration") ||
              err?.message?.includes("not enabled")
            ) {
              setFirebaseError(`Firebase sync not connected: ${err.message || err.code}`);
            } else if (!navigator.onLine) {
              // Network is down but user session is cached: allow using offline cache
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
            }
            setIsInitializing(false);
          }
        } else {
          setIsAuthenticated(false);
          setIsInitializing(false);
        }
      }
    });

    return () => {
      authUnsubscribed = true;
      unsubscribe();
    };
  }, [isPasscodeVerified]);

  // Monitor network connectivity and pending writes of all Firestore listeners
  useEffect(() => {
    if (firebaseError) {
      setSyncStatus("Firebase not configured");
      return;
    }
    if (isInitializing) {
      setSyncStatus("Syncing");
      return;
    }
    if (!navigator.onLine) {
      setSyncStatus("Offline - pending changes");
      return;
    }

    const hasAnyPending = Object.values(pendingCollections).some(Boolean);
    if (hasAnyPending) {
      setSyncStatus("Syncing");
    } else {
      setSyncStatus("Online & Synced");
    }
  }, [firebaseError, isInitializing, pendingCollections]);

  // Login handler
  const attemptLogin = async (memberId: string, passcode: string): Promise<boolean> => {
    setLoginError(null);
    const cleanedCode = passcode.trim().toLowerCase();
    
    // Group secure travel passcode gate validation
    if (!isPasscodeVerified) {
      if (cleanedCode !== "uttarakhand2026" && cleanedCode !== "uk2026") {
        setLoginError("Invalid private group passcode! Ask Sanket for the correct code.");
        return false;
      }
      try {
        localStorage.setItem("bb_passcode_verified", "true");
      } catch {}
      setIsPasscodeVerified(true);
    }

    const found = INITIAL_MEMBERS.find((m) => m.id === memberId);

    try {
      const userCredential = await signInAnonymously(auth);
      if (userCredential.user) {
        if (found) {
          setActiveUser(found);
        }
        setIsAuthenticated(true);
        setFirebaseError(null);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Manual sign in anonymously failed:", err);
      if (
        err.code === "auth/admin-restricted-operation" ||
        err.message?.includes("admin-restricted-operation") ||
        err.code?.includes("restricted-operation") ||
        err.message?.includes("not enabled") ||
        err.message?.includes("configuration")
      ) {
        setFirebaseError(`Firebase sync not connected: Anonymous authentication is not enabled in Firebase project.`);
        setLoginError(`Firebase sync not connected: Anonymous Auth is disabled in the console. Ask Sanket to enable it in the Firebase Console.`);
      } else {
        setLoginError(`Authentication failed: ${err.message}`);
      }
      return false;
    }
  };

  const tryEnableFirebase = async (): Promise<boolean> => {
    try {
      const userCredential = await signInAnonymously(auth);
      if (userCredential.user) {
        setFirebaseError(null);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (e: any) {
      console.warn("Manual Firebase sync reconnection attempt failed:", e);
      return false;
    }
  };

  const logout = () => {
    try {
      auth.signOut();
    } catch {}
    setActiveUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem("bb_active_user");
    } catch {}
  };

  // ---------------- FIRESTORE SEEDING & SNAPSHOTTING ----------------
  useEffect(() => {
    if (!isAuthenticated) return;
    if (firebaseError) return;

    setSyncStatus("Syncing");

    const tripRef = doc(db, "trips", TRIP_ID);

    // 1. Snapshot Trip Details (dates)
    const unsubTrip = onSnapshot(tripRef, async (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.tripStartDate) setTripStartDate(d.tripStartDate);
        if (d.tripEndDate) setTripEndDate(d.tripEndDate);
      } else {
        // Seed initial trip meta doc
        try {
          await setDoc(tripRef, {
            id: TRIP_ID,
            title: "Uttarakhand Family Trip",
            tripStartDate: "2026-06-19",
            tripEndDate: "2026-06-27",
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } catch (e) {
          console.error("Failed to seed trip document:", e);
        }
      }
    }, (error) => {
      setFirebaseError(`Firestore path trips/${TRIP_ID} failed: ${error.message}`);
      try {
        handleFirestoreError(error, OperationType.GET, `trips/${TRIP_ID}`);
      } catch (e) {
        console.error("Suppressed snapshot callback throw to avoid React crash:", e);
      }
    });

    // Subcollection helper with dynamic caching and metadata pendingWrites tracking
    const setupSubCollectionListener = <T extends { id: string; updatedAt?: number }>(
      colName: string,
      initialDataset: T[],
      stateSetter: React.Dispatch<React.SetStateAction<T[]>>,
      cacheKey: string
    ) => {
      const colRef = collection(db, "trips", TRIP_ID, colName);
      
      return onSnapshot(colRef, async (snap) => {
        // Track pending local writes
        setPendingCollections(prev => ({ ...prev, [colName]: snap.metadata.hasPendingWrites }));

        let items: T[] = [];
        snap.forEach((docSnap) => {
          items.push(docSnap.data() as T);
        });

        // Self-heal: If Firestore is empty or missing items from initialDataset,
        // write those missing ones to complete the set. This completely resolves cutoffs/interrupted seeds.
        const existingIds = new Set(items.map(item => item.id));
        const missingItems = initialDataset.filter(item => !existingIds.has(item.id));

        if (missingItems.length > 0) {
          console.log(`Self-healing ${missingItems.length} missing items for ${colName} subcollection...`);
          try {
            const batch = writeBatch(db);
            missingItems.forEach((item) => {
              const docRef = doc(colRef, item.id);
              batch.set(docRef, { ...item, updatedAt: Date.now() });
            });
            await batch.commit();
            // Include them in local items immediately for instant UI update
            items = [...items, ...missingItems];
          } catch (err) {
            console.warn(`Error self-healing collection ${colName}:`, err);
          }
        }

        // Sort naturally if it is the itinerary to guarantee correct chronological order
        if (colName === "itinerary") {
          items.sort((a, b) => {
            const numA = parseInt(a.id.replace("day-", ""), 10);
            const numB = parseInt(b.id.replace("day-", ""), 10);
            return numA - numB;
          });
        }

        stateSetter(items);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(items));
        } catch {}
      }, (error) => {
        console.warn(`Failed listening to ${colName}:`, error);
        setFirebaseError(`Firestore path trips/${TRIP_ID}/${colName} failed: ${error.message}`);
        try {
          handleFirestoreError(error, OperationType.LIST, `trips/${TRIP_ID}/${colName}`);
        } catch (e) {
          console.error("Suppressed snapshot callback throw to avoid React crash:", e);
        }
      });
    };

    // Instantiate listeners for all shared travel datasets (all 8 family collections)
    const unsubExpenses = setupSubCollectionListener<Expense>("expenses", INITIAL_EXPENSES, setExpenses, "bb_expenses");
    const unsubTransfers = setupSubCollectionListener<Transfer>("transfers", INITIAL_TRANSFERS, setTransfers, "bb_transfers");
    const unsubItinerary = setupSubCollectionListener<ItineraryDay>("itinerary", INITIAL_ITINERARY, setItinerary, "bb_itinerary");
    const unsubDocuments = setupSubCollectionListener<UploadedDocument>("documents", INITIAL_DOCUMENTS, setDocuments, "bb_documents");
    const unsubMemories = setupSubCollectionListener<Memory>("memories", INITIAL_MEMORIES, setMemories, "bb_memories");
    const unsubPacking = setupSubCollectionListener<PackingItem>("packing", INITIAL_PACKING_ITEMS, setPacking, "bb_packing");
    const unsubHotels = setupSubCollectionListener<Hotel>("hotels", INITIAL_HOTELS, setHotels, "bb_hotels");
    const unsubMembers = setupSubCollectionListener<Member>("members", INITIAL_MEMBERS, setMembers, "bb_members");

    return () => {
      unsubTrip();
      unsubExpenses();
      unsubTransfers();
      unsubItinerary();
      unsubDocuments();
      unsubMemories();
      unsubPacking();
      unsubHotels();
      unsubMembers();
    };
  }, [isAuthenticated, firebaseError]);

  // ---------------- DB MUTATOR API WRAPPERS (CONFLICT-SAFE MECHANISMS) ----------------

  const updateTripDates = async (start: string, end: string) => {
    setTripStartDate(start);
    setTripEndDate(end);
    try {
      localStorage.setItem("bb_trip_start", start);
      localStorage.setItem("bb_trip_end", end);
    } catch (e) {
      console.warn("localStorage write error in updateTripDates:", e);
    }

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID);
        await setDoc(docRef, { tripStartDate: start, tripEndDate: end, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}`);
      }
    }
  };

  const saveExpense = async (expenseData: Omit<Expense, "id"> & { id?: string }) => {
    const id = expenseData.id || `exp-${Date.now()}`;
    const payload: Expense = {
      ...expenseData,
      id,
    };

    // Optimistic Update
    setExpenses((prev) => [payload, ...prev].filter((val, idx, self) => self.findIndex((t) => t.id === val.id) === idx));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "expenses", id);
        // Basic conflict safety: Fetch existing item first and compare timestamp
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remote = snap.data();
          if (remote.updatedAt && remote.updatedAt > Date.now()) {
            console.log("Local write is older than remote server item. Cancelled to prevent overwrite.");
            return;
          }
        }
        await setDoc(docRef, { ...payload, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/expenses/${id}`);
      }
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "expenses", id);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `trips/${TRIP_ID}/expenses/${id}`);
      }
    }
  };

  const saveTransfer = async (transferData: Omit<Transfer, "id"> & { id?: string }) => {
    const id = transferData.id || `trans-${Date.now()}`;
    const payload: Transfer = {
      ...transferData,
      id,
    };

    setTransfers((prev) => [payload, ...prev].filter((val, idx, self) => self.findIndex((t) => t.id === val.id) === idx));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "transfers", id);
        await setDoc(docRef, { ...payload, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/transfers/${id}`);
      }
    }
  };

  const deleteTransfer = async (id: string) => {
    setTransfers((prev) => prev.filter((t) => t.id !== id));
    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "transfers", id);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `trips/${TRIP_ID}/transfers/${id}`);
      }
    }
  };

  const saveDocument = async (docData: Omit<UploadedDocument, "id"> & { id?: string }) => {
    const id = docData.id || `doc-${Date.now()}`;
    const payload: UploadedDocument = {
      ...docData,
      id,
    };

    setDocuments((prev) => [payload, ...prev].filter((val, idx, self) => self.findIndex((t) => t.id === val.id) === idx));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "documents", id);
        await setDoc(docRef, { ...payload, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/documents/${id}`);
      }
    }
  };

  const deleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "documents", id);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `trips/${TRIP_ID}/documents/${id}`);
      }
    }
  };

  const saveMemory = async (memoryData: Omit<Memory, "id"> & { id?: string }) => {
    const id = memoryData.id || `mem-${Date.now()}`;
    const payload: Memory = {
      ...memoryData,
      id,
    };

    setMemories((prev) => [payload, ...prev].filter((val, idx, self) => self.findIndex((t) => t.id === val.id) === idx));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "memories", id);
        await setDoc(docRef, { ...payload, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/memories/${id}`);
      }
    }
  };

  const loveMemory = async (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, loves: m.loves + 1 } : m))
    );

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "memories", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remote = snap.data() as Memory;
          await setDoc(docRef, { loves: (remote.loves || 0) + 1 }, { merge: true });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/memories/${id}`);
      }
    }
  };

  const deleteMemory = async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "memories", id);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `trips/${TRIP_ID}/memories/${id}`);
      }
    }
  };

  const savePackingItem = async (itemData: Omit<PackingItem, "id"> & { id?: string }) => {
    const id = itemData.id || `packing-${Date.now()}`;
    const payload: PackingItem = {
      ...itemData,
      id,
    };

    setPacking((prev) => [payload, ...prev].filter((val, idx, self) => self.findIndex((t) => t.id === val.id) === idx));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "packing", id);
        await setDoc(docRef, { ...payload, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/packing/${id}`);
      }
    }
  };

  const deletePackingItem = async (id: string) => {
    setPacking((prev) => prev.filter((p) => p.id !== id));
    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "packing", id);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `trips/${TRIP_ID}/packing/${id}`);
      }
    }
  };

  const togglePackingItem = async (item: PackingItem) => {
    const toggled = { ...item, status: !item.status, packedBy: activeUser?.name || "Someone" };
    setPacking((prev) => prev.map((p) => (p.id === item.id ? toggled : p)));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "packing", item.id);
        await setDoc(docRef, { ...toggled, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/packing/${item.id}`);
      }
    }
  };

  const saveHotel = async (hotelData: Omit<Hotel, "id"> & { id?: string }) => {
    const id = hotelData.id || `hotel-${Date.now()}`;
    const payload: Hotel = {
      ...hotelData,
      id,
    };

    setHotels((prev) => [...prev.filter((h) => h.id !== id), payload]);

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "hotels", id);
        await setDoc(docRef, { ...payload, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/hotels/${id}`);
      }
    }
  };

  const deleteHotel = async (id: string) => {
    setHotels((prev) => prev.filter((h) => h.id !== id));
    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "hotels", id);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `trips/${TRIP_ID}/hotels/${id}`);
      }
    }
  };

  const toggleItineraryComplete = async (dayId: string) => {
    const found = itinerary.find((day) => day.id === dayId);
    if (!found) return;

    const updated = { ...found, completed: !found.completed };
    setItinerary((prev) => prev.map((day) => (day.id === dayId ? updated : day)));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "itinerary", dayId);
        await setDoc(docRef, { ...updated, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/itinerary/${dayId}`);
      }
    }
  };

  const addItineraryNote = async (dayId: string, noteText: string) => {
    const found = itinerary.find((day) => day.id === dayId);
    if (!found) return;

    const updated = { ...found, notes: [...(found.notes || []), noteText] };
    setItinerary((prev) => prev.map((day) => (day.id === dayId ? updated : day)));

    if (isAuthenticated) {
      try {
        const docRef = doc(db, "trips", TRIP_ID, "itinerary", dayId);
        await setDoc(docRef, { ...updated, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `trips/${TRIP_ID}/itinerary/${dayId}`);
      }
    }
  };

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        activeUser,
        setActiveUser,
        isAuthenticated,
        isInitializing,
        isPasscodeVerified,
        loginError,
        attemptLogin,
        logout,
        firebaseError,
        tryEnableFirebase,
        
        tripStartDate,
        tripEndDate,
        updateTripDates,

        members,
        families,
        itinerary,
        expenses,
        transfers,
        documents,
        memories,
        packing,
        hotels,

        saveExpense,
        deleteExpense,
        saveTransfer,
        deleteTransfer,
        saveDocument,
        deleteDocument,
        saveMemory,
        loveMemory,
        deleteMemory,
        savePackingItem,
        deletePackingItem,
        togglePackingItem,
        saveHotel,
        deleteHotel,
        toggleItineraryComplete,
        addItineraryNote,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}

