/** Shared TypeScript types for Trip, Traveler, FlightOption, HotelOption, Booking. */

export type TripType = "round_trip" | "one_way" | "multi_city";
export type TripPurpose =
  | "vacation"
  | "business"
  | "family_visit"
  | "honeymoon"
  | "other";
export type TripStatus =
  | "draft"
  | "flights"
  | "hotels"
  | "ground"
  | "activities"
  | "review"
  | "booked";

export type CabinClass = "economy" | "premium_economy" | "business" | "first";
export type MaxStops = "none" | "one" | "two_plus" | "no_preference";
export type TimeWindow =
  | "early_morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "red_eye"
  | "no_preference";
export type SeatPreference = "window" | "aisle" | "no_preference";
export type TravelerType = "adult" | "child";
export type StarPreference = "3" | "4" | "5" | "no_preference";
export type GroundKind =
  | "rideshare"
  | "rental_car"
  | "private_transfer"
  | "public_transit";
export type GroundChoice = "yes" | "no" | "skip";

export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
}

export interface Traveler {
  id: string;
  tripId: string;
  fullName: string;
  dateOfBirth: string;
  type: TravelerType;
  age: number | null;
  loyaltyProgram: string | null;
  loyaltyNumber: string | null;
  sortOrder: number;
}

export type LoyaltyKind = "airline" | "hotel" | "other";

export interface LoyaltyMembership {
  id: string;
  tripId: string;
  programId: string;
  programLabel: string;
  kind: LoyaltyKind;
  memberNumber: string | null;
  balance: number;
}

export type ResearchKind = "hotel" | "activity" | "general";

export interface ResearchFinding {
  id: string;
  kind: ResearchKind;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  relatedNames: string[];
}

export interface DestinationResearch {
  deals: ResearchFinding[];
  events: ResearchFinding[];
  localFavorites: ResearchFinding[];
  fetchedAt: string;
  expiresAt: string;
  source: "mock" | "anthropic";
}

export interface PlaceSnapshot {
  placeId?: string;
  rating?: number;
  ratingCount?: number;
  hoursSummary?: string;
  openNow?: boolean | null;
  businessStatus?: string;
  source?: "mock" | "geoapify";
}

export interface TripPreferences {
  id: string;
  tripId: string;
  cabinClass: CabinClass;
  preferredAirlines: string[];
  noAirlinePreference: boolean;
  maxStops: MaxStops;
  outboundTimeWindow: TimeWindow;
  returnTimeWindow: TimeWindow;
  budgetMin: number;
  budgetMax: number;
  seatPreference: SeatPreference;
  specialAssistance: string | null;
}

export interface HotelPreferences {
  id: string;
  tripId: string;
  rooms: number;
  starRating: StarPreference;
  budgetMin: number;
  budgetMax: number;
  mustHaves: string[];
}

export interface Trip {
  id: string;
  status: TripStatus;
  tripType: TripType;
  departureCode: string;
  departureLabel: string;
  destinationCode: string;
  destinationLabel: string;
  additionalCities: string | null;
  departureDate: string;
  returnDate: string | null;
  flexibleDates: boolean;
  flexibleDays: number | null;
  tripPurpose: TripPurpose | null;
  contactEmail: string;
  adultCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlightSegment {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  durationMinutes: number;
}

export interface FlightLayover {
  airport: string;
  durationMinutes: number;
}

export interface FlightOption {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  durationMinutes: number;
  stops: number;
  layovers: FlightLayover[];
  segments: FlightSegment[];
  returnFlight?: Omit<FlightOption, "id" | "returnFlight">;
  cabinClass: CabinClass;
  pricePerTraveler: number;
  totalPrice: number;
  currency: string;
  bags: { carryOn: string; checked: string };
  fareRules: string;
  matchTags: string[];
  score: number;
  recommendReason?: string;
}

export interface FlightSelection {
  id: string;
  tripId: string;
  offer: FlightOption;
  confirmedAt: string;
}

export interface HotelOption {
  id: string;
  name: string;
  stars: number;
  neighborhood: string;
  city: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  amenities: string[];
  cancellationPolicy: string;
  whyItFits: string;
  photoUrl: string;
  photoAlt: string;
  place?: PlaceSnapshot;
  liveInsights?: ResearchFinding[];
}

export interface HotelSelection {
  id: string;
  tripId: string;
  offer: HotelOption;
  confirmedAt: string;
}

export interface GroundOption {
  id: string;
  kind: GroundKind;
  title: string;
  description: string;
  priceEstimate: number;
  details: string;
}

export interface GroundSelection {
  id: string;
  tripId: string;
  choice: GroundChoice;
  option: GroundOption | null;
  confirmedAt: string;
}

export interface ActivityOption {
  id: string;
  name: string;
  description: string;
  duration: string;
  pricePerPerson: number;
  totalPrice: number;
  category: string;
  productCode?: string;
  photoUrl?: string;
  rating?: number;
  reviewCount?: number;
  place?: PlaceSnapshot;
  liveInsights?: ResearchFinding[];
}

export interface ActivitySelection {
  id: string;
  tripId: string;
  skipped: boolean;
  options: ActivityOption[];
  confirmedAt: string;
}

export interface Booking {
  id: string;
  tripId: string;
  confirmationNumber: string;
  totalPrice: number;
  currency: string;
  sandbox: boolean;
  itinerarySnapshot: ItinerarySnapshot;
  createdAt: string;
}

export interface ItinerarySnapshot {
  trip: Trip;
  travelers: Traveler[];
  flight: FlightOption | null;
  hotel: HotelOption | null;
  ground: GroundOption | null;
  activities: ActivityOption[];
  totalPrice: number;
  stripeCheckoutSessionId?: string;
}

export interface TripBundle {
  trip: Trip;
  travelers: Traveler[];
  preferences: TripPreferences | null;
  hotelPreferences: HotelPreferences | null;
  loyaltyWallets: LoyaltyMembership[];
  flightSelection: FlightSelection | null;
  hotelSelection: HotelSelection | null;
  groundSelection: GroundSelection | null;
  activitySelection: ActivitySelection | null;
  booking: Booking | null;
}
