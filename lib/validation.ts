/** Zod schemas for every intake and booking step so bad data cannot be saved. */

import { z } from "zod";

export const tripBasicsSchema = z
  .object({
    departureCode: z.string().min(3, "Choose a departure airport"),
    departureLabel: z.string().min(2),
    destinationCode: z.string().min(3, "Choose a destination"),
    destinationLabel: z.string().min(2),
    additionalCities: z.string().optional(),
    tripType: z.enum(["round_trip", "one_way", "multi_city"]),
    departureDate: z.string().min(1, "Departure date is required"),
    returnDate: z.string().optional(),
    flexibleDates: z.boolean(),
    flexibleDays: z.number().int().min(1).max(5).optional(),
    tripPurpose: z
      .enum(["vacation", "business", "family_visit", "honeymoon", "other"])
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.departureCode === data.destinationCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination must be different from departure",
        path: ["destinationCode"],
      });
    }
    if (data.tripType === "round_trip") {
      if (!data.returnDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Return date is required for round trips",
          path: ["returnDate"],
        });
      } else if (data.returnDate < data.departureDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Return date must be on or after departure",
          path: ["returnDate"],
        });
      }
    }
    if (data.flexibleDates && !data.flexibleDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose how many days of flexibility (1–5)",
        path: ["flexibleDays"],
      });
    }
  });

export const travelerSchema = z.object({
  fullName: z.string().min(2, "Enter the name as it appears on ID"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  type: z.enum(["adult", "child"]),
  age: z.number().int().min(0).max(17).nullable(),
  loyaltyProgram: z.string().optional(),
  loyaltyNumber: z.string().optional(),
});

export const loyaltyWalletSchema = z.object({
  programId: z.string().min(1),
  programLabel: z.string().min(1),
  kind: z.enum(["airline", "hotel", "other"]),
  memberNumber: z.string().optional(),
  balance: z.number().min(0),
});

export const travelersStepSchema = z
  .object({
    contactEmail: z.string().email("Enter a valid email for itinerary updates"),
    adultCount: z.number().int().min(1, "At least one adult is required"),
    childCount: z.number().int().min(0).max(8),
    travelers: z.array(travelerSchema).min(1),
    loyaltyWallets: z.array(loyaltyWalletSchema),
  })
  .superRefine((data, ctx) => {
    if (data.travelers.length !== data.adultCount + data.childCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add details for every traveler",
        path: ["travelers"],
      });
    }
    const adults = data.travelers.filter((t) => t.type === "adult");
    const children = data.travelers.filter((t) => t.type === "child");
    if (adults.length !== data.adultCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each adult needs a name and date of birth",
        path: ["travelers"],
      });
    }
    children.forEach((child, i) => {
      if (child.age === null || child.age === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter an age for each child",
          path: ["travelers", data.adultCount + i, "age"],
        });
      }
    });
  });

export const flightPreferencesSchema = z
  .object({
    cabinClass: z.enum(["economy", "premium_economy", "business", "first"]),
    preferredAirlines: z.array(z.string()),
    noAirlinePreference: z.boolean(),
    maxStops: z.enum(["none", "one", "two_plus", "no_preference"]),
    outboundTimeWindow: z.enum([
      "early_morning",
      "morning",
      "afternoon",
      "evening",
      "red_eye",
      "no_preference",
    ]),
    returnTimeWindow: z.enum([
      "early_morning",
      "morning",
      "afternoon",
      "evening",
      "red_eye",
      "no_preference",
    ]),
    budgetMin: z.number().min(50),
    budgetMax: z.number().min(50),
    seatPreference: z.enum(["window", "aisle", "no_preference"]),
    specialAssistance: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.budgetMax < data.budgetMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum must be greater than or equal to minimum",
        path: ["budgetMax"],
      });
    }
  });

export const intakeConfirmSchema = tripBasicsSchema
  .and(travelersStepSchema)
  .and(flightPreferencesSchema);

export const hotelPreferencesSchema = z
  .object({
    rooms: z.number().int().min(1).max(8),
    starRating: z.enum(["3", "4", "5", "no_preference"]),
    budgetMin: z.number().min(50),
    budgetMax: z.number().min(50),
    mustHaves: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.budgetMax < data.budgetMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum must be greater than or equal to minimum",
        path: ["budgetMax"],
      });
    }
  });

export const groundDecisionSchema = z.object({
  choice: z.enum(["yes", "no", "skip"]),
  optionId: z.string().optional(),
});

export const bookingConfirmSchema = z.object({
  tripId: z.string().uuid(),
  reviewed: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you have reviewed every detail" }),
  }),
});

export type TripBasicsInput = z.infer<typeof tripBasicsSchema>;
export type TravelersStepInput = z.infer<typeof travelersStepSchema>;
export type LoyaltyWalletInput = z.infer<typeof loyaltyWalletSchema>;
export type FlightPreferencesInput = z.infer<typeof flightPreferencesSchema>;
export type IntakeConfirmInput = z.infer<typeof intakeConfirmSchema>;
export type HotelPreferencesInput = z.infer<typeof hotelPreferencesSchema>;
