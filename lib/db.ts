/** Server data layer: Supabase when configured, otherwise a local JSON store for sandbox testing. */

import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";
import { generateId } from "@/lib/utils";
import type {
  ActivitySelection,
  Booking,
  FlightOption,
  FlightSelection,
  GroundChoice,
  GroundOption,
  GroundSelection,
  HotelOption,
  HotelPreferences,
  HotelSelection,
  Trip,
  TripBundle,
  TripPreferences,
  TripStatus,
  Traveler,
} from "@/types";
import type { IntakeConfirmInput, HotelPreferencesInput } from "@/lib/validation";

type FileStore = {
  trips: Trip[];
  travelers: Traveler[];
  preferences: TripPreferences[];
  hotelPreferences: HotelPreferences[];
  flightSelections: FlightSelection[];
  hotelSelections: HotelSelection[];
  groundSelections: GroundSelection[];
  activitySelections: ActivitySelection[];
  bookings: Booking[];
};

const emptyStore = (): FileStore => ({
  trips: [],
  travelers: [],
  preferences: [],
  hotelPreferences: [],
  flightSelections: [],
  hotelSelections: [],
  groundSelections: [],
  activitySelections: [],
  bookings: [],
});

const storePath = path.join(process.cwd(), ".data", "store.json");

async function readStore(): Promise<FileStore> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: FileStore) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

function serverSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const key = env.supabaseServiceRoleKey || env.supabaseAnonKey;
  return createClient(env.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function mapTripRow(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    status: row.status as Trip["status"],
    tripType: row.trip_type as Trip["tripType"],
    departureCode: row.departure_code as string,
    departureLabel: row.departure_label as string,
    destinationCode: row.destination_code as string,
    destinationLabel: row.destination_label as string,
    additionalCities: (row.additional_cities as string) ?? null,
    departureDate: row.departure_date as string,
    returnDate: (row.return_date as string) ?? null,
    flexibleDates: Boolean(row.flexible_dates),
    flexibleDays: (row.flexible_days as number) ?? null,
    tripPurpose: (row.trip_purpose as Trip["tripPurpose"]) ?? null,
    contactEmail: row.contact_email as string,
    adultCount: row.adult_count as number,
    childCount: row.child_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTravelerRow(row: Record<string, unknown>): Traveler {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    fullName: row.full_name as string,
    dateOfBirth: row.date_of_birth as string,
    type: row.type as Traveler["type"],
    age: (row.age as number) ?? null,
    loyaltyProgram: (row.loyalty_program as string) ?? null,
    loyaltyNumber: (row.loyalty_number as string) ?? null,
    sortOrder: row.sort_order as number,
  };
}

function mapPrefsRow(row: Record<string, unknown>): TripPreferences {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    cabinClass: row.cabin_class as TripPreferences["cabinClass"],
    preferredAirlines: (row.preferred_airlines as string[]) ?? [],
    noAirlinePreference: Boolean(row.no_airline_preference),
    maxStops: row.max_stops as TripPreferences["maxStops"],
    outboundTimeWindow: row.outbound_time_window as TripPreferences["outboundTimeWindow"],
    returnTimeWindow: row.return_time_window as TripPreferences["returnTimeWindow"],
    budgetMin: row.budget_min as number,
    budgetMax: row.budget_max as number,
    seatPreference: row.seat_preference as TripPreferences["seatPreference"],
    specialAssistance: (row.special_assistance as string) ?? null,
  };
}

async function assembleBundleFromLocal(store: FileStore, tripId: string): Promise<TripBundle | null> {
  const trip = store.trips.find((t) => t.id === tripId);
  if (!trip) return null;
  return {
    trip,
    travelers: store.travelers.filter((t) => t.tripId === tripId).sort((a, b) => a.sortOrder - b.sortOrder),
    preferences: store.preferences.find((p) => p.tripId === tripId) ?? null,
    hotelPreferences: store.hotelPreferences.find((p) => p.tripId === tripId) ?? null,
    flightSelection: store.flightSelections.find((s) => s.tripId === tripId) ?? null,
    hotelSelection: store.hotelSelections.find((s) => s.tripId === tripId) ?? null,
    groundSelection: store.groundSelections.find((s) => s.tripId === tripId) ?? null,
    activitySelection: store.activitySelections.find((s) => s.tripId === tripId) ?? null,
    booking: store.bookings.find((b) => b.tripId === tripId) ?? null,
  };
}

export async function createTripFromIntake(input: IntakeConfirmInput): Promise<TripBundle> {
  const timestamp = nowIso();
  const tripId = generateId();
  const purpose = input.tripPurpose ? input.tripPurpose : null;

  const trip: Trip = {
    id: tripId,
    status: "flights",
    tripType: input.tripType,
    departureCode: input.departureCode,
    departureLabel: input.departureLabel,
    destinationCode: input.destinationCode,
    destinationLabel: input.destinationLabel,
    additionalCities: input.additionalCities || null,
    departureDate: input.departureDate,
    returnDate: input.tripType === "round_trip" ? input.returnDate || null : null,
    flexibleDates: input.flexibleDates,
    flexibleDays: input.flexibleDates ? input.flexibleDays ?? 3 : null,
    tripPurpose: purpose,
    contactEmail: input.contactEmail,
    adultCount: input.adultCount,
    childCount: input.childCount,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const travelers: Traveler[] = input.travelers.map((t, i) => ({
    id: generateId(),
    tripId,
    fullName: t.fullName,
    dateOfBirth: t.dateOfBirth,
    type: t.type,
    age: t.type === "child" ? t.age : null,
    loyaltyProgram: t.loyaltyProgram || null,
    loyaltyNumber: t.loyaltyNumber || null,
    sortOrder: i,
  }));

  const preferences: TripPreferences = {
    id: generateId(),
    tripId,
    cabinClass: input.cabinClass,
    preferredAirlines: input.noAirlinePreference ? [] : input.preferredAirlines,
    noAirlinePreference: input.noAirlinePreference || input.preferredAirlines.length === 0,
    maxStops: input.maxStops,
    outboundTimeWindow: input.outboundTimeWindow,
    returnTimeWindow: input.returnTimeWindow,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    seatPreference: input.seatPreference,
    specialAssistance: input.specialAssistance || null,
  };

  const sb = serverSupabase();
  if (sb) {
    const { error: tripError } = await sb.from("trips").insert({
      id: trip.id,
      status: trip.status,
      trip_type: trip.tripType,
      departure_code: trip.departureCode,
      departure_label: trip.departureLabel,
      destination_code: trip.destinationCode,
      destination_label: trip.destinationLabel,
      additional_cities: trip.additionalCities,
      departure_date: trip.departureDate,
      return_date: trip.returnDate,
      flexible_dates: trip.flexibleDates,
      flexible_days: trip.flexibleDays,
      trip_purpose: trip.tripPurpose,
      contact_email: trip.contactEmail,
      adult_count: trip.adultCount,
      child_count: trip.childCount,
    });
    if (tripError) throw new Error(tripError.message);

    const { error: travelerError } = await sb.from("travelers").insert(
      travelers.map((t) => ({
        id: t.id,
        trip_id: t.tripId,
        full_name: t.fullName,
        date_of_birth: t.dateOfBirth,
        type: t.type,
        age: t.age,
        loyalty_program: t.loyaltyProgram,
        loyalty_number: t.loyaltyNumber,
        sort_order: t.sortOrder,
      }))
    );
    if (travelerError) throw new Error(travelerError.message);

    const { error: prefError } = await sb.from("trip_preferences").insert({
      id: preferences.id,
      trip_id: preferences.tripId,
      cabin_class: preferences.cabinClass,
      preferred_airlines: preferences.preferredAirlines,
      no_airline_preference: preferences.noAirlinePreference,
      max_stops: preferences.maxStops,
      outbound_time_window: preferences.outboundTimeWindow,
      return_time_window: preferences.returnTimeWindow,
      budget_min: preferences.budgetMin,
      budget_max: preferences.budgetMax,
      seat_preference: preferences.seatPreference,
      special_assistance: preferences.specialAssistance,
    });
    if (prefError) throw new Error(prefError.message);
  } else {
    const store = await readStore();
    store.trips.push(trip);
    store.travelers.push(...travelers);
    store.preferences.push(preferences);
    await writeStore(store);
  }

  return {
    trip,
    travelers,
    preferences,
    hotelPreferences: null,
    flightSelection: null,
    hotelSelection: null,
    groundSelection: null,
    activitySelection: null,
    booking: null,
  };
}

export async function getTripBundle(tripId: string): Promise<TripBundle | null> {
  const sb = serverSupabase();
  if (sb) {
    const { data: tripRow, error } = await sb.from("trips").select("*").eq("id", tripId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!tripRow) return null;

    const [
      { data: travelerRows },
      { data: prefRow },
      { data: hotelPrefRow },
      { data: flightRow },
      { data: hotelRow },
      { data: groundRow },
      { data: activityRow },
      { data: bookingRow },
    ] = await Promise.all([
      sb.from("travelers").select("*").eq("trip_id", tripId).order("sort_order"),
      sb.from("trip_preferences").select("*").eq("trip_id", tripId).maybeSingle(),
      sb.from("hotel_preferences").select("*").eq("trip_id", tripId).maybeSingle(),
      sb.from("flight_selections").select("*").eq("trip_id", tripId).maybeSingle(),
      sb.from("hotel_selections").select("*").eq("trip_id", tripId).maybeSingle(),
      sb.from("ground_selections").select("*").eq("trip_id", tripId).maybeSingle(),
      sb.from("activity_selections").select("*").eq("trip_id", tripId).maybeSingle(),
      sb.from("bookings").select("*").eq("trip_id", tripId).maybeSingle(),
    ]);

    return {
      trip: mapTripRow(tripRow),
      travelers: (travelerRows ?? []).map(mapTravelerRow),
      preferences: prefRow ? mapPrefsRow(prefRow) : null,
      hotelPreferences: hotelPrefRow
        ? {
            id: hotelPrefRow.id,
            tripId: hotelPrefRow.trip_id,
            rooms: hotelPrefRow.rooms,
            starRating: hotelPrefRow.star_rating,
            budgetMin: hotelPrefRow.budget_min,
            budgetMax: hotelPrefRow.budget_max,
            mustHaves: hotelPrefRow.must_haves ?? [],
          }
        : null,
      flightSelection: flightRow
        ? { id: flightRow.id, tripId: flightRow.trip_id, offer: flightRow.offer, confirmedAt: flightRow.confirmed_at }
        : null,
      hotelSelection: hotelRow
        ? { id: hotelRow.id, tripId: hotelRow.trip_id, offer: hotelRow.offer, confirmedAt: hotelRow.confirmed_at }
        : null,
      groundSelection: groundRow
        ? {
            id: groundRow.id,
            tripId: groundRow.trip_id,
            choice: groundRow.choice,
            option: groundRow.option,
            confirmedAt: groundRow.confirmed_at,
          }
        : null,
      activitySelection: activityRow
        ? {
            id: activityRow.id,
            tripId: activityRow.trip_id,
            skipped: activityRow.skipped,
            options: activityRow.options ?? [],
            confirmedAt: activityRow.confirmed_at,
          }
        : null,
      booking: bookingRow
        ? {
            id: bookingRow.id,
            tripId: bookingRow.trip_id,
            confirmationNumber: bookingRow.confirmation_number,
            totalPrice: bookingRow.total_price,
            currency: bookingRow.currency,
            sandbox: bookingRow.sandbox,
            itinerarySnapshot: bookingRow.itinerary_snapshot,
            createdAt: bookingRow.created_at,
          }
        : null,
    };
  }

  return assembleBundleFromLocal(await readStore(), tripId);
}

export async function updateTripStatus(tripId: string, status: TripStatus) {
  const sb = serverSupabase();
  if (sb) {
    const { error } = await sb.from("trips").update({ status, updated_at: nowIso() }).eq("id", tripId);
    if (error) throw new Error(error.message);
    return;
  }
  const store = await readStore();
  const trip = store.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = status;
    trip.updatedAt = nowIso();
    await writeStore(store);
  }
}

export async function saveFlightSelection(tripId: string, offer: FlightOption) {
  const selection: FlightSelection = {
    id: generateId(),
    tripId,
    offer,
    confirmedAt: nowIso(),
  };
  const sb = serverSupabase();
  if (sb) {
    await sb.from("flight_selections").delete().eq("trip_id", tripId);
    const { error } = await sb.from("flight_selections").insert({
      id: selection.id,
      trip_id: tripId,
      offer,
      confirmed_at: selection.confirmedAt,
    });
    if (error) throw new Error(error.message);
    await updateTripStatus(tripId, "hotels");
    return selection;
  }
  const store = await readStore();
  store.flightSelections = store.flightSelections.filter((s) => s.tripId !== tripId);
  store.flightSelections.push(selection);
  const trip = store.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = "hotels";
    trip.updatedAt = nowIso();
  }
  await writeStore(store);
  return selection;
}

export async function saveHotelPreferences(tripId: string, input: HotelPreferencesInput) {
  const prefs: HotelPreferences = {
    id: generateId(),
    tripId,
    rooms: input.rooms,
    starRating: input.starRating,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    mustHaves: input.mustHaves,
  };
  const sb = serverSupabase();
  if (sb) {
    await sb.from("hotel_preferences").delete().eq("trip_id", tripId);
    const { error } = await sb.from("hotel_preferences").insert({
      id: prefs.id,
      trip_id: tripId,
      rooms: prefs.rooms,
      star_rating: prefs.starRating,
      budget_min: prefs.budgetMin,
      budget_max: prefs.budgetMax,
      must_haves: prefs.mustHaves,
    });
    if (error) throw new Error(error.message);
    return prefs;
  }
  const store = await readStore();
  store.hotelPreferences = store.hotelPreferences.filter((p) => p.tripId !== tripId);
  store.hotelPreferences.push(prefs);
  await writeStore(store);
  return prefs;
}

export async function saveHotelSelection(tripId: string, offer: HotelOption) {
  const selection: HotelSelection = {
    id: generateId(),
    tripId,
    offer,
    confirmedAt: nowIso(),
  };
  const sb = serverSupabase();
  if (sb) {
    await sb.from("hotel_selections").delete().eq("trip_id", tripId);
    const { error } = await sb.from("hotel_selections").insert({
      id: selection.id,
      trip_id: tripId,
      offer,
      confirmed_at: selection.confirmedAt,
    });
    if (error) throw new Error(error.message);
    await updateTripStatus(tripId, "ground");
    return selection;
  }
  const store = await readStore();
  store.hotelSelections = store.hotelSelections.filter((s) => s.tripId !== tripId);
  store.hotelSelections.push(selection);
  const trip = store.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = "ground";
    trip.updatedAt = nowIso();
  }
  await writeStore(store);
  return selection;
}

export async function saveGroundSelection(
  tripId: string,
  choice: GroundChoice,
  option: GroundOption | null
) {
  const selection: GroundSelection = {
    id: generateId(),
    tripId,
    choice,
    option,
    confirmedAt: nowIso(),
  };
  const sb = serverSupabase();
  if (sb) {
    await sb.from("ground_selections").delete().eq("trip_id", tripId);
    const { error } = await sb.from("ground_selections").insert({
      id: selection.id,
      trip_id: tripId,
      choice,
      option,
      confirmed_at: selection.confirmedAt,
    });
    if (error) throw new Error(error.message);
    await updateTripStatus(tripId, "activities");
    return selection;
  }
  const store = await readStore();
  store.groundSelections = store.groundSelections.filter((s) => s.tripId !== tripId);
  store.groundSelections.push(selection);
  const trip = store.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = "activities";
    trip.updatedAt = nowIso();
  }
  await writeStore(store);
  return selection;
}

export async function saveActivitySelection(
  tripId: string,
  skipped: boolean,
  options: ActivitySelection["options"]
) {
  const selection: ActivitySelection = {
    id: generateId(),
    tripId,
    skipped,
    options,
    confirmedAt: nowIso(),
  };
  const sb = serverSupabase();
  if (sb) {
    await sb.from("activity_selections").delete().eq("trip_id", tripId);
    const { error } = await sb.from("activity_selections").insert({
      id: selection.id,
      trip_id: tripId,
      skipped,
      options,
      confirmed_at: selection.confirmedAt,
    });
    if (error) throw new Error(error.message);
    await updateTripStatus(tripId, "review");
    return selection;
  }
  const store = await readStore();
  store.activitySelections = store.activitySelections.filter((s) => s.tripId !== tripId);
  store.activitySelections.push(selection);
  const trip = store.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = "review";
    trip.updatedAt = nowIso();
  }
  await writeStore(store);
  return selection;
}

export async function createBooking(tripId: string, booking: Omit<Booking, "id">) {
  const saved: Booking = { ...booking, id: generateId() };
  const sb = serverSupabase();
  if (sb) {
    const { error } = await sb.from("bookings").insert({
      id: saved.id,
      trip_id: saved.tripId,
      confirmation_number: saved.confirmationNumber,
      total_price: saved.totalPrice,
      currency: saved.currency,
      sandbox: saved.sandbox,
      itinerary_snapshot: saved.itinerarySnapshot,
    });
    if (error) throw new Error(error.message);
    await updateTripStatus(tripId, "booked");
    return saved;
  }
  const store = await readStore();
  store.bookings = store.bookings.filter((b) => b.tripId !== tripId);
  store.bookings.push(saved);
  const trip = store.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = "booked";
    trip.updatedAt = nowIso();
  }
  await writeStore(store);
  return saved;
}

export function usingLocalStore() {
  return !isSupabaseConfigured();
}
