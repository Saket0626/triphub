/**
 * Confirmation email via Resend.
 * Sending-only API key is enough. Until a custom domain is verified in Resend,
 * use TripHub <onboarding@resend.dev> (delivers to the account owner only).
 * Docs: https://resend.com/docs/send-with-nodejs
 */

import { Resend } from "resend";
import { env, isResendConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/types";

export async function sendConfirmationEmail(booking: Booking, to: string) {
  const html = renderItineraryEmail(booking);

  if (!isResendConfigured()) {
    console.info("[TripHub] Resend not configured — skipping live send. Preview:\n", html.slice(0, 400));
    return { skipped: true as const, id: "sandbox-local" };
  }

  const resend = new Resend(env.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: env.sandboxMode
      ? `[Sandbox] Your TripHub confirmation ${booking.confirmationNumber}`
      : `Your TripHub confirmation ${booking.confirmationNumber}`,
    html,
  });
  if (error) throw new Error(error.message);
  return { skipped: false as const, id: data?.id ?? "sent" };
}

function renderItineraryEmail(booking: Booking) {
  const snap = booking.itinerarySnapshot;
  const flight = snap.flight;
  const hotel = snap.hotel;
  const sandboxNote = booking.sandbox
    ? `<p style="background:#e0f2fe;padding:12px 16px;border-radius:12px;color:#0c4a6e;font-size:14px;line-height:1.45;">This is a <strong>test booking</strong>. Nothing was charged and no real tickets were issued.</p>`
    : "";

  return `<!doctype html>
<html>
<body style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#ffffff;color:#0f172a;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-radius:20px;">
    <p style="letter-spacing:0.16em;text-transform:uppercase;font-size:12px;font-weight:600;color:#0284c7;margin:0 0 12px;">TripHub</p>
    <h1 style="font-weight:600;font-size:28px;margin:0 0 8px;">You're all set</h1>
    <p style="color:#475569;">Confirmation <strong style="color:#0f172a;">${booking.confirmationNumber}</strong></p>
    ${sandboxNote}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p><strong>Travelers</strong><br/>${snap.travelers.map((t) => t.fullName).join(", ")}</p>
    ${
      flight
        ? `<p><strong>Flight</strong><br/>${flight.airline} ${flight.flightNumber}<br/>${flight.from} → ${flight.to}<br/>${formatDate(snap.trip.departureDate)}${snap.trip.returnDate ? ` – ${formatDate(snap.trip.returnDate)}` : ""}<br/>${formatCurrency(flight.totalPrice)}</p>`
        : ""
    }
    ${
      hotel
        ? `<p><strong>Hotel</strong><br/>${hotel.name}<br/>${hotel.neighborhood}, ${hotel.city}<br/>${formatCurrency(hotel.totalPrice)}</p>`
        : ""
    }
    ${
      snap.ground
        ? `<p><strong>Ground</strong><br/>${snap.ground.title} · ${formatCurrency(snap.ground.priceEstimate)}</p>`
        : "<p><strong>Ground</strong><br/>No ground transport added</p>"
    }
    ${
      snap.activities.length
        ? `<p><strong>Activities</strong><br/>${snap.activities.map((a) => `${a.name} · ${formatCurrency(a.totalPrice)}`).join("<br/>")}</p>`
        : "<p><strong>Activities</strong><br/>None added</p>"
    }
    <p style="font-size:20px;font-weight:600;margin-top:24px;">Total ${formatCurrency(snap.totalPrice)}</p>
  </div>
</body>
</html>`;
}
