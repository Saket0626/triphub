"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  flightPreferencesSchema,
  travelersStepSchema,
  tripBasicsSchema,
  type FlightPreferencesInput,
  type TravelersStepInput,
  type TripBasicsInput,
} from "@/lib/validation";
import { airportLabel } from "@/lib/airports";
import { AIRLINES, CABIN_NOTES, PURPOSE_LABELS, STOP_LABELS, TIME_WINDOWS, TRIP_TYPE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Checkbox, RadioGroup, RadioGroupItem, Switch } from "@/components/ui/form-controls";
import { Field } from "@/components/ui/misc";
import { AirportAutocomplete, DualSlider, Stepper } from "@/components/wizard/fields";
import { StepReveal } from "@/components/motion/reveal";
import { ConfirmActions, IntakeProgress, SectionHeader, StepNav } from "@/components/wizard/progress";

const STORAGE_KEY = "triphub:intake-draft";

type Draft = {
  step: number;
  basics: Partial<TripBasicsInput>;
  travelers: Partial<TravelersStepInput>;
  prefs: Partial<FlightPreferencesInput>;
};

function emptyTravelers(adults: number, children: number): TravelersStepInput["travelers"] {
  const list: TravelersStepInput["travelers"] = [];
  for (let i = 0; i < adults; i += 1) {
    list.push({ fullName: "", dateOfBirth: "", type: "adult", age: null, loyaltyProgram: "", loyaltyNumber: "" });
  }
  for (let i = 0; i < children; i += 1) {
    list.push({ fullName: "", dateOfBirth: "", type: "child", age: 8, loyaltyProgram: "", loyaltyNumber: "" });
  }
  return list;
}

export function IntakeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState<Partial<TripBasicsInput>>({
    tripType: "round_trip",
    flexibleDates: false,
    additionalCities: "",
  });
  const [travelers, setTravelers] = useState<Partial<TravelersStepInput>>({
    adultCount: 1,
    childCount: 0,
    contactEmail: "",
    travelers: emptyTravelers(1, 0),
  });
  const [prefs, setPrefs] = useState<Partial<FlightPreferencesInput>>({
    preferredAirlines: [],
    noAirlinePreference: true,
    maxStops: "no_preference",
    outboundTimeWindow: "no_preference",
    returnTimeWindow: "no_preference",
    budgetMin: 150,
    budgetMax: 800,
    seatPreference: "no_preference",
    specialAssistance: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Draft;
      setStep(draft.step ?? 0);
      if (draft.basics) setBasics(draft.basics);
      if (draft.travelers) setTravelers(draft.travelers);
      if (draft.prefs) setPrefs(draft.prefs);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, basics, travelers, prefs }));
  }, [step, basics, travelers, prefs]);

  async function confirmAndSearch() {
    setSaveError(null);
    const payload = {
      ...basics,
      ...travelers,
      ...prefs,
      tripPurpose: basics.tripPurpose || undefined,
    };
    const a = tripBasicsSchema.safeParse(basics);
    const b = travelersStepSchema.safeParse(travelers);
    const c = flightPreferencesSchema.safeParse(prefs);
    if (!a.success || !b.success || !c.success) {
      setSaveError("Please go back and complete every required field before confirming.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save trip");
      sessionStorage.removeItem(STORAGE_KEY);
      router.push(`/trip/${json.id}/flights`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save trip");
      setSaving(false);
    }
  }

  return (
    <div>
      <IntakeProgress current={step} />
      <StepReveal stepKey={step}>
      {step === 0 ? (
        <BasicsStep
          value={basics}
          onChange={setBasics}
          onNext={() => setStep(1)}
        />
      ) : null}
      {step === 1 ? (
        <TravelersStep
          value={travelers}
          onChange={setTravelers}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      ) : null}
      {step === 2 ? (
        <PrefsStep
          value={prefs}
          isRoundTrip={basics.tripType === "round_trip"}
          onChange={setPrefs}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      ) : null}
      {step === 3 ? (
        <ReviewStep
          basics={basics}
          travelers={travelers}
          prefs={prefs}
          onEdit={setStep}
          onBack={() => setStep(2)}
          onConfirm={confirmAndSearch}
          saving={saving}
          error={saveError}
        />
      ) : null}
      </StepReveal>
    </div>
  );
}

function BasicsStep({
  value,
  onChange,
  onNext,
}: {
  value: Partial<TripBasicsInput>;
  onChange: (v: Partial<TripBasicsInput>) => void;
  onNext: () => void;
}) {
  const form = useForm<TripBasicsInput>({
    resolver: zodResolver(tripBasicsSchema),
    values: {
      departureCode: value.departureCode ?? "",
      departureLabel: value.departureLabel ?? "",
      destinationCode: value.destinationCode ?? "",
      destinationLabel: value.destinationLabel ?? "",
      additionalCities: value.additionalCities ?? "",
      tripType: value.tripType ?? "round_trip",
      departureDate: value.departureDate ?? "",
      returnDate: value.returnDate ?? "",
      flexibleDates: value.flexibleDates ?? false,
      flexibleDays: value.flexibleDays,
      tripPurpose: value.tripPurpose ?? "",
    },
  });
  const tripType = form.watch("tripType");
  const flexible = form.watch("flexibleDates");

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        onChange(data);
        onNext();
      })}
    >
      <SectionHeader
        eyebrow="Step A"
        title="Where are you going?"
        description="City, dates, the usual. We'll search after you look this over at the end."
      />
      <div className="grid gap-6">
        <Field label="Departure city / airport" error={form.formState.errors.departureCode?.message}>
          <AirportAutocomplete
            id="departure"
            valueCode={form.watch("departureCode")}
            valueLabel={form.watch("departureLabel")}
            placeholder="City or airport code"
            onChange={(airport) => {
              form.setValue("departureCode", airport?.code ?? "", { shouldValidate: true });
              form.setValue("departureLabel", airport ? airportLabel(airport) : "");
            }}
          />
        </Field>
        <Field label="Destination city / country" error={form.formState.errors.destinationCode?.message}>
          <AirportAutocomplete
            id="destination"
            valueCode={form.watch("destinationCode")}
            valueLabel={form.watch("destinationLabel")}
            placeholder="City or airport code"
            onChange={(airport) => {
              form.setValue("destinationCode", airport?.code ?? "", { shouldValidate: true });
              form.setValue("destinationLabel", airport ? airportLabel(airport) : "");
            }}
          />
        </Field>
        <Field label="Trip type">
          <RadioGroup
            value={tripType}
            onValueChange={(v) => form.setValue("tripType", v as TripBasicsInput["tripType"])}
            className="grid gap-2 sm:grid-cols-3"
          >
            {(["round_trip", "one_way", "multi_city"] as const).map((t) => (
              <label key={t} className="option-row">
                <RadioGroupItem value={t} />
                <span>{TRIP_TYPE_LABELS[t]}</span>
              </label>
            ))}
          </RadioGroup>
        </Field>
        {tripType === "multi_city" ? (
          <Field label="Additional cities" hint="Optional. We’ll search the first leg now; extra cities can be refined later.">
            <Textarea
              placeholder="e.g. Chicago, then Montreal"
              {...form.register("additionalCities")}
            />
          </Field>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Departure date" error={form.formState.errors.departureDate?.message}>
            <Input type="date" {...form.register("departureDate")} />
          </Field>
          {tripType !== "one_way" ? (
            <Field label="Return date" error={form.formState.errors.returnDate?.message}>
              <Input type="date" {...form.register("returnDate")} />
            </Field>
          ) : null}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
          <Label htmlFor="flex">My dates are flexible by a few days</Label>
          <Switch
            id="flex"
            checked={flexible}
            onCheckedChange={(c) => {
              form.setValue("flexibleDates", c);
              if (c && !form.getValues("flexibleDays")) form.setValue("flexibleDays", 3);
            }}
          />
        </div>
        {flexible ? (
          <Field label="Flexibility (± days)" error={form.formState.errors.flexibleDays?.message}>
            <Stepper
              label="Days"
              min={1}
              max={5}
              value={form.watch("flexibleDays") ?? 3}
              onChange={(n) => form.setValue("flexibleDays", n)}
            />
          </Field>
        ) : null}
        <Field label="Trip purpose (optional)" hint="Used later to tailor hotel and activity recommendations.">
          <select
            className="control"
            value={form.watch("tripPurpose") ?? ""}
            onChange={(e) => form.setValue("tripPurpose", e.target.value as TripBasicsInput["tripPurpose"])}
          >
            <option value="">No particular purpose</option>
            {Object.entries(PURPOSE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <StepNav onNext={() => form.handleSubmit((data) => { onChange(data); onNext(); })()} />
    </form>
  );
}

function TravelersStep({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: Partial<TravelersStepInput>;
  onChange: (v: Partial<TravelersStepInput>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const form = useForm<TravelersStepInput>({
    resolver: zodResolver(travelersStepSchema),
    values: {
      contactEmail: value.contactEmail ?? "",
      adultCount: value.adultCount ?? 1,
      childCount: value.childCount ?? 0,
      travelers: value.travelers?.length ? value.travelers : emptyTravelers(1, 0),
    },
  });
  const adults = form.watch("adultCount");
  const children = form.watch("childCount");
  const people = form.watch("travelers");
  const [openLoyalty, setOpenLoyalty] = useState<Record<number, boolean>>({});

  function resize(nextAdults: number, nextChildren: number) {
    const current = form.getValues("travelers") ?? [];
    const adultRows = current.filter((t) => t.type === "adult");
    const childRows = current.filter((t) => t.type === "child");
    const merged = [
      ...Array.from({ length: nextAdults }, (_, i) => adultRows[i] ?? emptyTravelers(1, 0)[0]),
      ...Array.from({ length: nextChildren }, (_, i) => childRows[i] ?? emptyTravelers(0, 1)[0]),
    ];
    form.setValue("adultCount", nextAdults);
    form.setValue("childCount", nextChildren);
    form.setValue("travelers", merged);
  }

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        onChange(data);
        onNext();
      })}
    >
      <SectionHeader
        eyebrow="Step B"
        title="Who's coming?"
        description="Names and birthdays like they are on the ID — airlines are picky about that."
      />
      <div className="grid gap-6">
        <Field label="Contact email" hint="We'll send the itinerary here after you book. Nothing goes out before that." error={form.formState.errors.contactEmail?.message}>
          <Input type="email" placeholder="you@example.com" {...form.register("contactEmail")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stepper label="Adults" min={1} max={9} value={adults} onChange={(n) => resize(n, children)} />
          <Stepper label="Children" min={0} max={8} value={children} onChange={(n) => resize(adults, n)} />
        </div>
        {people.map((person, index) => (
          <Card key={`${person.type}-${index}`}>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-medium">
                {person.type === "adult" ? `Adult ${index + 1}` : `Child ${index - adults + 1}`}
              </p>
              <Field label="Full name (as on ID)" error={form.formState.errors.travelers?.[index]?.fullName?.message}>
                <Input
                  value={person.fullName}
                  onChange={(e) => {
                    const next = [...people];
                    next[index] = { ...next[index], fullName: e.target.value };
                    form.setValue("travelers", next);
                  }}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date of birth" hint="Required to match airline ticketing rules." error={form.formState.errors.travelers?.[index]?.dateOfBirth?.message}>
                  <Input
                    type="date"
                    value={person.dateOfBirth}
                    onChange={(e) => {
                      const next = [...people];
                      next[index] = { ...next[index], dateOfBirth: e.target.value };
                      form.setValue("travelers", next);
                    }}
                  />
                </Field>
                {person.type === "child" ? (
                  <Field label="Age" error={form.formState.errors.travelers?.[index]?.age?.message}>
                    <Input
                      type="number"
                      min={0}
                      max={17}
                      value={person.age ?? ""}
                      onChange={(e) => {
                        const next = [...people];
                        next[index] = { ...next[index], age: Number(e.target.value) };
                        form.setValue("travelers", next);
                      }}
                    />
                  </Field>
                ) : null}
              </div>
              <button
                type="button"
                className="text-sm text-primary"
                onClick={() => setOpenLoyalty((s) => ({ ...s, [index]: !s[index] }))}
              >
                {openLoyalty[index] ? "Hide" : "Add"} frequent flyer / loyalty numbers
              </button>
              {openLoyalty[index] ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Program (e.g. SkyMiles)"
                    value={person.loyaltyProgram ?? ""}
                    onChange={(e) => {
                      const next = [...people];
                      next[index] = { ...next[index], loyaltyProgram: e.target.value };
                      form.setValue("travelers", next);
                    }}
                  />
                  <Input
                    placeholder="Membership number"
                    value={person.loyaltyNumber ?? ""}
                    onChange={(e) => {
                      const next = [...people];
                      next[index] = { ...next[index], loyaltyNumber: e.target.value };
                      form.setValue("travelers", next);
                    }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {form.formState.errors.travelers?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.travelers.message}</p>
        ) : null}
      </div>
      <StepNav onBack={onBack} onNext={() => form.handleSubmit((data) => { onChange(data); onNext(); })()} />
    </form>
  );
}

function PrefsStep({
  value,
  isRoundTrip,
  onChange,
  onBack,
  onNext,
}: {
  value: Partial<FlightPreferencesInput>;
  isRoundTrip: boolean;
  onChange: (v: Partial<FlightPreferencesInput>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const form = useForm<FlightPreferencesInput>({
    resolver: zodResolver(flightPreferencesSchema),
    values: {
      cabinClass: value.cabinClass ?? "economy",
      preferredAirlines: value.preferredAirlines ?? [],
      noAirlinePreference: value.noAirlinePreference ?? true,
      maxStops: value.maxStops ?? "no_preference",
      outboundTimeWindow: value.outboundTimeWindow ?? "no_preference",
      returnTimeWindow: value.returnTimeWindow ?? "no_preference",
      budgetMin: value.budgetMin ?? 150,
      budgetMax: value.budgetMax ?? 800,
      seatPreference: value.seatPreference ?? "no_preference",
      specialAssistance: value.specialAssistance ?? "",
    },
  });

  const cabin = form.watch("cabinClass");
  const airlines = form.watch("preferredAirlines");
  const noPref = form.watch("noAirlinePreference");

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        onChange(data);
        onNext();
      })}
    >
      <SectionHeader
        eyebrow="Step C"
        title="How do you like to fly?"
        description="Seats, stops, budget. We'll use this to rank options. You still pick the actual flight."
      />
      <div className="grid gap-8">
        <Field label="Preferred cabin class" error={form.formState.errors.cabinClass?.message}>
          <RadioGroup
            value={cabin}
            onValueChange={(v) => form.setValue("cabinClass", v as FlightPreferencesInput["cabinClass"])}
          >
            {(Object.keys(CABIN_NOTES) as Array<keyof typeof CABIN_NOTES>).map((key) => (
              <label key={key} className="option-row items-start">
                <RadioGroupItem value={key} className="mt-1" />
                <span>
                  <span className="block font-medium">{CABIN_NOTES[key].label}</span>
                  <span className="text-xs text-muted-foreground">{CABIN_NOTES[key].note}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </Field>
        <Field label="Preferred airlines" hint="Optional. Leave as “No preference” if you don’t mind.">
          <label className="mb-2 flex items-center gap-2 text-sm">
            <Checkbox
              checked={noPref}
              onCheckedChange={(c) => {
                form.setValue("noAirlinePreference", Boolean(c));
                if (c) form.setValue("preferredAirlines", []);
              }}
            />
            No preference
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AIRLINES.map((airline) => (
              <label key={airline} className="option-row px-3 py-2">
                <Checkbox
                  checked={airlines.includes(airline)}
                  onCheckedChange={(c) => {
                    const next = c ? [...airlines, airline] : airlines.filter((a) => a !== airline);
                    form.setValue("preferredAirlines", next);
                    form.setValue("noAirlinePreference", next.length === 0);
                  }}
                />
                {airline}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Max number of stops tolerated">
          <RadioGroup
            value={form.watch("maxStops")}
            onValueChange={(v) => form.setValue("maxStops", v as FlightPreferencesInput["maxStops"])}
            className="grid gap-2 sm:grid-cols-2"
          >
            {(Object.keys(STOP_LABELS) as Array<keyof typeof STOP_LABELS>).map((key) => (
              <label key={key} className="option-row">
                <RadioGroupItem value={key} />
                {STOP_LABELS[key]}
              </label>
            ))}
          </RadioGroup>
        </Field>
        <Field label="Preferred departure time — outbound">
          <select
            className="control"
            value={form.watch("outboundTimeWindow")}
            onChange={(e) =>
              form.setValue("outboundTimeWindow", e.target.value as FlightPreferencesInput["outboundTimeWindow"])
            }
          >
            {TIME_WINDOWS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </Field>
        {isRoundTrip ? (
          <Field label="Preferred departure time — return">
            <select
              className="control"
              value={form.watch("returnTimeWindow")}
              onChange={(e) =>
                form.setValue("returnTimeWindow", e.target.value as FlightPreferencesInput["returnTimeWindow"])
              }
            >
              {TIME_WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Budget range per ticket" error={form.formState.errors.budgetMax?.message}>
          <DualSlider
            min={50}
            max={4000}
            step={25}
            value={[form.watch("budgetMin"), form.watch("budgetMax")]}
            onChange={([min, max]) => {
              form.setValue("budgetMin", min);
              form.setValue("budgetMax", max);
            }}
          />
        </Field>
        <Field label="Seat preference">
          <RadioGroup
            value={form.watch("seatPreference")}
            onValueChange={(v) => form.setValue("seatPreference", v as FlightPreferencesInput["seatPreference"])}
            className="grid grid-cols-3 gap-2"
          >
            {(["window", "aisle", "no_preference"] as const).map((s) => (
              <label key={s} className="option-row px-3 py-3 capitalize">
                <RadioGroupItem value={s} />
                {s.replace("_", " ")}
              </label>
            ))}
          </RadioGroup>
        </Field>
        <Field label="Accessibility or special assistance (optional)">
          <Textarea placeholder="Wheelchair assist, extra time, dietary notes…" {...form.register("specialAssistance")} />
        </Field>
      </div>
      <StepNav onBack={onBack} onNext={() => form.handleSubmit((data) => { onChange(data); onNext(); })()} />
    </form>
  );
}

function ReviewStep({
  basics,
  travelers,
  prefs,
  onEdit,
  onBack,
  onConfirm,
  saving,
  error,
}: {
  basics: Partial<TripBasicsInput>;
  travelers: Partial<TravelersStepInput>;
  prefs: Partial<FlightPreferencesInput>;
  onEdit: (step: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  saving: boolean;
  error: string | null;
}) {
  const summary = useMemo(
    () => [
      {
        step: 0,
        title: "Trip basics",
        rows: [
          ["From", basics.departureLabel],
          ["To", basics.destinationLabel],
          ["Type", basics.tripType ? TRIP_TYPE_LABELS[basics.tripType] : ""],
          ["Depart", basics.departureDate ? formatDate(basics.departureDate) : ""],
          [
            "Return",
            basics.tripType === "one_way"
              ? "One-way"
              : basics.returnDate
                ? formatDate(basics.returnDate)
                : "—",
          ],
          [
            "Flexible",
            basics.flexibleDates ? `± ${basics.flexibleDays ?? 0} days` : "Exact dates",
          ],
          ["Purpose", basics.tripPurpose ? PURPOSE_LABELS[basics.tripPurpose] : "Not specified"],
        ],
      },
      {
        step: 1,
        title: "Travelers",
        rows: [
          ["Email", travelers.contactEmail],
          ["Party", `${travelers.adultCount} adult${(travelers.adultCount ?? 0) > 1 ? "s" : ""}${travelers.childCount ? `, ${travelers.childCount} child${travelers.childCount > 1 ? "ren" : ""}` : ""}`],
          ...(travelers.travelers ?? []).map((t) => [
            t.fullName || "(name needed)",
            `${t.type}${t.dateOfBirth ? ` · born ${formatDate(t.dateOfBirth)}` : ""}`,
          ]),
        ],
      },
      {
        step: 2,
        title: "Flight preferences",
        rows: [
          ["Cabin", prefs.cabinClass ? CABIN_NOTES[prefs.cabinClass].label : ""],
          [
            "Airlines",
            prefs.noAirlinePreference || !prefs.preferredAirlines?.length
              ? "No preference"
              : prefs.preferredAirlines.join(", "),
          ],
          ["Stops", prefs.maxStops ? STOP_LABELS[prefs.maxStops] : ""],
          ["Outbound window", TIME_WINDOWS.find((w) => w.value === prefs.outboundTimeWindow)?.label],
          ["Budget / ticket", `$${prefs.budgetMin} – $${prefs.budgetMax}`],
          ["Seat", prefs.seatPreference?.replace("_", " ")],
          ["Assistance", prefs.specialAssistance || "None"],
        ],
      },
    ],
    [basics, travelers, prefs]
  );

  return (
    <div>
      <SectionHeader
        eyebrow="Step D"
        title="Does this look right?"
        description="Quick check. We'll start looking at flights after you confirm."
      />
      <div className="grid gap-4">
        {summary.map((section) => (
          <Card key={section.title}>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg">{section.title}</h2>
                <Button type="button" variant="link" onClick={() => onEdit(section.step)}>
                  Edit
                </Button>
              </div>
              <dl className="grid gap-3">
                {section.rows.map(([k, v]) => (
                  <div key={String(k)} className="grid grid-cols-[140px_1fr] gap-3 text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <ConfirmActions
        confirmLabel="Confirm trip basics and search for flights"
        onConfirm={onConfirm}
        onBack={onBack}
        backLabel="Go back"
        loading={saving}
      />
    </div>
  );
}
