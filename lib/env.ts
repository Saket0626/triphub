/** Environment flags and API-key presence checks. Real keys live in .env.local. */

function read(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export const env = {
  sandboxMode:
    read("SANDBOX_MODE", read("NEXT_PUBLIC_SANDBOX_MODE", "true")) !== "false",
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  duffelApiKey: read("DUFFEL_API_KEY"),
  liteApiKey: read("LITEAPI_KEY"),
  amadeusApiKey: read("AMADEUS_API_KEY"),
  amadeusApiSecret: read("AMADEUS_API_SECRET"),
  hotelbedsApiKey: read("HOTELBEDS_API_KEY"),
  hotelbedsApiSecret: read("HOTELBEDS_API_SECRET"),
  resendApiKey: read("RESEND_API_KEY"),
  emailFrom: read("EMAIL_FROM", "TripHub <booking@localhost>"),
  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripePublishableKey: read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  appUrl: read("APP_URL", read("NEXT_PUBLIC_APP_URL", "http://localhost:3000")),
  viatorApiKey: read("VIATOR_API_KEY"),
  googlePlacesApiKey: read("GOOGLE_PLACES_API_KEY"),
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
};

export function isPlaceholder(value: string) {
  if (!value) return true;
  return (
    value.includes("YOUR_") ||
    value.includes("your_") ||
    value.includes("placeholder") ||
    value.endsWith("_key")
  );
}

export function isSupabaseConfigured() {
  return (
    env.supabaseUrl.startsWith("https://") &&
    !isPlaceholder(env.supabaseUrl) &&
    env.supabaseAnonKey.length > 20 &&
    !isPlaceholder(env.supabaseAnonKey)
  );
}

export function isResendConfigured() {
  return env.resendApiKey.startsWith("re_") && !isPlaceholder(env.resendApiKey);
}
